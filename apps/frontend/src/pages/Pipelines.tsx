import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { toast } from 'sonner';

export const Pipelines = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('New Pipeline');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

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
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((p) => (
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
