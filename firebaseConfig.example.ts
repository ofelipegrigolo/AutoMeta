// Copie para firebaseConfig.ts e preencha com os dados do seu projeto Firebase.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
// @ts-ignore getReactNativePersistence só é exportado no bundle React Native
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJETO.firebasestorage.app",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
  measurementId: "SEU_MEASUREMENT_ID"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function criarAuth() {
  // Na web o Firebase já persiste a sessão no navegador
  if (Platform.OS === 'web') return getAuth(app);

  try {
    // Cast evita erro de tipo do TypeScript; a função existe em runtime no React Native
    return initializeAuth(app, {
      persistence: (getReactNativePersistence as any)(AsyncStorage),
    });
  } catch {
    // Fast Refresh reexecuta este módulo; o Auth já foi inicializado
    return getAuth(app);
  }
}

function criarFirestore() {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    // Fast Refresh reexecuta este módulo; o Firestore já foi inicializado
    return getFirestore(app);
  }
}

export const auth = criarAuth();
export const db = criarFirestore();
