  import { createFileRoute } from '@tanstack/react-router';
import { Box, Typography, Paper } from '@mui/material';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { colors } from '@/styles/colors';

function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3, backgroundColor: colors.secondary.var99 }}>
          <Typography variant="h4" sx={{ color: colors.secondary.var20, mb: 2 }}>
            Panel de Administración
          </Typography>
          <Typography variant="body1" sx={{ color: colors.secondary.var50 }}>
            Esta página solo es accesible para administradores.
          </Typography>
        </Paper>
      </Box>
    </ProtectedRoute>
  );
}

export const Route = createFileRoute('/admin')({
  component: AdminPage,
});
