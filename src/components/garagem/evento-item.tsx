import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { RegistroHistorico } from '@/types/garagem';
import { formatarMoeda, obterCorCategoria } from '@/utils/garagem';

type EventoItemProps = {
  registro: RegistroHistorico;
  onPress: (registro: RegistroHistorico) => void;
};

function rotuloDeValor(registro: RegistroHistorico): string {
  const litros = parseFloat(registro.litros ?? '0');
  const valor = parseFloat(registro.valorTotal ?? '0');

  if (valor > 0) return formatarMoeda(valor);
  if (registro.tipoRegistro === 'Abastecimento' && litros > 0) return `${registro.litros} L`;
  return 'Serviço';
}

/** Abastecimentos aparecem como "Abastecimento"; serviços, pelo nome do serviço. */
export function tituloDoEvento(registro: RegistroHistorico): string {
  return registro.tipoRegistro === 'Abastecimento'
    ? 'Abastecimento'
    : registro.tipoServicoOuCombustivel;
}

export function EventoItem({ registro, onPress }: EventoItemProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(registro)} style={styles.card}>
      <View style={[styles.barra, { backgroundColor: obterCorCategoria(registro) }]} />

      <View style={styles.infoEsquerda}>
        <Text style={styles.titulo}>{tituloDoEvento(registro)}</Text>
        <Text style={styles.subtexto}>{registro.quilometragem} Km Atual</Text>
      </View>

      <View style={styles.infoDireita}>
        <Text style={styles.valor}>{rotuloDeValor(registro)}</Text>
        <Text style={styles.subtexto}>{registro.data}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ececec',
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  barra: {
    width: 4,
    height: 28,
    borderRadius: 2,
    marginRight: 14,
  },
  infoEsquerda: {
    gap: 2,
    flex: 1,
  },
  titulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f0f0f',
  },
  subtexto: {
    fontSize: 11,
    color: '#9a9a9a',
  },
  infoDireita: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  valor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f0f0f',
  },
});
