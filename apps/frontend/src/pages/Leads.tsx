import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
import { CreateLeadDialog } from '../components/CreateLeadDialog';
import { useTranslation } from 'react-i18next';
import { TableSkeletonRows } from '../components/TableSkeleton';
import { StatusSelectChip } from '../components/StatusSelectChip';
import { SourceBadge } from '../components/SourceBadge';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';

export const Leads = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [pipelineId, setPipelineId] = useState<number | ''>('' as any);
  const [email, setEmail] = useState('lead@example.com');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: number; email: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [page, setPage] = useQueryState('page', 1 as any, 'number');
  const [pages, setPages] = useState(0);
  const [orderBy, setOrderBy] = useQueryState('orderBy', 'email');
  const [order, setOrder] = useQueryState('order', 'asc');
  const [status, setStatus] = useQueryState('status', '');
  const [q, setQ] = useQueryState('q', '');
  const { t } = useTranslation();
  const [discovering, setDiscovering] = useState(false);
  const polls = useRef(0);
  const timer = useRef<number | null>(null);

  const load = async (targetPage = page) => {
    if (!token) return;
    setLoadingList(true);
    const [leadsRes, pipesRes] = await Promise.all([
      api.leadsIndex(token, { per_page: 10, page: targetPage, pipeline_id: pipelineId || undefined, status: status || undefined, q, order_by: orderBy, order }),
      api.pipelinesIndex(token, { per_page: 50 })
    ]);
    if (leadsRes.ok && leadsRes.data) {
      setItems(leadsRes.data.leads);
      const p = (leadsRes.data as any).pagination; if (p) { setPages(p.pages); setPage(p.page); }
    } else {
      toast.error(t('leads.delete_failed'));
    }
    if (pipesRes.ok && pipesRes.data) setPipelines(pipesRes.data.pipelines);
    setLoadingList(false);
    if (discovering && ++polls.current >= 4) { setDiscovering(false); polls.current = 0; if (timer.current) { window.clearInterval(timer.current); timer.current = null; } }
  };

  useEffect(() => { load(page || 1); }, [token, pipelineId]);

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
      toast.success(t('leads.updated'));
      setEditing(null);
      await load();
    } else {
      toast.error(t('leads.update_failed'));
    }
  };

  const confirmDelete = async () => {
    if (!token || deleting == null) return;
    const res = await api.leadsDelete(token, deleting);
    setDeleting(null);
    if (res.ok) {
      toast.success(t('leads.deleted'));
      await load();
    } else {
      toast.error(t('leads.delete_failed'));
    }
  };

  const pipelineOptions = useMemo(() => [{ id: '', name: t('leads.all_pipelines') }, ...pipelines], [pipelines, t]);

  return (
    <>
      <Typography variant="h5" fontWeight={700} gutterBottom>{t('leads.title')}</Typography>
      <Card className="glass fade-in" sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField select size="small" label={t('leads.pipeline')} value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')} sx={{ minWidth: 220 }}>
            {pipelineOptions.map((p) => <MenuItem key={p.id ?? 'all'} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label={t('leads.status')} value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">{t('leads.all')}</MenuItem>
            {['new','researching','enriched','outreach','scheduled','responded','won','lost','archived'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <SearchBar value={q} onChange={setQ} placeholder={t('leads.search')} />
          <Button variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => setCreateOpen(true)}>{t('leads.new')}</Button>
          <Button variant="outlined" startIcon={<CloudDownloadOutlinedIcon />} onClick={async () => {
            if (!token) return;
            toast.info('Discovering leads…');
            setDiscovering(true);
            polls.current = 0;
            if (timer.current) { window.clearInterval(timer.current); timer.current = null; }
            timer.current = window.setInterval(() => load(page || 1), 2000);
            await api.discoverLeads(token, { keywords: q || 'saas', role: 'cto', location: 'US' });
          }}>{t('leads.fetch_apollo')}</Button>
        </CardContent>
      </Card>
      {discovering && (
        <Card className="glass" sx={{ mb: 2 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">Fetching fresh leads from your DB and vendors…</Typography>
          </CardContent>
        </Card>
      )}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 1 }}>
          <TextField size="small" label={t('leads.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button variant="contained" disabled={loading || !pipelineId} onClick={create as any}>{t('leads.create_lead')}</Button>
        </CardContent>
      </Card>
      <TableContainer component={Card} className="glass slide-up">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Source</TableCell>
              <TableCell sortDirection={orderBy === 'email' ? (order as any) : false}>
                <TableSortLabel active={orderBy === 'email'} direction={orderBy === 'email' ? (order as any) : 'asc'} onClick={() => setOrder(orderBy === 'email' && order === 'asc' ? 'desc' : 'asc') || setOrderBy('email')}>
                  {t('leads.email')}
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'status' ? (order as any) : false}>
                <TableSortLabel active={orderBy === 'status'} direction={orderBy === 'status' ? (order as any) : 'asc'} onClick={() => setOrder(orderBy === 'status' && order === 'asc' ? 'desc' : 'asc') || setOrderBy('status')}>
                  {t('leads.status')}
                </TableSortLabel>
              </TableCell>
              <TableCell>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingList ? <TableSkeletonRows rows={5} cols={3} /> : [...items]
              .filter((l) => !status || l.status === status)
              .filter((l) => !q || (l.email?.toLowerCase().includes(q.toLowerCase()) || l.company?.toLowerCase().includes(q.toLowerCase())))
              .sort((a:any,b:any)=>{ const key = orderBy; const o = order === 'asc' ? 1 : -1; if(a[key]<b[key]) return -1*o; if(a[key]>b[key]) return 1*o; return 0; })
              .map((l) => (
              <TableRow key={l.id} hover>
                <TableCell><SourceBadge source={l.source} /></TableCell>
                <TableCell>{l.email}</TableCell>
                <TableCell>
                  <StatusSelectChip
                    value={l.status}
                    options={['new','researching','enriched','outreach','scheduled','responded','won','lost','archived']}
                    onChange={async (next) => {
                      const res = await api.leadsUpdate(token!, l.id, { status: next });
                      if (res.ok) { toast.success(t('leads.updated')); await load(); } else { toast.error(t('leads.update_failed')); }
                    }}
                  />
                </TableCell>
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
        <DialogTitle>{t('leads.edit_title')}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" fullWidth label={t('leads.email')} value={editing?.email || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, email: e.target.value } : prev)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
          <Button onClick={submitEdit} variant="contained">{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleting != null}
        title={t('leads.delete_title')}
        message={t('leads.delete_msg')}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
      <CreateLeadDialog
        open={createOpen}
        pipelines={pipelines}
        onClose={() => setCreateOpen(false)}
        onCreate={async (attrs) => { setCreateOpen(false); setPipelineId(attrs.pipeline_id); setEmail(attrs.email); await create({ preventDefault: () => {} } as any); }}
      />
    </>
  );
};
