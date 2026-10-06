// Never migrate ownerless browser data into an authenticated account. Cloud
// data is authoritative; legacy keys remain untouched for explicit recovery.
export function accountStorage(storage, uid, currentUid = () => uid) {
  const owner = uid || 'guest';
  const prefix = `studio_private_v2:${encodeURIComponent(owner)}:`;
  const active = () => (currentUid() || 'guest') === owner;
  const shared = new Set(['studio_guest_mode', 'studio_signing_out']);
  const keyFor = key => shared.has(key) ? key : `${prefix}${key}`;
  return {
    getItem(key) {
      if (!active()) return null;
      if (key === 'studio_user_id') return uid || null;
      return storage.getItem(keyFor(key));
    },
    setItem(key, value) {
      if (!active()) return;
      if (key === 'studio_user_id') {
        if (value === uid) storage.setItem(key, value);
        return;
      }
      storage.setItem(keyFor(key), value);
    },
    removeItem(key) {
      if (!active()) return;
      if (key === 'studio_user_id') return;
      storage.removeItem(keyFor(key));
    },
    clear() {
      if (!active()) return;
      const keys = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(prefix)) keys.push(key);
      }
      for (const key of keys) storage.removeItem(key);
    },
  };
}

export async function accountRequestHeaders(auth, ownerUid) {
  const user = auth?.currentUser;
  if (!ownerUid || user?.uid !== ownerUid) throw new Error('Your account changed. Reopen this project before continuing.');
  const token = await user.getIdToken();
  if (auth.currentUser?.uid !== ownerUid) throw new Error('Your account changed. Please try again from your own workspace.');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
