import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, IconButton, Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { SearchBar } from '../components/SearchBar';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { CreateCompanyDialog } from '../components/CreateCompanyDialog';
import { toast } from 'sonner';
import DeleteIcon from '@mui/icons-material/Delete';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const Companies = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const { lng } = useParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = async () => {
    if (!token) return;
    const res = await api.companiesIndex(token, { per_page: 50, q });
    if (res.ok && res.data) setItems((res.data as any).companies);
  };

  useEffect(() => { load(); }, [token, q]);

  return (
    <>
      <Typography variant="h5" fontWeight={800} gutterBottom>{t('companies.title') || 'Companies'}</Typography>
      <Card className="glass" sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>{t('companies.new') || 'New Company'}</Button>
          <SearchBar value={q} onChange={setQ} placeholder={t('companies.search') || 'Search companies'} />
        </CardContent>
      </Card>
      <TableContainer component={Card} className="glass">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('common.name')}</TableCell>
              <TableCell>Domain</TableCell>
              <TableCell>Industry</TableCell>
              <TableCell>Size</TableCell>
              <TableCell align="right">Contacts</TableCell>
              <TableCell align="right">Deals</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Link component={RouterLink} to={`/${lng || 'en'}/companies/${c.id}`} underline="hover">{c.name}</Link>
                </TableCell>
                <TableCell>{c.domain}</TableCell>
                <TableCell>{c.industry}</TableCell>
                <TableCell>{c.size}</TableCell>
                <TableCell align="right">{c.contacts_count ?? ''}</TableCell>
                <TableCell align="right">{c.deals_count ?? ''}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => setDeleting(c.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <CreateCompanyDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={async (attrs) => {
        setCreateOpen(false);
        if (!token) return;
        const res = await api.companiesCreate(token, attrs);
        if (res.ok) { toast.success(t('companies.updated') || 'Created'); load(); } else { toast.error(t('companies.update_failed') || 'Update failed'); }
      }} />
      <ConfirmDialog
        open={!!deleting}
        title={t('common.confirm')}
        message={(t('companies.delete_confirm') as any) || 'Delete company? This cannot be undone.'}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          const id = deleting; setDeleting(null);
          if (!token || !id) return;
          const res = await api.companiesDelete(token, id);
          if (res.ok) { toast.success(t('companies.deleted') || 'Deleted'); load(); } else { toast.error(t('companies.delete_failed') || 'Delete failed'); }
        }}
      />
    </>
  );
};
