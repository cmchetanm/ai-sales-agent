import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, Chip, Stack, Typography, Box, Button } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';

const STATUSES = ['new','researching','enriched','outreach','scheduled','responded','won','lost','archived'] as const;

export function PipelineBoard({ pipelineId }: { pipelineId: number }) {
  const { token } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const load = async () => {
    if (!token || !pipelineId) return;
    setLoading(true);
    const res = await api.leadsIndex(token, { per_page: 200, page: 1, pipeline_id: pipelineId, order_by: 'updated_at', order: 'desc' });
    if (res.ok && res.data) setLeads(res.data.leads);
    setLoading(false);
  };

  useEffect(() => { load(); }, [token, pipelineId]);

  const grouped = useMemo(() => {
    const m: Record<string, any[]> = Object.fromEntries(STATUSES.map(s => [s, []]));
    leads.forEach(l => { (m[l.status] ||= []).push(l); });
    return m;
  }, [leads]);

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch" sx={{ minHeight: 320 }}>
      {STATUSES.map((st) => (
        <Card key={st} sx={{ flex: 1, minWidth: 260 }} className="glass">
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">{st.toUpperCase()}</Typography>
              <Chip size="small" label={grouped[st]?.length || 0} />
            </Stack>
            <Stack spacing={1}>
              {(grouped[st] || []).map((l) => (
                <Box key={l.id} sx={{ p: 1, border: (t)=>`1px solid ${t.palette.divider}`, borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{[l.first_name, l.last_name].filter(Boolean).join(' ') || l.email || 'Lead'}</Typography>
                  <Typography variant="caption" color="text.secondary">{l.company} {l.job_title ? `· ${l.job_title}` : ''}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    {STATUSES.filter(s => s!==st).slice(0,3).map(nst => (
                      <Chip key={nst} size="small" variant="outlined" label={nst} onClick={async () => {
                        if (!token) return;
                        const res = await api.leadsUpdate(token, l.id, { status: nst });
                        if (res.ok) await load();
                      }} />
                    ))}
                  </Stack>
                </Box>
              ))}
              {!loading && (grouped[st]?.length || 0) === 0 && (
                <Typography variant="caption" color="text.secondary">{t('leads.all') || 'Empty'}</Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

