import { colors } from './colors';
import { createTheme } from '@mui/material/styles';
// FIXME: No se está usando... entonces se podría eliminar
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: colors.primary.main,
      light: colors.primary.var70,
      dark: colors.primary.var30,
      contrastText: colors.neutral.var99,
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.var70,
      dark: colors.secondary.var30,
      contrastText: colors.neutral.var10,
    },
    error: {
      main: colors.error.main,
      light: colors.error.var70,
      dark: colors.error.var30,
      contrastText: colors.neutral.var99,
    },
    warning: {
      main: colors.warning.main,
      light: colors.warning.var70,
      dark: colors.warning.var30,
      contrastText: colors.neutral.var10,
    },
    info: {
      main: colors.information.main,
      light: colors.information.var70,
      dark: colors.information.var30,
      contrastText: colors.neutral.var99,
    },
    success: {
      main: colors.success.main,
      light: colors.success.var70,
      dark: colors.success.var30,
      contrastText: colors.neutral.var99,
    },
    background: {
      default: colors.surface.var99,
      paper: colors.surface.var95,
    },
    text: {
      primary: colors.neutral.var10,
      secondary: colors.neutral.var30,
      disabled: colors.neutral.var50,
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
  // ... otras configuraciones de tema
});
