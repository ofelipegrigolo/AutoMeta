import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

type ModalBaseProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Casca padrão dos modais: fundo escurecido, cartão branco e botão de fechar. */
export function ModalBase({ visible, onClose, children, contentStyle }: ModalBaseProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.content, contentStyle]}>
          <TouchableOpacity style={styles.botaoFechar} onPress={onClose}>
            <Ionicons name="close" size={13} color="#ffffff" />
          </TouchableOpacity>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const modalStyles = StyleSheet.create({
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f0f0f',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 12,
    color: '#4b4b4b',
    marginBottom: 20,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  botaoFechar: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
