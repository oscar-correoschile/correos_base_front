import {
  createRootRouteWithContext,
  Link,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { LayoutComponent } from "../layouts/main";
import MuiLink from "@mui/material/Link";
import { fetchSession } from "@/queries/session";
import { isPublicRoute } from "@/config/routes";

interface Context {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<Context>()({
  component: RootComponent,
  loader: async ({ context, location }) => {

    const isPublic = isPublicRoute(location.pathname);

    if (!isPublic) {
      try {
        const sessionData = await context.queryClient.ensureQueryData(fetchSession());
        if (!sessionData) {
          throw redirect({ to: "/login" });
        }
      } catch (error) {
        throw redirect({ to: "/login" });
      }
    }
  },

  notFoundComponent: () => {
    return (
      <div>
        <p>This is the notFoundComponent configured on root route</p>
        <MuiLink component={Link} to="/">
          Start Over
        </MuiLink>
      </div>
    );
  },
});

function RootComponent() {
  const queryClient = Route.useRouteContext().queryClient;
  const location = useLocation();
  
  const isPublic = isPublicRoute(location.pathname);

  return (
    <>
      {!isPublic ? (
        <LayoutComponent queryClient={queryClient} />
      ) : (
        <Outlet />
      )}
    </>
  );
}