import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { DIAS_LEMBRETE_SERVICO } from '@/constants/garagem';

const CHAVE_PREFERENCIA = 'notificacoes-ativas';
const CANAL_ANDROID = 'lembretes';
const HORA_LEMBRETE = 9;

const suportado = Platform.OS !== 'web';

if (suportado) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function notificacoesPermitidas(): Promise<boolean> {
  if (!suportado) return false;
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

async function pedirPermissao(): Promise<boolean> {
  if (!suportado) return false;

  if (Platform.OS === 'android') {
    // No Expo Go o módulo de canais pode falhar; sem canal próprio o Android usa o padrão
    await Notifications.setNotificationChannelAsync(CANAL_ANDROID, {
      name: 'Lembretes de manutenção',
      importance: AndroidImportance.DEFAULT,
    }).catch((error) => console.warn('Canal de notificação indisponível:', error));
  }

  if (await notificacoesPermitidas()) return true;
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

/** Preferência do usuário (ligada por padrão) combinada com a permissão do sistema. */
export async function notificacoesAtivas(): Promise<boolean> {
  const preferencia = await AsyncStorage.getItem(CHAVE_PREFERENCIA);
  if (preferencia === 'false') return false;
  return notificacoesPermitidas();
}

/** Liga/desliga os lembretes. Ao desligar, cancela os já agendados. Retorna o estado final. */
export async function definirNotificacoesAtivas(ativas: boolean): Promise<boolean> {
  if (!ativas) {
    await AsyncStorage.setItem(CHAVE_PREFERENCIA, 'false');
    if (suportado) await Notifications.cancelAllScheduledNotificationsAsync();
    return false;
  }

  const permitido = await pedirPermissao();
  await AsyncStorage.setItem(CHAVE_PREFERENCIA, permitido ? 'true' : 'false');
  return permitido;
}

function identificadorLembrete(veiculoId: string, servico: string): string {
  return `lembrete|${veiculoId}|${servico}`;
}

/**
 * Agenda o lembrete da próxima manutenção a partir do serviço recém-registrado.
 * Um novo serviço do mesmo tipo substitui o lembrete anterior do veículo.
 */
export async function agendarLembreteServico(
  veiculoId: string,
  placa: string,
  servico: string
): Promise<void> {
  const dias = DIAS_LEMBRETE_SERVICO[servico];
  if (!dias || !(await notificacoesAtivas())) return;

  const quando = new Date();
  quando.setDate(quando.getDate() + dias);
  quando.setHours(HORA_LEMBRETE, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    identifier: identificadorLembrete(veiculoId, servico),
    content: {
      title: 'Hora de revisar o veículo 🔧',
      body: `${servico} do veículo ${placa} está próxima do prazo.`,
      data: { veiculoId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: quando,
      channelId: CANAL_ANDROID,
    },
  });
}

/** Remove todos os lembretes agendados de um veículo (ex.: ao excluí-lo). */
export async function cancelarLembretesVeiculo(veiculoId: string): Promise<void> {
  if (!suportado) return;
  const agendadas = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    agendadas
      .filter((n) => n.content.data?.veiculoId === veiculoId)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

/** Mostra uma notificação imediatamente (sem agendamento), se o usuário a mantiver ativa. */
export async function notificarAgora(
  titulo: string,
  corpo: string,
  veiculoId: string
): Promise<boolean> {
  if (!(await notificacoesAtivas())) return false;

  await Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: corpo, data: { veiculoId } },
    trigger: null,
  });
  return true;
}
