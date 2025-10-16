import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BarChart3, Boxes, LogOut, Mail, UsersRound, Settings } from 'lucide-react';

export const Layout = () => {
  const { account, user, signOut } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const lang = (params.lng || (typeof navigator !== 'undefined' ? navigator.language : 'en')).split('-')[0] || 'en';

  const logout = async () => { await signOut(); navigate(`/${lang}/login`); };

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="h-full bg-slate-950 border-r border-slate-800/80">
        <div className="p-4 border-b border-slate-800">
          <div className="text-lg font-semibold">AI Sales Agent</div>
          <div className="text-xs text-slate-400">{account?.name ?? '—'}</div>
        </div>
        <nav className="p-3 flex flex-col gap-1">
          <Item to={`/${lang}/`} icon={<BarChart3 size={16} />}>Dashboard</Item>
          <Item to={`/${lang}/pipelines`} icon={<Boxes size={16} />}>Pipelines</Item>
          <Item to={`/${lang}/leads`} icon={<UsersRound size={16} />}>Leads</Item>
          <Item to={`/${lang}/campaigns`} icon={<Mail size={16} />}>Campaigns</Item>
          <Item to={`/${lang}/account`} icon={<Settings size={16} />}>Account</Item>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 flex items-center justify-between text-sm">
          <span className="text-slate-400 truncate mr-2">{user?.email}</span>
          <button className="btn btn-muted px-2 py-1" onClick={logout}><LogOut size={14} /> Logout</button>
        </div>
      </aside>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

const Item = ({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-brand-600/10 text-brand-300' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}
  >
    {icon}<span>{children}</span>
  </NavLink>
);
