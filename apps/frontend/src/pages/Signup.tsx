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
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-6 space-y-3">
        <h2 className="text-xl font-semibold">Create account</h2>
        {error && <div className="rounded-lg border border-red-500/50 bg-red-500/10 text-red-200 px-3 py-2">{error}</div>}
        <label className="label">Account name</label>
        <input className="input" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
        <label className="label">Plan slug</label>
        <input className="input" value={planSlug} onChange={(e) => setPlanSlug(e.target.value)} />
        <label className="label">Email</label>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label className="label">Confirm password</label>
        <input className="input" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />
        <button className="btn btn-primary w-full" disabled={loading} type="submit">{loading ? 'Creating…' : 'Create account'}</button>
        <div className="text-sm text-slate-400">Have an account? <Link className="text-brand-400 hover:text-brand-300" to="/login">Sign in</Link></div>
      </form>
    </main>
  );
};

