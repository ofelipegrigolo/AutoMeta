import { useRouter } from 'expo-router';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

export default function AuthScreen() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Estados dos campos
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Atenção', 'Por favor, preencha email e senha.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN ---
        await signInWithEmailAndPassword(auth, email.trim(), password);
        router.replace('/home');
      } else {
        // --- CADASTRO ---
        if (!fullName.trim()) {
          Alert.alert('Atenção', 'Por favor, informe seu Nome Completo.');
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          Alert.alert('Erro', 'As senhas não coincidem.');
          setLoading(false);
          return;
        }

        // 1. Criar usuário no Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        const user = userCredential.user;

        // 2. Salvar documento no Firestore na coleção 'usuario' com ID do usuário
        await setDoc(doc(db, 'usuario', user.uid), {
          nome: fullName.trim(),
          email: email.trim(),
          telefone: phone.trim() || '',
          dataCriacao: new Date().toISOString(),
        });

        Alert.alert('Sucesso!', 'Conta criada com sucesso.');
        router.replace('/home');
      }
    } catch (error: any) {
      // Exibe o erro real no seu terminal para diagnóstico preciso
      console.error('ERRO DETALHADO DO FIREBASE:', error.code, error.message);

      let mensagem = 'Ocorreu um erro ao processar. Tente novamente.';

      switch (error.code) {
        case 'auth/email-already-in-use':
          mensagem = 'Este e-mail já está cadastrado em outra conta.';
          break;
        case 'auth/invalid-email':
          mensagem = 'O e-mail digitado não é válido.';
          break;
        case 'auth/weak-password':
          mensagem = 'A senha precisa ter no mínimo 6 caracteres.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          mensagem = 'E-mail ou senha incorretos.';
          break;
        case 'permission-denied':
          mensagem = 'Permissão negada no banco de dados Firestore.';
          break;
        default:
          mensagem = error.message || mensagem;
      }

      Alert.alert('Erro no Cadastro', mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.innerContainer}>
          <Text style={styles.title}>{isLogin ? 'Seja bem-vindo' : 'Crie sua conta'}</Text>
          <Text style={styles.subtitle}>
            Preencha os campos abaixo para começar a usar a plataforma.
          </Text>

          <View style={styles.form}>
            {!isLogin && (
              <>
                <Text style={styles.label}>
                  Nome Completo <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#666"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </>
            )}

            <Text style={styles.label}>
              Email {!isLogin && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {!isLogin && (
              <>
                <Text style={styles.label}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </>
            )}

            <Text style={styles.label}>
              Senha {!isLogin && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Sua senha (mínimo 6 caracteres)"
              placeholderTextColor="#666"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {!isLogin && (
              <>
                <Text style={styles.label}>
                  Confirmar a Senha <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirme sua senha"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.buttonPrimaryText}>
                  {isLogin ? 'Acessar' : 'Criar conta'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.orText}>ou</Text>
          </View>

          <TouchableOpacity
            onPress={() => setIsLogin(!isLogin)}
            style={styles.footerLink}
          >
            <Text style={styles.footerText}>
              {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
              <Text style={styles.linkBold}>{isLogin ? 'Criar conta' : 'Acessar'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  innerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#999999',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  label: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 6,
  },
  required: {
    color: '#FF4D4D',
  },
  input: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    height: 48,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 14,
  },
  buttonPrimary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonPrimaryText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  orText: {
    color: '#666666',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 16,
  },
  footerLink: {
    marginTop: 10,
    alignItems: 'center',
  },
  footerText: {
    color: '#999999',
    fontSize: 13,
  },
  linkBold: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});