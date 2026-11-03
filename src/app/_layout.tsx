import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AutometaSplash } from '@/components/autometa-splash';
import TelaAuth from '@/components/TelaAuth';
import { auth } from '../../firebaseConfig';

// Mantém a splash nativa até a splash da autometa estar desenhada
SplashScreen.preventAutoHideAsync().catch(() => {});

// Se o Firebase demorar ou falhar, o app abre mesmo assim após este tempo
const TIMEOUT_SESSAO_MS = 3000;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [sessaoVerificada, setSessaoVerificada] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuarioLogado) => {
      setUser(usuarioLogado);
      setSessaoVerificada(true);
    });

    const timer = setTimeout(() => setSessaoVerificada(true), TIMEOUT_SESSAO_MS);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {sessaoVerificada && (user ? <AppTabs /> : <TelaAuth />)}
        <AutometaSplash pronto={sessaoVerificada} />
      </ThemeProvider>
    </View>
  );
}
