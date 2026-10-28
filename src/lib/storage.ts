export interface StorageRepository {
  getString(key: string): string | null;
  setString(key: string, value: string): void;
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(scopePrefix?: string): void;
}

export const REFRESH_TOKEN_STORAGE_KEY = "wms.frontend.auth.refresh-token";
export const REFRESH_LOCK_STORAGE_KEY = "wms.frontend.auth.refresh-lock";

export class LocalStorageRepository implements StorageRepository {
  getString(key: string): string | null {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return null;
      }
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setString(key: string, value: string): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return;
      }
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore quota or security errors in restricted browser contexts.
    }
  }

  get<T>(key: string): T | null {
    const raw = this.getString(key);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      this.setString(key, JSON.stringify(value));
    } catch {
      // Ignore serialization errors.
    }
  }

  remove(key: string): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return;
      }
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage access errors.
    }
  }

  clear(scopePrefix = "wms.frontend."): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return;
      }
      const keysToRemove: string[] = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key && key.startsWith(scopePrefix)) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage access errors.
    }
  }
}

export const localStorageRepository = new LocalStorageRepository();

