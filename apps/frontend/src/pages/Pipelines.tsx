import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { toast } from 'sonner';
import { PaginationControls } from '../components/PaginationControls';

export const Pipelines = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('New Pipeline');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [orderBy, setOrderBy] = useState<'name' | 'status'>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const load = async (targetPage = page) => {
    if (!token) return;
    const res = await api.pipelinesIndex(token, { per_page: 10, page: targetPage });
    if (res.ok && res.data) {
      setItems(res.data.pipelines);
      const p = (res.data as any).pagination;
      if (p) { setPages(p.pages); setPage(p.page); }
    } else {
      toast.error('Failed to load');
    }
  };

  useEffect(() => { load(1); }, [token]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    const res = await api.pipelinesCreate(token, { name });
    setLoading(false);
    if (res.ok) await load();
  };

  const submitEdit = async () => {
    if (!token || !editing) return;
    const res = await api.pipelinesUpdate(token, editing.id, { name: editing.name });
    if (res.ok) {
      toast.success('Pipeline updated');
      setEditing(null);
      await load();
    } else {
      toast.error('Update failed');
    }
  };

  const confirmDelete = async () => {
    if (!token || deleting == null) return;
    const res = await api.pipelinesDelete(token, deleting);
    setDeleting(null);
    if (res.ok) {
      toast.success('Pipeline deleted');
      await load();
    } else {
      toast.error('Delete failed');
    }
  };

  return (
    <>
      <Typography variant="h5" fontWeight={700} gutterBottom>Pipelines</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 1 }}>
          <TextField size="small" label="Pipeline name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button variant="contained" disabled={loading} onClick={create as any}>Create</Button>
        </CardContent>
      </Card>
      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sortDirection={orderBy === 'name' ? order : false}>
                <TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? order : 'asc'} onClick={() => setOrder((o) => (orderBy === 'name' ? (o === 'asc' ? 'desc' : 'asc') : 'asc')) || setOrderBy('name')}>
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'status' ? order : false}>
                <TableSortLabel active={orderBy === 'status'} direction={orderBy === 'status' ? order : 'asc'} onClick={() => setOrder((o) => (orderBy === 'status' ? (o === 'asc' ? 'desc' : 'asc') : 'asc')) || setOrderBy('status')}>
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...items].sort((a:any,b:any)=>{
              const key = orderBy; const o = order === 'asc' ? 1 : -1; if(a[key]<b[key]) return -1*o; if(a[key]>b[key]) return 1*o; return 0;
            }).map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" aria-label="edit" onClick={() => setEditing({ id: p.id, name: p.name })}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" aria-label="delete" onClick={() => setDeleting(p.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <PaginationControls page={page} pages={pages} onPageChange={(p) => load(p)} disabled={loading} />

      <Dialog open={!!editing} onClose={() => setEditing(null)}>
        <DialogTitle>Edit Pipeline</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" fullWidth label="Name" value={editing?.name || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button onClick={submitEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleting != null}
        title="Delete pipeline?"
        message="This cannot be undone."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
};
