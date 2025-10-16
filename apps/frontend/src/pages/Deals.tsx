import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, Link, MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SearchBar } from '../components/SearchBar';
import { CreateDealDialog } from '../components/CreateDealDialog';
import { toast } from 'sonner';
import { DealsBoard } from '../components/DealsBoard';
import { Link as RouterLink, useParams } from 'react-router-dom';

const STAGES = ['qualification','discovery','proposal','negotiation','won','lost'];

export const Deals = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [stage, setStage] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<'table'|'board'>(() => (localStorage.getItem('deals_view') as any) || 'table');
  const { lng } = useParams();

  const load = async () => {
    if (!token) return;
    const res = await api.dealsIndex(token, { per_page: 50, q, stage });
    if (res.ok && res.data) setItems(res.data.deals);
  };
  useEffect(() => { load(); }, [token, q, stage]);

  return (
    <>
      <Typography variant="h5" fontWeight={800} gutterBottom>{t('deals.title')}</Typography>
      <Card className="glass" sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>{t('deals.new')}</Button>
          <SearchBar value={q} onChange={setQ} placeholder={t('deals.search')} />
          <TextField select size="small" label="Stage" value={stage} onChange={(e)=>setStage(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">All</MenuItem>
            {STAGES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <ToggleButtonGroup exclusive size="small" value={view} onChange={(_,v)=>{ if(v){ setView(v); try{ localStorage.setItem('deals_view', v);}catch{} } }} sx={{ ml: 'auto' }}>
            <ToggleButton value="table">Table</ToggleButton>
            <ToggleButton value="board">Board</ToggleButton>
          </ToggleButtonGroup>
        </CardContent>
      </Card>
      {view === 'board' ? (
        <DealsBoard />
      ) : (
      <TableContainer component={Card} className="glass">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('common.name')}</TableCell>
              <TableCell>Stage</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Contact</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(d => (
              <TableRow key={d.id} hover>
                <TableCell>
                  <Link component={RouterLink} to={`/${lng || 'en'}/deals/${d.id}`} underline="hover">{d.name}</Link>
                </TableCell>
                <TableCell>
                  <Select size="small" value={d.stage} onChange={async (e)=>{ if (!token) return; const res = await api.dealsUpdate(token, d.id, { stage: e.target.value }); if (res.ok) { toast.success(t('deals.updated')); load(); } else { toast.error(t('deals.update_failed')); } }}>
                    {STAGES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </TableCell>
                <TableCell align="right">{(d.amount_cents/100).toLocaleString(undefined, { style: 'currency', currency: d.currency || 'USD' })}</TableCell>
                <TableCell>
                  {d.contact?.id ? (
                    <Link component={RouterLink} to={`/${lng || 'en'}/contacts/${d.contact.id}`} underline="hover">{d.contact.email}</Link>
                  ) : (d.contact?.email || '')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      )}
      <CreateDealDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={async (attrs) => { setCreateOpen(false); if (!token) return; const res = await api.dealsCreate(token, attrs); if (res.ok) { toast.success(t('deals.updated') || 'Created'); load(); } else { toast.error(t('deals.update_failed')); } }} />
    </>
  );
};
