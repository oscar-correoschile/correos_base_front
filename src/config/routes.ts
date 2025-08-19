// Configuración de rutas públicas y privadas

export const PUBLIC_ROUTES = [
  '/login',
] as const;

export const PROTECTED_ROUTES = [
  '/dashboard',
] as const;

// export const ADMIN_ROUTES = [
//   '/admin',
//   '/admin/users',
//   '/admin/settings',
// ] as const;

export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.includes(pathname as any);
};

export const isProtectedRoute = (pathname: string): boolean => {
  return PROTECTED_ROUTES.includes(pathname as any)
        //  ADMIN_ROUTES.includes(pathname as any);
};

// export const isAdminRoute = (pathname: string): boolean => {
//   return ADMIN_ROUTES.includes(pathname as any);
// };
