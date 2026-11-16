import { beforeEach, describe, expect, it } from "vitest";

import { useWarehouseScopeStore } from "@/stores";

describe("useWarehouseScopeStore", () => {
  beforeEach(() => {
    useWarehouseScopeStore.getState().reset();
  });

  it("mengizinkan Super Admin memilih Semua Gudang (null) atau gudang yang valid", () => {
    const store = useWarehouseScopeStore.getState();
    expect(store.selectedWarehouseId).toBeNull();

    store.setSelectedWarehouseId(2);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBe(2);

    store.syncWithAllowedWarehouses([1, 2, 3], true);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBe(2);

    store.syncWithAllowedWarehouses([1, 3], true);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBeNull();
  });

  it("mengunci user non-Super Admin 1 gudang dan mengizinkan 'Semua gudang saya' untuk multi-gudang", () => {
    const store = useWarehouseScopeStore.getState();

    // User dengan 1 gudang: otomatis terkunci ke gudang tunggalnya
    store.syncWithAllowedWarehouses([5], false);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBe(5);

    // User dengan >1 gudang: default boleh null ("Semua gudang saya") maupun memilih salah satu gudang
    useWarehouseScopeStore.getState().reset();
    store.syncWithAllowedWarehouses([5, 8], false);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBeNull();

    store.setSelectedWarehouseId(8);
    store.syncWithAllowedWarehouses([5, 8], false);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBe(8);

    // Kembali ke "Semua gudang saya" (null) harus tetap null
    store.setSelectedWarehouseId(null);
    store.syncWithAllowedWarehouses([5, 8], false);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBeNull();

    // Jika pilihan tidak masuk gudang yang diizinkan, reset ke null ("Semua gudang saya")
    store.setSelectedWarehouseId(99);
    store.syncWithAllowedWarehouses([5, 8], false);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBeNull();

    store.syncWithAllowedWarehouses([], false);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBeNull();
  });
});
