import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';

export const Campaigns = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [name, setName] = useState('Campaign');
  const [pipelineId, setPipelineId] = useState<number | ''>('' as any);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) return;
    const [cRes, pRes] = await Promise.all([
      api.campaignsIndex(token, { per_page: 20 }),
      api.pipelinesIndex(token, { per_page: 50 })
    ]);
    if (cRes.ok && cRes.data) setItems(cRes.data.campaigns);
    if (pRes.ok && pRes.data) setPipelines(pRes.data.pipelines);
  };

  useEffect(() => { load(); }, [token]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    const res = await api.campaignsCreate(token, { name, channel: 'email', status: 'draft', pipeline_id: pipelineId || undefined });
    setLoading(false);
    if (res.ok) await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Campaigns</h1>
      </div>
      <form onSubmit={create} className="card p-4 flex items-center gap-3">
        <input className="input max-w-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" />
        <select className="input max-w-xs" value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')}>
          <option value="">(No pipeline)</option>
          {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
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
            {items.map((c) => (
              <tr key={c.id} className="border-t border-slate-800/60">
                <td className="font-medium">{c.name}</td>
                <td className="text-slate-400">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
