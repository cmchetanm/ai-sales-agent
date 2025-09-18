import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Card, CardContent, Grid2 as Grid, Typography } from '@mui/material';

export const Dashboard = () => {
  const { token, user, account } = useAuth();
  const [health, setHealth] = useState<string>('...');

  useEffect(() => {
    let mounted = true;
    api.health().then((res) => {
      if (!mounted) return;
      setHealth(res.ok ? (res.data?.status || 'ok') : 'error');
    });
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <Typography variant="h5" fontWeight={700} gutterBottom>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        High-level view of your sales workspace.
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">Backend</Typography>
            <Typography variant="h5" fontWeight={700} textTransform="capitalize">{health}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">User</Typography>
            <Typography variant="h5" fontWeight={700}>{user?.email}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">Account</Typography>
            <Typography variant="h5" fontWeight={700}>{account?.name}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>
    </>
  );
};
