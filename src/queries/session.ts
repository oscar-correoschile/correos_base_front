import { queryOptions } from "@tanstack/react-query";

const API_WHATSAPP_URL = import.meta.env.VITE_API_WHATSAPP_URL || "http://localhost:3000";

export const fetchSession = () =>
  queryOptions({
    queryKey: ["session"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        return null;
      }

      try {
        const response = await fetch(`${API_WHATSAPP_URL}/auth/check`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            // Token inválido, limpiar localStorage
            localStorage.removeItem("access_token");
          }
          return null;
        }

        const sessionData = await response.json();
        return sessionData;
      } catch (error) {
        console.error("Error fetching session:", error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
