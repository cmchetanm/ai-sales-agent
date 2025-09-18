import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';

export const Pipelines = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('New Pipeline');
  const [loading, setLoading] = useState(false);

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
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
