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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Leads</h1>
      </div>
      <div className="card p-4 flex items-center gap-3">
        <label className="label">Pipeline</label>
        <select className="input max-w-xs" value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')}>
          {pipelineOptions.map((p) => <option key={p.id ?? 'all'} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <form onSubmit={create} className="card p-4 flex items-center gap-3">
        <input className="input max-w-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="lead@example.com" />
        <button className="btn btn-primary" disabled={loading || !pipelineId} type="submit">Create Lead</button>
      </form>
      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id} className="border-t border-slate-800/60">
                <td className="font-medium">{l.email}</td>
                <td className="text-slate-400">{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
