/**
 * Konsolidasi Global Client State Frontend WMS (tanpa Redux):
 * - Server State: dikelola penuh oleh TanStack React Query (`@/lib/query-client`).
 * - Global Client State: dikelola melalui store Zustand di modul ini (`useAuthStore`, `useUserGuideStore`, `useWarehouseScopeStore`).
 * - Local UI State: dikelola dengan React `useState` / Context ringan di tingkat fitur.
 */
export {
  useAuthStore,
  type AuthUser,
  type SessionRestoreErrorInfo,
  type SessionStatus,
} from "@/features/auth/store";
export { useUserGuideStore } from "@/features/user-guide/store";
export { useWarehouseScopeStore } from "@/stores/warehouseScopeStore";
