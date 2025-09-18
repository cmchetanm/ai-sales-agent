import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const ok = await signUp({ accountName, planSlug, email, password, passwordConfirmation });
    setLoading(false);
    if (ok) navigate('/');
    else setError('Unable to create account');
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" p={2}>
      <Card sx={{ width: 520 }}>
        <CardContent>
          <Stack component="form" onSubmit={onSubmit} spacing={2}>
            <Typography variant="h5" fontWeight={700}>Create account</Typography>
            {error && <Typography color="error" variant="body2">{error}</Typography>}
            <TextField label="Account name" value={accountName} onChange={(e) => setAccountName(e.target.value)} fullWidth size="small" />
            <TextField label="Plan slug" value={planSlug} onChange={(e) => setPlanSlug(e.target.value)} fullWidth size="small" />
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth size="small" />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth size="small" />
            <TextField label="Confirm password" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} fullWidth size="small" />
            <Button variant="contained" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</Button>
            <Typography variant="body2" color="text.secondary">Have an account? <Link to="/login">Sign in</Link></Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
