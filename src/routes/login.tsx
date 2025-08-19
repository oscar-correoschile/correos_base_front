import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import CssBaseline from "@mui/material/CssBaseline";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import { InputAdornment, IconButton } from "@mui/material";
import { Email, Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { fetchSession } from "@/queries/session";
import { useAppForm } from "@/forms/login";
import ForgotPassword from "@/components/ForgotPassword";
import ButtonBase from "@/components/button/button";
import useBreakpoints from "@/hooks/useBreakpoints";

interface LoginForm {
  email: string;
  password: string;
}

export const Route = createFileRoute("/login")({
  component: LoginForm,
  loader: async () => {
    // Verificar si el usuario ya está autenticado
    const token = localStorage.getItem("access_token");
    
    if (token) {
      try {
        // Hacer la verificación de sesión directamente
        const API_WHATSAPP_URL = import.meta.env.VITE_API_WHATSAPP_URL || "http://localhost:3000";
        const response = await fetch(`${API_WHATSAPP_URL}/auth/check`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const sessionData = await response.json();
          if (sessionData) {
            // Si ya está autenticado, redirigir al dashboard
            throw redirect({ to: "/dashboard" });
          }
        } else if (response.status === 401 || response.status === 403) {
          // Solo eliminar el token si es específicamente un error de autenticación
          console.log("Token expired or invalid, clearing token");
          localStorage.removeItem("access_token");
        } else {
          // Para otros errores HTTP (500, etc.), asumir que el token es válido y redirigir
          console.log("Server error, but assuming token is valid");
          throw redirect({ to: "/dashboard" });
        }
      } catch (error) {
        // Si hay error de red u otro, asumir que el token es válido y redirigir
        if (error instanceof Response) {
          // Si es un redirect, permitir que se propague
          throw error;
        }
        console.log("Network error, but keeping token and redirecting:", error);
        throw redirect({ to: "/dashboard" });
      }
    }
    
    // Si no hay token, permitir acceso al login
    return null;
  },
});

const Container = styled(Box)({
  backgroundColor: "#f5f5f5",
});

const MainBox = styled(Box)({
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
});

const Logo = styled("img")(({ theme }) => ({
  display: "block",
  marginLeft: "auto",
  marginRight: "auto",
  marginBottom: "2rem",
  width: "200px",
  height: "50px",
  [theme.breakpoints.down("sm")]: {
    width: "160px",
    height: "40px",
    marginBottom: "1.5rem",
  },
}));

const BoxBody = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  [theme.breakpoints.down("sm")]: {
    padding: "1rem",
    flex: 1,
    alignItems: "flex-start",
  },
  [theme.breakpoints.down(480)]: {
    padding: "0.5rem",
  },
}));

const BoxForm = styled(Paper)(({ theme }) => ({
  maxWidth: "500px",
  width: "100%",
  padding: "4rem",
  backgroundColor: "white",
  borderRadius: "2rem",
  [theme.breakpoints.down("sm")]: {
    padding: "2rem 1.5rem",
    borderRadius: "1.5rem",
    margin: "0 0.5rem",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  [theme.breakpoints.down(480)]: {
    padding: "1.5rem 1rem",
    borderRadius: "1rem",
    margin: "0 0.25rem",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  },
  [theme.breakpoints.down(360)]: {
    padding: "1rem 0.75rem",
    margin: "0 0.125rem",
  },
}));

const API_WHATSAPP_URL = import.meta.env.VITE_API_WHATSAPP_URL || "http://localhost:3000";

function LoginForm() {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isMobile } = useBreakpoints();

  const { refetch } = useSuspenseQuery(fetchSession());
  const navigate = useNavigate({ from: "/login" });

  const mutation = useMutation({
    mutationFn: async (value: LoginForm) => {
      console.log(import.meta.env);
      const response = await fetch(`${API_WHATSAPP_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: value.email,
          password: value.password,
        }),
        // credentials: "include", // Para incluir cookies
      });
      console.log("Login response:", response);
      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      if (!response.ok) {
        throw new Error(data.message || "Error de autenticación");
      }

      return data;
    },
    onSuccess: async (data) => {
      console.log("Login successful", data);
      setError(null);
      await refetch();
      navigate({ to: "/" });
    },
    onError: (error) => {
      console.error("Login failed", error);
      setError("Usuario o contraseña inválidos");
    },
  });

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Contraseña requerida"),
      }),
    },
    onSubmit: async ({ value, formApi }) => {
      setError(null);
      await mutation.mutateAsync(value);
      formApi.reset();
    },
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmitPasswordRecovery = async (email: string) => {
    console.log("Password recovery for:", email);
    setOpen(false);
  };

  return (
    <Container>
      <CssBaseline enableColorScheme />
      <MainBox>
        <Logo
          src="/images/logo_correos.svg"
          alt="Logo Correos Chile"
        />
        <BoxBody>
          <BoxForm elevation={0}>
            
            <Typography
              variant="body2"
              sx={{
                color: "#6B7280",
                textAlign: "center",
                fontSize: { xs: "0.85rem", sm: "0.875rem" },
                mb: { xs: 2, sm: 3 },
                lineHeight: 1.5,
              }}
            >
              Acceso para usuarios con Keycloak.
            </Typography>
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              noValidate
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                gap: 2,
              }}
            >
              <FormControl>
                <form.AppField
                  name="email"
                  children={(field) => (
                    <>
                      <field.TextField
                        id={field.name}
                        error={field.state.meta?.errors?.length > 0}
                        helperText={
                          field.state.meta?.errors
                            ? field.state.meta.errors[0]?.message
                            : ""
                        }
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Correo electrónico"
                        autoComplete="email"
                        autoFocus
                        required
                        fullWidth
                        variant="standard"
                        sx={{ mb: isMobile ? 2 : 3 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Email sx={{ color: "#474747", }} />
                            </InputAdornment>
                          ),
                        }}
                        color={
                          field.state.meta?.errors?.length > 0
                            ? "error"
                            : "primary"
                        }
                      />
                    </>
                  )}
                />
              </FormControl>
              <FormControl>
                <form.AppField
                  name="password"
                  children={(field) => (
                    <>
                      <field.TextField
                        id={field.name}
                        type={showPassword ? "text" : "password"}
                        error={field.state.meta?.errors?.length > 0}
                        helperText={
                          field.state.meta?.errors
                            ? field.state.meta.errors[0]?.message
                            : ""
                        }
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Clave"
                        autoComplete="current-password"
                        required
                        fullWidth
                        variant="standard"
                        sx={{ mb: isMobile ? 2 : 3 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton 
                                onClick={handleClickShowPassword} 
                                edge="end" 
                                sx={{ color: "#474747" }}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        color={
                          field.state.meta?.errors?.length > 0
                            ? "error"
                            : "primary"
                        }
                      />
                    </>
                  )}
                />
              </FormControl>

              <Box sx={{ textAlign: "left", mt: { xs: 2, sm: 4 }, mb: { xs: 1.5, sm: 2 } }}>
                <ButtonBase
                  onClick={handleClickOpen}
                  variant="text"
                  color="secondary"
                  startIcon={<img src={'/images/passwordIcon.svg'} width={24} height={24} alt="pwIcon" />}
                >
                  Recuperar Contraseña
                </ButtonBase>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <ButtonBase
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={!canSubmit || isSubmitting}
                    loading={isSubmitting}
                    sx={{ mt: 2 }}
                  >
                    {isSubmitting ? "Iniciando sesión..." : "Continuar"}
                  </ButtonBase>
                )}
              />
            </Box>
          </BoxForm>
        </BoxBody>
      </MainBox>
    </Container>
  );
}