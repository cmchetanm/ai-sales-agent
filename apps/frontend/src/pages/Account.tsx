import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, Grid2 as Grid, Stack, TextField, Typography, Button, Alert } from '@mui/material';
import { toast } from 'sonner';

export const Account = () => {
  const { token, account, reload } = useAuth();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [domain, setDomain] = useState('');
  const [summary, setSummary] = useState('');
  const [industries, setIndustries] = useState('');
  const [roles, setRoles] = useState('');
  const [locations, setLocations] = useState('');
  const [icpText, setIcpText] = useState('');
  const [icpError, setIcpError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;
    setName(account.name || '');
    const s = account.settings || {};
    setWebsite(s.website || '');
    setDomain(s.domain || '');
    const p = account.profile || {};
    setSummary(p.summary || '');
    setIndustries((p.target_industries || []).join(', '));
    setRoles((p.target_roles || []).join(', '));
    setLocations((p.target_locations || []).join(', '));
    setIcpText(JSON.stringify(p.ideal_customer_profile || {}, null, 2));
    setIcpError(null);
  }, [account]);

  const parseCSV = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIcpError(null);
    let icp: any = {};
    try {
      icp = icpText.trim() ? JSON.parse(icpText) : {};
    } catch (err: any) {
      setIcpError(err?.message || 'Invalid JSON');
      return;
    }
    setSaving(true);
    const payload: any = {
      name,
      settings: { website: website || undefined, domain: domain || undefined },
      profile_attributes: {
        id: account?.profile?.id,
        summary,
        target_industries: parseCSV(industries),
        target_roles: parseCSV(roles),
        target_locations: parseCSV(locations),
        ideal_customer_profile: icp,
      }
    };
    const res = await api.accountUpdate(token, payload);
    setSaving(false);
    if (res.ok) { toast.success(t('account.saved') || 'Saved'); await reload(); }
    else toast.error(t('account.update_failed') || 'Update failed');
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={800}>{t('account.title')}</Typography>
      <Card className="glass">
        <CardContent>
          <form onSubmit={onSubmit}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth size="small" label={t('common.name')} value={name} onChange={(e) => setName(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth size="small" label={t('account.website') || 'Website'} value={website} onChange={(e) => setWebsite(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth size="small" label={t('account.domain') || 'Domain'} value={domain} onChange={(e) => setDomain(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth multiline minRows={3} label={t('account.summary') || 'Company Summary'} value={summary} onChange={(e) => setSummary(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth size="small" label={t('account.industries') || 'Target Industries (comma separated)'} value={industries} onChange={(e) => setIndustries(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth size="small" label={t('account.roles') || 'Target Roles (comma separated)'} value={roles} onChange={(e) => setRoles(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth size="small" label={t('account.locations') || 'Target Locations (comma separated)'} value={locations} onChange={(e) => setLocations(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth multiline minRows={6} label={t('account.icp') || 'Ideal Customer Profile (JSON)'} value={icpText} onChange={(e) => setIcpText(e.target.value)} error={!!icpError} helperText={icpError || ''} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained" disabled={saving}>{t('common.save')}</Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Stack>
  );
};
