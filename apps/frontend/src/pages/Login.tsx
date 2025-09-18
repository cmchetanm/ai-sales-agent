import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

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
    <main style={styles.container}>
      <form onSubmit={onSubmit} style={styles.card}>
        <h2 style={{ marginBottom: 8 }}>Sign in</h2>
        {error && <div style={styles.error}>{error}</div>}
        <label style={styles.label}>Email</label>
        <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <label style={styles.label}>Password</label>
        <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button style={styles.button} disabled={loading} type="submit">{loading ? 'Signing in…' : 'Sign in'}</button>
        <div style={styles.alt}>No account? <Link to="/signup">Create one</Link></div>
      </form>
    </main>
  );
};

const styles: Record<string, any> = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1220', color: '#e2e8f0' },
  card: { width: 360, padding: 24, borderRadius: 12, background: '#111827', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 12, opacity: 0.8 },
  input: { padding: '8px 10px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb' },
  button: { marginTop: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#1f2937', color: '#e5e7eb', cursor: 'pointer' },
  alt: { marginTop: 8, fontSize: 12 },
  error: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', padding: 8, borderRadius: 8 }
};

