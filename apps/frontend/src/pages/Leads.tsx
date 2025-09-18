import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';

export const Leads = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [pipelineId, setPipelineId] = useState<number | ''>('' as any);
  const [email, setEmail] = useState('lead@example.com');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) return;
    const [leadsRes, pipesRes] = await Promise.all([
      api.leadsIndex(token, { per_page: 20, pipeline_id: pipelineId || undefined }),
      api.pipelinesIndex(token, { per_page: 50 })
    ]);
    if (leadsRes.ok && leadsRes.data) setItems(leadsRes.data.leads);
    if (pipesRes.ok && pipesRes.data) setPipelines(pipesRes.data.pipelines);
  };

  useEffect(() => { load(); }, [token, pipelineId]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !pipelineId) return;
    setLoading(true);
    const res = await api.leadsCreate(token, { pipeline_id: pipelineId, email, status: 'new' });
    setLoading(false);
    if (res.ok) await load();
  };

  const pipelineOptions = useMemo(() => [{ id: '', name: 'All Pipelines' }, ...pipelines], [pipelines]);

  return (
    <div>
      <h2>Leads</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
        <label>Pipeline:</label>
        <select value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')}>
          {pipelineOptions.map((p) => <option key={p.id ?? 'all'} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <form onSubmit={create} style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="lead@example.com" />
        <button disabled={loading || !pipelineId} type="submit">Create Lead</button>
      </form>
      <ul>
        {items.map((l) => (
          <li key={l.id}>{l.email} <span style={{ opacity: 0.6 }}>({l.status})</span></li>
        ))}
      </ul>
    </div>
  );
};

