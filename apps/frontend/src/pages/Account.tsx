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
    <div className="space-y-4">
      <h1 className="page-title">Account</h1>
      <form onSubmit={onSubmit} className="card p-4 flex items-center gap-3 max-w-lg">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary" disabled={saving} type="submit">Save</button>
      </form>
    </div>
  );
};
