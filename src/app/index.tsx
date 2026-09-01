import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../firebaseConfig';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const USUARIO_ID = '1';

interface Veiculo {
  id: string;
  placa: string;
  consumoMedio: string;
  valorGasto: string;
  graficoBarras?: number[];
}

interface Abastecimento {
  id: string;
  veiculoId: string;
  combustivel: string;
  litros: string;
  quilometragem: string;
  data: string;
}

export default function TelaSimples() {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estado para armazenar o nome do usuário
  const [nomeUsuario, setNomeUsuario] = useState('');

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [historico, setHistorico] = useState<Abastecimento[]>([]);
  const [veiculoAtivoIndex, setVeiculoAtivoIndex] = useState(0);

  const [litros, setLitros] = useState('');
  const [quilometragem, setQuilometragem] = useState('');
  const [combustivelSelecionado, setCombustivelSelecionado] = useState('Gasolina');

  const veiculoAtual = veiculos[veiculoAtivoIndex];

  // Função para definir a saudação conforme o horário atual
  const obterSaudacao = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return 'Bom dia';
    if (hora >= 12 && hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // 1. Buscar Nome do Usuário no Firestore
  useEffect(() => {
    const docRef = doc(db, 'usuario', USUARIO_ID);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setNomeUsuario(docSnap.data().nome || 'Usuário');
        } else {
          setNomeUsuario('Usuário');
        }
      },
      (error) => {
        console.error('Erro ao buscar nome do usuário:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Buscar Veículos em tempo real
  useEffect(() => {
    const q = query(collection(db, 'veiculos'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const listaVeiculos: Veiculo[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Veiculo, 'id'>),
        }));

        setVeiculos(listaVeiculos);
        setVeiculoAtivoIndex((index) =>
          listaVeiculos.length === 0 ? 0 : Math.min(index, listaVeiculos.length - 1)
        );
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar veículos:', error);
        Alert.alert('Erro', 'Não foi possível carregar os veículos do Firebase.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Buscar Histórico de Abastecimentos filtrado pelo Veículo Ativo
  useEffect(() => {
    if (!veiculoAtual?.id) {
      setHistorico([]);
      return;
    }

    const q = query(
      collection(db, 'historico'),
      where('veiculoId', '==', veiculoAtual.id),
      orderBy('dataCriacao', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const listaHistorico: Abastecimento[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Abastecimento, 'id'>),
        }));

        setHistorico(listaHistorico);
      },
      (error) => {
        console.error('Erro ao carregar histórico:', error);
      }
    );

    return () => unsubscribe();
  }, [veiculoAtual?.id]);

  // 4. Função para adicionar abastecimento
  const adicionarAbastecimento = async () => {
    if (!litros || !quilometragem) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    if (!veiculoAtual) {
      Alert.alert('Erro', 'Nenhum veículo selecionado.');
      return;
    }

    try {
      await addDoc(collection(db, 'historico'), {
        veiculoId: veiculoAtual.id,
        combustivel: combustivelSelecionado,
        litros: Number(litros).toString(),
        quilometragem: Number(quilometragem).toString(),
        data: new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        dataCriacao: serverTimestamp(),
      });

      setLitros('');
      setQuilometragem('');
      setModalVisible(false);
    } catch (error) {
      console.error('Erro ao salvar abastecimento:', error);
      Alert.alert('Erro', 'Não foi possível salvar o abastecimento.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f0f0f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={historico}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Saudação dinâmica com nome vindo do Firestore */}
            <Text style={styles.mensagem}>
              {obterSaudacao()},{' '}
              <Text style={styles.nomeUsuario}>
                {nomeUsuario ? `${nomeUsuario}.` : 'Carregando...'}
              </Text>
            </Text>

            <View>
              <FlatList
                data={veiculos}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                snapToInterval={CARD_WIDTH}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const offset = e.nativeEvent.contentOffset.x;
                  const index = Math.round(offset / CARD_WIDTH);
                  setVeiculoAtivoIndex(index);
                }}
                ListEmptyComponent={
                  <View style={[styles.cardcontainer, styles.cardVazio]}>
                    <Text style={styles.cardVazioTexto}>Nenhum veículo cadastrado.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.cardcontainer}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitulo}>{item.placa || 'Sem Placa'}</Text>
                      <View style={styles.miniGraficoContainer}>
                        {(item.graficoBarras || [20, 40, 60, 80, 100]).map((altura, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.miniBarra,
                              { height: `${altura}%` },
                              idx === 4 && styles.miniBarraDestaque,
                            ]}
                          />
                        ))}
                      </View>
                    </View>

                    <View style={styles.colunasContainer}>
                      <View style={styles.coluna}>
                        <Text style={styles.combustivelLabel}>Consumo Médio</Text>
                        <Text style={styles.cardSaldo}>
                          {item.consumoMedio || '0.0'} <Text style={styles.unidade}>Km/L</Text>
                        </Text>
                      </View>
                      <View style={styles.linhaDivisoria} />
                      <View style={styles.coluna}>
                        <Text style={styles.combustivelLabel}>Valor Gasto Mensal</Text>
                        <Text style={styles.cardSaldo}>{item.valorGasto || 'R$ 0,00'}</Text>
                      </View>
                    </View>
                  </View>
                )}
              />

              {veiculos.length > 0 && (
                <View style={styles.paginadorContainer}>
                  {veiculos.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.pontoPaginador,
                        veiculoAtivoIndex === index && styles.pontoPaginadorAtivo,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.acoesContainer}>
              <Text style={styles.secaoTitulo}>Ações Rápidas</Text>
              <View style={styles.botoesRow}>
                <TouchableOpacity
                  style={[styles.botaoAcao, veiculos.length === 0 && styles.botaoDesabilitado]}
                  disabled={veiculos.length === 0}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.textoBotao}>+ Abastecer</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.botaoAcao, styles.botaoSecundario]}>
                  <Text style={styles.textoBotaoSecundario}>Relatórios</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.secaoTitulo, styles.tituloHistorico]}>
              Histórico de Abastecimentos
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.historicoCard}>
            <View style={styles.historicoInfoEsquerda}>
              <View
                style={[
                  styles.combustivelIndicador,
                  { backgroundColor: item.combustivel === 'Gasolina' ? '#3b82f6' : '#10b981' },
                ]}
              />
              <View>
                <Text style={styles.historicoCombustivelTexto}>{item.combustivel}</Text>
                <Text style={styles.historicoSubtexto}>{item.quilometragem} Km atual</Text>
              </View>
            </View>

            <View style={styles.historicoInfoDireita}>
              <Text style={styles.historicoLitrosTexto}>{item.litros} L</Text>
              <Text style={styles.historicoSubtexto}>{item.data}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.listaVaziaTexto}>Nenhum abastecimento registrado.</Text>
        }
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Adicionar Abastecimento</Text>
            <Text style={styles.modalTexto}>
              Veículo: <Text style={styles.veiculoDestaque}>{veiculoAtual?.placa}</Text>
            </Text>

            <View style={styles.opcaocombustivel}>
              <TouchableOpacity
                style={[
                  styles.botaoCombustivel,
                  combustivelSelecionado === 'Gasolina' && styles.botaoAtivo,
                ]}
                onPress={() => setCombustivelSelecionado('Gasolina')}
              >
                <Text
                  style={
                    combustivelSelecionado === 'Gasolina'
                      ? styles.textoBotao
                      : styles.textoBotaoInativo
                  }
                >
                  Gasolina
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.botaoCombustivel,
                  combustivelSelecionado === 'Etanol' && styles.botaoAtivo,
                ]}
                onPress={() => setCombustivelSelecionado('Etanol')}
              >
                <Text
                  style={
                    combustivelSelecionado === 'Etanol'
                      ? styles.textoBotao
                      : styles.textoBotaoInativo
                  }
                >
                  Etanol
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputsContainer}>
              <Text style={styles.inputLabel}>Insira a quantidade de litros:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 45.5"
                placeholderTextColor="#a0a0a0"
                keyboardType="numeric"
                value={litros}
                onChangeText={setLitros}
              />

              <Text style={styles.inputLabel}>Insira a quilometragem atual:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 125400"
                placeholderTextColor="#a0a0a0"
                keyboardType="numeric"
                value={quilometragem}
                onChangeText={setQuilometragem}
              />
            </View>

            <TouchableOpacity style={styles.botaoFechar} onPress={adicionarAbastecimento}>
              <Text style={styles.textoBotao}>Confirmar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botaoCancelar} onPress={() => setModalVisible(false)}>
              <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  mensagem: {
    fontSize: 15,
    color: '#0f0f0f',
    marginTop: 50,
    marginLeft: 20,
    marginBottom: 20,
  },
  nomeUsuario: {
    fontWeight: 'bold',
  },
  cardcontainer: {
    width: CARD_WIDTH,
    height: 160,
    backgroundColor: '#0f0f0f',
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    elevation: 5,
    marginHorizontal: 20,
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cardTitulo: {
    color: '#a0a0a0',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  miniGraficoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 32,
    width: 60,
    justifyContent: 'flex-end',
  },
  miniBarra: {
    width: 6,
    backgroundColor: '#333',
    borderRadius: 3,
  },
  miniBarraDestaque: {
    backgroundColor: '#00ff88',
  },
  colunasContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coluna: {
    flex: 1,
  },
  linhaDivisoria: {
    width: 1,
    height: 40,
    backgroundColor: '#222',
    marginHorizontal: 15,
  },
  combustivelLabel: {
    color: '#a0a0a0',
    fontSize: 12,
    marginBottom: 4,
  },
  cardSaldo: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  unidade: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#a0a0a0',
  },
  paginadorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  pontoPaginador: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ccc',
  },
  pontoPaginadorAtivo: {
    backgroundColor: '#0f0f0f',
    width: 18,
  },
  acoesContainer: {
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
  botaoAcao: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.5,
  },
  botaoSecundario: {
    backgroundColor: '#f0f0f0',
  },
  textoBotao: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  textoBotaoSecundario: {
    color: '#0f0f0f',
    fontWeight: '600',
    fontSize: 14,
  },
  historicoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historicoInfoEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  combustivelIndicador: {
    width: 8,
    height: 36,
    borderRadius: 4,
  },
  historicoCombustivelTexto: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f0f0f',
  },
  historicoSubtexto: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  historicoInfoDireita: {
    alignItems: 'flex-end',
  },
  historicoLitrosTexto: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f0f0f',
  },
  listaVaziaTexto: {
    textAlign: 'center',
    color: '#a0a0a0',
    marginTop: 20,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f0f0f',
    marginBottom: 8,
  },
  modalTexto: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  veiculoDestaque: {
    fontWeight: 'bold',
    color: '#0f0f0f',
  },
  opcaocombustivel: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  botaoCombustivel: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoAtivo: {
    backgroundColor: '#0f0f0f',
  },
  textoBotaoInativo: {
    color: '#0f0f0f',
    fontWeight: '600',
    fontSize: 14,
  },
  inputsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0f0f0f',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  botaoFechar: {
    width: '100%',
    backgroundColor: '#0f0f0f',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  botaoCancelar: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  textoBotaoCancelar: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
});