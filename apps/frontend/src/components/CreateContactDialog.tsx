import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function CreateContactDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (attrs: any) => void }) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  useEffect(() => { if (open) { setFirstName(''); setLastName(''); setEmail(''); } }, [open]);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('contacts.new')}</DialogTitle>
      <DialogContent>
        <Stack spacing={1} sx={{ mt: 0.5 }}>
          <TextField label={t('leads.first_name') || 'First name'} value={firstName} onChange={e=>setFirstName(e.target.value)} />
          <TextField label={t('leads.last_name') || 'Last name'} value={lastName} onChange={e=>setLastName(e.target.value)} />
          <TextField label={t('common.email')} value={email} onChange={e=>setEmail(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={() => onCreate({ first_name: firstName, last_name: lastName, email })} variant="contained" disabled={!email.trim()}>{t('common.create')}</Button>
      </DialogActions>
    </Dialog>
  );
}

