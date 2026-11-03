import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Logo } from '@/components/logo';
import { EventoItem } from '@/components/garagem/evento-item';
import { ModalDetalhesEvento } from '@/components/garagem/modal-detalhes-evento';
import { ModalNovoEvento } from '@/components/garagem/modal-novo-evento';
import { ModalRelatorio } from '@/components/garagem/modal-relatorio';
import { VeiculoCarrossel } from '@/components/garagem/veiculo-carrossel';
import { useGaragem } from '@/hooks/use-garagem';
import { adicionarRegistro, excluirRegistro } from '@/services/historico';
import { verificarAlertas } from '@/services/alertas';
import { agendarLembreteServico } from '@/services/notificacoes';
import type { NovoRegistro, RegistroHistorico } from '@/types/garagem';
import { gerarDadosRelatorio, obterSaudacao } from '@/utils/garagem';

export default function InicioScreen() {
  const { uid, nomeUsuario, veiculos, registros, carregando } = useGaragem();

  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const [modalNovoVisivel, setModalNovoVisivel] = useState(false);
  const [modalRelatorioVisivel, setModalRelatorioVisivel] = useState(false);
  const [modalDetalhesVisivel, setModalDetalhesVisivel] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState<RegistroHistorico | null>(null);

  // Mantém o índice válido quando veículos são removidos
  const indice = veiculos.length === 0 ? 0 : Math.min(indiceAtivo, veiculos.length - 1);
  const veiculoAtual = veiculos[indice];
  const semVeiculos = veiculos.length === 0;

  const historico = useMemo(
    () => (veiculoAtual ? registros.filter((item) => item.veiculoId === veiculoAtual.id) : []),
    [registros, veiculoAtual]
  );

  const dadosRelatorio = useMemo(
    () => (veiculoAtual ? gerarDadosRelatorio(registros, veiculoAtual.id) : null),
    [registros, veiculoAtual]
  );

  // Alertas automáticos (consumo alto, revisão, gastos); o atraso evita avaliar dados parciais
  useEffect(() => {
    if (carregando || veiculos.length === 0) return;
    const timer = setTimeout(() => {
      verificarAlertas(veiculos, registros).catch((error) =>
        console.error('Erro ao verificar alertas:', error)
      );
    }, 2000);
    return () => clearTimeout(timer);
  }, [carregando, veiculos, registros]);

  const abrirDetalhes = (registro: RegistroHistorico) => {
    setRegistroSelecionado(registro);
    setModalDetalhesVisivel(true);
  };

  const salvarEvento = async (dados: NovoRegistro) => {
    // O modal exibe o alerta de erro quando esta função lança
    if (!uid || !veiculoAtual) {
      throw new Error('Sem usuário ou veículo para salvar o evento');
    }
    await adicionarRegistro(uid, veiculoAtual.id, dados);

    // O evento já foi gravado; falha no lembrete não deve fazê-lo parecer perdido
    if (dados.tipoRegistro === 'Serviço') {
      agendarLembreteServico(veiculoAtual.id, veiculoAtual.placa, dados.tipoServicoOuCombustivel).catch(
        (error) => console.error('Erro ao agendar lembrete:', error)
      );
    }
  };

  const excluirEvento = async (registro: RegistroHistorico) => {
    try {
      await excluirRegistro(registro.id);
      setModalDetalhesVisivel(false);
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      Alert.alert('Erro', 'Não foi possível excluir o evento.');
    }
  };

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0f0f0f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={historico}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.logo}>
              <Logo />
            </View>

            <Text style={styles.saudacao}>
              {obterSaudacao()},{' '}
              <Text style={styles.nomeUsuario}>{nomeUsuario ? `${nomeUsuario}.` : 'Carregando...'}</Text>
            </Text>

            <VeiculoCarrossel
              veiculos={veiculos}
              registros={registros}
              indiceAtivo={indice}
              onMudarIndice={setIndiceAtivo}
            />

            <View style={styles.acoes}>
              <Text style={styles.secaoTitulo}>Ações Rápidas</Text>
              <View style={styles.botoesRow}>
                <TouchableOpacity
                  style={[styles.botaoOutline, semVeiculos && styles.botaoDesabilitado]}
                  disabled={semVeiculos}
                  onPress={() => setModalNovoVisivel(true)}>
                  <Text style={styles.textoBotaoOutline}>Adicionar Novo Evento</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.botaoPreto, semVeiculos && styles.botaoDesabilitado]}
                  disabled={semVeiculos}
                  onPress={() => setModalRelatorioVisivel(true)}>
                  <Text style={styles.textoBotaoPreto}>Relatórios</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.secaoTitulo, styles.tituloHistorico]}>Histórico de Eventos</Text>
          </>
        }
        renderItem={({ item }) => <EventoItem registro={item} onPress={abrirDetalhes} />}
        ListEmptyComponent={<Text style={styles.listaVazia}>Nenhum evento registrado.</Text>}
      />

      <ModalNovoEvento
        visible={modalNovoVisivel}
        onClose={() => setModalNovoVisivel(false)}
        onSalvar={salvarEvento}
      />

      <ModalDetalhesEvento
        visible={modalDetalhesVisivel}
        registro={registroSelecionado}
        onClose={() => setModalDetalhesVisivel(false)}
        onExcluir={excluirEvento}
      />

      <ModalRelatorio
        visible={modalRelatorioVisivel}
        dados={dadosRelatorio}
        historico={historico}
        onClose={() => setModalRelatorioVisivel(false)}
        onSelecionarEvento={abrirDetalhes}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conteudo: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  logo: {
    marginTop: 50,
  },
  saudacao: {
    fontSize: 15,
    color: '#0f0f0f',
    marginTop: 20,
    marginLeft: 20,
    marginBottom: 20,
  },
  nomeUsuario: {
    fontWeight: 'bold',
  },
  acoes: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tituloHistorico: {
    marginTop: 32,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  botoesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  botaoOutline: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#0f0f0f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  botaoPreto: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.5,
  },
  textoBotaoPreto: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  textoBotaoOutline: {
    color: '#0f0f0f',
    fontWeight: '600',
    fontSize: 13,
  },
  listaVazia: {
    textAlign: 'center',
    color: '#a0a0a0',
    marginTop: 20,
    fontSize: 14,
  },
});
