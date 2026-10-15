import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth, db } from '../../firebaseConfig'; // Ajuste o caminho se necessário

export default function AddVehicleScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Estados dos Campos
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [quilometragem, setQuilometragem] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  // Selecionar foto da galeria
  const escolherFoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'É preciso permitir acesso às fotos para selecionar uma imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setFotoUri(result.assets[0].uri);
    }
  };

  const proximoPasso = () => {
    if (step === 1) {
      if (!placa.trim() || !modelo.trim()) {
        Alert.alert('Atenção', 'Por favor, preencha a placa e o modelo do veículo.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!ano.trim() || !quilometragem.trim()) {
        Alert.alert('Atenção', 'Por favor, informe o ano e a quilometragem atual.');
        return;
      }
      setStep(3);
    }
  };

  const passoAnterior = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    } else {
      router.back();
    }
  };

  const salvarVeiculo = async () => {
    const usuarioAtual = auth.currentUser;
    if (!usuarioAtual) {
      Alert.alert('Erro', 'Você precisa estar autenticado para cadastrar um veículo.');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'veiculos'), {
        usuarioId: usuarioAtual.uid,
        placa: placa.trim().toUpperCase(),
        modelo: modelo.trim(),
        ano: ano.trim(),
        quilometragem: Number(quilometragem) || 0,
        fotoUrl: fotoUri || '',
        consumoMedio: '0.0',
        valorGasto: 'R$ 0,00',
        dataCriacao: serverTimestamp(),
      });

      Alert.alert('Sucesso!', 'Veículo cadastrado na sua garagem.');
      router.replace('/perfil');
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar o veículo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header Fixo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={passoAnterior} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cadastrar Veículo</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Barra de Progresso */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' },
            ]}
          />
        </View>
        <Text style={styles.stepIndicatorText}>Etapa {step} de 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ETAPA 1: Placa e Modelo */}
        {step === 1 && (
          <View style={styles.stepForm}>
            <Text style={styles.stepTitle}>Identificação do Veículo</Text>
            <Text style={styles.stepSubtitle}>Informe a placa e o modelo do automóvel.</Text>

            <Text style={styles.label}>Placa do Veículo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: ABC1D23 ou MLU7272"
              placeholderTextColor="#888888"
              autoCapitalize="characters"
              value={placa}
              onChangeText={setPlaca}
            />

            <Text style={styles.label}>Modelo do Veículo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Volkswagen Jetta CLI, Fiat Palio"
              placeholderTextColor="#888888"
              value={modelo}
              onChangeText={setModelo}
            />

            <TouchableOpacity style={styles.btnPrimary} onPress={proximoPasso}>
              <Text style={styles.btnPrimaryText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ETAPA 2: Ano e Quilometragem */}
        {step === 2 && (
          <View style={styles.stepForm}>
            <Text style={styles.stepTitle}>Detalhes do Veículo</Text>
            <Text style={styles.stepSubtitle}>Preencha os dados do ano e a quilometragem atual.</Text>

            <Text style={styles.label}>Ano de Fabricação *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2021"
              placeholderTextColor="#888888"
              keyboardType="numeric"
              maxLength={4}
              value={ano}
              onChangeText={setAno}
            />

            <Text style={styles.label}>Quilometragem Atual (Km) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 45000"
              placeholderTextColor="#888888"
              keyboardType="numeric"
              value={quilometragem}
              onChangeText={setQuilometragem}
            />

            <TouchableOpacity style={styles.btnPrimary} onPress={proximoPasso}>
              <Text style={styles.btnPrimaryText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ETAPA 3: Foto (Opcional) */}
        {step === 3 && (
          <View style={styles.stepForm}>
            <Text style={styles.stepTitle}>Foto do Veículo</Text>
            <Text style={styles.stepSubtitle}>
              Adicione uma foto para ilustrar o seu veículo na sua Garagem (opcional).
            </Text>

            <TouchableOpacity style={styles.imagePickerCard} onPress={escolherFoto}>
              {fotoUri ? (
                <Image source={{ uri: fotoUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#666666" />
                  <Text style={styles.imagePickerText}>Toque para selecionar uma foto</Text>
                </View>
              )}
            </TouchableOpacity>

            {fotoUri && (
              <TouchableOpacity onPress={() => setFotoUri(null)} style={styles.removeFotoBtn}>
                <Text style={styles.removeFotoText}>Remover foto selecionada</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={salvarVeiculo}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnPrimaryText}>Concluir Cadastro</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FAFAFA',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#000000',
  },
  stepIndicatorText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  stepForm: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    height: 48,
    color: '#000000',
    paddingHorizontal: 16,
    marginBottom: 20,
    fontSize: 14,
  },
  btnPrimary: {
    backgroundColor: '#000000',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  imagePickerCard: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 13,
    color: '#666666',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeFotoBtn: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  removeFotoText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
});