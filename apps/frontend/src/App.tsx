import { BrowserRouter, Navigate, Route, Routes, Outlet, useParams, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LayoutMui } from './components/LayoutMui';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Pipelines } from './pages/Pipelines';
import { Leads } from './pages/Leads';
import { Campaigns } from './pages/Campaigns';
import { Account } from './pages/Account';
import { AgentChat } from './pages/AgentChat';
import { Toaster } from 'sonner';
import { ThemeModeProvider } from './theme';
import i18n from './i18n';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { token, loading } = useAuth();
  const { lng } = useParams();
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!token) return <Navigate to={`/${lng || 'en'}/login`} replace />;
  return children;
};

const LocaleGate = ({ children }: { children: JSX.Element }) => {
  const { lng } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const current = (lng || '').split('-')[0] || 'en';
  // Sync i18n language with URL param
  if (i18n.language.split('-')[0] !== current) {
    i18n.changeLanguage(current);
  }
  // Ensure path always begins with /:lng
  if (!lng) {
    navigate(`/en${location.pathname}`, { replace: true });
    return null as any;
  }
  return children;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <ThemeModeProvider>
        <Toaster position="top-right" theme="dark" richColors />
        <Routes>
          {/* Backward-compat: redirect bare routes to detected locale */}
          <Route path="/login" element={<DetectRedirect to="login" />} />
          <Route path="/signup" element={<DetectRedirect to="signup" />} />
          <Route path="/" element={<DetectRedirect />} />

          {/* Localized routes */}
          <Route path="/:lng/login" element={<LocaleGate><Login /></LocaleGate>} />
          <Route path="/:lng/signup" element={<LocaleGate><Signup /></LocaleGate>} />
          <Route
            path="/:lng/*"
            element={
              <LocaleGate>
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              </LocaleGate>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pipelines" element={<Pipelines />} />
            <Route path="chat" element={<AgentChat />} />
            <Route path="leads" element={<Leads />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="account" element={<Account />} />
          </Route>
          <Route path="*" element={<Navigate to="/en" replace />} />
        </Routes>
      </ThemeModeProvider>
    </BrowserRouter>
  </AuthProvider>
);

const MainLayout = () => <LayoutMui />;

export default App;

function DetectRedirect({ to }: { to?: string }) {
  const navigate = useNavigate();
  const loc = (i18n.language || navigator.language || 'en').split('-')[0];
  const path = to ? `/${loc}/${to}` : `/${loc}`;
  return <Navigate to={path} replace />;
}
