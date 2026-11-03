import type { RegistroHistorico, Veiculo } from '@/types/garagem';
import { calcularConsumoMedio, formatarMoeda, parseDecimal } from '@/utils/garagem';

export type TipoAlerta = 'consumo-alto' | 'revisao' | 'gasto-alto';

export interface Alerta {
  tipo: TipoAlerta;
  titulo: string;
  corpo: string;
  /** Intervalo mínimo (em dias) antes de repetir este mesmo alerta para o veículo. */
  intervaloDias: number;
}

const DIAS_SEM_REVISAO = 180;
/** Consumo atual abaixo deste percentual do informado no cadastro dispara o alerta. */
const LIMITE_CONSUMO = 0.85;
/** Gasto do mês acima deste múltiplo do mês anterior dispara o alerta. */
const LIMITE_GASTO = 1.3;
const MS_DIA = 24 * 60 * 60 * 1000;

function somaDoMes(registros: RegistroHistorico[], veiculoId: string, mes: number, ano: number) {
  return registros
    .filter((r) => {
      if (r.veiculoId !== veiculoId || !r.dataCriacao) return false;
      const d = r.dataCriacao.toDate();
      return d.getMonth() === mes && d.getFullYear() === ano;
    })
    .reduce((acc, r) => acc + (parseFloat(r.valorTotal || '0') || 0), 0);
}

/** Avalia os dados de um veículo e devolve os alertas que fazem sentido agora. */
export function gerarAlertas(
  veiculo: Veiculo,
  registros: RegistroHistorico[],
  agora: Date = new Date()
): Alerta[] {
  const doVeiculo = registros.filter((r) => r.veiculoId === veiculo.id);
  if (doVeiculo.length === 0) return [];

  const placa = veiculo.placa || 'seu veículo';
  const alertas: Alerta[] = [];

  // 1. Consumo alto (km/L abaixo do esperado)
  const esperado = parseDecimal(veiculo.consumoMedio ?? '');
  const atual = parseDecimal(calcularConsumoMedio(registros, veiculo.id));
  if (esperado > 0 && atual > 0 && atual < esperado * LIMITE_CONSUMO) {
    alertas.push({
      tipo: 'consumo-alto',
      titulo: 'Seu consumo está alto ⛽',
      corpo: `${placa} está fazendo ${atual.toFixed(1)} Km/L, abaixo dos ${esperado.toFixed(1)} Km/L esperados.`,
      intervaloDias: 7,
    });
  }

  // 2. Revisão em atraso (último serviço há muito tempo, ou nunca feito)
  const servicos = doVeiculo.filter((r) => r.tipoRegistro === 'Serviço' && r.dataCriacao);
  const ultimoServico = servicos.reduce<Date | null>((maisRecente, r) => {
    const data = r.dataCriacao!.toDate();
    return !maisRecente || data > maisRecente ? data : maisRecente;
  }, null);
  const primeiroRegistro = doVeiculo.reduce<Date | null>((maisAntigo, r) => {
    if (!r.dataCriacao) return maisAntigo;
    const data = r.dataCriacao.toDate();
    return !maisAntigo || data < maisAntigo ? data : maisAntigo;
  }, null);
  const referencia = ultimoServico ?? primeiroRegistro;
  if (referencia && (agora.getTime() - referencia.getTime()) / MS_DIA > DIAS_SEM_REVISAO) {
    alertas.push({
      tipo: 'revisao',
      titulo: 'Agende uma revisão 🔧',
      corpo: ultimoServico
        ? `${placa} está há mais de ${DIAS_SEM_REVISAO} dias sem serviço registrado.`
        : `Nenhum serviço registrado para ${placa}. Que tal agendar uma revisão?`,
      intervaloDias: 14,
    });
  }

  // 3. Gasto do mês muito acima do mês anterior
  const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const gastoAtual = somaDoMes(registros, veiculo.id, agora.getMonth(), agora.getFullYear());
  const gastoAnterior = somaDoMes(
    registros,
    veiculo.id,
    mesAnterior.getMonth(),
    mesAnterior.getFullYear()
  );
  if (gastoAnterior > 0 && gastoAtual > gastoAnterior * LIMITE_GASTO) {
    alertas.push({
      tipo: 'gasto-alto',
      titulo: 'Gastos acima do normal 💸',
      corpo: `${placa} já gastou ${formatarMoeda(gastoAtual)} este mês, contra ${formatarMoeda(gastoAnterior)} no mês passado.`,
      intervaloDias: 7,
    });
  }

  return alertas;
}
