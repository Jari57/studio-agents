import React, { useEffect, useState } from 'react';
import { auth, onAuthStateChanged } from '../firebase';

// Changing identity replaces the entire studio tree, including open editors,
// audio players, prompts, provider selections and in-flight UI state.
export default function AccountBoundary({ children }) {
  const [identity, setIdentity] = useState({ ready: !auth, uid: null });
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, user => {
      if (user) window.localStorage.setItem('studio_user_id', user.uid);
      else window.localStorage.removeItem('studio_user_id');
      setIdentity({ ready: true, uid: user?.uid || null });
    });
  }, []);
  if (!identity.ready) return <div role="status">Verifying your account…</div>;
  return children(identity.uid);
}
