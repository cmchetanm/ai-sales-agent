import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';

export function CreateLeadDialog({ open, pipelines, onClose, onCreate }: {
  open: boolean;
  pipelines: Array<{ id: number; name: string }>;
  onClose: () => void;
  onCreate: (attrs: { pipeline_id: number; email: string }) => void;
}) {
  const [pipelineId, setPipelineId] = useState<number | ''>('' as any);
  const [email, setEmail] = useState('');
  useEffect(() => { if (open) { setPipelineId('' as any); setEmail(''); } }, [open]);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>New Lead</DialogTitle>
      <DialogContent sx={{ display: 'flex', gap: 1, flexDirection: 'column', mt: 0.5 }}>
        <TextField select label="Pipeline" value={pipelineId as any} onChange={(e) => setPipelineId((e.target.value as any) || '')}>
          {pipelines.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
        <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => pipelineId && email && onCreate({ pipeline_id: pipelineId as number, email })} variant="contained" disabled={!pipelineId || !email}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

