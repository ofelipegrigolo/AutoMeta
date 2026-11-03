import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { tituloDoEvento } from '@/components/garagem/evento-item';
import { ModalBase, modalStyles } from '@/components/garagem/modal-base';
import type { RegistroHistorico } from '@/types/garagem';
import { formatarMoeda, obterCorCategoria } from '@/utils/garagem';

type ModalDetalhesEventoProps = {
  visible: boolean;
  registro: RegistroHistorico | null;
  onClose: () => void;
  onExcluir: (registro: RegistroHistorico) => void;
};

export function ModalDetalhesEvento({
  visible,
  registro,
  onClose,
  onExcluir,
}: ModalDetalhesEventoProps) {
  const valor = parseFloat(registro?.valorTotal ?? '0');

  const confirmarExclusao = () => {
    if (!registro) return;
    Alert.alert('Excluir evento', 'Esta ação não pode ser desfeita. Deseja excluir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => onExcluir(registro) },
    ]);
  };

  return (
    <ModalBase visible={visible} onClose={onClose}>
      {registro && (
        <>
          <View style={styles.cabecalho}>
            <View style={[styles.circulo, { backgroundColor: obterCorCategoria(registro) }]} />
            <View style={{ flex: 1 }}>
              <Text style={[modalStyles.titulo, styles.alinhadoEsquerda]}>
                {tituloDoEvento(registro)}
              </Text>
              <Text style={[modalStyles.subtitulo, styles.alinhadoEsquerda]}>
                {registro.tipoRegistro} • {registro.data}
              </Text>
            </View>
          </View>

          <View style={styles.grade}>
            <View style={styles.item}>
              <Text style={styles.label}>Quilometragem</Text>
              <Text style={styles.valor}>{registro.quilometragem} Km</Text>
            </View>

            {registro.tipoRegistro === 'Abastecimento' && (
              <View style={styles.item}>
                <Text style={styles.label}>Combustível</Text>
                <Text style={styles.valor}>{registro.tipoServicoOuCombustivel}</Text>
              </View>
            )}

            {registro.tipoRegistro === 'Abastecimento' && (
              <View style={styles.item}>
                <Text style={styles.label}>Volume</Text>
                <Text style={styles.valor}>{registro.litros || '0'} L</Text>
              </View>
            )}

            <View style={styles.item}>
              <Text style={styles.label}>Valor Total</Text>
              <Text style={styles.valor}>{valor > 0 ? formatarMoeda(valor) : 'Não informado'}</Text>
            </View>
          </View>

          {!!registro.observacao && (
            <View style={styles.observacao}>
              <Text style={styles.label}>Observações</Text>
              <Text style={styles.observacaoTexto}>{registro.observacao}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.botaoExcluir} onPress={confirmarExclusao}>
            <Text style={styles.textoExcluir}>Excluir evento</Text>
          </TouchableOpacity>
        </>
      )}
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingRight: 28,
  },
  alinhadoEsquerda: {
    textAlign: 'left',
    marginBottom: 2,
  },
  circulo: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  grade: {
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  valor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  observacao: {
    backgroundColor: '#f4f4f4',
    padding: 12,
    borderRadius: 10,
    gap: 4,
    marginBottom: 12,
  },
  botaoExcluir: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  textoExcluir: {
    color: '#ff002b',
    fontSize: 13,
    fontWeight: '600',
  },
  observacaoTexto: {
    fontSize: 13,
    color: '#374151',
  },
});
