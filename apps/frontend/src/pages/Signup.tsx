import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

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
    <main style={styles.container}>
      <form onSubmit={onSubmit} style={styles.card}>
        <h2 style={{ marginBottom: 8 }}>Create account</h2>
        {error && <div style={styles.error}>{error}</div>}
        <label style={styles.label}>Account name</label>
        <input style={styles.input} value={accountName} onChange={(e) => setAccountName(e.target.value)} />
        <label style={styles.label}>Plan slug</label>
        <input style={styles.input} value={planSlug} onChange={(e) => setPlanSlug(e.target.value)} />
        <label style={styles.label}>Email</label>
        <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
        <label style={styles.label}>Password</label>
        <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label style={styles.label}>Confirm password</label>
        <input style={styles.input} type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />
        <button style={styles.button} disabled={loading} type="submit">{loading ? 'Creating…' : 'Create account'}</button>
        <div style={styles.alt}>Have an account? <Link to="/login">Sign in</Link></div>
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

