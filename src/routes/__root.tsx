import {
  createRootRouteWithContext,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { LayoutComponent } from "../layouts/main";
import MuiLink from "@mui/material/Link";

// import { fetchSession } from "@/queries/session";

interface Context {
  queryClient: QueryClient;
}
export const Route = createRootRouteWithContext<Context>()({
  component: RootComponent,
  loader: async ({ context: _context }) => {
    // const data = await context.queryClient.ensureQueryData(fetchSession());
    // if (!data && location.pathname !== "/login") {
    //   throw redirect({ to: "/login" });
    // }
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
  // const { data: session, isSuccess } = useSuspenseQuery(fetchSession());
  const queryClient = Route.useRouteContext().queryClient;

  return (
    <>
      <LayoutComponent queryClient={queryClient} />
      {/*<Outlet />*/}
      {/*{isSuccess && session ? (
        <>
        </>
      ) : (

      )}*/}
    </>
  );
}
