import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Button, Card, CardContent, Chip, Link, Stack, TextField, Typography, MenuItem } from '@mui/material';
import { toast } from 'sonner';

export function CompanyDetails() {
  const { id, lng } = useParams();
  const companyId = Number(id);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [kind, setKind] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [after, setAfter] = useState<string>('');
  const [before, setBefore] = useState<string>('');
  const [form, setForm] = useState<any>({ domain: '', website: '', industry: '', size: '' });
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  const load = async (targetPage = page) => {
    if (!token || !companyId) return;
    const [cRes, aRes] = await Promise.all([
      api.companiesShow(token, companyId),
      api.companiesActivitiesIndex(token, companyId, { per_page: 10, page: targetPage, kind: kind || undefined, happened_after: after || undefined, happened_before: before || undefined })
    ]);
    if (cRes.ok && cRes.data) {
      const c = (cRes.data as any).company;
      setCompany(c);
      setForm({ domain: c.domain || '', website: c.website || '', industry: c.industry || '', size: c.size || '' });
    }
    if (aRes.ok && aRes.data) {
      setActivities((aRes.data as any).activities);
      const p = (aRes.data as any).pagination; if (p) { setPages(p.pages || 1); setPage(p.page || 1); }
    }
    // Related panels
    const [rc, rd] = await Promise.all([
      api.contactsIndex(token, { per_page: 5, company_id: companyId }),
      api.dealsIndex(token, { per_page: 5, company_id: companyId })
    ]);
    if (rc.ok && rc.data) setContacts((rc.data as any).contacts || []);
    if (rd.ok && rd.data) setDeals((rd.data as any).deals || []);
  };

  useEffect(() => { load(); }, [token, companyId]);

  if (!company) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button size="small" onClick={() => navigate(-1)}>Back</Button>
        <Typography variant="h5" fontWeight={800}>Company: {company.name}</Typography>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
        <Card sx={{ flex: 1 }} className="glass">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Profile</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {company.domain && <Chip label={company.domain} />}
              {company.industry && <Chip label={company.industry} />}
              {company.size && <Chip label={company.size} />}
              {company.website && <Link href={company.website} target="_blank" rel="noreferrer">Website</Link>}
              <Chip label={`Contacts: ${company.contacts_count || 0}`} />
              <Chip label={`Deals: ${company.deals_count || 0}`} />
            </Stack>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Edit</Typography>
            <Stack spacing={1} sx={{ mt: 0.5 }}>
              <TextField size="small" label="Domain" value={form.domain} onChange={(e)=>setForm((s:any)=>({ ...s, domain: e.target.value }))} />
              <TextField size="small" label="Website" value={form.website} onChange={(e)=>setForm((s:any)=>({ ...s, website: e.target.value }))} />
              <TextField size="small" label="Industry" value={form.industry} onChange={(e)=>setForm((s:any)=>({ ...s, industry: e.target.value }))} />
              <TextField size="small" label="Size" value={form.size} onChange={(e)=>setForm((s:any)=>({ ...s, size: e.target.value }))} />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={async ()=>{
                  if (!token || !company) return;
                  const res = await api.companiesUpdate(token, company.id, form);
                  if (res.ok) { toast.success('Company updated'); await load(); } else { toast.error('Update failed'); }
                }}>Save</Button>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Link component={RouterLink} to={`/${lng || 'en'}/contacts`} underline="hover">View Contacts</Link>
              <Link component={RouterLink} to={`/${lng || 'en'}/deals`} underline="hover">View Deals</Link>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }} className="glass">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Timeline</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
              <TextField size="small" select label="Type" value={kind} onChange={(e)=>{ setKind(e.target.value); setPage(1); }} sx={{ minWidth: 180 }}>
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
                  {(a.contact || a.deal) && (
                    <Typography variant="caption" color="text.secondary">
                      {a.contact ? `Contact: ${[a.contact.first_name, a.contact.last_name].filter(Boolean).join(' ') || a.contact.email}` : ''}
                      {a.deal ? `${a.contact ? ' · ' : ''}Deal: ${a.deal.name}` : ''}
                    </Typography>
                  )}
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
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
        <Card sx={{ flex: 1 }} className="glass">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Contacts</Typography>
            <Stack spacing={0.5}>
              {contacts.map((c) => (
                <Link key={c.id} component={RouterLink} to={`/${lng || 'en'}/contacts/${c.id}`} underline="hover">{[c.first_name, c.last_name].filter(Boolean).join(' ') || c.email}</Link>
              ))}
              {contacts.length === 0 && <Typography variant="caption" color="text.secondary">No contacts</Typography>}
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }} className="glass">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Deals</Typography>
            <Stack spacing={0.5}>
              {deals.map((d) => (
                <Link key={d.id} component={RouterLink} to={`/${lng || 'en'}/deals/${d.id}`} underline="hover">{d.name}</Link>
              ))}
              {deals.length === 0 && <Typography variant="caption" color="text.secondary">No deals</Typography>}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}
