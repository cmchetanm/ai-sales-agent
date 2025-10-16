import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Card, CardContent, Grid2 as Grid, Typography, Box, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LanOutlinedIcon from '@mui/icons-material/LanOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import UploadIcon from '@mui/icons-material/Upload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Link as RouterLink } from 'react-router-dom';

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
      <Typography variant="h5" fontWeight={800} gutterBottom>{t('dashboard.title')}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t('dashboard.subtitle')}
      </Typography>
      <GettingStarted />
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard icon={<PeopleOutlineIcon />} title="Leads" value="1,248" change="+12%" gradient="linear-gradient(135deg,#22d3ee80,#6366f180)" />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard icon={<MailOutlineIcon />} title="Emails" value="8,931" change="+5%" gradient="linear-gradient(135deg,#f472b680,#22d3ee80)" />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard icon={<LanOutlinedIcon />} title="Pipelines" value="3" change="Stable" gradient="linear-gradient(135deg,#6366f180,#22d3ee80)" />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard icon={<TrendingUpIcon />} title="Reply Rate" value="18.4%" change="+1.2%" gradient="linear-gradient(135deg,#22d3ee80,#f472b680)" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="glass">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>System</Typography>
              <Typography variant="h5" fontWeight={700} textTransform="capitalize">{t('dashboard.backend')}: {health}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="glass">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>{t('dashboard.account')}</Typography>
              <Typography variant="h5" fontWeight={700}>{account?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{t('dashboard.user')}: {user?.email}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

function StatCard({ icon, title, value, change, gradient }: { icon: React.ReactNode; title: string; value: string; change: string; gradient: string; }) {
  return (
    <Card className="glass">
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', color: 'white', background: gradient }}>
          {icon}
        </Box>
        <Box sx={{ ml: 1 }}>
          <Typography variant="caption" color="text.secondary">{title}</Typography>
          <Typography variant="h5" fontWeight={800}>{value}</Typography>
          <Typography variant="caption" color="success.main">{change}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function GettingStarted() {
  // Lightweight getting-started when workspace is emptyish
  // Show actionable CTAs: create pipeline, import leads, start campaign
  return (
    <Card className="glass" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Quick Start</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>Set up your workspace in three steps.</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button component={RouterLink} to="../pipelines" variant="contained" startIcon={<AddRoundedIcon />}>New Pipeline</Button>
          <Button component={RouterLink} to="../leads" variant="outlined" startIcon={<UploadIcon />}>Import Leads</Button>
          <Button component={RouterLink} to="../campaigns" variant="outlined" startIcon={<PlayArrowIcon />}>Start Campaign</Button>
        </Box>
      </CardContent>
    </Card>
  );
}
