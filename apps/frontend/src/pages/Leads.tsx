import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, IconButton, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel, Checkbox, Stack, Chip, Tooltip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { toast } from 'sonner';
import { PaginationControls } from '../components/PaginationControls';
import { SearchBar } from '../components/SearchBar';
import { useQueryState } from '../hooks/useQueryState';
import { CreateLeadDialog } from '../components/CreateLeadDialog';
import { LeadDetailsDialog } from '../components/LeadDetailsDialog';
import { useTranslation } from 'react-i18next';
import { TableSkeletonRows } from '../components/TableSkeleton';
import { StatusSelectChip } from '../components/StatusSelectChip';
import { SourceBadge } from '../components/SourceBadge';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useLocation } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ViewDayOutlinedIcon from '@mui/icons-material/ViewDayOutlined';
import DensitySmallIcon from '@mui/icons-material/DensitySmall';

export const Leads = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [pipelineId, setPipelineId] = useState<number | ''>('' as any);
  const [ownerId, setOwnerId] = useState<number | ''>('' as any);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: number; email: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkPipelineId, setBulkPipelineId] = useState<number | ''>('' as any);
  const [importOpen, setImportOpen] = useState(false);
  const [importCsv, setImportCsv] = useState('');
  const [details, setDetails] = useState<any | null>(null);
  const [importOwnerId, setImportOwnerId] = useState<number | ''>('' as any);
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
  const location = useLocation();
  const [density, setDensity] = useState<'compact'|'comfortable'>(() => (localStorage.getItem('leads_density') as any) || 'compact');

  type SavedView = { name: string; pipelineId: number | ''; ownerId: number | ''; status: string; q: string; orderBy: string; order: string };
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [selectedView, setSelectedView] = useState<string>('');

  const load = async (targetPage = page) => {
    if (!token) return;
    setLoadingList(true);
    const [leadsRes, pipesRes, usersRes] = await Promise.all([
      api.leadsIndex(token, { per_page: 10, page: targetPage, pipeline_id: pipelineId || undefined, status: status || undefined, assigned_user_id: ownerId || undefined, q, order_by: orderBy, order }),
      api.pipelinesIndex(token, { per_page: 50 }),
      api.usersIndex(token, { per_page: 100 })
    ]);
    if (leadsRes.ok && leadsRes.data) {
      setItems(leadsRes.data.leads);
      const p = (leadsRes.data as any).pagination; if (p) { setPages(p.pages); setPage(p.page); }
    } else {
      toast.error(t('leads.delete_failed'));
    }
    if (pipesRes.ok && pipesRes.data) setPipelines(pipesRes.data.pipelines);
    if (usersRes.ok && usersRes.data) setUsers(usersRes.data.users);
    setLoadingList(false);
    if (discovering && ++polls.current >= 4) { setDiscovering(false); polls.current = 0; if (timer.current) { window.clearInterval(timer.current); timer.current = null; } }
  };

  useEffect(() => { load(page || 1); }, [token, pipelineId, ownerId]);

  // Load saved views
  useEffect(() => {
    try {
      const raw = localStorage.getItem('leads_saved_views');
      const parsed = raw ? JSON.parse(raw) as SavedView[] : [];
      setSavedViews(parsed);
    } catch {}
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    if (sp.get('new') === 'lead') setCreateOpen(true);
  }, [location.search]);

  // Quick email-create removed; use New dialog instead

  const bulkApply = async (type: 'status' | 'pipeline') => {
    if (!token || selected.length === 0) return;
    const attrs: any = {};
    if (type === 'status' && bulkStatus) attrs.status = bulkStatus;
    if (type === 'pipeline' && bulkPipelineId) attrs.pipeline_id = bulkPipelineId;
    if (Object.keys(attrs).length === 0) return;
    const res = await api.leadsBulkUpdate(token, selected, attrs);
    if (res.ok) { toast.success(t('leads.updated')); setSelected([]); await load(); } else { toast.error(t('leads.update_failed')); }
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    setImportCsv(text);
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
          <TextField select size="small" label={t('leads.owner') || 'Owner'} value={ownerId as any} onChange={(e) => setOwnerId((e.target.value as any) || '')} sx={{ minWidth: 200 }}>
            <MenuItem value="">{t('leads.all')}</MenuItem>
            {users.map((u) => <MenuItem key={u.id} value={u.id}>{(u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.email}</MenuItem>)}
          </TextField>
          <SearchBar value={q} onChange={setQ} placeholder={t('leads.search')} />
          {/* Quick status chips */}
          {['new','researching','outreach','responded','won','lost'].map((s) => (
            <Chip key={s} size="small" label={s} color={status===s ? 'primary' : 'default'} onClick={() => setStatus(s)} />
          ))}
          {/* Density toggle */}
          <ToggleButtonGroup exclusive size="small" value={density} onChange={(_,v) => { if(v){ setDensity(v); try{ localStorage.setItem('leads_density', v);}catch{} } }}>
            <ToggleButton value="compact" aria-label="compact"><DensitySmallIcon fontSize="small" />&nbsp;Compact</ToggleButton>
            <ToggleButton value="comfortable" aria-label="comfortable"><ViewDayOutlinedIcon fontSize="small" />&nbsp;Comfort</ToggleButton>
          </ToggleButtonGroup>
          {/* Saved views */}
          <TextField select size="small" label={t('common.views') || 'Saved Views'} value={selectedView} onChange={(e) => {
            const name = e.target.value;
            setSelectedView(name);
            const view = savedViews.find(v => v.name === name);
            if (view) {
              setPipelineId(view.pipelineId);
              setOwnerId(view.ownerId);
              setStatus(view.status);
              setQ(view.q);
              setOrderBy(view.orderBy);
              setOrder(view.order);
            }
          }} sx={{ minWidth: 180 }}>
            <MenuItem value="">—</MenuItem>
            {savedViews.map(v => <MenuItem key={v.name} value={v.name}>{v.name}</MenuItem>)}
          </TextField>
          <Button size="small" startIcon={<SaveIcon />} onClick={() => {
            const name = prompt('Name this view');
            if (!name) return;
            const next: SavedView = { name, pipelineId, ownerId, status, q, orderBy, order } as any;
            const list = [...savedViews.filter(v => v.name !== name), next];
            setSavedViews(list);
            setSelectedView(name);
            try { localStorage.setItem('leads_saved_views', JSON.stringify(list)); } catch {}
          }}>{t('common.save') || 'Save View'}</Button>
          <Button size="small" startIcon={<DeleteOutlineIcon />} onClick={() => {
            if (!selectedView) return;
            const list = savedViews.filter(v => v.name !== selectedView);
            setSavedViews(list);
            setSelectedView('');
            try { localStorage.setItem('leads_saved_views', JSON.stringify(list)); } catch {}
          }} disabled={!selectedView}>{t('common.delete') || 'Delete'}</Button>
          <Button variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => setCreateOpen(true)}>{t('leads.new')}</Button>
          <Button variant="outlined" onClick={async () => {
            if (!token) return;
            const blob = await api.leadsExport(token, { pipeline_id: pipelineId || undefined, status: status || undefined, assigned_user_id: ownerId || undefined, q, order_by: orderBy, order });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'leads-export.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
          }}>{t('common.export') || 'Export CSV'}</Button>
          <Button variant="outlined" startIcon={<CloudDownloadOutlinedIcon />} onClick={async () => {
            if (!token) return;
            toast.info('Discovering leads…');
            setDiscovering(true);
            polls.current = 0;
            if (timer.current) { window.clearInterval(timer.current); timer.current = null; }
            timer.current = window.setInterval(() => load(page || 1), 2000);
            await api.discoverLeads(token, { keywords: q || 'saas', role: 'cto', location: 'US' });
          }}>{t('leads.sync_apollo') || t('leads.fetch_apollo')}</Button>
        </CardContent>
      </Card>
      {discovering && (
        <Card className="glass" sx={{ mb: 2 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">Fetching fresh leads from your DB and vendors…</Typography>
          </CardContent>
        </Card>
      )}
      {/* Removed quick email-create bar */}
      {selected.length > 0 && (
        <Card sx={{ mb: 1 }}>
          <CardContent sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2">{t('common.selected') || 'Selected'}: {selected.length}</Typography>
            <TextField select size="small" label={t('leads.status')} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value="">—</MenuItem>
              {['new','researching','enriched','outreach','scheduled','responded','won','lost','archived'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <Button size="small" variant="contained" onClick={() => bulkApply('status')}>{t('common.apply') || 'Apply'}</Button>
            <TextField select size="small" label={t('leads.pipeline')} value={bulkPipelineId as any} onChange={(e) => setBulkPipelineId((e.target.value as any) || '')} sx={{ minWidth: 220 }}>
              <MenuItem value="">—</MenuItem>
              {pipelines.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            <Button size="small" variant="outlined" onClick={() => bulkApply('pipeline')}>{t('common.apply') || 'Apply'}</Button>
            <Button size="small" variant="outlined" onClick={() => {
              const headers = ['email','first_name','last_name','company','job_title','location'];
              const rows = items.filter(i=>selected.includes(i.id)).map((l:any)=>[
                l.email,l.first_name,l.last_name,l.company,l.job_title,l.location
              ]);
              const csv = [headers.join(','), ...rows.map(r=>r.map(val => {
                const s = (val ?? '').toString();
                return /[,\n\"]/.test(s) ? `"${s.replace(/\"/g,'""')}"` : s;
              }).join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'leads-selected.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
            }}>Export Selected</Button>
          </CardContent>
        </Card>
      )}
      <TableContainer component={Card} className="glass slide-up">
        <Table size={density==='compact' ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < items.length}
                  checked={items.length > 0 && selected.length === items.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelected(items.map(i => i.id)); else setSelected([]);
                  }}
                />
              </TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Location</TableCell>
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
              <TableCell>Owner</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Last Contacted</TableCell>
              <TableCell>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingList ? <TableSkeletonRows rows={5} cols={12} /> : [...items]
              .filter((l) => !status || l.status === status)
              .filter((l) => !q || (l.email?.toLowerCase().includes(q.toLowerCase()) || l.company?.toLowerCase().includes(q.toLowerCase())))
              .sort((a:any,b:any)=>{ const key = orderBy; const o = order === 'asc' ? 1 : -1; if(a[key]<b[key]) return -1*o; if(a[key]>b[key]) return 1*o; return 0; })
              .map((l) => (
              <TableRow key={l.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox checked={selected.includes(l.id)} onChange={(e) => {
                    setSelected((prev) => e.target.checked ? [...prev, l.id] : prev.filter((id) => id !== l.id));
                  }} />
                </TableCell>
                <TableCell><SourceBadge source={l.source} /></TableCell>
                <TableCell>{[l.first_name, l.last_name].filter(Boolean).join(' ')}</TableCell>
                <TableCell>{l.company}</TableCell>
                <TableCell>{l.job_title}</TableCell>
                <TableCell>{l.location}</TableCell>
                <TableCell>
                  {l.email}
                  <Tooltip title="Copy email"><IconButton size="small" onClick={() => { navigator.clipboard?.writeText(l.email || ''); toast.success('Copied'); }}><ContentCopyIcon fontSize="inherit" /></IconButton></Tooltip>
                </TableCell>
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
                <TableCell>
                  <TextField select size="small" value={l.assigned_user_id || ''} onChange={async (e) => {
                    const id = Number(e.target.value);
                    const res = await api.leadsUpdate(token!, l.id, { assigned_user_id: id || null });
                    if (res.ok) { toast.success(t('leads.updated')); await load(); } else { toast.error(t('leads.update_failed')); }
                  }} sx={{ minWidth: 160, mr: 1 }}>
                    <MenuItem value="">—</MenuItem>
                    {users.map((u) => <MenuItem key={u.id} value={u.id}>{(u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.email}</MenuItem>)}
                  </TextField>
                </TableCell>
                <TableCell>{l.score != null ? (
                  <Tooltip title={t('leads.score') + ': ' + l.score}>
                    <Chip size="small" label={(l.score_band || (l.score >= 75 ? 'hot' : l.score >= 40 ? 'warm' : 'cold')).toUpperCase()} color={l.score_band === 'hot' || l.score >= 75 ? 'error' : (l.score_band === 'warm' || l.score >= 40 ? 'warning' : 'default')} />
                  </Tooltip>
                ) : ''}</TableCell>
                <TableCell>{l.last_contacted_at ? new Date(l.last_contacted_at).toLocaleDateString() : ''}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant={l.do_not_contact ? 'contained' : 'outlined'} color={l.do_not_contact ? 'warning' : 'inherit'} onClick={async () => {
                    const res = await api.leadsUpdate(token!, l.id, { do_not_contact: !l.do_not_contact });
                    if (res.ok) { toast.success(t('leads.updated')); await load(); } else { toast.error(t('leads.update_failed')); }
                  }}>{l.do_not_contact ? (t('leads.dnc_on') || 'DNC On') : (t('leads.dnc_off') || 'DNC Off')}</Button>
                  <IconButton size="small" aria-label="view" onClick={() => setDetails(l)}><InfoOutlinedIcon fontSize="small" /></IconButton>
                  <IconButton size="small" aria-label="edit" onClick={() => setEditing({ id: l.id, email: l.email, first_name: l.first_name, last_name: l.last_name, company: l.company, job_title: l.job_title, location: l.location, phone: l.phone, linkedin_url: l.linkedin_url, website: l.website })}><EditIcon fontSize="small" /></IconButton>
                  {l.linkedin_url && (<IconButton size="small" aria-label="linkedin" onClick={() => window.open(l.linkedin_url, '_blank')}>{/* simple anchor */}<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.79-1.75-1.764 0-.975.784-1.768 1.75-1.768s1.75.793 1.75 1.768c0 .974-.784 1.764-1.75 1.764zm13.5 11.268h-3v-5.604c0-1.337-.025-3.059-1.863-3.059-1.864 0-2.15 1.455-2.15 2.961v5.702h-3v-10h2.881v1.367h.041c.401-.761 1.381-1.563 2.844-1.563 3.041 0 3.604 2.003 3.604 4.609v5.587z"/></svg></IconButton>)}
                  <Button size="small" variant="text" onClick={async () => { if (!token) return; const res = await api.leadsQualify(token, l.id); if (res.ok) toast.success(t('leads.qualification_queued') || 'Qualification queued'); else toast.error(t('leads.update_failed')); }}>{t('leads.qualify') || 'Qualify'}</Button>
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
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 520 }}>
          <Stack direction="row" spacing={1}>
            <TextField autoFocus margin="dense" fullWidth label={t('leads.first_name') || 'First name'} value={editing?.first_name || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, first_name: e.target.value } : prev)} />
            <TextField margin="dense" fullWidth label={t('leads.last_name') || 'Last name'} value={editing?.last_name || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, last_name: e.target.value } : prev)} />
          </Stack>
          <TextField margin="dense" fullWidth label={t('leads.company') || 'Company'} value={editing?.company || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, company: e.target.value } : prev)} />
          <Stack direction="row" spacing={1}>
            <TextField margin="dense" fullWidth label={t('leads.job_title') || 'Job title'} value={editing?.job_title || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, job_title: e.target.value } : prev)} />
            <TextField margin="dense" fullWidth label={t('leads.location') || 'Location'} value={editing?.location || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, location: e.target.value } : prev)} />
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField margin="dense" fullWidth label={t('leads.email')} value={editing?.email || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, email: e.target.value } : prev)} />
            <TextField margin="dense" fullWidth label={t('leads.phone') || 'Phone'} value={editing?.phone || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, phone: e.target.value } : prev)} />
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField margin="dense" fullWidth label={t('leads.linkedin') || 'LinkedIn URL'} value={editing?.linkedin_url || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, linkedin_url: e.target.value } : prev)} />
            <TextField margin="dense" fullWidth label={t('leads.website') || 'Website'} value={editing?.website || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, website: e.target.value } : prev)} />
          </Stack>
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
        users={users}
        onClose={() => setCreateOpen(false)}
        onCreate={async (attrs) => { setCreateOpen(false); if (!token) return; const res = await api.leadsCreate(token, attrs); if (res.ok) { toast.success(t('leads.created') || 'Created'); await load(); } else { toast.error(t('leads.update_failed')); } }}
      />

      <LeadDetailsDialog open={!!details} onClose={() => setDetails(null)} lead={details || {}} />

      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={() => setImportOpen(true)} startIcon={<CloudDownloadOutlinedIcon />}>{t('leads.import') || 'Import CSV'}</Button>
        </CardContent>
      </Card>

      <Dialog open={importOpen} onClose={() => setImportOpen(false)}>
        <DialogTitle>{t('leads.import') || 'Import CSV'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 420 }}>
          <Typography variant="body2">{t('leads.import_hint') || 'Upload a CSV with headers (email, first_name, last_name, company, status, external_id, ...)'}</Typography>
          <input type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }} />
          <TextField label="CSV" multiline minRows={6} value={importCsv} onChange={(e) => setImportCsv(e.target.value)} />
          <Stack direction="row" spacing={1}>
            <TextField select size="small" label={t('leads.pipeline')} value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')} sx={{ minWidth: 220 }}>
              <MenuItem value="">—</MenuItem>
              {pipelines.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label={t('leads.owner') || 'Owner'} value={importOwnerId as any} onChange={(e) => setImportOwnerId((e.target.value as any) || '')} sx={{ minWidth: 220 }}>
              <MenuItem value="">—</MenuItem>
              {users.map((u) => <MenuItem key={u.id} value={u.id}>{(u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.email}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={async () => {
            if (!token || !importCsv.trim()) return;
            const res = await api.leadsImport(token, importCsv, { pipeline_id: pipelineId || undefined, assigned_user_id: importOwnerId || undefined });
            if (res.ok) { toast.success(t('common.queued') || 'Queued'); setImportOpen(false); setImportCsv(''); } else { toast.error(t('leads.update_failed')); }
          }}>{t('common.upload') || 'Upload'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
