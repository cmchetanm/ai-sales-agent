import { FormEvent, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Box, Button, Card, CardContent, Stack, TextField, Typography, Alert, IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import BoltIcon from '@mui/icons-material/Bolt';
import { Aurora } from '../components/Aurora';
import { useTranslation } from 'react-i18next';

export const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@acme.test');
  const [password, setPassword] = useState('DemoPass123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const expired = search.get('expired') === '1';
  const nextPath = search.get('next');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const ok = await signIn(email, password);
    setLoading(false);
    if (ok) {
      if (nextPath) {
        try { navigate(decodeURIComponent(nextPath)); return; } catch {}
      }
      navigate(`/${i18n.language.split('-')[0]}/`);
    }
    else setError(t('login.error'));
  };

  const [showPw, setShowPw] = useState(false);

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" p={2} position="relative" overflow="hidden">
      <Aurora />
      <Card className="glass" sx={{ width: 420 }}>
        <CardContent>
          <Stack component="form" onSubmit={onSubmit} spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <BoltIcon color="secondary" />
              <Typography variant="h5" fontWeight={800}>{t('login.title')}</Typography>
            </Stack>
            {expired && <Alert severity="info">{t('login.session_expired') || 'Your session expired. Please sign in again.'}</Alert>}
            {error && <Typography color="error" variant="body2">{error}</Typography>}
            <TextField label={t('login.email')} value={email} onChange={(e) => setEmail(e.target.value)} fullWidth size="small" />
            <TextField label={t('login.password')} type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} fullWidth size="small" InputProps={{ endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowPw((s) => !s)}>{showPw ? <VisibilityOff /> : <Visibility />}</IconButton>
              </InputAdornment>
            ) }} />
            <Button variant="contained" type="submit" disabled={loading}>{loading ? t('login.submitting') : t('login.submit')}</Button>
            <Button variant="outlined" type="button" onClick={() => { setEmail('demo@acme.test'); setPassword('DemoPass123!'); }}>
              Use Demo Account
            </Button>
            <Typography variant="body2" color="text.secondary">{t('login.footer', { link: '' })}<Link to="/signup">{t('login.create_one')}</Link></Typography>
            <Typography variant="caption" color="text.secondary">Tip: Press Ctrl/Cmd+K for the Command Palette</Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
 
