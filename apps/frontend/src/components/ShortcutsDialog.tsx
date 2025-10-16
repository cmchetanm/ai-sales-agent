import { Dialog, DialogContent, DialogTitle, Typography, Stack, Chip } from '@mui/material';

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rows = [
    { k: 'Ctrl/Cmd + K', v: 'Open Command Palette' },
    { k: 'Esc', v: 'Close dialogs and palette' },
    { k: 'Enter', v: 'Send chat message' },
    { k: 'Shift + Enter', v: 'New line in chat' },
  ];
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Keyboard Shortcuts</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          {rows.map((r) => (
            <Stack key={r.k} direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">{r.v}</Typography>
              <Chip size="small" label={r.k} />
            </Stack>
          ))}
          <Typography variant="caption" color="text.secondary">
            Tip: Use the palette to jump quickly to pages and actions.
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

