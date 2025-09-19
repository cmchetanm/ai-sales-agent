import React, { createContext, useEffect, useMemo, useState } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

export const ColorModeContext = createContext<{ mode: ThemeMode; toggle: () => void }>({ mode: 'dark', toggle: () => {} });

function buildTheme(mode: ThemeMode) {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: '#6d72f3' },
      secondary: { main: '#22d3ee' },
      background: isDark
        ? { default: '#0e1424', paper: '#111a2e' }
        : { default: '#f3f6fb', paper: '#ffffff' },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily:
        'Sora, Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial',
      fontSize: 13,
      h5: { fontSize: 20, fontWeight: 700 },
      h6: { fontSize: 16, fontWeight: 700 },
    },
    components: {
      MuiButton: {
        defaultProps: { size: 'small' },
        styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
            transition: 'transform .2s ease, box-shadow .2s ease',
            '&:hover': { transform: 'translateY(-1px)' }
          },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiTable: { defaultProps: { size: 'small' } },
      MuiTableCell: { styleOverrides: { root: { paddingTop: 8, paddingBottom: 8 } } },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'default' },
        styleOverrides: {
          root: {
            backdropFilter: 'saturate(180%) blur(8px)',
            backgroundColor: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.7)',
            borderBottom: isDark ? '1px solid rgba(148,163,184,0.12)' : '1px solid rgba(0,0,0,0.06)'
          }
        }
      },
      MuiToolbar: { styleOverrides: { root: { minHeight: 56 } } },
    },
  });
}

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => (localStorage.getItem('theme_mode') as ThemeMode) || 'dark');
  useEffect(() => localStorage.setItem('theme_mode', mode), [mode]);
  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const ctx = useMemo(() => ({ mode, toggle }), [mode]);

  return (
    <ColorModeContext.Provider value={ctx}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
