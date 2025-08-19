import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchSession } from "@/queries/session";

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = (): AuthState => {
  const { data: session, isPending } = useSuspenseQuery(fetchSession());

  return {
    user: session || null,
    isAuthenticated: !!session,
    isLoading: isPending,
  };
};

export const useRequireAuth = (): AuthState => {
  const auth = useAuth();
  
  if (!auth.isAuthenticated && !auth.isLoading) {
    throw new Error("Authentication required");
  }
  
  return auth;
};