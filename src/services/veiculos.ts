import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { cancelarLembretesVeiculo } from '@/services/notificacoes';
import type { DadosVeiculo } from '@/types/garagem';
import { db } from '../../firebaseConfig';

export async function adicionarVeiculo(usuarioId: string, dados: DadosVeiculo): Promise<void> {
  await addDoc(collection(db, 'veiculos'), {
    usuarioId,
    ...dados,
    dataCriacao: serverTimestamp(),
  });
}

export async function atualizarVeiculo(veiculoId: string, dados: DadosVeiculo): Promise<void> {
  await updateDoc(doc(db, 'veiculos', veiculoId), { ...dados });
}

/** Exclui o veículo, todo o seu histórico e os lembretes agendados. */
export async function excluirVeiculo(usuarioId: string, veiculoId: string): Promise<void> {
  const historico = await getDocs(
    query(
      collection(db, 'historico'),
      where('usuarioId', '==', usuarioId),
      where('veiculoId', '==', veiculoId)
    )
  );

  // Lotes de até 500 operações (limite do Firestore)
  for (let i = 0; i < historico.docs.length; i += 400) {
    const lote = writeBatch(db);
    historico.docs.slice(i, i + 400).forEach((d) => lote.delete(d.ref));
    await lote.commit();
  }

  await deleteDoc(doc(db, 'veiculos', veiculoId));
  await cancelarLembretesVeiculo(veiculoId);
}
