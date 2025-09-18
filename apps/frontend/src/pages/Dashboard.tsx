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
    <div>
      <h2>Dashboard</h2>
      <div style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>Backend health: {health}</div>
      {token && (
        <div style={{ marginTop: 16 }}>
          <div>User: {user?.email}</div>
          <div>Account: {account?.name}</div>
        </div>
      )}
    </div>
  );
};

