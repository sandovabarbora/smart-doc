import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  IconButton,
  Badge,
  Avatar,
  Divider,
  Tooltip,
  Switch,
  FormControlLabel,
  Collapse,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DocumentsIcon,
  Chat as ChatIcon,
  Assessment as EvaluationIcon,
  Psychology as AIIcon,
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
} from '@mui/icons-material';
import { useTheme as useAppTheme } from '../App';

const drawerWidth = 280;

const navigation = [
  { 
    name: 'Dashboard', 
    path: '/', 
    icon: DashboardIcon,
    description: 'Overview & Analytics',
  },
  { 
    name: 'Documents', 
    path: '/documents', 
    icon: DocumentsIcon,
    description: 'Upload & Manage',
  },
  { 
    name: 'Chat', 
    path: '/chat', 
    icon: ChatIcon,
    description: 'AI Assistant',
  },
  { 
    name: 'Evaluation', 
    path: '/evaluation', 
    icon: EvaluationIcon,
    description: 'Performance Metrics',
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { darkMode, toggleDarkMode } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getCurrentPageName = () => {
    const current = navigation.find(item => item.path === location.pathname);
    return current?.name || 'Dashboard';
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box sx={{ 
        p: 3, 
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ 
            width: 40, 
            height: 40,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }}>
            <AIIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} noWrap>
              Smart Doc AI
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Document Analyzer
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ px: 1, mb: 1, display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
          Main Menu
        </Typography>
        <List sx={{ p: 0 }}>
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.name} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    mx: 0.5,
                    minHeight: 48,
                    background: isActive 
                      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.primary.main, 0.05)})`
                      : 'transparent',
                    border: isActive ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}` : '1px solid transparent',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      background: isActive 
                        ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.main, 0.1)})`
                        : alpha(theme.palette.action.hover, 0.08),
                      transform: 'translateX(4px)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 40,
                    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                  }}>
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.name}
                    secondary={item.description}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Settings Section */}
        <Typography variant="overline" color="text.secondary" sx={{ px: 1, mb: 1, display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
          Settings
        </Typography>
        
        <ListItemButton 
          onClick={() => setShowSettings(!showSettings)}
          sx={{ borderRadius: 2, mx: 0.5, mb: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Preferences" />
          {showSettings ? <CollapseIcon /> : <ExpandIcon />}
        </ListItemButton>

        <Collapse in={showSettings}>
          <Box sx={{ pl: 2, pr: 1 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={darkMode} 
                  onChange={toggleDarkMode}
                  size="small"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  {darkMode ? <DarkIcon fontSize="small" /> : <LightIcon fontSize="small" />}
                  <Typography variant="body2">
                    {darkMode ? 'Dark' : 'Light'} Mode
                  </Typography>
                </Box>
              }
              sx={{ mb: 1 }}
            />
          </Box>
        </Collapse>
      </Box>

      {/* User Profile Section */}
      <Box sx={{ 
        p: 2,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.5)}, transparent)`,
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ 
            width: 36, 
            height: 36,
            bgcolor: theme.palette.secondary.main,
            fontSize: '0.875rem',
            fontWeight: 600,
          }}>
            U
          </Avatar>
          <Box flex={1}>
            <Typography variant="body2" fontWeight={600}>
              User
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Administrator
            </Typography>
          </Box>
          <Tooltip title="Help">
            <IconButton size="small">
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{ 
          width: { md: `calc(100% - ${drawerWidth}px)` }, 
          ml: { md: `${drawerWidth}px` },
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 4px 6px -1px ${alpha(theme.palette.common.black, 0.1)}`,
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box>
              <Typography variant="h6" noWrap component="div" fontWeight={600}>
                {getCurrentPageName()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Welcome back! Here's what's happening with your documents.
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ 
              width: 32, 
              height: 32,
              bgcolor: theme.palette.primary.main,
              ml: 1,
            }}>
              U
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.9)})`,
              backdropFilter: 'blur(20px)',
              border: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.9)})`,
              backdropFilter: 'blur(20px)',
              border: 'none',
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
