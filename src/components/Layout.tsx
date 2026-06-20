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
/** Mobile AppBar height in pixels */
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
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 40,
            height: 40,
            fontSize: '1.1rem',
          }}
        >
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            实用工具站
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.username || '未登录'}
          </Typography>
        </Box>
      </Box>
      <List sx={{ flex: 1, pt: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? 'white' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: isActive ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <SyncIndicator />
          <Typography variant="caption" color="text.secondary">
            {user?.username || '未登录'}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
          © 2026 个人实用工具站
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
          浙ICP备2026012560号
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
          公安备案：待审核通过后添加
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, alignItems: 'center' }}>
          <Link
            component="button"
            variant="caption"
            onClick={() => navigate('/privacy')}
            sx={{ textDecoration: 'none' }}
          >
            隐私政策
          </Link>
          <Typography variant="caption" color="text.secondary">|</Typography>
          <Link
            component="button"
            variant="caption"
            onClick={() => setReportOpen(true)}
            sx={{ textDecoration: 'none' }}
          >
            投诉举报
          </Link>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile AppBar — provides hamburger menu to open the Drawer */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            display: { xs: 'flex', md: 'none' },
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
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
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
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Drawer (temporary) */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
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
          pb: isMobile ? '56px' : 0,
        }}
      >
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, md: 3 },
            // Compensate for the fixed mobile AppBar height
            pt: { xs: `${MOBILE_APP_BAR_HEIGHT + 8}px`, md: 3 },
            maxWidth: 1200,
            mx: 'auto',
            width: '100%',
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
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '& .Mui-selected': {
              color: 'primary.main',
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

      {/* Report Dialog */}
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} />
    </Box>
  );
};

export default Layout;
