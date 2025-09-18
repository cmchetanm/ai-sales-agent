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

const drawerWidth = 260;

export function LayoutMui() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { account, user, signOut } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const logout = async () => { await signOut(); navigate('/login'); };

  const drawer = (
    <div>
      <Toolbar>
        <Box>
          <Typography variant="h6" fontWeight={700}>AI Sales Agent</Typography>
          <Typography variant="caption" color="text.secondary">{account?.name}</Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        <NavItem to="/" icon={<DashboardIcon />} label="Dashboard" />
        <NavItem to="/pipelines" icon={<LanOutlinedIcon />} label="Pipelines" />
        <NavItem to="/chat" icon={<ChatBubbleOutlineIcon />} label="Agent Chat" />
        <NavItem to="/leads" icon={<PeopleAltOutlinedIcon />} label="Leads" />
        <NavItem to="/campaigns" icon={<MailOutlineIcon />} label="Campaigns" />
        <NavItem to="/account" icon={<SettingsOutlinedIcon />} label="Account" />
      </List>
      <Box sx={{ position: 'absolute', bottom: 8, left: 0, right: 0, px: 2 }}>
        <Divider sx={{ mb: 1 }} />
        <Box display="flex" alignItems="center" gap={1} justifyContent="space-between">
          <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
          <Button size="small" startIcon={<LogoutIcon />} variant="outlined" onClick={logout}>Logout</Button>
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
            {account?.name || 'Workspace'}
          </Typography>
          <IconButton color="inherit" onClick={colorMode.toggle} sx={{ mr: 1 }} title="Toggle theme">
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
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <ListItem disablePadding>
      <NavLink to={to} end={to === '/'} style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}>
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
