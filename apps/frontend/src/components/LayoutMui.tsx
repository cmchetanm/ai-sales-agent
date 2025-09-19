import React, { useState } from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LanOutlinedIcon from '@mui/icons-material/LanOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth } from '../auth/AuthContext';
import { ColorModeContext } from '../theme';
import { useTranslation } from 'react-i18next';
import { MenuItem, Select } from '@mui/material';
import { useLocation, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Aurora } from './Aurora';
import { TopBarProgress } from './TopBarProgress';

const drawerWidth = 260;

export function LayoutMui() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { account, user, signOut, token } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const currentLang = (params.lng || i18n.language || 'en').split('-')[0];
  const [lang, setLang] = useState(currentLang);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const logout = async () => { await signOut(); navigate(`/${lang}/login`); };

  const drawer = (
    <div>
      <Toolbar>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: 0.3 }}>{t('app.title')}</Typography>
          <Typography variant="caption" color="text.secondary">{account?.name}</Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{
        '& .MuiListItemButton-root': { borderRadius: 1, mx: 1, my: 0.5 },
        '& .Mui-selected': { background: 'linear-gradient(90deg, rgba(99,102,241,0.15), transparent)' }
      }}>
        <NavItem baseLang={lang} to="/" icon={<DashboardIcon />} label={t('nav.dashboard')} />
        <NavItem baseLang={lang} to="/pipelines" icon={<LanOutlinedIcon />} label={t('nav.pipelines')} />
        <NavItem baseLang={lang} to="/chat" icon={<ChatBubbleOutlineIcon />} label={t('nav.chat')} />
        <NavItem baseLang={lang} to="/leads" icon={<PeopleAltOutlinedIcon />} label={t('nav.leads')} />
        <NavItem baseLang={lang} to="/campaigns" icon={<MailOutlineIcon />} label={t('nav.campaigns')} />
        <NavItem baseLang={lang} to="/account" icon={<SettingsOutlinedIcon />} label={t('nav.account')} />
      </List>
      <Box sx={{ position: 'absolute', bottom: 8, left: 0, right: 0, px: 2 }}>
        <Divider sx={{ mb: 1 }} />
        <Box display="flex" alignItems="center" gap={1} justifyContent="space-between">
          <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Select
              size="small"
              value={lang}
              onChange={async (e) => { const l = e.target.value as string; setLang(l); i18n.changeLanguage(l); const parts = location.pathname.split('/'); if (parts[1]) { parts[1] = l; } else { parts.splice(1, 0, l); } navigate(parts.join('/')); try { if (token) { const currentQ = (account as any)?.profile?.questionnaire || {}; await api.accountUpdate(token, { profile_attributes: { questionnaire: { ...currentQ, locale: l } } }); } } catch {} }}
              variant="outlined"
              displayEmpty
              sx={{
                minWidth: 72,
                height: 32,
                borderRadius: 2,
                '& .MuiSelect-select': { py: 0.5, px: 1.5, display: 'flex', alignItems: 'center' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: (t) => t.palette.divider },
              }}
            >
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="es">ES</MenuItem>
              <MenuItem value="fr">FR</MenuItem>
            </Select>
            <Button size="small" startIcon={<LogoutIcon />} variant="outlined" onClick={logout} sx={{ height: 32 }}>
              {t('app.logout')}
            </Button>
          </Stack>
        </Box>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {account?.name || t('app.workspace')}
          </Typography>
          <IconButton color="inherit" onClick={colorMode.toggle} sx={{ mr: 1 }} title={t('app.toggle_theme')}>
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="sidebar">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, background: (t) => t.palette.mode === 'dark' ? 'linear-gradient(180deg, #0f172a 0%, #0b1220 100%)' : undefined } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, background: (t) => t.palette.mode === 'dark' ? 'linear-gradient(180deg, #0f172a 0%, #0b1220 100%)' : undefined, borderRight: (t) => `1px solid ${t.palette.divider}` } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: { sm: `calc(100% - ${drawerWidth}px)` }, position: 'relative', overflow: 'hidden' }}>
        <TopBarProgress />
        <Toolbar />
        <Aurora />
        <Outlet />
      </Box>
    </Box>
  );
}

function NavItem({ to, icon, label, baseLang }: { to: string; icon: React.ReactNode; label: string; baseLang?: string }) {
  const lang = (baseLang || 'en').split('-')[0];
  const target = `/${lang}${to}`;
  return (
    <ListItem disablePadding>
      <NavLink to={target} end={to === '/'} style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}>
        {({ isActive }) => (
          <ListItemButton selected={isActive}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        )}
      </NavLink>
    </ListItem>
  );
}
