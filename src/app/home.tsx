import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { auth, db } from '../../firebaseConfig';


const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

interface Veiculo {
  id: string;
  placa: string;
  modelo?: string;
}

interface Evento {
  id: string;
  veiculoId: string;
  tipo: string;
  quilometragem: string;
  quantidade?: string;
  valorNumerico: number;
  valorFormatado: string;
  data: string;
}

export default function HomeScreen() {
  const router = useRouter();

  const [modalEventoVisible, setModalEventoVisible] = useState(false);
  const [modalRelatorioVisible, setModalRelatorioVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const [nomeUsuario, setNomeUsuario] = useState('');
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [historico, setHistorico] = useState<Evento[]>([]);
  const [veiculoAtivoIndex, setVeiculoAtivoIndex] = useState(0);

  // Estados do Modal de Adicionar Evento
  const [categoria, setCategoria] = useState<'Abastecimento' | 'Serviço'>('Abastecimento');
  const [nomeServico, setNomeServico] = useState('Troca de Óleo');
  const [quilometragem, setQuilometragem] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [valor, setValor] = useState('');

  const veiculoAtual = veiculos[veiculoAtivoIndex];
  const usuarioAtual = auth.currentUser;

  const obterSaudacao = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return 'Bom dia';
    if (hora >= 12 && hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getCorIndicador = (tipo: string) => {
    switch (tipo) {
      case 'Abastecimento':
        return '#2563eb'; // Azul
      case 'Troca de Óleo':
      case 'Serviço':
        return '#f59e0b'; // Amarelo/Laranja
      case 'Troca de Pneu':
        return '#10b981'; // Verde
      default:
        return '#8b5cf6'; // Roxo
    }
  };

  const valorTotalGastoMensal = historico.reduce((acc, curr) => acc + curr.valorNumerico, 0);

  const calcularConsumoMedio = () => {
    const abastecimentos = historico.filter((item) => item.tipo === 'Abastecimento' && item.quantidade);
    if (abastecimentos.length < 2) return '15.5';
    
    const kmInicial = parseFloat(abastecimentos[abastecimentos.length - 1].quilometragem) || 0;
    const kmFinal = parseFloat(abastecimentos[0].quilometragem) || 0;
    const totalLitros = abastecimentos.reduce((acc, curr) => acc + (parseFloat(curr.quantidade || '0') || 0), 0);

    if (totalLitros > 0 && kmFinal > kmInicial) {
      return ((kmFinal - kmInicial) / totalLitros).toFixed(1);
    }
    return '15.5';
  };

  const gerarAlturasMiniBarras = () => {
    if (historico.length === 0) return [20, 20, 20, 20, 20];
    const ultimosValores = historico.slice(0, 5).map((h) => h.valorNumerico).reverse();
    const max = Math.max(...ultimosValores, 1);
    return ultimosValores.map((val) => Math.max(Math.round((val / max) * 100), 20));
  };

  const gastosAbastecimento = historico.filter((h) => h.tipo === 'Abastecimento');
  const mediaAbastecimento = gastosAbastecimento.length > 0
    ? gastosAbastecimento.reduce((acc, curr) => acc + curr.valorNumerico, 0) / gastosAbastecimento.length
    : 0;

  const gastosServicos = historico.filter((h) => h.tipo !== 'Abastecimento');
  const mediaServico = gastosServicos.length > 0
    ? gastosServicos.reduce((acc, curr) => acc + curr.valorNumerico, 0) / gastosServicos.length
    : 0;

  // Buscar Nome do Usuário
  useEffect(() => {
    if (!usuarioAtual) return;

    const docRef = doc(db, 'usuario', usuarioAtual.uid);
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
  }, [usuarioAtual]);

  // Buscar Veículos filtrados por usuarioId
  useEffect(() => {
    if (!usuarioAtual) {
      setVeiculos([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'veiculos'),
      where('usuarioId', '==', usuarioAtual.uid)
    );

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
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [usuarioAtual]);

  // Buscar Histórico
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
        const listaHistorico: Evento[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const valorLimpo = parseFloat(
            (data.valor || '0').replace('R$', '').replace(/\./g, '').replace(',', '.').trim()
          ) || 0;

          return {
            id: doc.id,
            veiculoId: data.veiculoId,
            tipo: data.tipo || 'Abastecimento',
            quilometragem: data.quilometragem || '0',
            quantidade: data.quantidade || '',
            valorNumerico: valorLimpo,
            valorFormatado: data.valor || `R$ ${valorLimpo.toFixed(2).replace('.', ',')}`,
            data: data.data || '',
          };
        });
        setHistorico(listaHistorico);
      },
      (error) => {
        console.error('Erro ao carregar histórico:', error);
      }
    );
    return () => unsubscribe();
  }, [veiculoAtual?.id]);

  const adicionarEvento = async () => {
    if (!quilometragem || !valor) {
      Alert.alert('Atenção', 'Por favor, preencha os campos obrigatórios (*).');
      return;
    }

    if (!veiculoAtual || !usuarioAtual) {
      Alert.alert('Erro', 'Usuário não autenticado ou nenhum veículo selecionado.');
      return;
    }

    try {
      const valorFormatado = `R$ ${parseFloat(valor.replace(',', '.'))
        .toFixed(2)
        .replace('.', ',')}`;

      const tipoFinal = categoria === 'Abastecimento' ? 'Abastecimento' : nomeServico;

      await addDoc(collection(db, 'historico'), {
        veiculoId: veiculoAtual.id,
        usuarioId: usuarioAtual.uid,
        tipo: tipoFinal,
        categoria: categoria,
        quilometragem: Number(quilometragem).toString(),
        quantidade: categoria === 'Abastecimento' && quantidade ? Number(quantidade).toString() : '',
        valor: valorFormatado,
        data: new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        dataCriacao: serverTimestamp(),
      });

      setQuilometragem('');
      setQuantidade('');
      setValor('');
      setModalEventoVisible(false);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      Alert.alert('Erro', 'Não foi possível salvar o evento.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f0f0f" />
      </View>
    );
  }

  const consumoAtual = calcularConsumoMedio();
  const barrasCard = gerarAlturasMiniBarras();

  return (
    <View style={styles.container}>
      <FlatList
        data={historico}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.mensagem}>
                {obterSaudacao()}, <Text style={styles.nomeUsuario}>{nomeUsuario || 'Usuário'}.</Text>
              </Text>
            </View>

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
                    <Text style={styles.cardVazioTexto}>Nenhum veículo cadastrado na sua conta.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.cardcontainer}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardPlaca}>{item.placa}</Text>
                      
                      <View style={styles.miniGraficoContainer}>
                        {barrasCard.map((altura, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.miniBarra,
                              { height: `${Math.min(Math.max(altura, 20), 100)}%` },
                              idx === barrasCard.length - 1 && { backgroundColor: '#00ff88' },
                            ]}
                          />
                        ))}
                      </View>
                    </View>

                    <View style={styles.colunasContainer}>
                      <View style={styles.coluna}>
                        <Text style={styles.labelCard}>Consumo Médio</Text>
                        <Text style={styles.valorCard}>
                          {consumoAtual} <Text style={styles.unidade}>Km/L</Text>
                        </Text>
                      </View>
                      <View style={styles.colunaDireita}>
                        <Text style={styles.labelCard}>Valor Gasto Mensal</Text>
                        <Text style={styles.valorCard}>
                          R$ {valorTotalGastoMensal.toFixed(2).replace('.', ',')}
                        </Text>
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
                  style={[styles.botaoAcaoOutlined, veiculos.length === 0 && { opacity: 0.5 }]}
                  disabled={veiculos.length === 0}
                  onPress={() => setModalEventoVisible(true)}
                >
                  <Text style={styles.textoBotaoOutlined}>Registrar Novo Evento</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoAcaoPreto}
                  onPress={() => setModalRelatorioVisible(true)}
                >
                  <Text style={styles.textoBotaoPreto}>Relatórios</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.secaoTitulo, styles.tituloHistorico]}>
              Histórico de Eventos
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.historicoCard}>
            <View style={styles.historicoLeft}>
              <View
                style={[
                  styles.combustivelIndicador,
                  { backgroundColor: getCorIndicador(item.tipo) },
                ]}
              />
              <View>
                <Text style={styles.historicoTituloText}>{item.tipo}</Text>
                <Text style={styles.historicoSubtexto}>{item.quilometragem} Km Atual</Text>
              </View>
            </View>

            <View style={styles.historicoRight}>
              <Text style={styles.historicoValorText}>{item.valorFormatado}</Text>
              <Text style={styles.historicoSubtexto}>{item.data}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.listaVaziaTexto}>Nenhum evento registrado para este veículo.</Text>
        }
      />

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBarItem} onPress={() => router.push('/home')}>
          <Ionicons name="home-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBarItem} onPress={() => router.push('/perfil')}>
          <Ionicons name="person-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* MODAL 1: ADICIONAR NOVO EVENTO (DINÂMICO) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalEventoVisible}
        onRequestClose={() => setModalEventoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalEventoVisible(false)}
            >
              <Ionicons name="close-circle" size={24} color="#000" />
            </TouchableOpacity>

            <Text style={styles.modalTitulo}>Adicionar novo evento</Text>
            <Text style={styles.modalSubtitulo}>
              Insira abaixo informações do evento que deseja incluir
            </Text>

            {/* Alternância Abastecimento / Serviço */}
            <View style={styles.selectorContainer}>
              <TouchableOpacity
                style={[
                  styles.selectorButton,
                  categoria === 'Abastecimento' && styles.selectorButtonAtivo,
                ]}
                onPress={() => setCategoria('Abastecimento')}
              >
                <Text
                  style={[
                    styles.selectorText,
                    categoria === 'Abastecimento' && styles.selectorTextAtivo,
                  ]}
                >
                  Abastecimento
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.selectorButton,
                  categoria === 'Serviço' && styles.selectorButtonAtivo,
                ]}
                onPress={() => setCategoria('Serviço')}
              >
                <Text
                  style={[
                    styles.selectorText,
                    categoria === 'Serviço' && styles.selectorTextAtivo,
                  ]}
                >
                  Serviço
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formModal}>
              {/* Seleção do Tipo de Serviço se for Categoria Serviço */}
              {categoria === 'Serviço' && (
                <>
                  <Text style={styles.inputLabel}>
                    Tipo de Serviço <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.tipoServicoRow}>
                    {['Troca de Óleo', 'Troca de Pneu', 'Outro'].map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.btnTipoServico,
                          nomeServico === item && styles.btnTipoServicoAtivo,
                        ]}
                        onPress={() => setNomeServico(item)}
                      >
                        <Text
                          style={[
                            styles.btnTipoServicoTexto,
                            nomeServico === item && styles.btnTipoServicoTextoAtivo,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.inputLabel}>
                Quilometragem Atual <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: 45000"
                keyboardType="numeric"
                value={quilometragem}
                onChangeText={setQuilometragem}
              />

              {/* Campo Quantidade apenas para Abastecimento */}
              {categoria === 'Abastecimento' && (
                <>
                  <Text style={styles.inputLabel}>
                    Quantidade Abastecida em Litros (Opcional)
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ex: 40"
                    keyboardType="numeric"
                    value={quantidade}
                    onChangeText={setQuantidade}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>
                Valor do Evento <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: 250.00"
                keyboardType="numeric"
                value={valor}
                onChangeText={setValor}
              />

              <TouchableOpacity style={styles.btnConfirmar} onPress={adicionarEvento}>
                <Text style={styles.btnConfirmarText}>Adicionar Evento</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: RELATÓRIO MENSAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalRelatorioVisible}
        onRequestClose={() => setModalRelatorioVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalRelatorioVisible(false)}
            >
              <Ionicons name="close-circle" size={24} color="#000" />
            </TouchableOpacity>

            <Text style={styles.modalTitulo}>Relatório Mensal</Text>
            <Text style={styles.modalSubtitulo}>Acompanhe seu gasto mensal abaixo</Text>

            <View style={styles.relatorioGrid}>
              <View style={styles.relatorioCardItem}>
                <Text style={styles.relatorioLabel}>Valor Total Gasto</Text>
                <Text style={styles.relatorioValor}>
                  R$ {valorTotalGastoMensal.toFixed(2).replace('.', ',')}
                </Text>
                <View style={styles.barsRow}>
                  {historico.slice(0, 4).map((h, i) => {
                    const maxVal = Math.max(...historico.map(x => x.valorNumerico), 1);
                    const hPercent = Math.max(Math.round((h.valorNumerico / maxVal) * 36), 10);
                    const cores = ['#10b981', '#f97316', '#f59e0b', '#ef4444'];
                    return (
                      <View
                        key={i}
                        style={[styles.bar, { height: hPercent, backgroundColor: cores[i % cores.length] }]}
                      />
                    );
                  })}
                  {historico.length === 0 && <View style={[styles.bar, { height: 15, backgroundColor: '#ccc' }]} />}
                </View>
              </View>

              <View style={styles.relatorioCardItem}>
                <Text style={styles.relatorioLabel}>Gasto Médio Abastecimento</Text>
                <Text style={styles.relatorioValor}>
                  R$ {mediaAbastecimento.toFixed(2).replace('.', ',')}
                </Text>
                <View style={styles.barsRow}>
                  {gastosAbastecimento.slice(0, 4).map((h, i) => {
                    const maxVal = Math.max(...gastosAbastecimento.map(x => x.valorNumerico), 1);
                    const hPercent = Math.max(Math.round((h.valorNumerico / maxVal) * 36), 10);
                    const cores = ['#f59e0b', '#10b981', '#f97316', '#ef4444'];
                    return (
                      <View
                        key={i}
                        style={[styles.bar, { height: hPercent, backgroundColor: cores[i % cores.length] }]}
                      />
                    );
                  })}
                  {gastosAbastecimento.length === 0 && <View style={[styles.bar, { height: 15, backgroundColor: '#ccc' }]} />}
                </View>
              </View>

              <View style={styles.relatorioCardItem}>
                <Text style={styles.relatorioLabel}>Gasto Médio Serviço</Text>
                <Text style={styles.relatorioValor}>
                  R$ {mediaServico.toFixed(2).replace('.', ',')}
                </Text>
                <View style={styles.barsRow}>
                  {gastosServicos.slice(0, 4).map((h, i) => {
                    const maxVal = Math.max(...gastosServicos.map(x => x.valorNumerico), 1);
                    const hPercent = Math.max(Math.round((h.valorNumerico / maxVal) * 36), 10);
                    const cores = ['#ef4444', '#f59e0b', '#f97316', '#10b981'];
                    return (
                      <View
                        key={i}
                        style={[styles.bar, { height: hPercent, backgroundColor: cores[i % cores.length] }]}
                      />
                    );
                  })}
                  {gastosServicos.length === 0 && <View style={[styles.bar, { height: 15, backgroundColor: '#ccc' }]} />}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingBottom: 80,
  },
  header: {
    paddingTop: 70,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  mensagem: {
    fontSize: 13,
    color: '#333333',
    alignSelf: 'flex-start',
  },
  nomeUsuario: {
    fontWeight: 'bold',
  },
  cardcontainer: {
    width: CARD_WIDTH,
    height: 150,
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  cardVazio: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  cardVazioTexto: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPlaca: {
    color: '#a0a0a0',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  miniGraficoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 24,
  },
  miniBarra: {
    width: 5,
    backgroundColor: '#333333',
    borderRadius: 2,
  },
  colunasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  coluna: {
    flex: 1,
  },
  colunaDireita: {
    alignItems: 'flex-end',
  },
  labelCard: {
    color: '#888888',
    fontSize: 10,
    marginBottom: 4,
  },
  valorCard: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  unidade: {
    fontSize: 11,
    fontWeight: 'normal',
    color: '#888888',
  },
  paginadorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  pontoPaginador: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
  },
  pontoPaginadorAtivo: {
    backgroundColor: '#000000',
    width: 24,
  },
  acoesContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  secaoTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  tituloHistorico: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  botoesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  botaoAcaoOutlined: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cccccc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  textoBotaoOutlined: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 12,
  },
  botaoAcaoPreto: {
    flex: 1,
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  textoBotaoPreto: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  historicoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  historicoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  combustivelIndicador: {
    width: 6,
    height: 32,
    borderRadius: 3,
  },
  historicoTituloText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  historicoSubtexto: {
    fontSize: 11,
    color: '#999999',
    marginTop: 2,
  },
  historicoRight: {
    alignItems: 'flex-end',
  },
  historicoValorText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },
  listaVaziaTexto: {
    textAlign: 'center',
    color: '#999',
    marginTop: 15,
    fontSize: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomBarItem: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 10,
    marginBottom: 4,
  },
  modalSubtitulo: {
    fontSize: 11,
    color: '#777777',
    marginBottom: 20,
    textAlign: 'center',
  },
  selectorContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 2,
    width: '100%',
    marginBottom: 16,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  selectorButtonAtivo: {
    backgroundColor: '#000000',
  },
  selectorText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  selectorTextAtivo: {
    color: '#ffffff',
  },
  formModal: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  tipoServicoRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  btnTipoServico: {
    flex: 1,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  btnTipoServicoAtivo: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  btnTipoServicoTexto: {
    fontSize: 10,
    color: '#333333',
    fontWeight: '500',
  },
  btnTipoServicoTextoAtivo: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modalInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 14,
    backgroundColor: '#ffffff',
  },
  btnConfirmar: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  btnConfirmarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  relatorioGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    gap: 8,
  },
  relatorioCardItem: {
    flex: 1,
    alignItems: 'center',
  },
  relatorioLabel: {
    fontSize: 9,
    color: '#777777',
    textAlign: 'center',
    marginBottom: 4,
  },
  relatorioValor: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 40,
  },
  bar: {
    width: 6,
    borderRadius: 2,
  },
});