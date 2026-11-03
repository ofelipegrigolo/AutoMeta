import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EventoItem } from '@/components/garagem/evento-item';
import { MiniGrafico } from '@/components/garagem/mini-grafico';
import { ModalBase, modalStyles } from '@/components/garagem/modal-base';
import type { DadosRelatorio, RegistroHistorico } from '@/types/garagem';

type ModalRelatorioProps = {
  visible: boolean;
  dados: DadosRelatorio | null;
  historico: RegistroHistorico[];
  onClose: () => void;
  onSelecionarEvento: (registro: RegistroHistorico) => void;
};

function Coluna({ valor, label, barras }: { valor: string; label: string; barras: number[] }) {
  return (
    <View style={styles.coluna}>
      <Text style={styles.colunaValor}>{valor}</Text>
      <Text style={styles.colunaLabel}>{label}</Text>
      <MiniGrafico barras={barras} variante="relatorio" />
    </View>
  );
}

export function ModalRelatorio({
  visible,
  dados,
  historico,
  onClose,
  onSelecionarEvento,
}: ModalRelatorioProps) {
  return (
    <ModalBase visible={visible} onClose={onClose} contentStyle={styles.conteudo}>
      <Text style={modalStyles.titulo}>Relatório Mensal</Text>
      <Text style={modalStyles.subtitulo}>Acompanhe seu gasto mensal atual</Text>

      {dados && (
        <>
          <View style={styles.colunas}>
            <Coluna valor={dados.gastoTotal} label="Valor Total Gasto" barras={dados.barrasTotal} />
            <Coluna
              valor={dados.gastoAbastecimento}
              label="Valor Gasto Abastecimento"
              barras={dados.barrasAbastecimento}
            />
            <Coluna
              valor={dados.gastoServico}
              label="Valor Gasto Desgaste"
              barras={dados.barrasServico}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.lista}>
            {historico.length === 0 ? (
              <Text style={styles.listaVazia}>Nenhum evento registrado.</Text>
            ) : (
              historico.map((registro) => (
                <EventoItem key={registro.id} registro={registro} onPress={onSelecionarEvento} />
              ))
            )}
          </ScrollView>
        </>
      )}
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    maxHeight: '85%',
  },
  colunas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  coluna: {
    flex: 1,
    alignItems: 'center',
  },
  colunaValor: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f0f0f',
    textAlign: 'center',
  },
  colunaLabel: {
    fontSize: 9,
    color: '#4b4b4b',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
  lista: {
    marginTop: 8,
  },
  listaVazia: {
    textAlign: 'center',
    color: '#a0a0a0',
    marginTop: 20,
    fontSize: 14,
  },
});
