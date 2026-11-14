import { create } from "zustand";

interface WarehouseScopeState {
  /**
   * ID gudang aktif yang dipilih pada top bar; `null` berarti "Semua Gudang" (khusus Super Admin).
   */
  selectedWarehouseId: number | null;
  setSelectedWarehouseId: (warehouseId: number | null) => void;
  /**
   * Menjaga agar pilihan gudang selalu sinkron terhadap daftar gudang yang diizinkan untuk akun aktif.
   */
  syncWithAllowedWarehouses: (
    allowedWarehouseIds: readonly number[],
    isSuperAdmin: boolean,
  ) => void;
  reset: () => void;
}

/**
 * Store Zustand untuk cakupan filter gudang global antar-halaman.
 */
export const useWarehouseScopeStore = create<WarehouseScopeState>((set) => ({
  selectedWarehouseId: null,
  setSelectedWarehouseId: (warehouseId) =>
    set((state) =>
      state.selectedWarehouseId === warehouseId
        ? state
        : { selectedWarehouseId: warehouseId },
    ),
  syncWithAllowedWarehouses: (allowedWarehouseIds, isSuperAdmin) =>
    set((state) => {
      if (isSuperAdmin) {
        if (
          state.selectedWarehouseId !== null &&
          allowedWarehouseIds.length > 0 &&
          !allowedWarehouseIds.includes(state.selectedWarehouseId)
        ) {
          return { selectedWarehouseId: null };
        }
        return state;
      }

      if (allowedWarehouseIds.length === 0) {
        return state.selectedWarehouseId === null
          ? state
          : { selectedWarehouseId: null };
      }

      if (
        state.selectedWarehouseId !== null &&
        allowedWarehouseIds.includes(state.selectedWarehouseId)
      ) {
        return state;
      }

      return { selectedWarehouseId: allowedWarehouseIds[0] };
    }),
  reset: () => set({ selectedWarehouseId: null }),
}));
