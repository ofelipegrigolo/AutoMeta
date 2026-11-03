import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useUsuarioId } from '@/hooks/use-usuario-id';
import type { RegistroHistorico, Veiculo } from '@/types/garagem';
import { db } from '../../firebaseConfig';

/** Dados em tempo real do usuário logado: nome, veículos e histórico (mais novo primeiro). */
export function useGaragem() {
  const uid = useUsuarioId();

  const [nomeUsuario, setNomeUsuario] = useState('');
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [registros, setRegistros] = useState<RegistroHistorico[]>([]);
  const [carregadoPara, setCarregadoPara] = useState<string | null>(null);
  const carregando = uid !== null && carregadoPara !== uid;

  useEffect(() => {
    if (!uid) return;

    const cancelarUsuario = onSnapshot(
      doc(db, 'usuario', uid),
      (snap) => setNomeUsuario(snap.exists() ? snap.data().nome || 'Usuário' : 'Usuário'),
      (error) => console.error('Erro ao buscar nome do usuário:', error)
    );

    const cancelarHistorico = onSnapshot(
      query(collection(db, 'historico'), where('usuarioId', '==', uid), orderBy('dataCriacao', 'desc')),
      (snap) =>
        setRegistros(
          snap.docs.map((d) => ({
            id: d.id,
            // 'estimate' evita dataCriacao nula em registros recém-criados que o servidor ainda não confirmou
            ...(d.data({ serverTimestamps: 'estimate' }) as Omit<RegistroHistorico, 'id'>),
          }))
        ),
      (error) => console.error('Erro ao carregar histórico:', error)
    );

    const cancelarVeiculos = onSnapshot(
      query(collection(db, 'veiculos'), where('usuarioId', '==', uid)),
      (snap) => {
        setVeiculos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Veiculo, 'id'>) })));
        setCarregadoPara(uid);
      },
      (error) => {
        console.error('Erro ao carregar veículos:', error);
        setCarregadoPara(uid);
      }
    );

    return () => {
      cancelarUsuario();
      cancelarHistorico();
      cancelarVeiculos();
    };
  }, [uid]);

  return { uid, nomeUsuario, veiculos, registros, carregando };
}
