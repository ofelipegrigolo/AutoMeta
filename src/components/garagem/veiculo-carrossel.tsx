import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';

import { MiniGrafico } from '@/components/garagem/mini-grafico';
import type { RegistroHistorico, Veiculo } from '@/types/garagem';
import {
  calcularConsumoMedio,
  calcularGastoMensal,
  formatarMoeda,
  obterBarrasGrafico,
} from '@/utils/garagem';

const { width: LARGURA_TELA } = Dimensions.get('window');
const LARGURA_CARD = LARGURA_TELA * 0.92;
const MARGEM_CARD = 10;
const INTERVALO_SNAP = LARGURA_CARD + MARGEM_CARD * 2;
const PADDING_LATERAL = (LARGURA_TELA - LARGURA_CARD) / 2 - MARGEM_CARD;

type VeiculoCarrosselProps = {
  veiculos: Veiculo[];
  registros: RegistroHistorico[];
  indiceAtivo: number;
  onMudarIndice: (indice: number) => void;
};

export function VeiculoCarrossel({
  veiculos,
  registros,
  indiceAtivo,
  onMudarIndice,
}: VeiculoCarrosselProps) {
  return (
    <View>
      <FlatList
        data={veiculos}
        keyExtractor={(item) => item.id}
        horizontal
        snapToInterval={INTERVALO_SNAP}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: PADDING_LATERAL }}
        onScroll={(e) => {
          const indice = Math.round(e.nativeEvent.contentOffset.x / INTERVALO_SNAP);
          if (indice >= 0 && indice < veiculos.length && indice !== indiceAtivo) {
            onMudarIndice(indice);
          }
        }}
        ListEmptyComponent={
          <View style={[styles.card, styles.cardVazio]}>
            <Text style={styles.cardVazioTexto}>Nenhum veículo cadastrado.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.linhaTopo}>
              <Text style={styles.placa}>{item.placa || 'Sem Placa'}</Text>
              <MiniGrafico barras={obterBarrasGrafico(registros, item.id)} />
            </View>

            <View style={styles.linhaCorpo}>
              <View>
                <Text style={styles.rotulo}>Consumo Médio</Text>
                <Text style={styles.consumo}>
                  {calcularConsumoMedio(registros, item.id)} <Text style={styles.unidade}>Km/L</Text>
                </Text>
              </View>
              <View style={styles.colunaDireita}>
                <Text style={styles.rotulo}>Valor Gasto Mensal</Text>
                <Text style={styles.gasto}>
                  {formatarMoeda(calcularGastoMensal(registros, item.id))}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      {veiculos.length > 0 && (
        <View style={styles.paginador}>
          {veiculos.map((veiculo, index) => (
            <View
              key={veiculo.id}
              style={[styles.ponto, indiceAtivo === index && styles.pontoAtivo]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: LARGURA_CARD,
    height: 130,
    backgroundColor: '#0f0f0f',
    borderRadius: 24,
    padding: 22,
    justifyContent: 'space-between',
    elevation: 5,
    marginHorizontal: MARGEM_CARD,
  },
  cardVazio: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  cardVazioTexto: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  linhaTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  placa: {
    color: '#8a8a8a',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  rotulo: {
    color: '#8a8a8a',
    fontSize: 10,
    marginBottom: 2,
  },
  colunaDireita: {
    alignItems: 'flex-end',
  },
  linhaCorpo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  consumo: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  unidade: {
    fontSize: 13,
    fontWeight: 'normal',
    color: '#a0a0a0',
  },
  gasto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paginador: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  ponto: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d4d4d4',
  },
  pontoAtivo: {
    backgroundColor: '#0f0f0f',
  },
});
