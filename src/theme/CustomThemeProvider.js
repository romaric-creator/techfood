import React, { useMemo, useState, createContext, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { getDashboardTheme, updateDashboardTheme } from '../services/themeService';

export const ThemeSettingsContext = createContext({ customTheme: {}, updateTheme: () => {} });

const defaultTheme = {
  primary: '#6366f1', // Couleur primaire actuelle (gradient start)
  secondary: '#4f46e5', // Couleur secondaire actuelle (gradient end)
  background: '#f5f7fa' // Couleur de fond actuelle
};


const CustomThemeProvider = ({ children }) => {
  // Read local storage theme or use default
  const initialTheme = JSON.parse(localStorage.getItem('customTheme')) || defaultTheme;
  const [customTheme, setCustomTheme] = useState(initialTheme);

  useEffect(() => {
    // Load theme from Firebase only if on Dashboard (check pathname)
    if (window.location.pathname.includes("dashboard")) {
      getDashboardTheme()
        .then(data => {
          const newTheme = {
            primary: data.primary || defaultTheme.primary,
            secondary: data.secondary || defaultTheme.secondary,
            background: data.background || defaultTheme.background
          };
          setCustomTheme(newTheme);
          localStorage.setItem('customTheme', JSON.stringify(newTheme));
        })
        .catch(err => {
          console.error("Erreur lors de la récupération du thème dashboard via l'API :", err);
        });
    }
  }, []);

  const updateTheme = (newTheme) => {
    // Update state and local storage
    const merged = { ...customTheme, ...newTheme };
    setCustomTheme(merged);
    localStorage.setItem('customTheme', JSON.stringify(merged));
    // If on dashboard, update theme in Firebase
    if (window.location.pathname.includes("dashboard")) {
      updateDashboardTheme(merged)
        .catch(err => {
          console.error("Erreur lors de la mise à jour du thème dashboard via l'API :", err);
        });
    }
  };

  const muiTheme = useMemo(() =>
    createTheme({
      palette: {
        mode: customTheme.mode || 'dark',
        primary: { main: customTheme.primary },
        secondary: { main: customTheme.secondary },
        background: {
          default: customTheme.background || '#121212',
          paper: customTheme.surface || '#1e1e1e'
        },
        text: {
          primary: customTheme.textPrimary || '#ffffff',
          secondary: customTheme.textSecondary || '#b3b3b3'
        }
      },
      typography: {
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '0.02em' },
        h2: { fontSize: '2rem', fontWeight: 700, letterSpacing: '0.02em' },
        h3: { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '0.02em' },
        h4: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '0.02em' },
        h5: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.02em' },
        h6: { fontSize: '1rem', fontWeight: 600, letterSpacing: '0.02em' },
        subtitle1: { fontSize: '1rem', fontWeight: 500, letterSpacing: '0.02em' },
        subtitle2: { fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.02em' },
        body1: { fontSize: '1rem', letterSpacing: '0.02em' },
        body2: { fontSize: '0.875rem', letterSpacing: '0.02em' },
        button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.02em' }
      },
      shape: {
        borderRadius: 8
      },
      components: {
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundColor: 'transparent',
              '& .MuiCardContent-root': {
                backgroundColor: 'inherit'
              }
            }
          }
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none'
            }
          }
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              padding: '8px 16px'
            },
            contained: {
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }
            }
          }
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 8,
                '& fieldset': {
                  borderWidth: 2
                },
                '&:hover fieldset': {
                  borderWidth: 2
                }
              }
            }
          }
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundImage: 'none'
            }
          }
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              fontWeight: 500
            }
          }
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 12
            }
          }
        },
        MuiSnackbar: {
          styleOverrides: {
            root: {
              '& .MuiAlert-root': {
                borderRadius: 8
              }
            }
          }
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        MuiBottomNavigation: {
          styleOverrides: {
            root: {
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(18, 18, 18, 0.8)'
            }
          }
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundImage: 'none'
            }
          }
        }
      }
    }), [customTheme]);

  return (
    <ThemeSettingsContext.Provider value={{ customTheme, updateTheme }}>
      <ThemeProvider theme={muiTheme}>
         <CssBaseline />
         {children}
      </ThemeProvider>
    </ThemeSettingsContext.Provider>
  );
};

export default CustomThemeProvider;