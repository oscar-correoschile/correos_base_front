import { useAuthStore } from "@/store/auth";

const accessToken = useAuthStore.getState().accessToken;
type HeadersType = {
  "Content-Type": string;
  Authorization?: string;
};
export const baseFetch = (path: string, method: string, body: object) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const headers: HeadersType = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  } else {
    console.warn("No access token found, request may fail.");
  }
  const options = {
    method,
    headers,
  };
  const url = new URL(path, baseUrl);
  return fetch(url.toString(), { ...options, body: JSON.stringify(body) });
};
