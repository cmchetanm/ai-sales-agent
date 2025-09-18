import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';

export const Dashboard = () => {
  const { token, user, account } = useAuth();
  const [health, setHealth] = useState<string>('...');

  useEffect(() => {
    let mounted = true;
    api.health().then((res) => {
      if (!mounted) return;
      setHealth(res.ok ? (res.data?.status || 'ok') : 'error');
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-slate-400">High-level view of your sales workspace.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <div className="text-sm text-slate-400">Backend</div>
          <div className="text-2xl font-semibold capitalize">{health}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-slate-400">User</div>
          <div className="text-2xl font-semibold">{user?.email}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-slate-400">Account</div>
          <div className="text-2xl font-semibold">{account?.name}</div>
        </div>
      </div>
    </div>
  );
};
