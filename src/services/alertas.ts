import AsyncStorage from '@react-native-async-storage/async-storage';

import { notificarAgora } from '@/services/notificacoes';
import type { RegistroHistorico, Veiculo } from '@/types/garagem';
import { gerarAlertas } from '@/utils/alertas';

const MS_DIA = 24 * 60 * 60 * 1000;

/**
 * Avalia todos os veículos e dispara na hora os alertas pertinentes.
 * Cada alerta só se repete após o seu intervalo mínimo, para não incomodar.
 */
export async function verificarAlertas(
  veiculos: Veiculo[],
  registros: RegistroHistorico[]
): Promise<void> {
  const agora = Date.now();

  for (const veiculo of veiculos) {
    for (const alerta of gerarAlertas(veiculo, registros)) {
      const chave = `alerta|${veiculo.id}|${alerta.tipo}`;
      const ultimo = Number(await AsyncStorage.getItem(chave)) || 0;
      if (agora - ultimo < alerta.intervaloDias * MS_DIA) continue;

      // Só marca como enviado se a notificação realmente saiu
      if (await notificarAgora(alerta.titulo, alerta.corpo, veiculo.id)) {
        await AsyncStorage.setItem(chave, String(agora));
      }
    }
  }
}
