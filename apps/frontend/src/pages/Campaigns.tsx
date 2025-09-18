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
    <div>
      <h2>Campaigns</h2>
      <form onSubmit={create} style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" />
        <select value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')}>
          <option value="">(No pipeline)</option>
          {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button disabled={loading} type="submit">Create</button>
      </form>
      <ul>
        {items.map((c) => (
          <li key={c.id}>{c.name} <span style={{ opacity: 0.6 }}>({c.status})</span></li>
        ))}
      </ul>
    </div>
  );
};

