import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { Logo } from '@/components/logo';

const FADE_IN_MS = 500;
const FADE_OUT_MS = 350;

type AutometaSplashProps = {
  /** Quando true, a splash faz fade-out e some da tela. */
  pronto: boolean;
};

/**
 * Splash da autometa exibida por cima do app enquanto a sessão é verificada.
 * Faz fade-in da marca, espera `pronto` e então faz fade-out e se desmonta.
 */
export function AutometaSplash({ pronto }: AutometaSplashProps) {
  const [marca] = useState(() => new Animated.Value(0));
  const [overlay] = useState(() => new Animated.Value(1));
  const [visivel, setVisivel] = useState(true);
  const [entrouNaTela, setEntrouNaTela] = useState(false);

  useEffect(() => {
    Animated.timing(marca, {
      toValue: 1,
      duration: FADE_IN_MS,
      useNativeDriver: true,
    }).start(() => setEntrouNaTela(true));
  }, [marca]);

  useEffect(() => {
    if (!pronto || !entrouNaTela) return;

    Animated.timing(overlay, {
      toValue: 0,
      duration: FADE_OUT_MS,
      useNativeDriver: true,
    }).start(() => setVisivel(false));
  }, [pronto, entrouNaTela, overlay]);

  if (!visivel) return null;

  return (
    <Animated.View
      pointerEvents={pronto && entrouNaTela ? 'none' : 'auto'}
      style={[styles.container, { opacity: overlay }]}
      // Esconde a splash nativa só depois da nossa estar desenhada, sem "piscar"
      onLayout={() => {
        SplashScreen.hideAsync().catch(() => {});
      }}>
      <Animated.View style={{ opacity: marca }}>
        <Logo tamanho="grande" cor="#FFFFFF" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
