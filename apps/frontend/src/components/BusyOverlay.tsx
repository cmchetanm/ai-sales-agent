import { Backdrop, CircularProgress } from '@mui/material';

export function BusyOverlay({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <Backdrop open={loading} sx={{ position: 'absolute', inset: 0, zIndex: (t) => t.zIndex.modal + 1, color: '#fff' }}>
        <CircularProgress color="inherit" thickness={4} />
      </Backdrop>
    </div>
  );
}

