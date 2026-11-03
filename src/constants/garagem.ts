import type { OpcaoRegistro } from '@/types/garagem';

export const OPCOES_SERVICO: OpcaoRegistro[] = [
  { id: 'Troca de Óleo', label: '🛢️ Óleo', cor: '#f59e0b' },
  { id: 'Troca de Pneu', label: '🛞 Pneu', cor: '#22c55e' },
  { id: 'Filtro', label: '🧼 Filtros', cor: '#06b6d4' },
  { id: 'Manutenção', label: '🔧 Revisão', cor: '#ec4899' },
  { id: 'Outro', label: '📝 Outro', cor: '#8b5cf6' },
];

export const OPCOES_COMBUSTIVEL: OpcaoRegistro[] = [
  { id: 'Gasolina', label: '⛽ Gasolina', cor: '#3b82f6' },
  { id: 'Etanol', label: '🌱 Etanol', cor: '#10b981' },
  { id: 'Diesel', label: '🚚 Diesel', cor: '#64748b' },
];

export const COR_PADRAO_ABASTECIMENTO = '#3b82f6';
export const COR_PADRAO_SERVICO = '#8b5cf6';

/** Cores das barras do mini gráfico do relatório. */
export const MINI_GRAFICO_CORES = ['#facc15', '#22c55e', '#4ade80', '#facc15', '#ef4444'];

/** Cor das barras do mini gráfico no card do veículo (fundo escuro). */
export const MINI_GRAFICO_COR_CARD = '#22e07a';

/** Prazo (em dias) para lembrar da próxima manutenção após cada tipo de serviço. */
export const DIAS_LEMBRETE_SERVICO: Record<string, number> = {
  'Troca de Óleo': 180,
  'Troca de Pneu': 365,
  Filtro: 180,
  Manutenção: 365,
};
