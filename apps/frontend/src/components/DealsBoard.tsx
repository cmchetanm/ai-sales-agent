import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, Chip, Stack, Typography, Box, Link } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const STAGES = ['qualification','discovery','proposal','negotiation','won','lost'] as const;

export function DealsBoard() {
  const { token } = useAuth();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const { lng } = useParams();

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const res = await api.dealsIndex(token, { per_page: 200, page: 1 });
    if (res.ok && res.data) setDeals((res.data as any).deals);
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

  const grouped = useMemo(() => {
    const m: Record<string, any[]> = Object.fromEntries(STAGES.map(s => [s, []]));
    deals.forEach(d => { (m[d.stage] ||= []).push(d); });
    return m;
  }, [deals]);

  const totals = useMemo(() => {
    const sums: Record<string, number> = Object.fromEntries(STAGES.map(s => [s, 0]));
    deals.forEach(d => { sums[d.stage] = (sums[d.stage] || 0) + (Number(d.amount_cents) || 0); });
    return sums;
  }, [deals]);

  const totalsByCurrency = useMemo(() => {
    const sums: Record<string, Record<string, number>> = Object.fromEntries(STAGES.map(s => [s, {}]));
    deals.forEach(d => {
      const st = d.stage; const cur = d.currency || 'USD'; const amt = Number(d.amount_cents) || 0;
      const bucket = sums[st] || (sums[st] = {});
      bucket[cur] = (bucket[cur] || 0) + amt;
    });
    return sums;
  }, [deals]);

  return (
    <>
      <Card className="glass" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2" color="text.secondary">Overall Totals</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
              <Chip size="small" label={`Deals: ${deals.length}`} />
              <Typography variant="caption" color="text.secondary">
                {Object.entries(deals.reduce<Record<string, number>>((acc, d) => {
                  const cur = d.currency || 'USD'; acc[cur] = (acc[cur] || 0) + (Number(d.amount_cents) || 0); return acc;
                }, {})).map(([cur, cents]) => (cents/100).toLocaleString(undefined, { style: 'currency', currency: cur })).join(' · ') || ''}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch" sx={{ minHeight: 320 }}>
      {STAGES.map((st) => (
        <Card
          key={st}
          sx={{ flex: 1, minWidth: 260, outline: (theme)=> overStage===st ? `2px dashed ${theme.palette.primary.main}` : 'none', outlineOffset: 2 }}
          className="glass"
          onDragOver={(e)=>{ e.preventDefault(); setOverStage(st); }}
          onDragLeave={()=>{ setOverStage(null); }}
          onDrop={async (e) => {
            e.preventDefault();
            setOverStage(null);
            try {
              const data = e.dataTransfer.getData('text/plain');
              const parsed = JSON.parse(data || '{}');
              const id = Number(parsed.id);
              const fromStage = String(parsed.stage);
              if (!id || !st || fromStage === st) return;
              // Optimistic update
              setDeals((prev)=> prev.map(d => d.id === id ? { ...d, stage: st } : d));
              if (!token) return;
              const res = await api.dealsUpdate(token, id, { stage: st });
              if (!res.ok) {
                // revert
                setDeals((prev)=> prev.map(d => d.id === id ? { ...d, stage: fromStage } : d));
                toast.error('Move failed');
              }
            } catch {}
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">{st.toUpperCase()}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label={grouped[st]?.length || 0} />
                <Typography variant="caption" color="text.secondary">
                  {Object.entries(totalsByCurrency[st] || {})
                    .sort((a,b)=>b[1]-a[1])
                    .map(([cur, cents]) => (cents/100).toLocaleString(undefined, { style: 'currency', currency: cur }))
                    .join(' · ') || (totals[st] ? (totals[st]/100).toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '')}
                </Typography>
              </Stack>
            </Stack>
            <Stack spacing={1}>
              {(grouped[st] || []).map((d) => (
                <Box
                  key={d.id}
                  draggable
                  onDragStart={(e)=>{ setDraggingId(d.id); try{ e.dataTransfer.setData('text/plain', JSON.stringify({ id: d.id, stage: st })); }catch{} }}
                  onDragEnd={()=> setDraggingId(null)}
                  sx={{ p: 1, border: (t)=>`1px solid ${t.palette.divider}`, borderRadius: 1, opacity: draggingId===d.id ? 0.6 : 1 }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    <Link component={RouterLink} to={`/${lng || 'en'}/deals/${d.id}`} underline="hover">{d.name}</Link>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{d.contact?.email || ''}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    {STAGES.filter(s => s!==st).slice(0,3).map(nst => (
                      <Chip key={nst} size="small" variant="outlined" label={nst} onClick={async () => {
                        if (!token) return;
                        const res = await api.dealsUpdate(token, d.id, { stage: nst });
                        if (res.ok) await load();
                      }} />
                    ))}
                    {st !== 'won' && (
                      <Chip size="small" color="success" label="Won" onClick={async ()=>{ if (!token) return; const res = await api.dealsUpdate(token, d.id, { stage: 'won' }); if (res.ok) await load(); }} />
                    )}
                    {st !== 'lost' && (
                      <Chip size="small" color="error" label="Lost" onClick={async ()=>{ if (!token) return; const res = await api.dealsUpdate(token, d.id, { stage: 'lost' }); if (res.ok) await load(); }} />
                    )}
                  </Stack>
                </Box>
              ))}
              {!loading && (grouped[st]?.length || 0) === 0 && (
                <Typography variant="caption" color="text.secondary">Empty</Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}
      </Stack>
    </>
  );
}
