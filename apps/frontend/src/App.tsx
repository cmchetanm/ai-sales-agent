import { useEffect, useState } from 'react';

const App = () => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000'}/health`, {
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Health check failed');
        const body = await response.json();
        setMessage(body.status ?? 'ok');
        setStatus('ready');
      })
      .catch(() => {
        setStatus('error');
        setMessage('Unable to reach backend');
      });

    return () => controller.abort();
  }, []);

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <h1 style={styles.title}>AI Sales Agent</h1>
        <p style={styles.subtitle}>Your orchestration hub is warming up.</p>
        <div style={styles.status(status)}>{status.toUpperCase()}</div>
        <p style={styles.message}>{message}</p>
      </section>
    </main>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at top, #0f172a, #020617)',
    color: '#e2e8f0',
    fontFamily: 'Inter, system-ui, sans-serif'
  } as const,
  card: {
    padding: '3rem',
    borderRadius: '1.5rem',
    background: 'rgba(15, 23, 42, 0.8)',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(16px)',
    textAlign: 'center',
    maxWidth: '480px',
    width: '100%'
  } as const,
  title: {
    fontSize: '2.5rem',
    marginBottom: '0.75rem'
  } as const,
  subtitle: {
    fontSize: '1rem',
    opacity: 0.8,
    marginBottom: '2rem'
  } as const,
  status: (state: 'loading' | 'ready' | 'error') => ({
    display: 'inline-block',
    padding: '0.5rem 1.5rem',
    borderRadius: '999px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    marginBottom: '1rem',
    backgroundColor:
      state === 'ready' ? 'rgba(16, 185, 129, 0.15)' : state === 'error' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(59, 130, 246, 0.15)',
    color:
      state === 'ready' ? '#34d399' : state === 'error' ? '#f87171' : '#60a5fa',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  }),
  message: {
    fontSize: '0.95rem',
    opacity: 0.75
  } as const
};

export default App;

