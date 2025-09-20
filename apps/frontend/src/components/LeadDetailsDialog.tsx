import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Stack, TextField, Chip } from '@mui/material';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function LeadDetailsDialog({ open, onClose, lead }: { open: boolean; onClose: () => void; lead: any }) {
  const { token } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [note, setNote] = useState('');

  const load = async () => {
    if (!token || !lead) return;
    const res = await api.leadsActivitiesIndex(token, lead.id, { per_page: 20 });
    if (res.ok && res.data) setActivities(res.data.activities);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const addNote = async () => {
    if (!token || !lead || !note.trim()) return;
    const res = await api.leadsActivitiesCreate(token, lead.id, { kind: 'note', content: note });
    if (res.ok) { setNote(''); await load(); }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Lead Details</DialogTitle>
      <DialogContent sx={{ display: 'flex', gap: 2 }}>
        <Stack spacing={1} sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Profile</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={lead.email} />
            {lead.first_name && <Chip label={`${lead.first_name} ${lead.last_name || ''}`.trim()} />}
            {lead.company && <Chip label={lead.company} />}
            {lead.job_title && <Chip label={lead.job_title} />}
            {lead.location && <Chip label={lead.location} />}
          </Stack>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>Log Note</Typography>
          <Stack direction="row" spacing={1}>
            <TextField fullWidth size="small" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." />
            <Button variant="contained" onClick={addNote} disabled={!note.trim()}>Add</Button>
          </Stack>
        </Stack>
        <Stack spacing={1} sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Timeline</Typography>
          <Stack spacing={1}>
            {activities.map((a, i) => (
              <div key={i} style={{ padding: 8, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8 }}>
                <Typography variant="caption" color="text.secondary">{new Date(a.happened_at).toLocaleString()} · {a.kind}</Typography>
                <Typography variant="body2">{a.content}</Typography>
              </div>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

