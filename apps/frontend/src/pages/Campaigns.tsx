import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, IconButton, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { toast } from 'sonner';
import { PaginationControls } from '../components/PaginationControls';
import { SearchBar } from '../components/SearchBar';
import { useQueryState } from '../hooks/useQueryState';
import { CreateCampaignDialog } from '../components/CreateCampaignDialog';

export const Campaigns = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [name, setName] = useState('Campaign');
  const [pipelineId, setPipelineId] = useState<number | ''>('' as any);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string; status: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useQueryState('page', 1 as any, 'number');
  const [pages, setPages] = useState(0);
  const [orderBy, setOrderBy] = useQueryState('orderBy', 'name');
  const [order, setOrder] = useQueryState('order', 'asc');
  const [status, setStatus] = useQueryState('status', '');
  const [q, setQ] = useQueryState('q', '');

  const load = async (targetPage = page) => {
    if (!token) return;
    const [cRes, pRes] = await Promise.all([
      api.campaignsIndex(token, { per_page: 10, page: targetPage }),
      api.pipelinesIndex(token, { per_page: 50 })
    ]);
    if (cRes.ok && cRes.data) {
      setItems(cRes.data.campaigns);
      const p = (cRes.data as any).pagination; if (p) { setPages(p.pages); setPage(p.page); }
    } else {
      toast.error('Failed to load');
    }
    if (pRes.ok && pRes.data) setPipelines(pRes.data.pipelines);
  };

  useEffect(() => { load(page || 1); }, [token]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    const res = await api.campaignsCreate(token, { name, channel: 'email', status: 'draft', pipeline_id: pipelineId || undefined });
    setLoading(false);
    if (res.ok) await load();
  };

  const submitEdit = async () => {
    if (!token || !editing) return;
    const res = await api.campaignsUpdate(token, editing.id, { name: editing.name, status: editing.status });
    if (res.ok) {
      toast.success('Campaign updated');
      setEditing(null);
      await load();
    } else {
      toast.error('Update failed');
    }
  };

  const confirmDelete = async () => {
    if (!token || deleting == null) return;
    const res = await api.campaignsDelete(token, deleting);
    setDeleting(null);
    if (res.ok) {
      toast.success('Campaign deleted');
      await load();
    } else {
      toast.error('Delete failed');
    }
  };

  return (
    <>
      <Typography variant="h5" fontWeight={700} gutterBottom>Campaigns</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField size="small" label="Campaign" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField select size="small" label="Pipeline" value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')} sx={{ minWidth: 220 }}>
            <MenuItem value="">(No pipeline)</MenuItem>
            {pipelines.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">All</MenuItem>
            {['draft','scheduled','running','paused','completed','archived'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <SearchBar value={q} onChange={setQ} placeholder="Search campaigns" />
          <Button variant="contained" onClick={() => setCreateOpen(true)}>New Campaign</Button>
        </CardContent>
      </Card>
      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sortDirection={orderBy === 'name' ? (order as any) : false}>
                <TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? (order as any) : 'asc'} onClick={() => setOrder(orderBy === 'name' && order === 'asc' ? 'desc' : 'asc') || setOrderBy('name')}>
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'status' ? (order as any) : false}>
                <TableSortLabel active={orderBy === 'status'} direction={orderBy === 'status' ? (order as any) : 'asc'} onClick={() => setOrder(orderBy === 'status' && order === 'asc' ? 'desc' : 'asc') || setOrderBy('status')}>
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...items]
              .filter((c) => !status || c.status === status)
              .filter((c) => !q || c.name?.toLowerCase().includes(q.toLowerCase()))
              .sort((a:any,b:any)=>{ const key = orderBy; const o = order === 'asc' ? 1 : -1; if(a[key]<b[key]) return -1*o; if(a[key]>b[key]) return 1*o; return 0; })
              .map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>{c.name}</TableCell>
                <TableCell>
                  <TextField
                    select size="small" value={c.status}
                    onChange={async (e) => {
                      const next = e.target.value;
                      const res = await api.campaignsUpdate(token!, c.id, { status: next });
                      if (res.ok) { toast.success('Status updated'); await load(); } else { toast.error('Update failed'); }
                    }}
                  >
                    {['draft','scheduled','running','paused','completed','archived'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </TableCell>
                <TableCell align="right"> 
                  <IconButton size="small" aria-label="edit" onClick={() => setEditing({ id: c.id, name: c.name, status: c.status })}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" aria-label="delete" onClick={() => setDeleting(c.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <PaginationControls page={page} pages={pages} onPageChange={(p) => load(p)} disabled={loading} />
      <Dialog open={!!editing} onClose={() => setEditing(null)}>
        <DialogTitle>Edit Campaign</DialogTitle>
        <DialogContent sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
          <TextField autoFocus margin="dense" fullWidth label="Name" value={editing?.name || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)} />
          <TextField select label="Status" value={editing?.status || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, status: e.target.value } : prev)}>
            {['draft','scheduled','running','paused','completed','archived'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button onClick={submitEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleting != null}
        title="Delete campaign?"
        message="This cannot be undone."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
      <CreateCampaignDialog
        open={createOpen}
        pipelines={pipelines}
        onClose={() => setCreateOpen(false)}
        onCreate={async (attrs) => {
          setCreateOpen(false);
          setName(attrs.name);
          setPipelineId((attrs.pipeline_id as any) || '');
          setStatus(attrs.status);
          await create({ preventDefault: () => {} } as any);
        }}
      />
    </>
  );
};
