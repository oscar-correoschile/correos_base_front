import { queryOptions } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export const fetchSession = () =>
  queryOptions({
    queryKey: ["session"],
    queryFn: () =>
      authClient.getSession().then((session) => {
        if (!session) {
          return null;
        }
        return session.data;
      }),
    staleTime: 1000 * 60 * 10, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
