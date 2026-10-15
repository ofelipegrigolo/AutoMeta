import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../firebaseConfig'; // Ajuste o caminho conforme necessário

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

interface VeiculoPerfil {
  id: string;
  placa: string;
  modelo: string;
  ano?: string;
  fotoUrl?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<'Garagem' | 'Dados Adicionais' | 'Configurações'>('Garagem');
  
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [emailUsuario, setEmailUsuario] = useState('');
  const [veiculos, setVeiculos] = useState<VeiculoPerfil[]>([]);
  const [loading, setLoading] = useState(true);

  const usuarioAtual = auth.currentUser;

  // Buscar dados do usuário logado e seus veículos no Firestore
  useEffect(() => {
    if (!usuarioAtual) {
      setLoading(false);
      return;
    }

    setEmailUsuario(usuarioAtual.email || 'usuario@email.com');

    // 1. Buscar nome do usuário no Firestore
    const userDocRef = doc(db, 'usuario', usuarioAtual.uid);
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setNomeUsuario(docSnap.data().nome || 'Usuário');
      } else {
        setNomeUsuario('Usuário');
      }
    });

    // 2. Buscar somente os veículos cadastrados por este usuário
    const q = query(
      collection(db, 'veiculos'),
      where('usuarioId', '==', usuarioAtual.uid)
    );

    const unsubVeiculos = onSnapshot(
      q,
      (snapshot) => {
        const listaVeiculos: VeiculoPerfil[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            placa: data.placa || 'SEM PLACA',
            modelo: data.modelo || 'Veículo Cadastrado',
            ano: data.ano || '',
            fotoUrl: data.fotoUrl || '',
          };
        });
        setVeiculos(listaVeiculos);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar garagem:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubUser();
      unsubVeiculos();
    };
  }, [usuarioAtual]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Topo / Header Fixo */}
      <View style={styles.header}>

        {/* Foto e Informações do Perfil */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={32} color="#888888" />
          </View>
          <Text style={styles.userName}>{nomeUsuario}</Text>
          <Text style={styles.userEmail}>{emailUsuario}</Text>
        </View>

        {/* Abas de Navegação */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setAbaAtiva('Garagem')}
          >
            <Text style={[styles.tabText, abaAtiva === 'Garagem' && styles.tabTextActive]}>
              Garagem
            </Text>
            {abaAtiva === 'Garagem' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setAbaAtiva('Dados Adicionais')}
          >
            <Text style={[styles.tabText, abaAtiva === 'Dados Adicionais' && styles.tabTextActive]}>
              Dados Adicionais
            </Text>
            {abaAtiva === 'Dados Adicionais' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setAbaAtiva('Configurações')}
          >
            <Text style={[styles.tabText, abaAtiva === 'Configurações' && styles.tabTextActive]}>
              Configurações
            </Text>
            {abaAtiva === 'Configurações' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo Dinâmico */}
      <View style={styles.contentContainer}>
        {abaAtiva === 'Garagem' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Botão Adicionar Veículo que abre a nova tela */}
            <TouchableOpacity 
              style={styles.btnAddVeiculo}
              onPress={() => router.push('/cadastro-veiculo')}
            >
              <Ionicons name="car-outline" size={18} color="#000000" style={{ marginRight: 6 }} />
              <Text style={styles.btnAddVeiculoText}>Adicionar Novo Veículo</Text>
            </TouchableOpacity>

            {/* Listagem de Veículos */}
            {veiculos.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum Veículo Cadastrado.</Text>
            ) : (
              veiculos.map((veiculo) => (
                <View key={veiculo.id} style={styles.carCard}>
                  {veiculo.fotoUrl ? (
                    <Image source={{ uri: veiculo.fotoUrl }} style={styles.carBgImage} />
                  ) : null}
                  <View style={styles.carCardOverlay} />
                  <View style={styles.carDetails}>
                    <Text style={styles.carPlaca}>{veiculo.placa}</Text>
                    <Text style={styles.carModelo}>
                      {veiculo.modelo} {veiculo.ano ? `• ${veiculo.ano}` : ''}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {abaAtiva === 'Dados Adicionais' && (
          <View style={styles.tabContentCenter}>
            <Text style={styles.sectionPlaceholderTitle}>Informações Pessoais</Text>
            <Text style={styles.sectionPlaceholderSub}>Gerencie seus dados cadastrais e preferências.</Text>
          </View>
        )}

        {abaAtiva === 'Configurações' && (
          <View style={styles.tabContentCenter}>
            <Text style={styles.sectionPlaceholderTitle}>Configurações da Conta</Text>
            <Text style={styles.sectionPlaceholderSub}>Opções de tema, notificações e segurança.</Text>
          </View>
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBarItem} onPress={() => router.push('/home')}>
          <Ionicons name="home-outline" size={24} color="#666666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBarItem} onPress={() => router.push('/profile')}>
          <Ionicons name="person-outline" size={24} color="#000000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 90,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#777777',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    paddingVertical: 10,
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: 'bold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#000000',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
    alignItems: 'center',
  },
  btnAddVeiculo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    width: CARD_WIDTH,
    height: 42,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  btnAddVeiculoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999999',
    marginTop: 40,
    fontSize: 13,
  },
  carCard: {
    width: CARD_WIDTH,
    height: 110,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    justifyContent: 'flex-end',
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  carBgImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carCardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  carDetails: {
    zIndex: 2,
  },
  carPlaca: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  carModelo: {
    color: '#CCCCCC',
    fontSize: 11,
  },
  tabContentCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sectionPlaceholderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  sectionPlaceholderSub: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomBarItem: {
    padding: 10,
  },
});