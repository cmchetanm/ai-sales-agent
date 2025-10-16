import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Card, CardContent, Grid2 as Grid, Typography, Box, Button, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LanOutlinedIcon from '@mui/icons-material/LanOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import UploadIcon from '@mui/icons-material/Upload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Link as RouterLink } from 'react-router-dom';
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from '../components/SimpleCharts';

export const Dashboard = () => {
  const { token, user, account } = useAuth();
  const [stats, setStats] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    if (token) {
      setLoadingStats(true);
      api.dashboard(token).then((res) => {
        if (!mounted) return;
        if (res.ok && res.data) setStats(res.data);
        setLoadingStats(false);
      });
    }
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <Typography variant="h5" fontWeight={800} gutterBottom>{t('dashboard.title')}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t('dashboard.subtitle')}
      </Typography>
      <GettingStarted />
      <ChartsGrid stats={stats} loading={loadingStats} />
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

function ChartsGrid({ stats, loading }: { stats: any; loading: boolean }) {
  const leadsByStatus = Object.entries(stats?.leads?.by_status || {}).map(([name, value]) => ({ name, value: Number(value) }));
  const leadsBySource = Object.entries(stats?.leads?.by_source || {}).map(([label, value]) => ({ id: label, value: Number(value), label }));
  const weekly = (stats?.leads?.weekly_created || []).map((r: any) => ({ x: r.week, y: r.count }));
  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card className="glass">
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">Leads by Status</Typography>
            {loading ? <CircularProgress size={20} /> : (
              <SimpleBarChart data={leadsByStatus.map(d=>({ label: d.name, value: d.value }))} height={280} />
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card className="glass">
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">Weekly Leads Created</Typography>
            {loading ? <CircularProgress size={20} /> : (
              <SimpleLineChart points={weekly} height={280} />
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card className="glass">
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">Leads by Source</Typography>
            {loading ? <CircularProgress size={20} /> : (
              <SimplePieChart data={leadsBySource.map(d=>({ label: d.label as string, value: d.value as number }))} height={280} />
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
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
