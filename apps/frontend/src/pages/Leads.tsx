import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';

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
    <>
      <Typography variant="h5" fontWeight={700} gutterBottom>Leads</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 1 }}>
          <TextField select size="small" label="Pipeline" value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')} sx={{ minWidth: 220 }}>
            {pipelineOptions.map((p) => <MenuItem key={p.id ?? 'all'} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
        </CardContent>
      </Card>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 1 }}>
          <TextField size="small" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button variant="contained" disabled={loading || !pipelineId} onClick={create as any}>Create Lead</Button>
        </CardContent>
      </Card>
      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((l) => (
              <TableRow key={l.id} hover>
                <TableCell>{l.email}</TableCell>
                <TableCell>{l.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
