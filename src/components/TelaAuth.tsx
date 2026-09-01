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
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function TelaAuth() {
  // ... seu código da tela de autenticação
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async () => {
    const emailLimpo = email.trim();
    const senhaLimpa = senha.trim();

    if (!emailLimpo || !senhaLimpa || (!isLogin && !nome.trim())) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
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
          telefone: '',
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.titulo}>{isLogin ? 'Entrar' : 'Criar Conta'}</Text>

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Nome Completo"
            placeholderTextColor="#a0a0a0"
            value={nome}
            onChangeText={setNome}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#a0a0a0"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#a0a0a0"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity
          style={[styles.botao, carregando && styles.botaoDesabilitado]}
          onPress={handleSubmit}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.textoBotao}>
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </Text>
          )}
        </TouchableOpacity>

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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f0f0f',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
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
  botao: {
    backgroundColor: '#0f0f0f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  textoBotao: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  trocarModo: {
    marginTop: 16,
    alignItems: 'center',
  },
  textoTrocarModo: {
    color: '#00aa55',
    fontSize: 14,
    fontWeight: '600',
  },
});