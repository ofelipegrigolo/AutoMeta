import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Logo } from '@/components/logo';
import {
  definirNotificacoesAtivas,
  notificacoesAtivas,
} from '@/services/notificacoes';
import { adicionarVeiculo, atualizarVeiculo, excluirVeiculo } from '@/services/veiculos';
import { formatarTelefone } from '@/utils/telefone';
import { useUsuarioId } from '@/hooks/use-usuario-id';
import type { Veiculo } from '@/types/garagem';
import { auth, db } from '../../firebaseConfig';

export default function TelaPerfil() {
  const [perfilCarregadoPara, setPerfilCarregadoPara] = useState<string | null>(null);
  const uid = useUsuarioId();
  const loading = uid !== null && perfilCarregadoPara !== uid;

  // Estados de Usuário
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [emailUsuario, setEmailUsuario] = useState('');
  const [telefoneUsuario, setTelefoneUsuario] = useState('');
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState('');

  const [nomeEdit, setNomeEdit] = useState('');
  const [telefoneEdit, setTelefoneEdit] = useState('');
  const [fotoEdit, setFotoEdit] = useState('');

  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  // Controle de Abas (1: Garagem, 2: Dados Adicionais, 3: Configurações)
  const [abaAtiva, setAbaAtiva] = useState<1 | 2 | 3>(1);

  // Estados da Garagem (Veículos)
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [modalVeiculoVisivel, setModalVeiculoVisivel] = useState(false);
  const [placaInput, setPlacaInput] = useState('');
  const [modeloInput, setModeloInput] = useState('');
  const [consumoInput, setConsumoInput] = useState('');
  const [fotoVeiculoInput, setFotoVeiculoInput] = useState('');
  const [combustivelInput, setCombustivelInput] = useState('Flex');
  const [cambioInput, setCambioInput] = useState('Manual');

  const [salvandoVeiculo, setSalvandoVeiculo] = useState(false);
  // null = cadastrando um veículo novo; id = editando o veículo existente
  const [veiculoEditandoId, setVeiculoEditandoId] = useState<string | null>(null);

  const [notificacoesLigadas, setNotificacoesLigadas] = useState(false);

  useEffect(() => {
    notificacoesAtivas().then(setNotificacoesLigadas).catch(() => setNotificacoesLigadas(false));
  }, []);

  const alternarNotificacoes = async () => {
    try {
      const ligadas = await definirNotificacoesAtivas(!notificacoesLigadas);
      setNotificacoesLigadas(ligadas);
      if (!notificacoesLigadas && !ligadas) {
        Alert.alert(
          'Permissão necessária',
          'Ative as notificações do AutoMeta nas configurações do aparelho para receber lembretes.'
        );
      }
    } catch (error) {
      console.error('Erro ao alterar notificações:', error);
      Alert.alert('Erro', 'Não foi possível alterar as notificações.');
    }
  };

  const abrirNovoVeiculo = () => {
    setVeiculoEditandoId(null);
    setPlacaInput('');
    setModeloInput('');
    setConsumoInput('');
    setFotoVeiculoInput('');
    setCombustivelInput('Flex');
    setCambioInput('Manual');
    setModalVeiculoVisivel(true);
  };

  const abrirEdicaoVeiculo = (v: Veiculo) => {
    setVeiculoEditandoId(v.id);
    setPlacaInput(v.placa);
    setModeloInput(v.modelo ?? '');
    setConsumoInput(v.consumoMedio ?? '');
    setFotoVeiculoInput(v.fotoUrl ?? '');
    setCombustivelInput(v.combustivelPadrao ?? 'Flex');
    setCambioInput(v.cambio ?? 'Manual');
    setModalVeiculoVisivel(true);
  };

  const confirmarExclusaoVeiculo = (v: Veiculo) => {
    Alert.alert(
      'Excluir veículo',
      `Excluir ${v.placa} apaga também todo o histórico de eventos dele. Deseja continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (!uid) return;
            try {
              await excluirVeiculo(uid, v.id);
            } catch (error) {
              console.error('Erro ao excluir veículo:', error);
              Alert.alert('Erro', 'Não foi possível excluir o veículo.');
            }
          },
        },
      ]
    );
  };

  // Selecionar Foto de Perfil da Galeria
  const selecionarFotoPerfil = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'É preciso permitir acesso à galeria para alterar a foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setFotoEdit(result.assets[0].uri);
    }
  };

  // Selecionar Foto do Veículo da Galeria
  const selecionarFotoVeiculo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'É preciso permitir acesso à galeria para adicionar uma foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setFotoVeiculoInput(result.assets[0].uri);
    }
  };

  // 1. Buscar Dados do Usuário (documento com ID = uid do Auth)
  useEffect(() => {
    if (!uid) return;

    const docRef = doc(db, 'usuario', uid);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const nome = data.nome || 'Usuário';
          const email = data.email || 'usuario@email.com';
          const telefone = data.telefone || '';
          const foto = data.fotoUrl || '';

          setNomeUsuario(nome);
          setEmailUsuario(email);
          setTelefoneUsuario(telefone);
          setFotoPerfilUrl(foto);

          setNomeEdit(nome);
          setTelefoneEdit(telefone);
          setFotoEdit(foto);
        } else {
          setNomeUsuario('Usuário');
        }
        setPerfilCarregadoPara(uid);
      },
      (error) => {
        console.error('Erro ao carregar perfil:', error);
        setPerfilCarregadoPara(uid);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  // 2. Buscar Veículos SOMENTE do usuário logado (Garagem)
  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, 'veiculos'), where('usuarioId', '==', uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista: Veiculo[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Veiculo, 'id'>),
        }));
        setVeiculos(lista);
      },
      (error) => console.error('Erro ao carregar garagem:', error)
    );
    return () => unsubscribe();
  }, [uid]);

  const salvarPerfil = async () => {
    if (!nomeEdit.trim()) {
      Alert.alert('Atenção', 'O nome não pode ficar em branco.');
      return;
    }

    if (!uid) {
      Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
      return;
    }

    setSalvandoPerfil(true);
    try {
      await updateDoc(doc(db, 'usuario', uid), {
        nome: nomeEdit.trim(),
        telefone: telefoneEdit.trim(),
        fotoUrl: fotoEdit.trim(),
      });
      setEditandoPerfil(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const salvarVeiculo = async () => {
    const placaLimpa = placaInput.trim().toUpperCase();
    const modeloLimpo = modeloInput.trim();

    if (!placaLimpa || !modeloLimpo) {
      Alert.alert('Atenção', 'Preencha a placa e o modelo do veículo.');
      return;
    }

    if (!uid) {
      Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
      return;
    }

    setSalvandoVeiculo(true);
    try {
      const dados = {
        placa: placaLimpa,
        modelo: modeloLimpo,
        consumoMedio: consumoInput.trim() || '0.0',
        fotoUrl: fotoVeiculoInput.trim(),
        combustivelPadrao: combustivelInput,
        cambio: cambioInput,
      };

      if (veiculoEditandoId) {
        await atualizarVeiculo(veiculoEditandoId, dados);
      } else {
        await adicionarVeiculo(uid, dados);
      }

      setModalVeiculoVisivel(false);
      Alert.alert(
        'Sucesso',
        veiculoEditandoId ? 'Veículo atualizado com sucesso!' : 'Veículo adicionado com sucesso!'
      );
    } catch {
      Alert.alert('Erro', 'Falha ao salvar veículo.');
    } finally {
      setSalvandoVeiculo(false);
    }
  };

  // Sair da Conta: desloga do Firebase Auth (o _layout troca para a tela de login)
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao sair da conta:', error);
      Alert.alert('Erro', 'Não foi possível sair da conta. Tente novamente.');
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={[]}
        renderItem={() => null}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* CABEÇALHO / LOGO */}
            <View style={styles.logoContainer}>
              <Logo />
            </View>

            {/* CARD DE PERFIL */}
            <View style={styles.headerPerfil}>
              <View style={styles.avatar}>
                {fotoPerfilUrl ? (
                  <Image source={{ uri: fotoPerfilUrl }} style={styles.fotoAvatarImage} />
                ) : (
                  <Text style={styles.textoAvatar}>
                    {nomeUsuario ? nomeUsuario.charAt(0).toUpperCase() : 'U'}
                  </Text>
                )}
              </View>
              <Text style={styles.nomeHeader}>{nomeUsuario || 'Carregando...'}</Text>
              <Text style={styles.emailHeader}>{emailUsuario}</Text>
            </View>

            {/* CONTROLE DAS 3 ABAS (underline) */}
            <View style={styles.abasContainer}>
              <TouchableOpacity
                style={styles.botaoAba}
                onPress={() => setAbaAtiva(1)}
              >
                <Text style={[styles.textoAba, abaAtiva === 1 && styles.textoAbaAtiva]}>
                  Garagem
                </Text>
                {abaAtiva === 1 && <View style={styles.linhaAbaAtiva} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoAba}
                onPress={() => setAbaAtiva(2)}
              >
                <Text style={[styles.textoAba, abaAtiva === 2 && styles.textoAbaAtiva]}>
                  Dados Adicionais
                </Text>
                {abaAtiva === 2 && <View style={styles.linhaAbaAtiva} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoAba}
                onPress={() => setAbaAtiva(3)}
              >
                <Text style={[styles.textoAba, abaAtiva === 3 && styles.textoAbaAtiva]}>
                  Configurações
                </Text>
                {abaAtiva === 3 && <View style={styles.linhaAbaAtiva} />}
              </TouchableOpacity>
            </View>

            {/* ABA 1: GARAGEM / VEÍCULOS */}
            {abaAtiva === 1 && (
              <View style={styles.secaoConteudo}>
                <TouchableOpacity
                  style={styles.botaoAdicionarVeiculo}
                  onPress={abrirNovoVeiculo}
                >
                  <Ionicons name="car-outline" size={14} color="#0f0f0f" />
                  <Text style={styles.textoBotaoAdicionarVeiculo}>Adicionar Novo Veículo</Text>
                </TouchableOpacity>

                {veiculos.length === 0 ? (
                  <Text style={styles.listaVaziaTexto}>Nenhum Veículo Cadastrado.</Text>
                ) : (
                  veiculos.map((v) => (
                    <View key={v.id} style={styles.cardVeiculo}>
                      {v.fotoUrl ? (
                        <Image source={{ uri: v.fotoUrl }} style={styles.fotoVeiculoCard} />
                      ) : (
                        <View style={[styles.fotoVeiculoCard, styles.fotoVeiculoPlaceholder]}>
                          <Text style={{ fontSize: 28 }}>🚘</Text>
                        </View>
                      )}
                      <View style={styles.acoesVeiculo}>
                        <TouchableOpacity
                          style={styles.botaoAcaoVeiculo}
                          onPress={() => abrirEdicaoVeiculo(v)}
                        >
                          <Ionicons name="pencil" size={14} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.botaoAcaoVeiculo}
                          onPress={() => confirmarExclusaoVeiculo(v)}
                        >
                          <Ionicons name="trash-outline" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.overlayVeiculo}>
                        <Text style={styles.veiculoPlacaTexto}>{v.placa}</Text>
                        <Text style={styles.veiculoModeloTexto}>{v.modelo || 'Veículo'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ABA 2: DADOS ADICIONAIS */}
            {abaAtiva === 2 && (
              <View style={styles.secaoConteudo}>
                <View style={styles.headerSecaoRow}>
                  <Text style={styles.secaoTitulo}>Informações Pessoais</Text>
                  <TouchableOpacity onPress={() => setEditandoPerfil(!editandoPerfil)}>
                    <Text style={styles.linkEditar}>
                      {editandoPerfil ? 'Cancelar' : 'Editar'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {editandoPerfil ? (
                  <View style={styles.formContainer}>
                    <Text style={styles.inputLabel}>Foto de Perfil</Text>
                    <TouchableOpacity style={styles.botaoUpload} onPress={selecionarFotoPerfil}>
                      <Text style={styles.textoBotaoUpload}>Escolher Foto da Galeria</Text>
                    </TouchableOpacity>

                    {fotoEdit ? (
                      <Image source={{ uri: fotoEdit }} style={styles.previewImagemPerfil} />
                    ) : null}

                    <Text style={styles.inputLabel}>Nome Completo</Text>
                    <TextInput
                      style={styles.input}
                      value={nomeEdit}
                      onChangeText={setNomeEdit}
                      placeholder="Seu nome"
                      placeholderTextColor="#a0a0a0"
                    />

                    <Text style={styles.inputLabel}>Telefone</Text>
                    <TextInput
                      style={styles.input}
                      value={telefoneEdit}
                      onChangeText={(texto) => setTelefoneEdit(formatarTelefone(texto))}
                      placeholder="(00) 00000-0000"
                      placeholderTextColor="#a0a0a0"
                      keyboardType="phone-pad"
                    />

                    <TouchableOpacity
                      style={styles.botaoAcao}
                      onPress={salvarPerfil}
                      disabled={salvandoPerfil}
                    >
                      <Text style={styles.textoBotao}>
                        {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.dadosContainer}>
                    <View style={styles.dadoItem}>
                      <Text style={styles.dadoRotulo}>Nome</Text>
                      <Text style={styles.dadoValor}>{nomeUsuario || '-'}</Text>
                    </View>
                    <View style={styles.dadoItem}>
                      <Text style={styles.dadoRotulo}>E-mail</Text>
                      <Text style={styles.dadoValor}>{emailUsuario || '-'}</Text>
                    </View>
                    <View style={styles.dadoItem}>
                      <Text style={styles.dadoRotulo}>Telefone</Text>
                      <Text style={styles.dadoValor}>{telefoneUsuario || '-'}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ABA 3: CONFIGURAÇÕES */}
            {abaAtiva === 3 && (
              <View style={styles.secaoConteudo}>
                <View style={styles.dadosContainer}>
                  <TouchableOpacity style={styles.opcaoLinha} onPress={alternarNotificacoes}>
                    <Text style={styles.opcaoTexto}>Notificações</Text>
                    <Text style={styles.opcaoStatus}>{notificacoesLigadas ? 'Ativado' : 'Desativado'}</Text>
                  </TouchableOpacity>

                  <View style={styles.linhaSeparadora} />

                  <TouchableOpacity style={styles.opcaoLinha}>
                    <Text style={styles.opcaoTexto}>Alterar Senha</Text>
                  </TouchableOpacity>

                  <View style={styles.linhaSeparadora} />

                  <TouchableOpacity style={styles.opcaoLinha} onPress={handleLogout}>
                    <Text style={[styles.opcaoTexto, { color: '#ff002b' }]}>Sair da Conta</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        }
      />

      {/* MODAL CADASTRAR VEÍCULO */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVeiculoVisivel}
        onRequestClose={() => setModalVeiculoVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>
              {veiculoEditandoId ? 'Editar Veículo' : 'Adicionar Veículo'}
            </Text>
            <Text style={styles.modalTexto}>
              {veiculoEditandoId
                ? 'Atualize os dados do veículo.'
                : 'Cadastre um novo veículo em sua garagem.'}
            </Text>

            <View style={styles.inputsContainer}>
              <Text style={styles.inputLabel}>Modelo / Nome do Carro:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Civic 2.0 EXL"
                placeholderTextColor="#a0a0a0"
                value={modeloInput}
                onChangeText={setModeloInput}
              />

              <Text style={styles.inputLabel}>Placa:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: ABC1D23"
                placeholderTextColor="#a0a0a0"
                value={placaInput}
                onChangeText={setPlacaInput}
                autoCapitalize="characters"
                maxLength={7}
              />

              <Text style={styles.inputLabel}>Foto do Veículo:</Text>
              <TouchableOpacity style={styles.botaoUpload} onPress={selecionarFotoVeiculo}>
                <Text style={styles.textoBotaoUpload}>Escolher Foto do Carro</Text>
              </TouchableOpacity>

              {fotoVeiculoInput ? (
                <Image source={{ uri: fotoVeiculoInput }} style={styles.previewImagemVeiculo} />
              ) : null}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Combustível:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Flex, Gasolina..."
                    placeholderTextColor="#a0a0a0"
                    value={combustivelInput}
                    onChangeText={setCombustivelInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Câmbio:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Manual / Auto"
                    placeholderTextColor="#a0a0a0"
                    value={cambioInput}
                    onChangeText={setCambioInput}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Consumo Médio (Km/L):</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 12.5"
                placeholderTextColor="#a0a0a0"
                keyboardType="numeric"
                value={consumoInput}
                onChangeText={setConsumoInput}
              />
            </View>

            <TouchableOpacity
              style={styles.botaoFechar}
              onPress={salvarVeiculo}
              disabled={salvandoVeiculo}
            >
              <Text style={styles.textoBotao}>
                {salvandoVeiculo ? 'Salvando...' : veiculoEditandoId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoCancelar}
              onPress={() => setModalVeiculoVisivel(false)}
            >
              <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { paddingVertical: 20, paddingBottom: 30 },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 50,
    marginBottom: 16,
  },

  headerPerfil: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  fotoAvatarImage: {
    width: '100%',
    height: '100%',
  },
  textoAvatar: {
    color: '#00ff88',
    fontSize: 26,
    fontWeight: 'bold',
  },
  nomeHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f0f0f',
  },
  emailHeader: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },

  /* ABAS - estilo underline */
  abasContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  botaoAba: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  textoAba: {
    color: '#a0a0a0',
    fontWeight: '600',
    fontSize: 12,
  },
  textoAbaAtiva: {
    color: '#0f0f0f',
  },
  linhaAbaAtiva: {
    marginTop: 6,
    height: 2,
    width: '100%',
    backgroundColor: '#0f0f0f',
    borderRadius: 1,
  },

  /* CONTEÚDO DAS ABAS */
  secaoConteudo: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  headerSecaoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  secaoTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  linkEditar: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f0f0f',
  },

  /* GARAGEM */
  botaoAdicionarVeiculo: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#0f0f0f',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  textoBotaoAdicionarVeiculo: {
    color: '#0f0f0f',
    fontSize: 12,
    fontWeight: '600',
  },

  cardVeiculo: {
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  fotoVeiculoCard: {
    width: '100%',
    height: '100%',
  },
  fotoVeiculoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  acoesVeiculo: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
    zIndex: 1,
  },
  botaoAcaoVeiculo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayVeiculo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 100,
  },
  veiculoPlacaTexto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 35,
    left: 12,
  },
  veiculoModeloTexto: {
    color: '#e5e5e5',
    fontSize: 14,
    marginTop: 1,
    position: 'absolute',
    bottom: 12,
    left: 12, // desloca para a direita da placa
  },

  listaVaziaTexto: {
    textAlign: 'center',
    color: '#a0a0a0',
    marginTop: 20,
    fontSize: 13,
  },

  /* FORMULÁRIO DE DADOS */
  formContainer: {
    width: '100%',
    marginTop: 4,
  },
  dadosContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  dadoItem: {
    marginBottom: 12,
  },
  dadoRotulo: {
    fontSize: 12,
    color: '#a0a0a0',
    fontWeight: '600',
  },
  dadoValor: {
    fontSize: 15,
    color: '#0f0f0f',
    fontWeight: '500',
    marginTop: 2,
  },

  /* CONFIGURAÇÕES */
  opcaoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  opcaoTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f0f0f',
  },
  opcaoStatus: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  linhaSeparadora: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },

  /* BOTÕES E INPUTS DE UPLOAD */
  botaoUpload: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  textoBotaoUpload: {
    color: '#0f0f0f',
    fontWeight: '600',
    fontSize: 13,
  },
  previewImagemPerfil: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignSelf: 'center',
    marginBottom: 12,
  },
  previewImagemVeiculo: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },

  /* BOTÕES E INPUTS PADRÃO */
  botaoAcao: {
    backgroundColor: '#0f0f0f',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  textoBotao: { color: '#fff', fontWeight: '600', fontSize: 14 },

  /* MODAL */
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
  inputsContainer: { width: '100%', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0f0f0f',
    marginBottom: 12,
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
  botaoCancelar: { width: '100%', paddingVertical: 14, alignItems: 'center' },
  textoBotaoCancelar: { color: '#666', fontWeight: '600', fontSize: 14 },
});
