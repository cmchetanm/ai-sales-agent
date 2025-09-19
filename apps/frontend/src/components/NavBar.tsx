import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';

export const NavBar = () => {
  const { user, account, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const logout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <Link to="/" style={styles.brand}>{t('app.title')}</Link>
        <nav style={styles.nav}>
          <Link to="/pipelines" style={styles.link}>{t('nav.pipelines')}</Link>
          <Link to="/leads" style={styles.link}>{t('nav.leads')}</Link>
          <Link to="/campaigns" style={styles.link}>{t('nav.campaigns')}</Link>
          <Link to="/account" style={styles.link}>{t('nav.account')}</Link>
        </nav>
      </div>
      <div style={styles.right}>
        {account && <span style={styles.account}>{account.name}</span>}
        {user && <button onClick={logout} style={styles.button}>{t('app.logout')}</button>}
      </div>
    </header>
  );
};

const styles: Record<string, any> = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#0b1220', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  left: { display: 'flex', alignItems: 'center', gap: '1rem' },
  brand: { color: '#e2e8f0', textDecoration: 'none', fontWeight: 700 },
  nav: { display: 'flex', gap: '0.75rem' },
  link: { color: '#cbd5e1', textDecoration: 'none' },
  right: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  account: { fontSize: 12, opacity: 0.8 },
  button: { background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', padding: '0.35rem 0.75rem', borderRadius: 6 }
};
