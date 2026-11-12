import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/features/auth/store";
import { queryClient } from "@/lib/query-client";

export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _accessToken?: string | null;
}

export interface TokenRotationResult {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  access_expires_at: string;
}

function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!envUrl) {
    return "/api/v1";
  }
  const cleanUrl = envUrl.replace(/\/+$/, "");
  return cleanUrl.endsWith("/api/v1") ? cleanUrl : `${cleanUrl}/api/v1`;
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  (config as RetryableRequestConfig)._accessToken = token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

type TokenRefreshExecutor = () => Promise<string | null>;

let customTokenRefreshExecutor: TokenRefreshExecutor | null = null;

export function registerTokenRefreshExecutor(executor: TokenRefreshExecutor | null) {
  customTokenRefreshExecutor = executor;
}

let fallbackRefreshPromise: Promise<string | null> | null = null;

async function defaultRotateAccessToken(): Promise<string | null> {
  if (!fallbackRefreshPromise) {
    fallbackRefreshPromise = apiClient
      .post<TokenRotationResult>("/auth/refresh")
      .then((response) => {
        const nextAccessToken = response.data.access_token;
        useAuthStore.getState().setAccessToken(nextAccessToken);
        return nextAccessToken;
      })
      .catch((refreshError: unknown) => {
        const status = axios.isAxiosError(refreshError)
          ? refreshError.response?.status
          : undefined;
        if (status === 401 || status === 422) {
          useAuthStore.getState().logout();
          queryClient.clear();
        } else {
          useAuthStore.getState().logout();
        }
        throw refreshError;
      })
      .finally(() => {
        fallbackRefreshPromise = null;
      });
  }

  return fallbackRefreshPromise;
}

function isAuthEndpointExcludedFromRefresh(url?: string): boolean {
  if (!url) {
    return false;
  }
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (
      status !== 401 ||
      !originalRequest ||
      isAuthEndpointExcludedFromRefresh(originalRequest.url) ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const currentAccessToken = useAuthStore.getState().accessToken;
    if (
      currentAccessToken &&
      originalRequest._accessToken &&
      currentAccessToken !== originalRequest._accessToken
    ) {
      originalRequest.headers.set("Authorization", `Bearer ${currentAccessToken}`);
      return apiClient(originalRequest);
    }

    const executeRefresh = customTokenRefreshExecutor ?? defaultRotateAccessToken;
    try {
      const token = await executeRefresh();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      }
    } catch {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);
