import { create } from "zustand";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  role_name: string;
  is_active: boolean;
  permissions: string[];
  warehouse_ids: number[];
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type SessionStatus =
  | "checking"
  | "authenticated"
  | "unauthenticated"
  | "unavailable"
  | "forbidden";

export interface SessionRestoreErrorInfo {
  message: string;
  code?: string;
  requestId?: string;
  isOffline?: boolean;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  status: SessionStatus;
  restoreError: SessionRestoreErrorInfo | null;
  setAccessToken: (accessToken: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setAuthenticated: (accessToken: string, user: AuthUser) => void;
  setChecking: () => void;
  setUnavailable: (restoreError: SessionRestoreErrorInfo) => void;
  setForbidden: (restoreError: SessionRestoreErrorInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: "checking",
  restoreError: null,
  setAccessToken: (accessToken) =>
    set((state) => {
      const nextStatus: SessionStatus =
        accessToken && state.user
          ? "authenticated"
          : accessToken
            ? state.status
            : "unauthenticated";
      if (state.accessToken === accessToken && state.status === nextStatus) {
        return state;
      }
      return {
        accessToken,
        status: nextStatus,
      };
    }),
  setUser: (user) =>
    set((state) => {
      const nextStatus: SessionStatus =
        user && state.accessToken ? "authenticated" : state.status;
      const nextError = user && state.accessToken ? null : state.restoreError;
      if (
        state.user === user &&
        state.status === nextStatus &&
        state.restoreError === nextError
      ) {
        return state;
      }
      return {
        user,
        status: nextStatus,
        restoreError: nextError,
      };
    }),
  setAuthenticated: (accessToken, user) =>
    set((state) => {
      if (
        state.accessToken === accessToken &&
        state.user === user &&
        state.status === "authenticated" &&
        state.restoreError === null
      ) {
        return state;
      }
      return {
        accessToken,
        user,
        status: "authenticated",
        restoreError: null,
      };
    }),
  setChecking: () =>
    set((state) => {
      const nextStatus: SessionStatus =
        state.accessToken && state.user ? "authenticated" : "checking";
      if (state.status === nextStatus && state.restoreError === null) {
        return state;
      }
      return {
        status: nextStatus,
        restoreError: null,
      };
    }),
  setUnavailable: (restoreError) =>
    set({
      accessToken: null,
      user: null,
      status: "unavailable",
      restoreError,
    }),
  setForbidden: (restoreError) =>
    set({
      accessToken: null,
      user: null,
      status: "forbidden",
      restoreError,
    }),
  logout: () =>
    set((state) => {
      if (
        state.accessToken === null &&
        state.user === null &&
        state.status === "unauthenticated" &&
        state.restoreError === null
      ) {
        return state;
      }
      return {
        accessToken: null,
        user: null,
        status: "unauthenticated",
        restoreError: null,
      };
    }),
}));
