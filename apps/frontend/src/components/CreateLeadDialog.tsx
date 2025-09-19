import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function CreateLeadDialog({ open, pipelines, onClose, onCreate }: {
  open: boolean;
  pipelines: Array<{ id: number; name: string }>;
  onClose: () => void;
  onCreate: (attrs: { pipeline_id: number; email: string }) => void;
}) {
  const [pipelineId, setPipelineId] = useState<number | ''>('' as any);
  const [email, setEmail] = useState('');
  const { t } = useTranslation();
  useEffect(() => { if (open) { setPipelineId('' as any); setEmail(''); } }, [open]);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('leads.new')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', gap: 1, flexDirection: 'column', mt: 0.5 }}>
        <TextField select label={t('leads.pipeline')} value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')}>
          {pipelines.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
        <TextField label={t('leads.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={() => pipelineId && email && onCreate({ pipeline_id: pipelineId as number, email })} variant="contained" disabled={!pipelineId || !email}>
          {t('common.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
