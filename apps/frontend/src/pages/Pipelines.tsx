import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel, Chip, Stack, ToggleButtonGroup, ToggleButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { toast } from 'sonner';
import { PaginationControls } from '../components/PaginationControls';
import { SearchBar } from '../components/SearchBar';
import { useQueryState } from '../hooks/useQueryState';
import { CreatePipelineDialog } from '../components/CreatePipelineDialog';
import { useTranslation } from 'react-i18next';
import { StatusChip } from '../components/StatusChip';
import { TableSkeletonRows } from '../components/TableSkeleton';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useLocation } from 'react-router-dom';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { PipelineBoard } from '../components/PipelineBoard';

export const Pipelines = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('New Pipeline');
  const [loadingList, setLoadingList] = useState(true);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState<null | { stage_stats: any[]; status_counts: Record<string, number> }>(null);
  const [page, setPage] = useQueryState('page', 1 as any, 'number');
  const [pages, setPages] = useState(0);
  const [orderBy, setOrderBy] = useQueryState('orderBy', 'name');
  const [order, setOrder] = useQueryState('order', 'asc');
  const [q, setQ] = useQueryState('q', '');
  const { t } = useTranslation();
  const location = useLocation();
  const [view, setView] = useState<'table'|'board'>(() => (localStorage.getItem('pipelines_view') as any) || 'table');

  const load = async (targetPage = page) => {
    if (!token) return;
    setLoadingList(true);
    const res = await api.pipelinesIndex(token, { per_page: 10, page: targetPage, q, order_by: orderBy, order });
    if (res.ok && res.data) {
      setItems(res.data.pipelines);
      const p = (res.data as any).pagination;
      if (p) { setPages(p.pages); setPage(p.page); }
    } else {
      toast.error(t('pipelines.delete_failed'));
    }
  setLoadingList(false);
  };

  useEffect(() => { load(page || 1); }, [token]);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    if (sp.get('new')) setCreateOpen(true);
  }, [location.search]);

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
      toast.success(t('pipelines.updated'));
      setEditing(null);
      await load();
    } else {
      toast.error(t('pipelines.update_failed'));
    }
  };

  const confirmDelete = async () => {
    if (!token || deleting == null) return;
    const res = await api.pipelinesDelete(token, deleting);
    setDeleting(null);
    if (res.ok) {
      toast.success(t('pipelines.deleted'));
      await load();
    } else {
      toast.error(t('pipelines.delete_failed'));
    }
  };

  return (
    <>
      <Typography variant="h5" fontWeight={700} gutterBottom>{t('pipelines.title')}</Typography>
      <Card className="glass fade-in" sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>{t('pipelines.new')}</Button>
          <SearchBar value={q} onChange={setQ} placeholder={t('pipelines.search')} />
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_,v)=>{ if(v){ setView(v); try{ localStorage.setItem('pipelines_view', v);}catch{} } }}>
            <ToggleButton value="table" aria-label="table"><TableRowsIcon fontSize="small" />&nbsp;Table</ToggleButton>
            <ToggleButton value="board" aria-label="board"><ViewColumnIcon fontSize="small" />&nbsp;Board</ToggleButton>
          </ToggleButtonGroup>
        </CardContent>
      </Card>
      {view === 'table' ? (
      <TableContainer component={Card} className="glass slide-up" sx={{ position: 'relative' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sortDirection={orderBy === 'name' ? (order as any) : false}>
                <TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? (order as any) : 'asc'} onClick={() => setOrder(orderBy === 'name' && order === 'asc' ? 'desc' : 'asc') || setOrderBy('name')}>
                  {t('common.name')}
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === 'status' ? (order as any) : false}>
                <TableSortLabel active={orderBy === 'status'} direction={orderBy === 'status' ? (order as any) : 'asc'} onClick={() => setOrder(orderBy === 'status' && order === 'asc' ? 'desc' : 'asc') || setOrderBy('status')}>
                  {t('common.status')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingList ? <TableSkeletonRows rows={5} cols={3} /> : [...items]
              .filter((p) => !q || p.name?.toLowerCase().includes(q.toLowerCase()))
              .sort((a:any,b:any)=>{
              const key = orderBy; const o = order === 'asc' ? 1 : -1; if(a[key]<b[key]) return -1*o; if(a[key]>b[key]) return 1*o; return 0;
            })
            .map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.name}</TableCell>
                <TableCell><StatusChip value={p.status} /></TableCell>
                <TableCell align="right" sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button size="small" variant="outlined" onClick={async () => {
                    const res = await api.pipelinesStats(token!, p.id);
                    if (res.ok && res.data) setStatsOpen({ stage_stats: res.data.stage_stats, status_counts: res.data.status_counts });
                  }}>{t('pipelines.stats') || 'Stats'}</Button>
                  <IconButton size="small" aria-label="edit" onClick={() => setEditing({ id: p.id, name: p.name })}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" aria-label="delete" onClick={() => setDeleting(p.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      ) : (
        <Card className="glass slide-up" sx={{ p: 2 }}>
          {items.length > 0 ? (
            <PipelineBoard pipelineId={items[0]?.id} />
          ) : (
            <Typography variant="body2" color="text.secondary">{t('pipelines.search')}</Typography>
          )}
        </Card>
      )}
      <PaginationControls page={page} pages={pages} onPageChange={(p) => load(p)} disabled={loading} />

      <Dialog open={!!editing} onClose={() => setEditing(null)}>
        <DialogTitle>{t('pipelines.edit_title')}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" fullWidth label={t('common.name')} value={editing?.name || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
          <Button onClick={submitEdit} variant="contained">{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleting != null}
        title={t('pipelines.delete_title')}
        message={t('pipelines.delete_msg')}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
      <CreatePipelineDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (n) => { setCreateOpen(false); setName(n); await create({ preventDefault: () => {} } as any); }}
      />

      <Dialog open={!!statsOpen} onClose={() => setStatsOpen(null)}>
        <DialogTitle>{t('pipelines.stats') || 'Pipeline Stats'}</DialogTitle>
        <DialogContent>
          {statsOpen && (
            <Stack spacing={2}>
              <div>
                <Typography variant="subtitle2">{t('pipelines.stage_stats') || 'Stage Stats'}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {statsOpen.stage_stats.map((s, i) => (<Chip key={i} label={`${s.name}: ${s.count}`} />))}
                </Stack>
              </div>
              <div>
                <Typography variant="subtitle2">{t('pipelines.status_counts') || 'Status Counts'}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {Object.entries(statsOpen.status_counts).map(([k, v]) => (<Chip key={k} label={`${k}: ${v}`} />))}
                </Stack>
              </div>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsOpen(null)}>{t('common.close') || 'Close'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
