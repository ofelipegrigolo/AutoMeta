import { FontAwesome, Ionicons } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function TelaAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const handleSubmit = async () => {
    const emailLimpo = email.trim();
    const senhaLimpa = senha.trim();

    if (!emailLimpo || !senhaLimpa || (!isLogin && !nome.trim())) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!isLogin && senhaLimpa !== confirmarSenha.trim()) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    setCarregando(true);

    try {
      if (isLogin) {
        // Realizar Login
        await signInWithEmailAndPassword(auth, emailLimpo, senhaLimpa);
        Alert.alert('Sucesso', 'Bem-vindo de volta!');
      } else {
        // Criar Novo Usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          emailLimpo,
          senhaLimpa
        );
        const user = userCredential.user;

        // Criar o documento do usuário no Firestore usando o UID como ID
        await setDoc(doc(db, 'usuario', user.uid), {
          nome: nome.trim(),
          email: emailLimpo,
          telefone: telefone.trim(),
          dataCriacao: new Date(),
        });

        Alert.alert('Sucesso', 'Conta criada com sucesso!');
      }
    } catch (error: any) {
      console.error(error);
      let mensagemErro = 'Ocorreu um erro. Tente novamente.';
      if (error.code === 'auth/email-already-in-use') {
        mensagemErro = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/invalid-email') {
        mensagemErro = 'E-mail inválido.';
      } else if (error.code === 'auth/weak-password') {
        mensagemErro = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        mensagemErro = 'E-mail ou senha incorretos.';
      }
      Alert.alert('Erro', mensagemErro);
    } finally {
      setCarregando(false);
    }
  };

  const handleGoogleSignIn = () => {
    // TODO: integrar login com Google (expo-auth-session / firebase)
    console.log('Login com Google');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logotipo.png')}
            style={{ width: 100, height: 24, marginRight: 6 }}
          />
        </View>

        {/* Título */}
        <Text style={styles.titulo}>
          {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
        </Text>
        <Text style={styles.subtitulo}>
          {isLogin
            ? 'Preencha os campos abaixo para acessar a plataforma.'
            : 'Preencha os campos abaixo para começar a usar a plataforma.'}
        </Text>

        {/* Nome Completo (somente cadastro) */}
        {!isLogin && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Nome Completo <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholderTextColor="#6B6B6B"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
            />
          </View>
        )}

        {/* Email */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Email <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="#6B6B6B"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Telefone (somente cadastro) */}
        {!isLogin && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor="#6B6B6B"
              keyboardType="phone-pad"
              value={telefone}
              onChangeText={setTelefone}
            />
          </View>
        )}

        {/* Senha */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Senha <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholderTextColor="#6B6B6B"
              secureTextEntry={!mostrarSenha}
              value={senha}
              onChangeText={setSenha}
            />
            <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)}>
              <Ionicons
                name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#6B6B6B"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirmar Senha (somente cadastro) */}
        {!isLogin && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Confirmar a Senha <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholderTextColor="#6B6B6B"
                secureTextEntry={!mostrarConfirmarSenha}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
              />
              <TouchableOpacity
                onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
              >
                <Ionicons
                  name={mostrarConfirmarSenha ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B6B6B"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Botão principal */}
        <TouchableOpacity
          style={[styles.botao, carregando && styles.botaoDesabilitado]}
          onPress={handleSubmit}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#0D0D0D" />
          ) : (
            <Text style={styles.textoBotao}>
              {isLogin ? 'Entrar' : 'Criar conta'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Divisor "ou" */}
        <Text style={styles.ouTexto}>ou</Text>

        {/* Botão Google */}
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <Text style={styles.googleG}><FontAwesome name="google" size={32} color="white" /></Text>
        </TouchableOpacity>

        {/* Alternar Login / Cadastro */}
        <TouchableOpacity
          style={styles.trocarModo}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.textoTrocarModo}>
            {isLogin
              ? 'Não tem uma conta? Registre-se'
              : 'Já tem uma conta? Faça Login'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitulo: {
    color: '#9A9A9A',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    color: '#E5E5E5',
    fontSize: 13,
    marginBottom: 8,
  },
  required: {
    color: '#E05252',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  botao: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  textoBotao: {
    color: '#0D0D0D',
    fontSize: 15,
    fontWeight: '600',
  },
  ouTexto: {
    color: '#6B6B6B',
    fontSize: 13,
    marginVertical: 16,
  },
  googleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  trocarModo: {
    marginTop: 24,
    alignItems: 'center',
  },
  textoTrocarModo: {
    color: '#9A9A9A',
    fontSize: 13,
    fontWeight: '500',
  },
});
