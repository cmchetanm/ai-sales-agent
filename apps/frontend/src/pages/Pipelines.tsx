import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';

export const Pipelines = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('New Pipeline');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) return;
    const res = await api.pipelinesIndex(token, { per_page: 20 });
    if (res.ok && res.data) setItems(res.data.pipelines);
  };

  useEffect(() => { load(); }, [token]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    const res = await api.pipelinesCreate(token, { name });
    setLoading(false);
    if (res.ok) await load();
  };

  return (
    <div>
      <h2>Pipelines</h2>
      <form onSubmit={create} style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pipeline name" />
        <button disabled={loading} type="submit">Create</button>
      </form>
      <ul>
        {items.map((p) => (
          <li key={p.id}>{p.name} <span style={{ opacity: 0.6 }}>({p.status})</span></li>
        ))}
      </ul>
    </div>
  );
};

