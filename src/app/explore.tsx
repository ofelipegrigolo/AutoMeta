import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../firebaseConfig';

interface TelaPerfilProps {
  navigation?: any;
}

const USUARIO_ID = '1';

export default function TelaPerfil({ navigation }: TelaPerfilProps) {
  // Dados salvos no banco
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [emailUsuario, setEmailUsuario] = useState('');
  const [telefoneUsuario, setTelefoneUsuario] = useState('');

  // Estados temporários para edição de formulário
  const [nomeEdit, setNomeEdit] = useState('');
  const [telefoneEdit, setTelefoneEdit] = useState('');

  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [editandoPerfil, setEditandoPerfil] = useState(false);

  // Estados do Modal do Veículo
  const [modalVeiculoVisivel, setModalVeiculoVisivel] = useState(false);
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [consumoMedio, setConsumoMedio] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'usuario', USUARIO_ID);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const nome = data.nome || '';
          const email = data.email || '';
          const telefone = data.telefone || '';

          setNomeUsuario(nome);
          setEmailUsuario(email);
          setTelefoneUsuario(telefone);

          setNomeEdit(nome);
          setTelefoneEdit(telefone);
        } else {
          Alert.alert('Erro', 'Documento "1" não foi encontrado no Firestore.');
        }
        setCarregandoPerfil(false);
      },
      (error) => {
        console.error('Erro ao buscar dados do usuário:', error);
        setCarregandoPerfil(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const iniciarEdicao = () => {
    setNomeEdit(nomeUsuario);
    setTelefoneEdit(telefoneUsuario);
    setEditandoPerfil(true);
  };

  const cancelarEdicao = () => {
    setNomeEdit(nomeUsuario);
    setTelefoneEdit(telefoneUsuario);
    setEditandoPerfil(false);
  };

  const salvarPerfil = async () => {
    if (!nomeEdit.trim()) {
      Alert.alert('Erro', 'O nome não pode estar vazio.');
      return;
    }

    try {
      const docRef = doc(db, 'usuario', USUARIO_ID);
      await updateDoc(docRef, {
        nome: nomeEdit.trim(),
        telefone: telefoneEdit.trim(),
      });

      setEditandoPerfil(false);
      Alert.alert('Sucesso', 'Perfil atualizado no banco de dados!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    }
  };

  const handlePlacaChange = (text: string) => {
    const limpo = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setPlaca(limpo);
  };

const salvarVeiculo = async () => {
    const placaLimpa = placa.trim();
    const modeloLimpo = modelo.trim();
    const consumoFormatado = consumoMedio.replace(',', '.').trim();

    if (!placaLimpa || !modeloLimpo) {
      Alert.alert('Campos Obrigatórios', 'Por favor, informe a placa e o modelo do veículo.');
      return;
    }

    if (placaLimpa.length < 7) {
      Alert.alert('Placa Inválida', 'A placa deve conter pelo menos 7 caracteres.');
      return;
    }

    setSalvando(true);

    try {
      await addDoc(collection(db, 'veiculos'), {
        usuarioId: USUARIO_ID, // <-- VÍNCULO ADICIONADO AQUI
        placa: placaLimpa,
        modelo: modeloLimpo,
        consumoMedio: consumoFormatado || '0.0',
        valorGasto: 'R$ 0,00',
        graficoBarras: [20, 20, 20, 20, 20],
        dataCriacao: serverTimestamp(),
      });

      Alert.alert('Sucesso', 'Veículo cadastrado com sucesso!');
      setPlaca('');
      setModelo('');
      setConsumoMedio('');
      setModalVeiculoVisivel(false);
    } catch (error) {
      console.error('Erro ao cadastrar veículo:', error);
      Alert.alert('Erro', 'Não foi possível salvar o veículo no banco de dados.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cabeçalho */}
        <View style={styles.headerPerfil}>
          <View style={styles.avatar}>
            {carregandoPerfil ? (
              <ActivityIndicator color="#00ff88" />
            ) : (
              <Text style={styles.textoAvatar}>
                {nomeUsuario ? nomeUsuario.charAt(0).toUpperCase() : 'U'}
              </Text>
            )}
          </View>
          <Text style={styles.nomeHeader}>{nomeUsuario || 'Carregando...'}</Text>
          <Text style={styles.emailHeader}>{emailUsuario}</Text>
        </View>

        {/* Seção: Dados Pessoais */}
        <View style={styles.secaoCard}>
          <View style={styles.headerSecao}>
            <Text style={styles.tituloSecao}>Dados Pessoais</Text>

            {!editandoPerfil ? (
              <TouchableOpacity onPress={iniciarEdicao}>
                <Text style={styles.textoAcaoSecao}>Editar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.acoesEdicao}>
                <TouchableOpacity onPress={cancelarEdicao} style={{ marginRight: 12 }}>
                  <Text style={styles.textoCancelarSecao}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={salvarPerfil}>
                  <Text style={styles.textoAcaoSecao}>Salvar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {editandoPerfil ? (
            /* Modo de Edição: Inputs Ativos */
            <>
              <Text style={styles.inputLabel}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                value={nomeEdit}
                onChangeText={setNomeEdit}
                placeholder="Seu nome"
              />

              <Text style={styles.inputLabel}>E-mail (Não editável)</Text>
              <TextInput
                style={[styles.input, styles.inputDesabilitado]}
                value={emailUsuario}
                editable={false}
              />

              <Text style={styles.inputLabel}>Telefone / WhatsApp</Text>
              <TextInput
                style={styles.input}
                value={telefoneEdit}
                onChangeText={setTelefoneEdit}
                keyboardType="phone-pad"
                placeholder="(00) 00000-0000"
              />
            </>
          ) : (
            /* Modo Visualização: Apenas Texto */
            <>
              <View style={styles.campoVisualizacao}>
                <Text style={styles.inputLabel}>Nome Completo</Text>
                <Text style={styles.textoValor}>{nomeUsuario || '-'}</Text>
              </View>

              <View style={styles.campoVisualizacao}>
                <Text style={styles.inputLabel}>E-mail</Text>
                <Text style={styles.textoValor}>{emailUsuario || '-'}</Text>
              </View>

              <View style={styles.campoVisualizacao}>
                <Text style={styles.inputLabel}>Telefone / WhatsApp</Text>
                <Text style={styles.textoValor}>{telefoneUsuario || '-'}</Text>
              </View>
            </>
          )}
        </View>

        {/* Garagem & Veículos */}
        <View style={styles.secaoCard}>
          <Text style={styles.tituloSecao}>Garagem & Veículos</Text>
          <Text style={styles.subtituloSecao}>Adicione e gerencie os veículos da sua conta.</Text>

          <TouchableOpacity
            style={styles.botaoAdicionarVeiculo}
            onPress={() => setModalVeiculoVisivel(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.textoBotaoAdicionar}>+ Cadastrar Novo Veículo</Text>
          </TouchableOpacity>
        </View>

        {/* Preferências & Opções */}
        <View style={styles.secaoCard}>
          <Text style={styles.tituloSecao}>Preferências & Opções</Text>

          <TouchableOpacity style={styles.itemOpcao} onPress={() => Alert.alert('Notificações', 'Em breve!')}>
            <Text style={styles.textoOpcao}>🔔 Notificações de Abastecimento</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.itemOpcao} onPress={() => Alert.alert('Relatório', 'Em breve!')}>
            <Text style={styles.textoOpcao}>📊 Exportar Relatório Geral (PDF)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.itemOpcao, styles.opcaoSair]}
            onPress={() => Alert.alert('Sair', 'Deseja realmente sair da conta?')}
          >
            <Text style={styles.textoSair}>🚪 Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Veículo */}
      <Modal visible={modalVeiculoVisivel} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.tituloModal}>Novo Veículo</Text>

            <View style={styles.cardPreview}>
              <Text style={styles.previewLabel}>Visualização do Veículo</Text>
              <Text style={styles.previewPlaca}>{placa || '*****'}</Text>
              <Text style={styles.previewModelo}>{modelo || 'Modelo do Veículo'}</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Placa (Ex: ABC1D23)"
              placeholderTextColor="#a0a0a0"
              autoCapitalize="characters"
              maxLength={7}
              value={placa}
              onChangeText={handlePlacaChange}
            />

            <TextInput
              style={styles.input}
              placeholder="Modelo (Ex: Honda Civic 2.0)"
              placeholderTextColor="#a0a0a0"
              value={modelo}
              onChangeText={setModelo}
            />

            <TextInput
              style={styles.input}
              placeholder="Consumo Médio (Ex: 12.5)"
              placeholderTextColor="#a0a0a0"
              keyboardType="decimal-pad"
              value={consumoMedio}
              onChangeText={setConsumoMedio}
            />

            <TouchableOpacity
              style={[styles.botaoSalvar, salvando && styles.botaoDesabilitado]}
              disabled={salvando}
              onPress={salvarVeiculo}
            >
              <Text style={styles.textoBotaoSalvar}>{salvando ? 'Salvando...' : 'Salvar Veículo'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botaoCancelar} onPress={() => setModalVeiculoVisivel(false)}>
              <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  headerPerfil: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textoAvatar: {
    color: '#00ff88',
    fontSize: 32,
    fontWeight: 'bold',
  },
  nomeHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f0f0f',
  },
  emailHeader: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  secaoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  headerSecao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  acoesEdicao: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tituloSecao: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f0f0f',
  },
  subtituloSecao: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  textoAcaoSecao: {
    fontSize: 14,
    color: '#00aa55',
    fontWeight: '600',
  },
  textoCancelarSecao: {
    fontSize: 14,
    color: '#ff3b30',
    fontWeight: '600',
  },
  campoVisualizacao: {
    marginBottom: 14,
  },
  textoValor: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0f0f0f',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputDesabilitado: {
    backgroundColor: '#fafafa',
    borderColor: '#eee',
    color: '#888',
  },
  botaoAdicionarVeiculo: {
    backgroundColor: '#0f0f0f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  textoBotaoAdicionar: {
    color: '#00ff88',
    fontWeight: '600',
    fontSize: 14,
  },
  itemOpcao: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  textoOpcao: {
    fontSize: 14,
    color: '#333',
  },
  opcaoSair: {
    borderBottomWidth: 0,
    marginTop: 6,
  },
  textoSair: {
    fontSize: 14,
    color: '#ff3b30',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
  },
  tituloModal: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#0f0f0f',
  },
  cardPreview: {
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  previewLabel: {
    color: '#a0a0a0',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  previewPlaca: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  previewModelo: {
    color: '#00ff88',
    fontSize: 13,
  },
  botaoSalvar: {
    backgroundColor: '#0f0f0f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  textoBotaoSalvar: {
    color: '#fff',
    fontWeight: '600',
  },
  botaoCancelar: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  textoBotaoCancelar: {
    color: '#666',
  },
});