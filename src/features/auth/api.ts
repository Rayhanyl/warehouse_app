import axios from "axios";
import {
  apiClient,
  registerTokenRefreshExecutor,
  type RetryableRequestConfig,
  type TokenRotationResult,
} from "@/lib/api-client";
import { extractApiErrorInfo } from "@/lib/errors";
import { queryClient } from "@/lib/query-client";
import {
  localStorageRepository,
  REFRESH_LOCK_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
} from "@/lib/storage";
import {
  useAuthStore,
  type AuthUser,
  type SessionRestoreErrorInfo,
} from "@/features/auth/store";

interface LoginCredentials {
  username: string;
  password: string;
}

interface ChangePasswordCredentials {
  current_password: string;
  new_password: string;
}

interface RefreshLockRecord {
  tabId: string;
  token: string;
  startedAt: number;
}

type AuthBroadcastMessage =
  | { type: "AUTH_LOGOUT" }
  | { type: "AUTH_TOKEN_ROTATED"; accessToken: string }
  | { type: "AUTH_SESSION_UPDATED"; accessToken: string; user: AuthUser };

const AUTH_BROADCAST_CHANNEL_NAME = "wms.frontend.auth.channel";
const TAB_ID = `tab-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
const REFRESH_LOCK_TTL_MS = 4000;
const SESSION_RESTORE_TIMEOUT_MS = 10000;

export class SessionRestoreTimeoutError extends Error {
  constructor() {
    super("Pemulihan sesi melewati batas waktu.");
    this.name = "SessionRestoreTimeoutError";
  }
}

export function getRefreshToken(): string | null {
  const raw = localStorageRepository.getString(REFRESH_TOKEN_STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    localStorageRepository.remove(REFRESH_TOKEN_STORAGE_KEY);
    return null;
  }
  return trimmed;
}

export function hasRefreshToken(): boolean {
  return getRefreshToken() !== null;
}

export function saveRefreshToken(refreshToken: string): void {
  const trimmed = refreshToken.trim();
  if (!trimmed) {
    return;
  }
  localStorageRepository.setString(REFRESH_TOKEN_STORAGE_KEY, trimmed);
}

export function clearRefreshToken(): void {
  localStorageRepository.remove(REFRESH_TOKEN_STORAGE_KEY);
  localStorageRepository.remove(REFRESH_LOCK_STORAGE_KEY);
}

export function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  return status === 401 || status === 422;
}

export function isForbiddenSessionError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}

export function isRecoverableSessionError(error: unknown): boolean {
  if (error instanceof SessionRestoreTimeoutError) {
    return true;
  }

  if (!axios.isAxiosError(error)) {
    return false;
  }

  const info = extractApiErrorInfo(error);
  const status = info.status;
  return (
    info.isTimeout ||
    info.isNetworkError ||
    !error.response ||
    status === 408 ||
    status === 429 ||
    (status !== undefined && status >= 500)
  );
}

export function describeSessionRestoreError(
  error: unknown,
): SessionRestoreErrorInfo {
  if (error instanceof SessionRestoreTimeoutError) {
    return {
      message:
        "Pemulihan sesi melewati batas waktu. Sesi Anda tetap tersimpan. Periksa koneksi jaringan lalu coba lagi.",
      code: "SESSION_RESTORE_TIMEOUT",
      isOffline: true,
    };
  }

  const info = extractApiErrorInfo(error);

  if (info.status === 403) {
    return {
      message:
        info.message ??
        "Akun Anda tidak memiliki izin untuk mengakses ruang kerja ini.",
      code: info.code ?? "PERMISSION_DENIED",
      requestId: info.requestId,
      isOffline: false,
    };
  }

  if (info.isTimeout) {
    return {
      message:
        "Waktu tunggu koneksi ke server habis. Sesi Anda tetap tersimpan di perangkat ini. Silakan coba lagi.",
      code: info.code ?? "REQUEST_TIMEOUT",
      requestId: info.requestId,
      isOffline: true,
    };
  }

  if (info.isNetworkError || info.status === undefined) {
    return {
      message:
        "Server atau jaringan sedang tidak dapat dihubungi. Sesi Anda tetap disimpan. Coba lagi tanpa harus masuk ulang.",
      code: info.code ?? "NETWORK_ERROR",
      requestId: info.requestId,
      isOffline: true,
    };
  }

  if (info.status >= 500) {
    return {
      message:
        "Server sedang mengalami gangguan sementara. Sesi Anda tetap disimpan. Silakan coba lagi beberapa saat lagi.",
      code: info.code ?? "INTERNAL_ERROR",
      requestId: info.requestId,
      isOffline: false,
    };
  }

  return {
    message:
      info.message ??
      "Sesi belum dapat dipulihkan saat ini. Silakan coba kembali.",
    code: info.code,
    requestId: info.requestId,
    isOffline: false,
  };
}

let authBroadcastChannel: BroadcastChannel | null = null;
let isTabSyncInitialized = false;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  if (!authBroadcastChannel) {
    try {
      authBroadcastChannel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL_NAME);
    } catch {
      authBroadcastChannel = null;
    }
  }
  return authBroadcastChannel;
}

function broadcastAuthMessage(message: AuthBroadcastMessage): void {
  try {
    getBroadcastChannel()?.postMessage(message);
  } catch {
    // Ignore BroadcastChannel errors in unsupported environments.
  }
}

export function handleAuthBroadcastMessage(message: AuthBroadcastMessage): void {
  if (!message || typeof message !== "object" || !("type" in message)) {
    return;
  }

  if (message.type === "AUTH_LOGOUT") {
    useAuthStore.getState().logout();
    queryClient.clear();
    return;
  }

  if (message.type === "AUTH_TOKEN_ROTATED" && message.accessToken) {
    useAuthStore.getState().setAccessToken(message.accessToken);
    return;
  }

  if (
    message.type === "AUTH_SESSION_UPDATED" &&
    message.accessToken &&
    message.user
  ) {
    useAuthStore
      .getState()
      .setAuthenticated(message.accessToken, message.user);
  }
}

export function handleStorageSyncEvent(
  event: Pick<StorageEvent, "key" | "newValue">,
): void {
  if (event.key !== null && event.key !== REFRESH_TOKEN_STORAGE_KEY) {
    return;
  }

  const nextToken = event.newValue?.trim() ?? "";
  if (!nextToken) {
    useAuthStore.getState().logout();
    queryClient.clear();
  }
}

export function initAuthTabSync(): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    handleStorageSyncEvent(event);
  };

  const channel = getBroadcastChannel();
  const onMessage = (event: MessageEvent<AuthBroadcastMessage>) => {
    handleAuthBroadcastMessage(event.data);
  };

  if (!isTabSyncInitialized) {
    window.addEventListener("storage", onStorage);
    channel?.addEventListener("message", onMessage);
    isTabSyncInitialized = true;
  }

  return () => {
    window.removeEventListener("storage", onStorage);
    channel?.removeEventListener("message", onMessage);
    isTabSyncInitialized = false;
  };
}

function acquireCrossTabRefreshLock(refreshToken: string): boolean {
  const existingLock = localStorageRepository.get<RefreshLockRecord>(
    REFRESH_LOCK_STORAGE_KEY,
  );
  const now = Date.now();

  if (
    existingLock &&
    existingLock.tabId !== TAB_ID &&
    existingLock.token === refreshToken &&
    now - existingLock.startedAt < REFRESH_LOCK_TTL_MS
  ) {
    return false;
  }

  localStorageRepository.set<RefreshLockRecord>(REFRESH_LOCK_STORAGE_KEY, {
    tabId: TAB_ID,
    token: refreshToken,
    startedAt: now,
  });
  return true;
}

function releaseCrossTabRefreshLock(): void {
  const existingLock = localStorageRepository.get<RefreshLockRecord>(
    REFRESH_LOCK_STORAGE_KEY,
  );
  if (!existingLock || existingLock.tabId === TAB_ID) {
    localStorageRepository.remove(REFRESH_LOCK_STORAGE_KEY);
  }
}

async function waitForOtherTabRefresh(initialToken: string): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < 600) {
    await new Promise((resolve) => window.setTimeout(resolve, 40));
    const currentStoredToken = getRefreshToken();
    const lock = localStorageRepository.get<RefreshLockRecord>(
      REFRESH_LOCK_STORAGE_KEY,
    );
    if (!currentStoredToken || currentStoredToken !== initialToken || !lock) {
      return;
    }
  }
}

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
    const initialRefreshToken = getRefreshToken();
    if (!initialRefreshToken) {
      return null;
    }

    const tokenBeforeLock = useAuthStore.getState().accessToken;
    const acquiredLock = acquireCrossTabRefreshLock(initialRefreshToken);

    if (!acquiredLock) {
      await waitForOtherTabRefresh(initialRefreshToken);
      const latestAccessToken = useAuthStore.getState().accessToken;
      if (latestAccessToken && latestAccessToken !== tokenBeforeLock) {
        return latestAccessToken;
      }
      const latestRefreshToken = getRefreshToken();
      if (!latestRefreshToken) {
        return null;
      }
    }

    const refreshTokenToSend = getRefreshToken();
    if (!refreshTokenToSend) {
      releaseCrossTabRefreshLock();
      return null;
    }

    try {
      const { data } = await apiClient.post<TokenRotationResult>(
        "/auth/refresh",
        {
          refresh_token: refreshTokenToSend,
        },
      );
      saveRefreshToken(data.refresh_token);
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
  saveRefreshToken(data.refresh_token);
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
      useAuthStore
        .getState()
        .setForbidden(describeSessionRestoreError(error));
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
        useAuthStore
          .getState()
          .setUnavailable(describeSessionRestoreError(error));
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
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    useAuthStore.getState().logout();
    return null;
  }

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
    } else if (isForbiddenSessionError(error)) {
      useAuthStore
        .getState()
        .setForbidden(describeSessionRestoreError(error));
    } else if (isRecoverableSessionError(error)) {
      useAuthStore
        .getState()
        .setUnavailable(describeSessionRestoreError(error));
    } else {
      useAuthStore.getState().logout();
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      await apiClient.post("/auth/logout", { refresh_token: refreshToken });
    }
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
