import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Container,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  Assignment,
  Elderly,
  Forum,
  CardGiftcard,
  Work,
  Business,
  Event,
  Stars,
  Feedback,
  Notifications,
  AccountCircle,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { notificationsAPI } from '../services/api';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const { data: unreadCount } = useQuery(
    'unreadCount',
    () => notificationsAPI.getUnreadCount().then((res) => res.data.count),
    { enabled: !!user, refetchInterval: 30000 }
  );

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Tasks & Errands', icon: <Assignment />, path: '/tasks' },
    { text: 'Elderly Assistance', icon: <Elderly />, path: '/elderly' },
    { text: 'Community Forum', icon: <Forum />, path: '/forum' },
    { text: 'Donations & Swaps', icon: <CardGiftcard />, path: '/donations' },
    { text: 'Mini-Jobs', icon: <Work />, path: '/jobs' },
    { text: 'Businesses', icon: <Business />, path: '/businesses' },
    { text: 'Calendar', icon: <Event />, path: '/calendar' },
    { text: 'Time Credits', icon: <Stars />, path: '/credits' },
    { text: 'Feedback', icon: <Feedback />, path: '/feedback' },
  ];

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Community Services
          </Typography>

          {user && (
            <>
              <IconButton color="inherit" onClick={() => navigate('/calendar')}>
                <Badge badgeContent={0} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <IconButton
                color="inherit"
                onClick={handleProfileMenuOpen}
                aria-label="account"
              >
                {user.profile_picture ? (
                  <Avatar src={user.profile_picture} alt={user.name} />
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => { navigate('/credits'); handleMenuClose(); }}>
                  Credits: {user.time_credits || 0}
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                component={Link}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 Community Services Platform. Made with ❤️ for communities
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;
