import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function CreateCompanyDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (attrs: any) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  useEffect(() => { if (open) { setName(''); setDomain(''); setWebsite(''); setIndustry(''); setSize(''); } }, [open]);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('companies.new') || 'New Company'}</DialogTitle>
      <DialogContent>
        <Stack spacing={1} sx={{ mt: 0.5 }}>
          <TextField label={t('common.name')} value={name} onChange={e=>setName(e.target.value)} />
          <TextField label={t('account.domain') || 'Domain'} value={domain} onChange={e=>setDomain(e.target.value)} />
          <TextField label={t('account.website') || 'Website'} value={website} onChange={e=>setWebsite(e.target.value)} />
          <TextField label={t('companies.industry') || 'Industry'} value={industry} onChange={e=>setIndustry(e.target.value)} />
          <TextField label={t('companies.size') || 'Size'} value={size} onChange={e=>setSize(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={() => onCreate({ name, domain, website, industry, size })} variant="contained" disabled={!name.trim()}>{t('common.create')}</Button>
      </DialogActions>
    </Dialog>
  );
}

