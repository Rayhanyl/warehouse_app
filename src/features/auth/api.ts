import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { useAuthStore, type AuthUser } from "@/features/auth/store";

const refreshTokenKey = "wms.frontend.auth.refresh-token";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  access_expires_at: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface ChangePasswordCredentials {
  current_password: string;
  new_password: string;
}

function getRefreshToken() {
  return localStorage.getItem(refreshTokenKey);
}

function saveRefreshToken(refreshToken: string) {
  localStorage.setItem(refreshTokenKey, refreshToken);
}

export function clearRefreshToken() {
  localStorage.removeItem(refreshTokenKey);
}

function isInvalidRefreshTokenError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function isRecoverableSessionError(error: unknown) {
  if (error instanceof SessionRestoreTimeoutError) {
    return true;
  }

  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return !error.response || status === 408 || status === 429 || (status !== undefined && status >= 500);
}

async function fetchCurrentUser() {
  const { data } = await apiClient.get<AuthUser>("/auth/me");
  return data;
}

let sessionRefreshRequest: Promise<AuthUser | null> | null = null;
const sessionRestoreTimeoutMs = 10000;

class SessionRestoreTimeoutError extends Error {
  constructor() {
    super("Pemulihan sesi melewati batas waktu.");
    this.name = "SessionRestoreTimeoutError";
  }
}

export async function login(credentials: LoginCredentials) {
  const { data } = await apiClient.post<TokenResponse>("/auth/login", credentials);
  saveRefreshToken(data.refresh_token);
  useAuthStore.getState().setAccessToken(data.access_token);

  try {
    const user = await fetchCurrentUser();
    useAuthStore.getState().setUser(user);
    return user;
  } catch (error) {
    useAuthStore.getState().logout();
    if (isInvalidRefreshTokenError(error)) {
      clearRefreshToken();
    }
    throw error;
  }
}

export async function refreshSession() {
  if (sessionRefreshRequest) {
    return sessionRefreshRequest;
  }

  const refreshPromise = refreshSessionInternal();
  const timeoutPromise = new Promise<never>((_, reject) => {
    window.setTimeout(
      () => reject(new SessionRestoreTimeoutError()),
      sessionRestoreTimeoutMs,
    );
  });

  sessionRefreshRequest = Promise.race([refreshPromise, timeoutPromise]).finally(() => {
    sessionRefreshRequest = null;
  });

  return sessionRefreshRequest;
}

async function refreshSessionInternal() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const { data } = await apiClient.post<TokenResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    saveRefreshToken(data.refresh_token);
    useAuthStore.getState().setAccessToken(data.access_token);
    const user = await fetchCurrentUser();
    useAuthStore.getState().setUser(user);
    return user;
  } catch (error) {
    useAuthStore.getState().logout();
    if (isInvalidRefreshTokenError(error)) {
      clearRefreshToken();
    }
    throw error;
  }
}

export async function logout() {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      await apiClient.post("/auth/logout", { refresh_token: refreshToken });
    }
  } finally {
    useAuthStore.getState().logout();
    clearRefreshToken();
  }
}

export async function changePassword(credentials: ChangePasswordCredentials) {
  await apiClient.post("/auth/change-password", credentials);
}
