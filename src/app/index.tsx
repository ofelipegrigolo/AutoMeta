import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  // Redireciona automaticamente para a tela de login após 2.5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/auth');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container} onTouchEnd={() => router.replace('/login')}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>autometa</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
});