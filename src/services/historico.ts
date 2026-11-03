import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

import type { NovoRegistro } from '@/types/garagem';
import { db } from '../../firebaseConfig';

export async function adicionarRegistro(
  usuarioId: string,
  veiculoId: string,
  dados: NovoRegistro
): Promise<void> {
  await addDoc(collection(db, 'historico'), {
    usuarioId,
    veiculoId,
    tipoRegistro: dados.tipoRegistro,
    tipoServicoOuCombustivel: dados.tipoServicoOuCombustivel,
    litros: String(dados.litros),
    quilometragem: String(dados.quilometragem),
    valorTotal: String(dados.valorTotal),
    observacao: dados.observacao,
    data: new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    dataCriacao: serverTimestamp(),
  });
}

export async function excluirRegistro(registroId: string): Promise<void> {
  await deleteDoc(doc(db, 'historico', registroId));
}
