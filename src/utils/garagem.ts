import {
  COR_PADRAO_ABASTECIMENTO,
  COR_PADRAO_SERVICO,
  OPCOES_COMBUSTIVEL,
  OPCOES_SERVICO,
} from '@/constants/garagem';
import type { DadosRelatorio, RegistroHistorico, TipoRegistro } from '@/types/garagem';

const BARRAS_PADRAO = [15, 25, 20, 30, 20];
const QUANTIDADE_BARRAS = 5;

export function obterSaudacao(agora: Date = new Date()): string {
  const hora = agora.getHours();
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Converte texto digitado em número, aceitando vírgula ou ponto como separador decimal. */
export function parseDecimal(texto: string): number {
  return Number(texto.trim().replace(',', '.'));
}

export function calcularConsumoMedio(registros: RegistroHistorico[], veiculoId: string): string {
  const abastecimentos = registros
    .filter((item) => item.veiculoId === veiculoId && item.tipoRegistro !== 'Serviço')
    .sort((a, b) => parseFloat(a.quilometragem) - parseFloat(b.quilometragem));

  if (abastecimentos.length < 2) return '0.0';

  const kmInicial = parseFloat(abastecimentos[0].quilometragem);
  const kmFinal = parseFloat(abastecimentos[abastecimentos.length - 1].quilometragem);
  const totalKm = kmFinal - kmInicial;

  // O primeiro abastecimento só marca o ponto de partida; os litros contam a partir do segundo
  const totalLitros = abastecimentos
    .slice(1)
    .reduce((acc, item) => acc + (parseFloat(item.litros || '0') || 0), 0);

  if (totalLitros <= 0 || totalKm <= 0) return '0.0';

  return (totalKm / totalLitros).toFixed(1);
}

export function calcularGastoMensal(
  registros: RegistroHistorico[],
  veiculoId: string,
  tipo?: TipoRegistro
): number {
  const agora = new Date();

  return registros
    .filter((item) => {
      if (item.veiculoId !== veiculoId) return false;
      if (tipo && item.tipoRegistro !== tipo) return false;
      if (!item.dataCriacao) return false;

      const data = item.dataCriacao.toDate();
      return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
    })
    .reduce((acc, item) => acc + (parseFloat(item.valorTotal || '0') || 0), 0);
}

/** Alturas (em %) das barras do mini gráfico; espera os registros do mais novo para o mais antigo. */
export function obterBarrasGrafico(
  registros: RegistroHistorico[],
  veiculoId: string,
  tipo?: TipoRegistro
): number[] {
  const recentes = registros
    .filter((item) => item.veiculoId === veiculoId && (!tipo || item.tipoRegistro === tipo))
    .slice(0, QUANTIDADE_BARRAS)
    .reverse();

  if (recentes.length === 0) return BARRAS_PADRAO;

  const valores = recentes.map((item) => parseFloat(item.valorTotal || item.litros || '0') || 0);
  const maximo = Math.max(...valores, 1);
  const barras = valores.map((v) => Math.max(10, Math.round((v / maximo) * 100)));

  while (barras.length < QUANTIDADE_BARRAS) {
    barras.unshift(15);
  }

  return barras;
}

export function obterCorCategoria(item: RegistroHistorico): string {
  if (item.tipoRegistro === 'Abastecimento') {
    return (
      OPCOES_COMBUSTIVEL.find((c) => c.id === item.tipoServicoOuCombustivel)?.cor ??
      COR_PADRAO_ABASTECIMENTO
    );
  }
  return (
    OPCOES_SERVICO.find((s) => s.id === item.tipoServicoOuCombustivel)?.cor ?? COR_PADRAO_SERVICO
  );
}

export function gerarDadosRelatorio(
  registros: RegistroHistorico[],
  veiculoId: string
): DadosRelatorio {
  const gastoAbastecimento = calcularGastoMensal(registros, veiculoId, 'Abastecimento');
  const gastoServico = calcularGastoMensal(registros, veiculoId, 'Serviço');

  return {
    gastoTotal: formatarMoeda(gastoAbastecimento + gastoServico),
    gastoAbastecimento: formatarMoeda(gastoAbastecimento),
    gastoServico: formatarMoeda(gastoServico),
    barrasTotal: obterBarrasGrafico(registros, veiculoId),
    barrasAbastecimento: obterBarrasGrafico(registros, veiculoId, 'Abastecimento'),
    barrasServico: obterBarrasGrafico(registros, veiculoId, 'Serviço'),
  };
}
