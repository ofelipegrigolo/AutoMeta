import { StyleSheet, View } from 'react-native';

import { MINI_GRAFICO_COR_CARD, MINI_GRAFICO_CORES } from '@/constants/garagem';

type MiniGraficoProps = {
  /** Alturas das barras em porcentagem (0–100). */
  barras: number[];
  variante?: 'card' | 'relatorio';
};

export function MiniGrafico({ barras, variante = 'card' }: MiniGraficoProps) {
  const estilos = variante === 'card' ? styles.card : styles.relatorio;
  const corDaBarra = (idx: number) =>
    variante === 'card' ? MINI_GRAFICO_COR_CARD : MINI_GRAFICO_CORES[idx % MINI_GRAFICO_CORES.length];

  return (
    <View style={estilos.container}>
      {barras.map((altura, idx) => (
        <View
          key={idx}
          style={[
            estilos.barra,
            { height: `${altura}%`, backgroundColor: corDaBarra(idx) },
          ]}
        />
      ))}
    </View>
  );
}

const styles = {
  card: StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
      height: 24,
      width: 56,
      justifyContent: 'flex-end',
    },
    barra: { width: 5, borderRadius: 3 },
  }),
  relatorio: StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
      height: 40,
    },
    barra: { width: 6, borderRadius: 3 },
  }),
};
