import { createTheme } from '@mui/material/styles';
import { colors } from './styles/colors';

const errorMain = '#d32f2f';
const errorHover = '#E05A5A';
export const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: { main: errorMain, contrastText: '#222' },
    secondary: { main: '#F5F5F5', contrastText: '#222' },
    success: { main: '#37994C', contrastText: '#fff' },
    error: { main: errorMain, contrastText: '#fff' },
    warning: { main: '#F6D77B', contrastText: '#222' },
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#222',
    },
    background: {
      default: '#fff',
      paper: '#fff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
          fontWeight: 700,
          fontSize: '1rem',
          padding: '10px 28px',
          minHeight: 40,
          minWidth: 80,
          boxShadow: 'none',
          letterSpacing: 0.2,
          '& .MuiButton-startIcon': {
            marginRight: 8,
          },
          '& .MuiButton-endIcon': {
            marginLeft: 8,
          },
        },
        containedPrimary: {
          backgroundColor: errorMain,
          color: '#fff',
          '&:hover': {
            backgroundColor: errorHover,
          },
        },
        containedSecondary: {
          backgroundColor: '#616161',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#424242',
          },
        },
        containedSuccess: {
          backgroundColor: '#37994C',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#2e7d32',
          },
        },
        containedInfo: {
          backgroundColor: '#1E88E5',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#1565c0',
          },
        },
        containedError: {
          backgroundColor: errorMain,
          color: '#fff',
          '&:hover': {
            backgroundColor: errorHover,
          },
        },
        outlined: {
          borderWidth: 2,
          borderColor: errorMain,
          color: errorMain,
          backgroundColor: 'transparent',
          '&:hover': {
            borderColor: errorHover,
            backgroundColor: 'rgba(224,90,90,0.08)',
          },
        },
        outlinedPrimary: {
          borderColor: errorMain,
          color: errorMain,
          '&:hover': {
            borderColor: errorHover,
            backgroundColor: 'rgba(224,90,90,0.08)',
          },
        },
        outlinedSecondary: {
          borderColor: '#616161',
          color: '#616161',
          '&:hover': {
            borderColor: '#424242',
            backgroundColor: 'rgba(97,97,97,0.08)',
          },
        },
        outlinedSuccess: {
          borderColor: '#37994C',
          color: '#37994C',
          '&:hover': {
            borderColor: '#2e7d32',
            backgroundColor: 'rgba(55,153,76,0.08)',
          },
        },
        outlinedInfo: {
          borderColor: '#1E88E5',
          color: '#1E88E5',
          '&:hover': {
            borderColor: '#1565c0',
            backgroundColor: 'rgba(30,136,229,0.08)',
          },
        },
        outlinedError: {
          borderColor: errorMain,
          color: errorMain,
          '&:hover': {
            borderColor: errorHover,
            backgroundColor: 'rgba(224,90,90,0.08)',
          },
        },
        text: {
          color: errorMain,
          fontWeight: 700,
          '&:hover': {
            backgroundColor: 'rgba(224,90,90,0.08)',
          },
        },
        textPrimary: {
          color: errorMain,
          '&:hover': {
            backgroundColor: 'rgba(224,90,90,0.08)',
          },
        },
        textSecondary: {
          color: '#616161',
          '&:hover': {
            backgroundColor: 'rgba(97,97,97,0.08)',
          },
        },
        textSuccess: {
          color: '#37994C',
          '&:hover': {
            backgroundColor: 'rgba(55,153,76,0.08)',
          },
        },
        textInfo: {
          color: '#1E88E5',
          '&:hover': {
            backgroundColor: 'rgba(30,136,229,0.08)',
          },
        },
        textError: {
          color: errorMain,
          '&:hover': {
            backgroundColor: 'rgba(224,90,90,0.08)',
          },
        },
      },
    },
  },
});
