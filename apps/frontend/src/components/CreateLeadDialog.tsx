import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function CreateLeadDialog({ open, pipelines, users = [], onClose, onCreate }: {
  open: boolean;
  pipelines: Array<{ id: number; name: string }>;
  users?: Array<{ id: number; email: string; first_name?: string; last_name?: string }>;
  onClose: () => void;
  onCreate: (attrs: any) => void;
}) {
  const [pipelineId, setPipelineId] = useState<number | ''>('' as any);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState('new');
  const [ownerId, setOwnerId] = useState<number | ''>('' as any);
  const { t } = useTranslation();
  useEffect(() => { if (open) {
    setPipelineId('' as any); setEmail(''); setFirstName(''); setLastName(''); setCompany('');
    setJobTitle(''); setLocation(''); setPhone(''); setLinkedin(''); setWebsite(''); setStatus('new'); setOwnerId('' as any);
  } }, [open]);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('leads.new')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', gap: 1, flexDirection: 'column', mt: 0.5, minWidth: 520 }}>
        <TextField select label={t('leads.pipeline')} value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')}>
          {pipelines.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
        <Stack direction="row" spacing={1}>
          <TextField label={t('leads.first_name') || 'First name'} value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth />
          <TextField label={t('leads.last_name') || 'Last name'} value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth />
        </Stack>
        <TextField label={t('leads.company') || 'Company'} value={company} onChange={(e) => setCompany(e.target.value)} />
        <Stack direction="row" spacing={1}>
          <TextField label={t('leads.job_title') || 'Job title'} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} fullWidth />
          <TextField label={t('leads.location') || 'Location'} value={location} onChange={(e) => setLocation(e.target.value)} fullWidth />
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField label={t('leads.email')} value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <TextField label={t('leads.phone') || 'Phone'} value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField label={t('leads.linkedin') || 'LinkedIn URL'} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} fullWidth />
          <TextField label={t('leads.website') || 'Website'} value={website} onChange={(e) => setWebsite(e.target.value)} fullWidth />
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField select label={t('leads.status')} value={status} onChange={(e) => setStatus(e.target.value)} fullWidth>
            {['new','researching','enriched','outreach','scheduled','responded','won','lost','archived'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select label={t('leads.owner') || 'Owner'} value={ownerId as any} onChange={(e) => setOwnerId((e.target.value as any) || '')} fullWidth>
            <MenuItem value="">—</MenuItem>
            {users.map((u) => <MenuItem key={u.id} value={u.id}>{(u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.email}</MenuItem>)}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={() => {
          if (!pipelineId) return;
          const payload: any = {
            pipeline_id: pipelineId as number,
            status,
            email,
            first_name: firstName,
            last_name: lastName,
            company,
            job_title: jobTitle,
            location,
            phone,
            linkedin_url: linkedin,
            website,
          };
          if (ownerId) payload.assigned_user_id = ownerId;
          onCreate(payload);
        }} variant="contained" disabled={!pipelineId}>
          {t('common.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
