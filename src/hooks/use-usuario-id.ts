import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { auth } from '../../firebaseConfig';

/** UID do usuário logado no Firebase Auth, ou null quando não há sessão. */
export function useUsuarioId(): string | null {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  useEffect(() => onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null)), []);

  return uid;
}
