import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type LogoProps = {
  tamanho?: 'pequeno' | 'grande';
  cor?: string;
};

const TAMANHOS = {
  pequeno: { icone: 14, fonte: 13, gap: 6 },
  grande: { icone: 30, fonte: 30, gap: 10 },
} as const;

function IconeCursor({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* arco de movimento */}
      <Path d="M4 8C4 4.5 7 2 10.5 2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path
        d="M9.5 1.2L10.6 2.3L9.3 3.2"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* ponteiro / cursor */}
      <Path d="M9 10.5L19.5 15.2L15 16.6L13.2 21L9 10.5Z" fill={color} />
    </Svg>
  );
}

/** Marca da autometa: ícone + nome. Use `cor` branca sobre fundos escuros. */
export function Logo({ tamanho = 'pequeno', cor = '#0f0f0f' }: LogoProps) {
  const { icone, fonte, gap } = TAMANHOS[tamanho];

  return (
    <View style={[styles.container, { gap }]}>
      <IconeCursor size={icone} color={cor} />
      <Text style={[styles.texto, { fontSize: fonte, color: cor }]}>autometa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
