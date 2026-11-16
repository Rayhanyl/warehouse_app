import { useMemo } from "react";

import { useAuthStore, type AuthUser, type AuthWarehouseRef } from "@/features/auth/store";
import { useWarehouseScopeStore } from "@/stores/warehouseScopeStore";

/**
 * Mengembalikan daftar gudang aktif yang dapat diakses oleh pengguna aktif,
 * menggunakan detail `user.warehouses` dari `/auth/me` atau fallback dari `warehouse_ids`.
 */
export function resolveUserWarehouseOptions(
  user: AuthUser | null,
): AuthWarehouseRef[] {
  if (!user) return [];
  if (user.warehouses && user.warehouses.length > 0) {
    return user.warehouses.filter((warehouse) => warehouse.is_active !== false);
  }
  return (user.warehouse_ids ?? []).map((warehouseId) => ({
    id: warehouseId,
    code: "",
    name: `Gudang #${warehouseId}`,
    is_active: true,
  }));
}

/**
 * Memformat label ringkas gudang untuk Top Bar, filter halaman, dan profil.
 */
export function formatWarehouseScopeLabel(
  warehouse: Pick<AuthWarehouseRef, "code" | "name">,
): string {
  return warehouse.code ? `${warehouse.code} - ${warehouse.name}` : warehouse.name;
}

/**
 * Hook global cakupan gudang aktif yang menyatukan kebijakan akses role dengan filter Top Bar.
 */
export function useWarehouseScope() {
  const user = useAuthStore((state) => state.user);
  const selectedWarehouseId = useWarehouseScopeStore(
    (state) => state.selectedWarehouseId,
  );
  const setSelectedWarehouseId = useWarehouseScopeStore(
    (state) => state.setSelectedWarehouseId,
  );
  const syncWithAllowedWarehouses = useWarehouseScopeStore(
    (state) => state.syncWithAllowedWarehouses,
  );

  const isAuthenticatedUser = user !== null;
  const canAccessAllWarehouses =
    !isAuthenticatedUser ||
    Boolean(
      user.has_all_warehouse_access ||
        user.role_name === "Super Admin" ||
        user.role_name === "Auditor",
    );

  const warehouseOptions = useMemo(
    () => resolveUserWarehouseOptions(user),
    [user],
  );

  const allowedWarehouseIds = useMemo(
    () => warehouseOptions.map((warehouse) => warehouse.id),
    [warehouseOptions],
  );

  const activeWarehouseId = useMemo<number | null>(() => {
    if (!isAuthenticatedUser) return selectedWarehouseId;
    if (canAccessAllWarehouses) return selectedWarehouseId;
    if (allowedWarehouseIds.length === 0) return null;
    if (allowedWarehouseIds.length === 1) return allowedWarehouseIds[0];
    if (selectedWarehouseId === null) return null;
    if (allowedWarehouseIds.includes(selectedWarehouseId)) {
      return selectedWarehouseId;
    }
    return null;
  }, [
    allowedWarehouseIds,
    canAccessAllWarehouses,
    isAuthenticatedUser,
    selectedWarehouseId,
  ]);

  const activeWarehouse = useMemo(
    () =>
      activeWarehouseId !== null
        ? (warehouseOptions.find((item) => item.id === activeWarehouseId) ?? {
            id: activeWarehouseId,
            code: "",
            name: `Gudang #${activeWarehouseId}`,
            is_active: true,
          })
        : null,
    [activeWarehouseId, warehouseOptions],
  );

  const activeWarehouseLabel = activeWarehouse
    ? formatWarehouseScopeLabel(activeWarehouse)
    : canAccessAllWarehouses
      ? "Semua gudang"
      : allowedWarehouseIds.length > 1
        ? "Semua gudang saya"
        : "Belum ada gudang ditugaskan";

  const showTopbarSelector =
    canAccessAllWarehouses || warehouseOptions.length > 1;

  const isWarehouseAllowed = (warehouseId: number | string): boolean => {
    if (!isAuthenticatedUser || canAccessAllWarehouses) return true;
    const numericId = Number(warehouseId);
    return Number.isFinite(numericId) && allowedWarehouseIds.includes(numericId);
  };

  const resolveEffectiveWarehouseFilter = (
    localWarehouseId: number | null,
  ): number | null => {
    if (selectedWarehouseId !== null) {
      return isAuthenticatedUser && !canAccessAllWarehouses
        ? isWarehouseAllowed(selectedWarehouseId)
          ? selectedWarehouseId
          : activeWarehouseId
        : selectedWarehouseId;
    }
    if (!isAuthenticatedUser || canAccessAllWarehouses) {
      return localWarehouseId;
    }
    if (localWarehouseId !== null && isWarehouseAllowed(localWarehouseId)) {
      return localWarehouseId;
    }
    return activeWarehouseId;
  };

  const filterWarehouseChoices = <T extends { id: number | string }>(
    choices: readonly T[],
  ): T[] => {
    if (!isAuthenticatedUser || canAccessAllWarehouses) {
      return [...choices];
    }
    const allowedSet = new Set(allowedWarehouseIds.map(String));
    return choices.filter((choice) => allowedSet.has(String(choice.id)));
  };

  return {
    user,
    isAuthenticatedUser,
    canAccessAllWarehouses,
    warehouseOptions,
    allowedWarehouseIds,
    selectedWarehouseId,
    activeWarehouseId,
    activeWarehouse,
    activeWarehouseLabel,
    showTopbarSelector,
    setSelectedWarehouseId,
    syncWithAllowedWarehouses,
    isWarehouseAllowed,
    resolveEffectiveWarehouseFilter,
    filterWarehouseChoices,
  };
}
