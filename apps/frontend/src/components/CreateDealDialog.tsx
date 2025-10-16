import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Stack, MenuItem } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const STAGES = ['qualification','discovery','proposal','negotiation','won','lost'];

export function CreateDealDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (attrs: any) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0 as any);
  const [stage, setStage] = useState('qualification');
  useEffect(() => { if (open) { setName(''); setAmount(0 as any); setStage('qualification'); } }, [open]);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('deals.new')}</DialogTitle>
      <DialogContent>
        <Stack spacing={1} sx={{ mt: 0.5 }}>
          <TextField label={t('common.name')} value={name} onChange={e=>setName(e.target.value)} />
          <TextField type="number" label="Amount (cents)" value={amount as any} onChange={e=>setAmount(parseInt(e.target.value||'0',10))} />
          <TextField select label="Stage" value={stage} onChange={(e)=>setStage(e.target.value)}>
            {STAGES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={() => onCreate({ name, amount_cents: amount, stage })} variant="contained" disabled={!name.trim()}>{t('common.create')}</Button>
      </DialogActions>
    </Dialog>
  );
}

