import React from 'react';
import { Navigate, useLocation } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';
import { colors } from '@/styles/colors';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const LoadingScreen: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: colors.secondary.var95,
      gap: 2,
    }}
  >
    <CircularProgress size={40} sx={{ color: colors.primary.main }} />
    <Typography variant="body1" sx={{ color: colors.secondary.var50 }}>
      Verificando autenticación...
    </Typography>
  </Box>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" search={{ redirect: location.pathname }} />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: colors.secondary.var95,
          gap: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: colors.error.main }}>
          Acceso Denegado
        </Typography>
        <Typography variant="body1" sx={{ color: colors.secondary.var50 }}>
          No tienes permisos para acceder a esta página.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};