import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function CreatePipelineDialog({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const { t } = useTranslation();
  useEffect(() => { if (open) setName(''); }, [open]);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('pipelines.new')}</DialogTitle>
      <DialogContent>
        <TextField autoFocus fullWidth margin="dense" label={t('common.name')} value={name} onChange={(e) => setName(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={() => onCreate(name)} variant="contained" disabled={!name.trim()}>{t('common.create')}</Button>
      </DialogActions>
    </Dialog>
  );
}
