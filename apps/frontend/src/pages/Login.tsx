import { FormEvent, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Box, Button, Card, CardContent, Stack, TextField, Typography, Alert } from '@mui/material';
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

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" p={2}>
      <Card sx={{ width: 420 }}>
        <CardContent>
          <Stack component="form" onSubmit={onSubmit} spacing={2}>
            <Typography variant="h5" fontWeight={700}>{t('login.title')}</Typography>
            {expired && <Alert severity="info">{t('login.session_expired') || 'Your session expired. Please sign in again.'}</Alert>}
            {error && <Typography color="error" variant="body2">{error}</Typography>}
            <TextField label={t('login.email')} value={email} onChange={(e) => setEmail(e.target.value)} fullWidth size="small" />
            <TextField label={t('login.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth size="small" />
            <Button variant="contained" type="submit" disabled={loading}>{loading ? t('login.submitting') : t('login.submit')}</Button>
            <Typography variant="body2" color="text.secondary">{t('login.footer', { link: '' })}<Link to="/signup">{t('login.create_one')}</Link></Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
 
