import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Card, CardContent, Grid2 as Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export const Dashboard = () => {
  const { token, user, account } = useAuth();
  const [health, setHealth] = useState<string>('...');
  const { t } = useTranslation();

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
      <Typography variant="h5" fontWeight={700} gutterBottom>{t('dashboard.title')}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t('dashboard.subtitle')}
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">{t('dashboard.backend')}</Typography>
            <Typography variant="h5" fontWeight={700} textTransform="capitalize">{health}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">{t('dashboard.user')}</Typography>
            <Typography variant="h5" fontWeight={700}>{user?.email}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">{t('dashboard.account')}</Typography>
            <Typography variant="h5" fontWeight={700}>{account?.name}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>
    </>
  );
};
