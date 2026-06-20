import React, { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
  Typography,
  Avatar,
  AppBar,
  Toolbar,
  IconButton,
  Link,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LinkIcon from '@mui/icons-material/Link';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import SyncIndicator from './SyncIndicator';
import ReportDialog from './ReportDialog';
import { authManager } from '../services/auth';

const DRAWER_WIDTH = 240;
const MOBILE_APP_BAR_HEIGHT = 48;

const navItems = [
  { label: '日历待办', path: '/calendar', icon: <CalendarMonthIcon /> },
  { label: '链接板', path: '/links', icon: <LinkIcon /> },
  { label: '关于', path: '/about', icon: <PersonIcon /> },
  { label: '设置', path: '/settings', icon: <SettingsIcon /> },
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const currentNavIndex = navItems.findIndex(
    (item) => location.pathname === item.path,
  );

  const user = authManager.getUser();

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo & User */}
      <Box
        sx={{
          px: { xs: 2, md: 2.5 },
          py: { xs: 2, md: 2.5 },
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Avatar
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: 40,
            height: 40,
            fontSize: '1.1rem',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          }}
        >
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '0.95rem' }}>
            实用工具站
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {user?.username || '未登录'}
          </Typography>
        </Box>
      </Box>

      {/* Nav Items */}
      <List sx={{ flex: 1, px: 1.5, pt: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  ...(isActive && {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
                    color: '#fff',
                    '& .MuiListItemIcon-root': { color: '#fff' },
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  }),
                }}
              >
                <ListItemIcon
                  sx={{ minWidth: 40, color: isActive ? '#fff' : 'text.secondary' }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.9rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <SyncIndicator />
          <Typography variant="caption" color="text.secondary">
            {user?.username || '未登录'}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
          &copy; 2026 个人实用工具站
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
          浙ICP备2026012560号
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
          <Link
            component="button"
            variant="caption"
            onClick={() => navigate('/privacy')}
            sx={{ textDecoration: 'none', fontSize: '0.7rem' }}
          >
            隐私政策
          </Link>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>|</Typography>
          <Link
            component="button"
            variant="caption"
            onClick={() => setReportOpen(true)}
            sx={{ textDecoration: 'none', fontSize: '0.7rem' }}
          >
            投诉举报
          </Link>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            display: { xs: 'flex', md: 'none' },
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 4px 20px rgba(31, 38, 135, 0.06)',
            color: '#1e293b',
          }}
        >
          <Toolbar sx={{ minHeight: `${MOBILE_APP_BAR_HEIGHT}px !important` }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              aria-label="打开菜单"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, fontSize: '1rem' }}>
              实用工具站
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              backgroundColor: 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '4px 0 24px rgba(31, 38, 135, 0.06)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          pb: isMobile ? '64px' : 0,
        }}
      >
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, md: 3 },
            pt: { xs: `${MOBILE_APP_BAR_HEIGHT + 8}px`, md: 3 },
            maxWidth: 1200,
            mx: 'auto',
            width: '100%',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          value={currentNavIndex >= 0 ? currentNavIndex : 0}
          onChange={(_, newValue) => {
            navigate(navItems[newValue].path);
          }}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.drawer,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.4)',
            height: 64,
            '& .Mui-selected': {
              color: '#667eea',
            },
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      )}

      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} />
    </Box>
  );
};

export default Layout;
