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

  it("membatasi user non-Super Admin agar selalu terkunci pada gudang yang diizinkan", () => {
    const store = useWarehouseScopeStore.getState();

    store.syncWithAllowedWarehouses([5, 8], false);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBe(5);

    store.setSelectedWarehouseId(8);
    store.syncWithAllowedWarehouses([5, 8], false);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBe(8);

    store.setSelectedWarehouseId(99);
    store.syncWithAllowedWarehouses([5, 8], false);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBe(5);

    store.syncWithAllowedWarehouses([], false);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBeNull();
  });
});
