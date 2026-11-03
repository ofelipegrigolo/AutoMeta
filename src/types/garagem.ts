import type { Timestamp } from 'firebase/firestore';

export type TipoRegistro = 'Abastecimento' | 'Serviço';

export interface Veiculo {
  id: string;
  placa: string;
  modelo?: string;
  consumoMedio?: string;
  fotoUrl?: string;
  combustivelPadrao?: string;
  cambio?: string;
}

export interface RegistroHistorico {
  id: string;
  usuarioId?: string;
  veiculoId: string;
  tipoRegistro: TipoRegistro;
  tipoServicoOuCombustivel: string;
  litros?: string;
  quilometragem: string;
  data: string;
  valorTotal?: string;
  observacao?: string;
  dataCriacao?: Timestamp | null;
}

/** Dados já validados de um novo evento, prontos para serem gravados. */
export interface NovoRegistro {
  tipoRegistro: TipoRegistro;
  tipoServicoOuCombustivel: string;
  litros: number;
  quilometragem: number;
  valorTotal: number;
  observacao: string;
}

export interface OpcaoRegistro {
  id: string;
  label: string;
  cor: string;
}

export interface DadosRelatorio {
  gastoTotal: string;
  gastoAbastecimento: string;
  gastoServico: string;
  barrasTotal: number[];
  barrasAbastecimento: number[];
  barrasServico: number[];
}

/** Campos editáveis de um veículo (cadastro e edição). */
export interface DadosVeiculo {
  placa: string;
  modelo: string;
  consumoMedio: string;
  fotoUrl: string;
  combustivelPadrao: string;
  cambio: string;
}
