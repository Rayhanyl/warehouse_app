import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/features/auth/store";
import { queryClient } from "@/lib/query-client";
import {
  localStorageRepository,
  REFRESH_TOKEN_STORAGE_KEY,
} from "@/lib/storage";

export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export interface TokenRotationResult {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  access_expires_at: string;
}

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

type TokenRefreshExecutor = () => Promise<string | null>;

let customTokenRefreshExecutor: TokenRefreshExecutor | null = null;

export function registerTokenRefreshExecutor(executor: TokenRefreshExecutor | null) {
  customTokenRefreshExecutor = executor;
}

let fallbackRefreshPromise: Promise<string | null> | null = null;

async function defaultRotateAccessToken(): Promise<string | null> {
  const rawToken = localStorageRepository.getString(REFRESH_TOKEN_STORAGE_KEY);
  const refreshToken = rawToken?.trim() ?? "";
  if (!refreshToken) {
    if (rawToken !== null) {
      localStorageRepository.remove(REFRESH_TOKEN_STORAGE_KEY);
    }
    return null;
  }

  if (!fallbackRefreshPromise) {
    fallbackRefreshPromise = apiClient
      .post<TokenRotationResult>("/auth/refresh", {
        refresh_token: refreshToken,
      })
      .then((response) => {
        const nextAccessToken = response.data.access_token;
        const nextRefreshToken = response.data.refresh_token;
        localStorageRepository.setString(
          REFRESH_TOKEN_STORAGE_KEY,
          nextRefreshToken,
        );
        useAuthStore.getState().setAccessToken(nextAccessToken);
        return nextAccessToken;
      })
      .catch((refreshError: unknown) => {
        const status = axios.isAxiosError(refreshError)
          ? refreshError.response?.status
          : undefined;
        if (status === 401 || status === 422) {
          localStorageRepository.remove(REFRESH_TOKEN_STORAGE_KEY);
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

    const refreshToken = localStorageRepository
      .getString(REFRESH_TOKEN_STORAGE_KEY)
      ?.trim();
    if (!refreshToken) {
      localStorageRepository.remove(REFRESH_TOKEN_STORAGE_KEY);
      useAuthStore.getState().logout();
      queryClient.clear();
      return Promise.reject(error);
    }

    const executeRefresh = customTokenRefreshExecutor ?? defaultRotateAccessToken;
    const token = await executeRefresh();

    if (token) {
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);
