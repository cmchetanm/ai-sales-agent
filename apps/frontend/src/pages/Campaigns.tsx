import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, IconButton, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel, Stack, Chip, Switch, FormControlLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { toast } from 'sonner';
import { PaginationControls } from '../components/PaginationControls';
import { SearchBar } from '../components/SearchBar';
import { useQueryState } from '../hooks/useQueryState';
import { CreateCampaignDialog } from '../components/CreateCampaignDialog';
import { useTranslation } from 'react-i18next';
import { StatusChip } from '../components/StatusChip';
import { StatusSelectChip } from '../components/StatusSelectChip';
import { TableSkeletonRows } from '../components/TableSkeleton';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

export const Campaigns = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [name, setName] = useState('Campaign');
  const [pipelineId, setPipelineId] = useState<number | ''>('' as any);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string; status: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState<null | any>(null);
  const [metricsOpen, setMetricsOpen] = useState<null | any>(null);
  const [filtersText, setFiltersText] = useState('');
  const [sequenceText, setSequenceText] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [fStatuses, setFStatuses] = useState<string[]>([]);
  const [fRoles, setFRoles] = useState('');
  const [fIndustries, setFIndustries] = useState('');
  const [fLocations, setFLocations] = useState('');
  const [fQuery, setFQuery] = useState('');
  const [steps, setSteps] = useState<Array<{ channel: string; delay_minutes: number; subject?: string; body?: string }>>([]);
  const [page, setPage] = useQueryState('page', 1 as any, 'number');
  const [pages, setPages] = useState(0);
  const [orderBy, setOrderBy] = useQueryState('orderBy', 'name');
  const [order, setOrder] = useQueryState('order', 'asc');
  const [status, setStatus] = useQueryState('status', '');
  const [q, setQ] = useQueryState('q', '');
  const { t } = useTranslation();

  const load = async (targetPage = page) => {
    if (!token) return;
    setLoadingList(true);
    const [cRes, pRes] = await Promise.all([
      api.campaignsIndex(token, { per_page: 10, page: targetPage, q, status: status || undefined, order_by: orderBy, order }),
      api.pipelinesIndex(token, { per_page: 50 })
    ]);
    if (cRes.ok && cRes.data) {
      setItems(cRes.data.campaigns);
      const p = (cRes.data as any).pagination; if (p) { setPages(p.pages); setPage(p.page); }
    } else {
      toast.error(t('campaigns.delete_failed'));
    }
    if (pRes.ok && pRes.data) setPipelines(pRes.data.pipelines);
    setLoadingList(false);
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
      toast.success(t('campaigns.updated'));
      setEditing(null);
      await load();
    } else {
      toast.error(t('campaigns.update_failed'));
    }
  };

  const confirmDelete = async () => {
    if (!token || deleting == null) return;
    const res = await api.campaignsDelete(token, deleting);
    setDeleting(null);
    if (res.ok) {
      toast.success(t('campaigns.deleted'));
      await load();
    } else {
      toast.error(t('campaigns.delete_failed'));
    }
  };

  return (
    <>
      <Typography variant="h5" fontWeight={700} gutterBottom>{t('campaigns.title')}</Typography>
      <Card className="glass fade-in" sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField size="small" label={t('campaigns.title')} value={name} onChange={(e) => setName(e.target.value)} sx={{ minWidth: 220 }} />
          <TextField select size="small" label={t('leads.pipeline')} value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')} sx={{ minWidth: 220 }}>
            <MenuItem value="">(No pipeline)</MenuItem>
            {pipelines.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label={t('common.status')} value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">{t('leads.all')}</MenuItem>
            {['draft','scheduled','running','paused','completed','archived'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <SearchBar value={q} onChange={setQ} placeholder={t('campaigns.search')} />
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)} sx={{
            background: 'linear-gradient(135deg,#6366f1,#22d3ee)',
            color: 'white', fontWeight: 700,
            '&:hover': { filter: 'brightness(1.05)', background: 'linear-gradient(135deg,#6366f1,#22d3ee)' }
          }}>{t('campaigns.new')}</Button>
        </CardContent>
      </Card>
      <TableContainer component={Card} className="glass slide-up">
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
              .filter((c) => !status || c.status === status)
              .filter((c) => !q || c.name?.toLowerCase().includes(q.toLowerCase()))
              .sort((a:any,b:any)=>{ const key = orderBy; const o = order === 'asc' ? 1 : -1; if(a[key]<b[key]) return -1*o; if(a[key]>b[key]) return 1*o; return 0; })
              .map((c) => (
              <TableRow key={c.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(99,102,241,0.06)' } }}>
                <TableCell>{c.name}</TableCell>
                <TableCell>
                  <StatusSelectChip
                    value={c.status}
                    options={['draft','scheduled','running','paused','completed','archived']}
                    onChange={async (next) => {
                      const res = await api.campaignsUpdate(token!, c.id, { status: next });
                      if (res.ok) { toast.success(t('campaigns.updated')); await load(); } else { toast.error(t('campaigns.update_failed')); }
                    }}
                  />
                </TableCell>
                <TableCell align="right" sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}> 
                  <Button size="small" variant="outlined" onClick={async () => {
                    const res = await api.campaignsPreview(token!, c.id);
                    if (res.ok && res.data) toast.info(`${t('campaigns.preview')}: ${res.data.target_count}`);
                  }}>{t('campaigns.preview')}</Button>
                  <Button size="small" variant="contained" onClick={async () => {
                    const res = await api.campaignsStart(token!, c.id);
                    if (res.ok) { toast.success(t('campaigns.started')); await load(); } else { toast.error(t('campaigns.update_failed')); }
                  }}>{t('campaigns.start')}</Button>
                  <Button size="small" variant="outlined" color="warning" onClick={async () => {
                    const res = await api.campaignsPause(token!, c.id);
                    if (res.ok) { toast.success(t('campaigns.paused')); await load(); } else { toast.error(t('campaigns.update_failed')); }
                  }}>{t('campaigns.pause')}</Button>
                  <Button size="small" variant="outlined" onClick={() => { setConfigOpen(c); setFiltersText(JSON.stringify(c.audience_filters || {}, null, 2)); setSequenceText(JSON.stringify(c.sequence || [], null, 2));
                    try {
                      const f = c.audience_filters || {};
                      setFStatuses(Array.isArray(f.status) ? f.status : (f.status ? [f.status] : []));
                      setFRoles(Array.isArray(f.roles) ? f.roles.join(', ') : (f.roles || ''));
                      setFIndustries(Array.isArray(f.industries) ? f.industries.join(', ') : (f.industries || ''));
                      setFLocations(Array.isArray(f.locations) ? f.locations.join(', ') : (f.locations || ''));
                      setFQuery(f.q || '');
                      const seq = Array.isArray(c.sequence) ? c.sequence : [];
                      setSteps(seq.map((s: any) => ({ channel: s.channel || 'email', delay_minutes: s.delay_minutes || 0, subject: s.variants?.[0]?.subject || '', body: s.variants?.[0]?.body || '' })));
                    } catch {}
                  }}>{t('campaigns.configure') || 'Configure'}</Button>
                  <Button size="small" variant="text" onClick={() => setMetricsOpen(c)}>{t('campaigns.metrics') || 'Metrics'}</Button>
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
        <DialogTitle>{t('campaigns.edit_title')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
          <TextField autoFocus margin="dense" fullWidth label={t('common.name')} value={editing?.name || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)} />
          <TextField select label={t('common.status')} value={editing?.status || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, status: e.target.value } : prev)}>
            {['draft','scheduled','running','paused','completed','archived'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
          <Button onClick={submitEdit} variant="contained">{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleting != null}
        title={t('campaigns.delete_title')}
        message={t('campaigns.delete_msg')}
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

      {/* Configure audience + sequence */}
      <Dialog open={!!configOpen} onClose={() => setConfigOpen(null)} maxWidth="md" fullWidth>
        <DialogTitle>{t('campaigns.configure') || 'Configure Campaign'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel control={<Switch checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />} label={t('campaigns.advanced_json') || 'Advanced (JSON)'} />
          {!advanced && (
            <>
              <Typography variant="subtitle2">{t('campaigns.audience_filters') || 'Audience Filters'}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <TextField size="small" label={t('common.status') || 'Status'} value={fStatuses.join(', ')} onChange={(e) => setFStatuses(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} sx={{ minWidth: 240 }} />
                <TextField size="small" label={t('campaigns.roles') || 'Roles'} value={fRoles} onChange={(e) => setFRoles(e.target.value)} sx={{ minWidth: 240 }} />
                <TextField size="small" label={t('campaigns.industries') || 'Industries'} value={fIndustries} onChange={(e) => setFIndustries(e.target.value)} sx={{ minWidth: 240 }} />
                <TextField size="small" label={t('campaigns.locations') || 'Locations'} value={fLocations} onChange={(e) => setFLocations(e.target.value)} sx={{ minWidth: 240 }} />
                <TextField size="small" label={t('common.search') || 'Search'} value={fQuery} onChange={(e) => setFQuery(e.target.value)} sx={{ minWidth: 240 }} />
              </Stack>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>{t('campaigns.sequence') || 'Sequence'}</Typography>
              <Stack spacing={1}>
                {steps.map((s, idx) => (
                  <Stack key={idx} direction="row" spacing={1} alignItems="center">
                    <TextField select size="small" label={t('campaigns.channel') || 'Channel'} value={s.channel} onChange={(e) => setSteps(prev => prev.map((x, i) => i === idx ? { ...x, channel: e.target.value } : x))} sx={{ minWidth: 140 }}>
                      {['email','linkedin','sms'].map(ch => <MenuItem key={ch} value={ch}>{ch}</MenuItem>)}
                    </TextField>
                    <TextField size="small" label={t('campaigns.delay_minutes') || 'Delay (min)'} type="number" value={s.delay_minutes} onChange={(e) => setSteps(prev => prev.map((x, i) => i === idx ? { ...x, delay_minutes: Number(e.target.value) } : x))} sx={{ width: 140 }} />
                    {s.channel === 'email' && (
                      <>
                        <TextField size="small" label={t('campaigns.subject') || 'Subject'} value={s.subject || ''} onChange={(e) => setSteps(prev => prev.map((x, i) => i === idx ? { ...x, subject: e.target.value } : x))} sx={{ minWidth: 200 }} />
                        <TextField size="small" label={t('campaigns.body') || 'Body'} value={s.body || ''} onChange={(e) => setSteps(prev => prev.map((x, i) => i === idx ? { ...x, body: e.target.value } : x))} sx={{ minWidth: 280 }} />
                      </>
                    )}
                    <Button size="small" color="error" onClick={() => setSteps(prev => prev.filter((_, i) => i !== idx))}>Remove</Button>
                  </Stack>
                ))}
                <Button size="small" onClick={() => setSteps(prev => [...prev, { channel: 'email', delay_minutes: prev.length ? 1440 : 0, subject: '', body: '' }])}>{t('campaigns.add_step') || 'Add Step'}</Button>
              </Stack>
            </>
          )}
          {advanced && (
            <>
              <Typography variant="subtitle2">{t('campaigns.audience_filters') || 'Audience Filters'}</Typography>
              <Typography variant="body2" color="text.secondary">{t('campaigns.audience_hint') || 'JSON: { status: [], roles: [], industries: [], locations: [], assigned_user_id, q }'}</Typography>
              <TextField multiline minRows={6} value={filtersText} onChange={(e) => setFiltersText(e.target.value)} />
              <Typography variant="subtitle2">{t('campaigns.sequence') || 'Sequence'}</Typography>
              <Typography variant="body2" color="text.secondary">{t('campaigns.sequence_hint') || 'JSON array of steps: [{ channel, delay_minutes, variants: [{ name, weight, subject, body }] }]'}</Typography>
              <TextField multiline minRows={8} value={sequenceText} onChange={(e) => setSequenceText(e.target.value)} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigOpen(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={async () => {
            if (!token || !configOpen) return;
            try {
              let filters: any = {};
              let sequence: any[] = [];
              if (advanced) {
                filters = filtersText.trim() ? JSON.parse(filtersText) : {};
                sequence = sequenceText.trim() ? JSON.parse(sequenceText) : [];
              } else {
                filters = {
                  status: fStatuses,
                  roles: fRoles ? fRoles.split(',').map(s => s.trim()).filter(Boolean) : [],
                  industries: fIndustries ? fIndustries.split(',').map(s => s.trim()).filter(Boolean) : [],
                  locations: fLocations ? fLocations.split(',').map(s => s.trim()).filter(Boolean) : [],
                  q: fQuery || undefined,
                };
                sequence = steps.map((s) => s.channel === 'email'
                  ? { channel: 'email', delay_minutes: Number(s.delay_minutes) || 0, variants: [{ name: 'A', weight: 100, subject: s.subject || '', body: s.body || '' }] }
                  : { channel: s.channel, delay_minutes: Number(s.delay_minutes) || 0 }
                );
              }
              const res = await api.campaignsUpdate(token, configOpen.id, { audience_filters: filters, sequence });
              if (res.ok) { toast.success(t('campaigns.updated')); setConfigOpen(null); await load(); } else { toast.error(t('campaigns.update_failed')); }
            } catch (e) {
              toast.error(t('campaigns.invalid_json') || 'Invalid JSON');
            }
          }}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* Metrics */}
      <Dialog open={!!metricsOpen} onClose={() => setMetricsOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('campaigns.metrics') || 'Metrics'}</DialogTitle>
        <DialogContent>
          {metricsOpen && (
            <Stack spacing={2}>
              <div>
                <Typography variant="subtitle2">{t('campaigns.events') || 'Events'}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {Object.entries(metricsOpen.metrics?.events || {}).map(([k, v]: any) => (<Chip key={k} label={`${k}: ${v}`} />))}
                </Stack>
              </div>
              <div>
                <Typography variant="subtitle2">{t('campaigns.variants') || 'Variants'}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {Object.entries(metricsOpen.metrics?.variants || {}).flatMap(([name, obj]: any) => Object.entries(obj as any).map(([k, v]: any, i) => (<Chip key={`${name}-${i}-${k}`} label={`${name}·${k}: ${v}`} />)))}
                </Stack>
              </div>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetricsOpen(null)}>{t('common.close') || 'Close'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
