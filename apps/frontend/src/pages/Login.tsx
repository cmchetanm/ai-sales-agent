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
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-6 space-y-3">
        <h2 className="text-xl font-semibold">Sign in</h2>
        {error && <div className="rounded-lg border border-red-500/50 bg-red-500/10 text-red-200 px-3 py-2">{error}</div>}
        <label className="label">Email</label>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn btn-primary w-full" disabled={loading} type="submit">{loading ? 'Signing in…' : 'Sign in'}</button>
        <div className="text-sm text-slate-400">No account? <Link className="text-brand-400 hover:text-brand-300" to="/signup">Create one</Link></div>
      </form>
    </main>
  );
};
 
