import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: () => {
    // Redirigir automáticamente al dashboard
    throw redirect({ to: "/dashboard" });
  },
  component: Index,
});

function Index() {
  // Esta función nunca se ejecutará porque siempre redirige
  return null;
}
