import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
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
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Logo } from '@/components/logo';
import { formatarTelefone } from '@/utils/telefone';
import { auth, db } from '../../firebaseConfig';

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAMANHO_MINIMO_SENHA = 6;

type CampoProps = TextInputProps & {
  label: string;
  obrigatorio?: boolean;
};

function Campo({ label, obrigatorio, ...props }: CampoProps) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>
        {label}
        {obrigatorio && <Text style={styles.asterisco}> *</Text>}
      </Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#525252"
        autoCorrect={false}
        selectionColor="#ffffff"
        {...props}
      />
    </View>
  );
}

function IconeGoogle({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

function mensagemDeErro(codigo?: string): string {
  switch (codigo) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está em uso.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/weak-password':
      return `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet.';
    default:
      return 'Ocorreu um erro. Tente novamente.';
  }
}

export default function TelaAuth() {
  const insets = useSafeAreaInsets();

  const [cadastro, setCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const alternarModo = () => {
    setCadastro((atual) => !atual);
    setSenha('');
    setConfirmarSenha('');
  };

  const validar = (): string | null => {
    if (!email.trim() || !senha) return 'Preencha todos os campos obrigatórios.';
    if (!REGEX_EMAIL.test(email.trim())) return 'Informe um e-mail válido.';

    if (cadastro) {
      if (!nome.trim()) return 'Preencha todos os campos obrigatórios.';
      if (senha.length < TAMANHO_MINIMO_SENHA) {
        return `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
      }
      if (senha !== confirmarSenha) return 'As senhas não coincidem.';
    }

    return null;
  };

  const enviar = async () => {
    const erro = validar();
    if (erro) {
      Alert.alert('Atenção', erro);
      return;
    }

    const emailLimpo = email.trim();
    setCarregando(true);

    try {
      if (!cadastro) {
        await signInWithEmailAndPassword(auth, emailLimpo, senha);
        return;
      }

      const { user } = await createUserWithEmailAndPassword(auth, emailLimpo, senha);
      // Documento do usuário no Firestore usa o UID do Auth como ID
      await setDoc(doc(db, 'usuario', user.uid), {
        nome: nome.trim(),
        email: emailLimpo,
        telefone: telefone.trim(),
        fotoUrl: '',
        dataCriacao: serverTimestamp(),
      });
    } catch (error: unknown) {
      console.error('Erro de autenticação:', error);
      Alert.alert('Erro', mensagemDeErro((error as { code?: string }).code));
    } finally {
      setCarregando(false);
    }
  };

  const entrarComGoogle = () => {
    Alert.alert('Em breve', 'O acesso com Google ainda não está disponível.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.conteudo,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Logo tamanho="pequeno" cor="#ffffff" />

        <Text style={styles.titulo}>{cadastro ? 'Crie sua conta' : 'Seja bem-vindo'}</Text>
        <Text style={styles.subtitulo}>
          Preencha os campos abaixo para começar a usar a plataforma.
        </Text>

        <View style={styles.formulario}>
          {cadastro && (
            <Campo
              label="Nome Completo"
              obrigatorio
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
              textContentType="name"
            />
          )}

          <Campo
            label="Email"
            obrigatorio={cadastro}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
          />

          {cadastro && (
            <Campo
              label="Telefone"
              value={telefone}
              onChangeText={(texto) => setTelefone(formatarTelefone(texto))}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
            />
          )}

          <Campo
            label="Senha"
            obrigatorio={cadastro}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoCapitalize="none"
            textContentType={cadastro ? 'newPassword' : 'password'}
          />

          {cadastro && (
            <Campo
              label="Confirmar a Senha"
              obrigatorio
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
              autoCapitalize="none"
              textContentType="newPassword"
            />
          )}

          <TouchableOpacity
            style={[styles.botao, carregando && styles.botaoDesabilitado]}
            onPress={enviar}
            disabled={carregando}
            activeOpacity={0.85}>
            {carregando ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.botaoTexto}>{cadastro ? 'Criar conta' : 'Acessar'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.ou}>ou</Text>

        <TouchableOpacity
          style={styles.botaoGoogle}
          onPress={entrarComGoogle}
          accessibilityLabel="Continuar com Google">
          <IconeGoogle />
        </TouchableOpacity>

        <TouchableOpacity style={styles.alternar} onPress={alternarModo} disabled={carregando}>
          <Text style={styles.alternarTexto}>
            {cadastro ? 'Já tem uma conta? ' : 'Ainda não tem conta? '}
            <Text style={styles.alternarDestaque}>{cadastro ? 'Acessar' : 'Criar conta'}</Text>
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
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  titulo: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 40,
    textAlign: 'center',
  },
  subtitulo: {
    color: '#a3a3a3',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 260,
  },
  formulario: {
    width: '100%',
    marginTop: 28,
  },
  campo: {
    marginBottom: 14,
  },
  label: {
    color: '#e5e5e5',
    fontSize: 11,
    marginBottom: 6,
  },
  asterisco: {
    color: '#ef4444',
  },
  input: {
    height: 44,
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 6,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#ffffff',
  },
  botao: {
    height: 46,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  botaoTexto: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  ou: {
    color: '#e5e5e5',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 18,
  },
  botaoGoogle: {
    marginTop: 12,
    padding: 10,
  },
  alternar: {
    marginTop: 20,
    padding: 8,
  },
  alternarTexto: {
    color: '#a3a3a3',
    fontSize: 12,
  },
  alternarDestaque: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
