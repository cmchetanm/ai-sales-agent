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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Pipelines</h1>
      </div>
      <form onSubmit={create} className="card p-4 flex items-center gap-3">
        <input className="input max-w-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pipeline name" />
        <button className="btn btn-primary" disabled={loading} type="submit">Create</button>
      </form>
      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-slate-800/60">
                <td className="font-medium">{p.name}</td>
                <td className="text-slate-400">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
