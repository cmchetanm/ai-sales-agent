import { useEffect, useMemo, useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, Chip, Link, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { toast } from 'sonner';

const STAGES = ['qualification','discovery','proposal','negotiation','won','lost'];

export function DealDetails() {
  const { id, lng } = useParams();
  const dealId = Number(id);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<any | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [kind, setKind] = useState<string>('');
  const [after, setAfter] = useState<string>('');
  const [before, setBefore] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = async (targetPage = page) => {
    if (!token || !dealId) return;
    const [dRes, aRes] = await Promise.all([
      api.dealsShow(token, dealId),
      api.dealsActivitiesIndex(token, dealId, { per_page: 10, page: targetPage, kind: kind || undefined, happened_after: after || undefined, happened_before: before || undefined }),
    ]);
    if (dRes.ok && dRes.data) setDeal((dRes.data as any).deal);
    if (aRes.ok && aRes.data) {
      setActivities((aRes.data as any).activities);
      const p = (aRes.data as any).pagination; if (p) { setPages(p.pages || 1); setPage(p.page || 1); }
    }
  };

  useEffect(() => { load(); }, [token, dealId]);

  const addNote = async () => {
    if (!token || !dealId || !note.trim()) return;
    const res = await api.dealsActivitiesCreate(token, dealId, { kind: 'note', content: note });
    if (res.ok) { setNote(''); await load(); }
  };

  if (!deal) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button size="small" onClick={() => navigate(-1)}>Back</Button>
        <Typography variant="h5" fontWeight={800}>Deal: {deal.name}</Typography>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
        <Card sx={{ flex: 1 }} className="glass">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Overview</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
              <Chip label={(deal.amount_cents/100).toLocaleString(undefined, { style: 'currency', currency: deal.currency || 'USD' })} />
              {deal.company?.name && <Chip label={deal.company.name} />}
              {deal.contact?.email && (
                <Link component={RouterLink} to={`/${lng || 'en'}/contacts/${deal.contact.id}`} underline="hover">{deal.contact.email}</Link>
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" gutterBottom>Stage</Typography>
            <Select size="small" value={deal.stage} onChange={async (e)=>{
              if (!token) return; const res = await api.dealsUpdate(token, deal.id, { stage: e.target.value });
              if (res.ok) { toast.success('Deal updated'); load(); } else { toast.error('Update failed'); }
            }}>
              {STAGES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Log Note</Typography>
            <Stack direction="row" spacing={1}>
              <TextField fullWidth size="small" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." />
              <Button variant="contained" onClick={addNote} disabled={!note.trim()}>Add</Button>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }} className="glass">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Timeline</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
              <TextField size="small" select label="Type" value={kind} onChange={(e)=>{ setKind(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
                <MenuItem value="">All</MenuItem>
                {['email_sent','email_opened','email_replied','call','meeting','note'].map(k => <MenuItem key={k} value={k}>{k}</MenuItem>)}
              </TextField>
              <TextField size="small" type="date" label="After" InputLabelProps={{ shrink: true }} value={after} onChange={(e)=>{ setAfter(e.target.value); setPage(1); }} />
              <TextField size="small" type="date" label="Before" InputLabelProps={{ shrink: true }} value={before} onChange={(e)=>{ setBefore(e.target.value); setPage(1); }} />
              <Button size="small" onClick={()=>load(1)}>Apply</Button>
            </Stack>
            <Stack spacing={1}>
              {activities.map((a, i) => (
                <div key={i} style={{ padding: 8, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8 }}>
                  <Typography variant="caption" color="text.secondary">{new Date(a.happened_at).toLocaleString()} · {a.kind}</Typography>
                  <Typography variant="body2">{a.content}</Typography>
                </div>
              ))}
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
              <Button size="small" disabled={page<=1} onClick={()=>load(page-1)}>Prev</Button>
              <Typography variant="caption" sx={{ alignSelf: 'center' }}>Page {page} of {pages}</Typography>
              <Button size="small" disabled={page>=pages} onClick={()=>load(page+1)}>Next</Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}
