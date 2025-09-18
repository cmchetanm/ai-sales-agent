import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';

export const Account = () => {
  const { token, account, reload } = useAuth();
  const [name, setName] = useState(account?.name || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setName(account?.name || ''); }, [account]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    const res = await api.accountUpdate(token, { name });
    setSaving(false);
    if (res.ok) await reload();
  };

  return (
    <div>
      <h2>Account</h2>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <button disabled={saving} type="submit">Save</button>
      </form>
    </div>
  );
};

