import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCWgYtTrWOmvNSnftMjJu3R6JeLVZ5I0kc",
  authDomain: "gestaodeconsumo-64031.firebaseapp.com",
  projectId: "gestaodeconsumo-64031",
  storageBucket: "gestaodeconsumo-64031.firebasestorage.app",
  messagingSenderId: "1024654088041",
  appId: "1:1024654088041:web:2679e102b2d3f1e500cff8",
  measurementId: "G-B7J25W1WB2"
};

const app = initializeApp(firebaseConfig);

// Usar (getReactNativePersistence as any) evita o erro do TypeScript
// garantindo a execução correta no runtime do React Native/Expo.
export const auth = initializeAuth(app, {
  persistence: (getReactNativePersistence as any)(AsyncStorage),
});

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});