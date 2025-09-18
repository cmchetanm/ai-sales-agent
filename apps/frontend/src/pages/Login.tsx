import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

export const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@acme.test');
  const [password, setPassword] = useState('DemoPass123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const ok = await signIn(email, password);
    setLoading(false);
    if (ok) navigate('/');
    else setError('Invalid email or password');
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" p={2}>
      <Card sx={{ width: 420 }}>
        <CardContent>
          <Stack component="form" onSubmit={onSubmit} spacing={2}>
            <Typography variant="h5" fontWeight={700}>Sign in</Typography>
            {error && <Typography color="error" variant="body2">{error}</Typography>}
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth size="small" />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth size="small" />
            <Button variant="contained" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
            <Typography variant="body2" color="text.secondary">No account? <Link to="/signup">Create one</Link></Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
 
