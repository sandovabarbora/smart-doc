import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import { CssBaseline, Box, useMediaQuery } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Chat from './pages/Chat';
import Evaluation from './pages/Evaluation';

// Context for theme mode
const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const createAppTheme = (darkMode: boolean) => createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: darkMode ? '#3B82F6' : '#1976d2',
      light: darkMode ? '#60A5FA' : '#42a5f5',
      dark: darkMode ? '#1E40AF' : '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: darkMode ? '#F59E0B' : '#dc004e',
      light: darkMode ? '#FBBF24' : '#f50057',
      dark: darkMode ? '#D97706' : '#c51162',
    },
    background: {
      default: darkMode ? '#0F172A' : '#F8FAFC',
      paper: darkMode ? '#1E293B' : '#FFFFFF',
    },
    text: {
      primary: darkMode ? '#F1F5F9' : '#1E293B',
      secondary: darkMode ? '#94A3B8' : '#64748B',
    },
    divider: darkMode ? alpha('#475569', 0.2) : alpha('#CBD5E1', 0.5),
    success: {
      main: darkMode ? '#10B981' : '#4caf50',
      light: darkMode ? '#34D399' : '#81c784',
      dark: darkMode ? '#059669' : '#388e3c',
    },
    warning: {
      main: darkMode ? '#F59E0B' : '#ff9800',
      light: darkMode ? '#FBBF24' : '#ffb74d',
      dark: darkMode ? '#D97706' : '#f57c00',
    },
    error: {
      main: darkMode ? '#EF4444' : '#f44336',
      light: darkMode ? '#F87171' : '#e57373',
      dark: darkMode ? '#DC2626' : '#d32f2f',
    },
    info: {
      main: darkMode ? '#06B6D4' : '#2196f3',
      light: darkMode ? '#22D3EE' : '#64b5f6',
      dark: darkMode ? '#0891B2' : '#1976d2',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: darkMode ? '#475569 #1E293B' : '#CBD5E1 #F8FAFC',
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: darkMode ? '#1E293B' : '#F8FAFC',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: darkMode ? '#475569' : '#CBD5E1',
            borderRadius: 4,
            '&:hover': {
              backgroundColor: darkMode ? '#64748B' : '#94A3B8',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(darkMode ? '#475569' : '#E2E8F0', 0.2)}`,
          boxShadow: darkMode
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: darkMode
              ? '0 10px 25px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
              : '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
            '&.Mui-focused': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const theme = createAppTheme(darkMode);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <Box
            sx={{
              minHeight: '100vh',
              background: darkMode
                ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)'
                : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #CBD5E1 100%)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: darkMode
                  ? `radial-gradient(circle at 20% 50%, ${alpha('#3B82F6', 0.1)} 0%, transparent 50%), 
                     radial-gradient(circle at 80% 20%, ${alpha('#F59E0B', 0.1)} 0%, transparent 50%)`
                  : `radial-gradient(circle at 20% 50%, ${alpha('#3B82F6', 0.05)} 0%, transparent 50%), 
                     radial-gradient(circle at 80% 20%, ${alpha('#F59E0B', 0.05)} 0%, transparent 50%)`,
                pointerEvents: 'none',
                zIndex: -1,
              },
            }}
          >
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/evaluation" element={<Evaluation />} />
                </Routes>
              </Layout>
            </Router>
          </Box>
        </QueryClientProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default App;