import { queryClient } from "@/lib/query-client";
import {
  localStorageRepository,
  REFRESH_LOCK_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
} from "@/lib/storage";
import { useAuthStore, type AuthUser } from "@/features/auth/store";
import { getRefreshToken } from "./tokenStorage";

interface RefreshLockRecord {
  tabId: string;
  token: string;
  startedAt: number;
}

export type AuthBroadcastMessage =
  | { type: "AUTH_LOGOUT" }
  | { type: "AUTH_TOKEN_ROTATED"; accessToken: string }
  | { type: "AUTH_SESSION_UPDATED"; accessToken: string; user: AuthUser };

const AUTH_BROADCAST_CHANNEL_NAME = "wms.frontend.auth.channel";
const TAB_ID = `tab-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
const REFRESH_LOCK_TTL_MS = 4000;

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

export function broadcastAuthMessage(message: AuthBroadcastMessage): void {
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
    useAuthStore.getState().setAuthenticated(message.accessToken, message.user);
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

export function acquireCrossTabRefreshLock(refreshToken: string): boolean {
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

export function releaseCrossTabRefreshLock(): void {
  const existingLock = localStorageRepository.get<RefreshLockRecord>(
    REFRESH_LOCK_STORAGE_KEY,
  );
  if (!existingLock || existingLock.tabId === TAB_ID) {
    localStorageRepository.remove(REFRESH_LOCK_STORAGE_KEY);
  }
}

export async function waitForOtherTabRefresh(initialToken: string): Promise<void> {
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
