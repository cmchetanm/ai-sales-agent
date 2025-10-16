import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, TextField, List, ListItemButton, ListItemText, Stack, Typography, Chip } from '@mui/material';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ColorModeContext } from '../theme';

type Command = {
  id: string;
  title: string;
  subtitle?: string;
  keywords?: string;
  badge?: string;
  action: () => void;
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { lng } = useParams();
  const { signOut } = useAuth();
  const colorMode = React.useContext(ColorModeContext);
  const location = useLocation();
  const base = `/${(lng || 'en').split('-')[0]}`;

  useEffect(() => { if (!open) setQ(''); }, [open]);

  const commands: Command[] = useMemo(() => [
    { id: 'nav:dashboard', title: 'Go to Dashboard', action: () => navigate(`${base}/`) },
    { id: 'nav:pipelines', title: 'Go to Pipelines', action: () => navigate(`${base}/pipelines`) },
    { id: 'nav:chat', title: 'Go to Agent Chat', action: () => navigate(`${base}/chat`) },
    { id: 'nav:leads', title: 'Go to Leads', action: () => navigate(`${base}/leads`) },
    { id: 'nav:campaigns', title: 'Go to Campaigns', action: () => navigate(`${base}/campaigns`) },
    { id: 'nav:account', title: 'Go to Account', action: () => navigate(`${base}/account`) },
    { id: 'create:lead', title: 'New Lead…', subtitle: 'Open create lead dialog', badge: 'Create', action: () => navigate(`${base}/leads?new=lead`) },
    { id: 'create:pipeline', title: 'New Pipeline…', subtitle: 'Open create pipeline dialog', badge: 'Create', action: () => navigate(`${base}/pipelines?new=1`) },
    { id: 'create:campaign', title: 'New Campaign…', subtitle: 'Open create campaign dialog', badge: 'Create', action: () => navigate(`${base}/campaigns?new=1`) },
    { id: 'app:theme', title: 'Toggle Theme', subtitle: 'Light / Dark', action: () => colorMode.toggle() },
    { id: 'app:logout', title: 'Sign Out', action: async () => { await signOut(); navigate(`${base}/login`); } },
  ], [navigate, base, colorMode, signOut]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return commands;
    return commands.filter(c => [c.title, c.subtitle, c.keywords].filter(Boolean).join(' ').toLowerCase().includes(s));
  }, [q, commands]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent sx={{ pt: 2, pb: 1 }}>
        <Stack spacing={1}>
          <TextField
            autoFocus
            size="small"
            placeholder="Type a command or search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <List dense disablePadding sx={{ maxHeight: 360, overflow: 'auto' }}>
            {filtered.map((c) => (
              <ListItemButton key={c.id} onClick={() => { c.action(); onClose(); }}>
                <ListItemText
                  primary={<Stack direction="row" spacing={1} alignItems="center"><Typography variant="body2" fontWeight={600}>{c.title}</Typography>{c.badge && <Chip size="small" label={c.badge} />}</Stack>}
                  secondary={c.subtitle}
                />
              </ListItemButton>
            ))}
            {filtered.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 2 }}>No results</Typography>
            )}
          </List>
          <Typography variant="caption" color="text.secondary">Press Esc to close • Enter to run • Ctrl/Cmd+K to open</Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

