import axios from "axios";
import {
  apiClient,
  registerTokenRefreshExecutor,
  type RetryableRequestConfig,
  type TokenRotationResult,
} from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";
import { useAuthStore, type AuthUser } from "@/features/auth/store";
import {
  acquireCrossTabRefreshLock,
  broadcastAuthMessage,
  handleAuthBroadcastMessage,
  handleStorageSyncEvent,
  initAuthTabSync,
  releaseCrossTabRefreshLock,
  waitForOtherTabRefresh,
} from "./tabSync";
import {
  clearRefreshToken,
  describeSessionRestoreError,
  getRefreshToken,
  hasRefreshToken,
  isForbiddenSessionError,
  isInvalidRefreshTokenError,
  isRecoverableSessionError,
  saveRefreshToken,
  SessionRestoreTimeoutError,
} from "./tokenStorage";

export {
  clearRefreshToken,
  describeSessionRestoreError,
  getRefreshToken,
  handleAuthBroadcastMessage,
  handleStorageSyncEvent,
  hasRefreshToken,
  initAuthTabSync,
  isForbiddenSessionError,
  isInvalidRefreshTokenError,
  isRecoverableSessionError,
  saveRefreshToken,
  SessionRestoreTimeoutError,
};

interface LoginCredentials {
  username: string;
  password: string;
}

interface ChangePasswordCredentials {
  current_password: string;
  new_password: string;
}

const SESSION_RESTORE_TIMEOUT_MS = 10000;

async function fetchCurrentUser(): Promise<AuthUser> {
  const config: RetryableRequestConfig = {
    headers: axios.AxiosHeaders.from({}),
    _retry: true,
  };
  const { data } = await apiClient.get<AuthUser>("/auth/me", config);
  return data;
}

let inFlightTokenRotation: Promise<string | null> | null = null;
let sessionRefreshRequest: Promise<AuthUser | null> | null = null;

export async function rotateAccessToken(): Promise<string | null> {
  if (inFlightTokenRotation) {
    return inFlightTokenRotation;
  }

  inFlightTokenRotation = (async () => {
    const initialRefreshToken = getRefreshToken() ?? "cookie-session";
    const tokenBeforeLock = useAuthStore.getState().accessToken;
    const acquiredLock = acquireCrossTabRefreshLock(initialRefreshToken);

    if (!acquiredLock) {
      await waitForOtherTabRefresh(initialRefreshToken);
      const latestAccessToken = useAuthStore.getState().accessToken;
      if (latestAccessToken && latestAccessToken !== tokenBeforeLock) {
        return latestAccessToken;
      }
    }

    try {
      // Peramban secara otomatis menyertakan HttpOnly cookie berkat withCredentials: true.
      // Jika tersedia token di storage (lingkungan tes / migrasi), kirimkan sebagai payload opsional.
      const fallbackToken = getRefreshToken();
      const payload = fallbackToken ? { refresh_token: fallbackToken } : undefined;

      const { data } = await apiClient.post<TokenRotationResult>(
        "/auth/refresh",
        payload,
      );
      if (data.refresh_token) {
        saveRefreshToken(data.refresh_token);
      }
      useAuthStore.getState().setAccessToken(data.access_token);
      broadcastAuthMessage({
        type: "AUTH_TOKEN_ROTATED",
        accessToken: data.access_token,
      });
      return data.access_token;
    } catch (error) {
      if (isInvalidRefreshTokenError(error)) {
        clearRefreshToken();
        useAuthStore.getState().logout();
        queryClient.clear();
        broadcastAuthMessage({ type: "AUTH_LOGOUT" });
      }
      throw error;
    } finally {
      releaseCrossTabRefreshLock();
    }
  })().finally(() => {
    inFlightTokenRotation = null;
  });

  return inFlightTokenRotation;
}

registerTokenRefreshExecutor(rotateAccessToken);

export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const normalizedCredentials: LoginCredentials = {
    username: credentials.username.trim(),
    password: credentials.password,
  };

  const { data } = await apiClient.post<TokenRotationResult>(
    "/auth/login",
    normalizedCredentials,
  );
  if (data.refresh_token) {
    saveRefreshToken(data.refresh_token);
  }
  useAuthStore.getState().setAccessToken(data.access_token);

  try {
    const user = await fetchCurrentUser();
    useAuthStore.getState().setAuthenticated(data.access_token, user);
    broadcastAuthMessage({
      type: "AUTH_SESSION_UPDATED",
      accessToken: data.access_token,
      user,
    });
    return user;
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      clearRefreshToken();
      useAuthStore.getState().logout();
      queryClient.clear();
    } else if (isForbiddenSessionError(error)) {
      useAuthStore.getState().setForbidden(describeSessionRestoreError(error));
    } else {
      useAuthStore.getState().logout();
    }
    throw error;
  }
}

export async function refreshSession(): Promise<AuthUser | null> {
  if (sessionRefreshRequest) {
    return sessionRefreshRequest;
  }

  let timeoutHandle: number | undefined;
  const refreshPromise = refreshSessionInternal();
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = window.setTimeout(
      () => reject(new SessionRestoreTimeoutError()),
      SESSION_RESTORE_TIMEOUT_MS,
    );
  });

  sessionRefreshRequest = Promise.race([refreshPromise, timeoutPromise])
    .catch((error: unknown) => {
      if (error instanceof SessionRestoreTimeoutError) {
        useAuthStore.getState().setUnavailable(describeSessionRestoreError(error));
      }
      throw error;
    })
    .finally(() => {
      if (timeoutHandle !== undefined) {
        window.clearTimeout(timeoutHandle);
      }
      sessionRefreshRequest = null;
    });

  return sessionRefreshRequest;
}

async function refreshSessionInternal(): Promise<AuthUser | null> {
  useAuthStore.getState().setChecking();

  try {
    const accessToken = await rotateAccessToken();
    if (!accessToken) {
      useAuthStore.getState().logout();
      return null;
    }

    const user = await fetchCurrentUser();
    useAuthStore.getState().setAuthenticated(accessToken, user);
    broadcastAuthMessage({
      type: "AUTH_SESSION_UPDATED",
      accessToken,
      user,
    });
    return user;
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      clearRefreshToken();
      useAuthStore.getState().logout();
      queryClient.clear();
      broadcastAuthMessage({ type: "AUTH_LOGOUT" });
      return null;
    } else if (isForbiddenSessionError(error)) {
      useAuthStore.getState().setForbidden(describeSessionRestoreError(error));
    } else if (isRecoverableSessionError(error)) {
      useAuthStore.getState().setUnavailable(describeSessionRestoreError(error));
    } else {
      useAuthStore.getState().logout();
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  const fallbackToken = getRefreshToken();
  const payload = fallbackToken ? { refresh_token: fallbackToken } : undefined;

  try {
    await apiClient.post("/auth/logout", payload);
  } catch {
    // Ignore logout transport errors so local session cleanup always completes.
  } finally {
    clearRefreshToken();
    useAuthStore.getState().logout();
    queryClient.clear();
    broadcastAuthMessage({ type: "AUTH_LOGOUT" });
  }
}

export async function changePassword(
  credentials: ChangePasswordCredentials,
): Promise<void> {
  await apiClient.post("/auth/change-password", credentials);
}
