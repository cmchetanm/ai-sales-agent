import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';

export function CreateCampaignDialog({ open, pipelines, onClose, onCreate }: {
  open: boolean;
  pipelines: Array<{ id: number; name: string }>;
  onClose: () => void;
  onCreate: (attrs: { name: string; pipeline_id?: number; channel: string; status: string }) => void;
}) {
  const [name, setName] = useState('');
  const [pipelineId, setPipelineId] = useState<number | ''>('' as any);
  const [status, setStatus] = useState('draft');
  const channel = 'email';
  useEffect(() => { if (open) { setName(''); setPipelineId('' as any); setStatus('draft'); } }, [open]);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>New Campaign</DialogTitle>
      <DialogContent sx={{ display: 'flex', gap: 1, flexDirection: 'column', mt: 0.5 }}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField select label="Pipeline" value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')}>
          <MenuItem value="">(No pipeline)</MenuItem>
          {pipelines.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
        <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          {['draft','scheduled','running','paused','completed','archived'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => name && onCreate({ name, channel, status, pipeline_id: pipelineId || undefined })} variant="contained" disabled={!name.trim()}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

