import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import ForgotPassword from "@/components/ForgotPassword";
import Alert from "@mui/material/Alert";
import { useState } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { fetchSession } from "@/queries/session";
import { useAppForm } from "@/forms/login";

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  [theme.breakpoints.up("sm")]: {
    maxWidth: "450px",
  },
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage:
        "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
    }),
  },
}));

function RouteComponent() {
  const [open, setOpen] = useState(false);

  const { refetch } = useSuspenseQuery(fetchSession());
  const navigate = useNavigate({ from: "/login" });

  const mutation = useMutation({
    mutationFn: async (value: LoginForm) => {
      const { data, error } = await authClient.signIn.email(value);
      // await authClient.signUp.email({
      //   email: "dead.time.aa@gmail.com",
      //   password: "123456.,.",
      //   name: "Alvaro Abarca",
      //   callbackURL: "/",
      // });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: async (data) => {
      console.log("Login successful", data);
      await refetch();
      navigate({ to: "/" });
    },
    onError: (error) => {
      console.error("Login failed", error);
    },
  });

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validators: {
      onChange: z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Contraseña requerida"),
        rememberMe: z.boolean(),
      }),
    },
    onSubmit: async ({ value, formApi }) => {
      await mutation.mutateAsync(value);
      formApi.reset();
    },
  });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        {/* <ColorModeSelect
          sx={{ position: "fixed", top: "1rem", right: "1rem" }}
        /> */}
        <Card variant="outlined">
          {/* <SitemarkIcon /> */}
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
          >
            Sign in
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
                    <FormLabel htmlFor="email">Email</FormLabel>
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
                      placeholder="your@email.com"
                      autoComplete="email"
                      autoFocus
                      required
                      fullWidth
                      variant="outlined"
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
                    <FormLabel htmlFor="password">Password</FormLabel>
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
                      placeholder="••••••"
                      autoComplete="current-password"
                      autoFocus
                      required
                      fullWidth
                      variant="outlined"
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
            <form.AppField
              name="rememberMe"
              children={(field) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      id={field.name}
                      name={field.name}
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Remember me"
                />
              )}
            />
            {/* <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            /> */}
            <ForgotPassword open={open} handleClose={handleClose} />
            {false && (
              <Alert severity="error">Usuario o contrasena invalidos.</Alert>
            )}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <form.SubmitButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={!canSubmit || isSubmitting}
                  loading={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </form.SubmitButton>
              )}
            />
            <Link
              component="button"
              type="button"
              onClick={handleClickOpen}
              variant="body2"
              sx={{ alignSelf: "center" }}
            >
              Forgot your password?
            </Link>
          </Box>
          <Divider>or</Divider>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* <Button
              fullWidth
              variant="outlined"
              onClick={() => alert("Sign in with Google")}
              startIcon={<GoogleIcon />}
            >
              Sign in with Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => alert("Sign in with Facebook")}
              startIcon={<FacebookIcon />}
            >
              Sign in with Facebook
            </Button> */}
            <Typography sx={{ textAlign: "center" }}>
              Don&apos;t have an account?{" "}
              <Link
                href="/material-ui/getting-started/templates/sign-in/"
                variant="body2"
                sx={{ alignSelf: "center" }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignInContainer>
    </div>
  );
}
