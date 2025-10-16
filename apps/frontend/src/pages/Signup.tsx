import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Box, Button, Card, CardContent, Stack, TextField, Typography, IconButton, InputAdornment } from '@mui/material';
import { Aurora } from '../components/Aurora';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';

export const Signup = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [accountName, setAccountName] = useState('Acme Inc');
  const [planSlug, setPlanSlug] = useState('basic');
  const [email, setEmail] = useState('owner@example.com');
  const [password, setPassword] = useState('SecurePass123!');
  const [passwordConfirmation, setPasswordConfirmation] = useState('SecurePass123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const ok = await signUp({ accountName, planSlug, email, password, passwordConfirmation });
    setLoading(false);
    if (ok) navigate(`/${i18n.language.split('-')[0]}/`);
    else setError(t('signup.error'));
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" p={2} position="relative" overflow="hidden">
      <Aurora />
      <Card className="glass" sx={{ width: 520 }}>
        <CardContent>
          <Stack component="form" onSubmit={onSubmit} spacing={2}>
            <Typography variant="h5" fontWeight={700}>{t('signup.title')}</Typography>
            {error && <Typography color="error" variant="body2">{error}</Typography>}
            <TextField label={t('signup.account_name')} value={accountName} onChange={(e) => setAccountName(e.target.value)} fullWidth size="small" />
            <TextField label={t('signup.plan_slug')} value={planSlug} onChange={(e) => setPlanSlug(e.target.value)} fullWidth size="small" />
            <TextField label={t('signup.email')} value={email} onChange={(e) => setEmail(e.target.value)} fullWidth size="small" />
            <TextField label={t('signup.password')} type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} fullWidth size="small" InputProps={{ endAdornment: (
              <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPw((s)=>!s)}>{showPw ? <VisibilityOff/> : <Visibility/>}</IconButton></InputAdornment>
            ) }} />
            <TextField label={t('signup.confirm_password')} type={showPw2 ? 'text' : 'password'} value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} fullWidth size="small" InputProps={{ endAdornment: (
              <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPw2((s)=>!s)}>{showPw2 ? <VisibilityOff/> : <Visibility/>}</IconButton></InputAdornment>
            ) }} />
            <Button variant="contained" type="submit" disabled={loading}>{loading ? t('signup.submitting') : t('signup.submit')}</Button>
            <Typography variant="body2" color="text.secondary">{t('signup.footer', { link: '' })}<Link to="/login">{t('signup.sign_in')}</Link></Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
