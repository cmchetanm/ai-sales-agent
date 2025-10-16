import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, IconButton, Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { SearchBar } from '../components/SearchBar';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CreateContactDialog } from '../components/CreateContactDialog';
import { Link as RouterLink, useParams } from 'react-router-dom';

export const Contacts = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const { lng } = useParams();

  const load = async () => {
    if (!token) return;
    const res = await api.contactsIndex(token, { per_page: 50, q });
    if (res.ok && res.data) setItems(res.data.contacts);
  };

  useEffect(() => { load(); }, [token, q]);

  return (
    <>
      <Typography variant="h5" fontWeight={800} gutterBottom>{t('contacts.title')}</Typography>
      <Card className="glass" sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>{t('contacts.new')}</Button>
          <SearchBar value={q} onChange={setQ} placeholder={t('contacts.search')} />
        </CardContent>
      </Card>
      <TableContainer component={Card} className="glass">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('common.name')}</TableCell>
              <TableCell>{t('common.email')}</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Company</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Link component={RouterLink} to={`/${lng || 'en'}/contacts/${c.id}`} underline="hover">{[c.first_name, c.last_name].filter(Boolean).join(' ') || c.email}</Link>
                </TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.title}</TableCell>
                <TableCell>
                  {c.company?.id ? (
                    <Link component={RouterLink} to={`/${lng || 'en'}/companies/${c.company.id}`} underline="hover">{c.company.name}</Link>
                  ) : (c.company?.name || '')}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setEditing(c)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={async () => { if (!token) return; const res = await api.contactsDelete(token, c.id); if (res.ok) { toast.success(t('contacts.deleted') || 'Deleted'); load(); } else { toast.error(t('contacts.delete_failed')); } }}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <CreateContactDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={async (attrs) => { setCreateOpen(false); if (!token) return; const res = await api.contactsCreate(token, attrs); if (res.ok) { toast.success(t('contacts.updated') || 'Created'); load(); } else { toast.error(t('contacts.update_failed')); } }} />
    </>
  );
};
