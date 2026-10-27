import axios from "axios";
import { useAuthStore } from "@/features/auth/store";

const refreshTokenKey = "wms.frontend.auth.refresh-token";

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000"}/api/v1`,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshRequest: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status !== 401 ||
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const refreshToken = localStorage.getItem("wms.frontend.auth.refresh-token");
    if (!refreshToken) {
      return Promise.reject(error);
    }

    if (!refreshRequest) {
      refreshRequest = axios
        .post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { "Content-Type": "application/json" }, timeout: 10000 },
        )
        .then((response) => {
          const token = response.data.access_token as string;
          localStorage.setItem(
            "wms.frontend.auth.refresh-token",
            response.data.refresh_token as string,
          );
          useAuthStore.getState().setAccessToken(token);
          return token;
        })
        .catch((refreshError) => {
          useAuthStore.getState().logout();
          if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
            localStorage.removeItem(refreshTokenKey);
          }
          throw refreshError;
        })
        .finally(() => {
          refreshRequest = null;
        });
    }

    const token = await refreshRequest;
    if (token) {
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);
