import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, IconButton, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { toast } from 'sonner';
import { PaginationControls } from '../components/PaginationControls';
import { SearchBar } from '../components/SearchBar';

export const Leads = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [pipelineId, setPipelineId] = useState<number | ''>('' as any);
  const [email, setEmail] = useState('lead@example.com');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: number; email: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [orderBy, setOrderBy] = useState<'email' | 'status'>('email');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [status, setStatus] = useState<string>('');
  const [q, setQ] = useState('');

  const load = async (targetPage = page) => {
    if (!token) return;
    const [leadsRes, pipesRes] = await Promise.all([
      api.leadsIndex(token, { per_page: 10, page: targetPage, pipeline_id: pipelineId || undefined }),
      api.pipelinesIndex(token, { per_page: 50 })
    ]);
    if (leadsRes.ok && leadsRes.data) {
      setItems(leadsRes.data.leads);
      const p = (leadsRes.data as any).pagination; if (p) { setPages(p.pages); setPage(p.page); }
    } else {
      toast.error('Failed to load');
    }
    if (pipesRes.ok && pipesRes.data) setPipelines(pipesRes.data.pipelines);
  };

  useEffect(() => { load(1); }, [token, pipelineId]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !pipelineId) return;
    setLoading(true);
    const res = await api.leadsCreate(token, { pipeline_id: pipelineId, email, status: 'new' });
    setLoading(false);
    if (res.ok) await load();
  };

  const submitEdit = async () => {
    if (!token || !editing) return;
    const res = await api.leadsUpdate(token, editing.id, { email: editing.email });
    if (res.ok) {
      toast.success('Lead updated');
      setEditing(null);
      await load();
    } else {
      toast.error('Update failed');
    }
  };

  const confirmDelete = async () => {
    if (!token || deleting == null) return;
    const res = await api.leadsDelete(token, deleting);
    setDeleting(null);
    if (res.ok) {
      toast.success('Lead deleted');
      await load();
    } else {
      toast.error('Delete failed');
    }
  };

  const pipelineOptions = useMemo(() => [{ id: '', name: 'All Pipelines' }, ...pipelines], [pipelines]);

  return (
    <>
      <Typography variant="h5" fontWeight={700} gutterBottom>Leads</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField select size="small" label="Pipeline" value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')} sx={{ minWidth: 220 }}>
            {pipelineOptions.map((p) => <MenuItem key={p.id ?? 'all'} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">All</MenuItem>
            {['new','researching','enriched','outreach','scheduled','responded','won','lost','archived'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <SearchBar value={q} onChange={setQ} placeholder="Search leads" />
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
              <TableCell sortDirection={orderBy === 'email' ? order : false}>
                <TableSortLabel active={orderBy === 'email'} direction={orderBy === 'email' ? order : 'asc'} onClick={() => setOrder((o) => (orderBy === 'email' ? (o === 'asc' ? 'desc' : 'asc') : 'asc')) || setOrderBy('email')}>
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'status' ? order : false}>
                <TableSortLabel active={orderBy === 'status'} direction={orderBy === 'status' ? order : 'asc'} onClick={() => setOrder((o) => (orderBy === 'status' ? (o === 'asc' ? 'desc' : 'asc') : 'asc')) || setOrderBy('status')}>
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...items]
              .filter((l) => !status || l.status === status)
              .filter((l) => !q || (l.email?.toLowerCase().includes(q.toLowerCase()) || l.company?.toLowerCase().includes(q.toLowerCase())))
              .sort((a:any,b:any)=>{ const key = orderBy; const o = order === 'asc' ? 1 : -1; if(a[key]<b[key]) return -1*o; if(a[key]>b[key]) return 1*o; return 0; })
              .map((l) => (
              <TableRow key={l.id} hover>
                <TableCell>{l.email}</TableCell>
                <TableCell>{l.status}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" aria-label="edit" onClick={() => setEditing({ id: l.id, email: l.email })}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" aria-label="delete" onClick={() => setDeleting(l.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <PaginationControls page={page} pages={pages} onPageChange={(p) => load(p)} disabled={loading} />
      <Dialog open={!!editing} onClose={() => setEditing(null)}>
        <DialogTitle>Edit Lead</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" fullWidth label="Email" value={editing?.email || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, email: e.target.value } : prev)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button onClick={submitEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleting != null}
        title="Delete lead?"
        message="This cannot be undone."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
};
