import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, IconButton, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { toast } from 'sonner';

export const Campaigns = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [name, setName] = useState('Campaign');
  const [pipelineId, setPipelineId] = useState<number | ''>('' as any);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string; status: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

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
        <CardContent sx={{ display: 'flex', gap: 1 }}>
          <TextField size="small" label="Campaign" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField select size="small" label="Pipeline" value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')} sx={{ minWidth: 220 }}>
            <MenuItem value="">(No pipeline)</MenuItem>
            {pipelines.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <Button variant="contained" disabled={loading} onClick={create as any}>Create</Button>
        </CardContent>
      </Card>
      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align=\"right\">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.status}</TableCell>
                <TableCell align=\"right\"> 
                  <IconButton size=\"small\" aria-label=\"edit\" onClick={() => setEditing({ id: c.id, name: c.name, status: c.status })}><EditIcon fontSize=\"small\" /></IconButton>
                  <IconButton size=\"small\" aria-label=\"delete\" onClick={() => setDeleting(c.id)} color=\"error\"><DeleteIcon fontSize=\"small\" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={!!editing} onClose={() => setEditing(null)}>
        <DialogTitle>Edit Campaign</DialogTitle>
        <DialogContent sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
          <TextField autoFocus margin=\"dense\" fullWidth label=\"Name\" value={editing?.name || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)} />
          <TextField select label=\"Status\" value={editing?.status || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, status: e.target.value } : prev)}>
            {['draft','scheduled','running','paused','completed','archived'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button onClick={submitEdit} variant=\"contained\">Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleting != null}
        title=\"Delete campaign?\"
        message=\"This cannot be undone.\"
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
};
