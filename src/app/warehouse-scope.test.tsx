import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore, type AuthUser } from "@/features/auth/store";
import { StorageLocationsPage } from "@/features/master-data/storage-locations/pages/StorageLocationsPage";
import { PurchaseOrdersPage } from "@/features/purchase-orders/pages/PurchaseOrdersPage";
import { StockPage } from "@/features/stock/pages/StockPage";
import { apiClient } from "@/lib/api-client";
import { DashboardPage } from "@/pages/DashboardPage";
import { useWarehouseScopeStore } from "@/stores/warehouseScopeStore";

const warehousesFixture = [
  { id: 1, code: "WH-1", name: "Gudang Utama", is_active: true },
  { id: 2, code: "WH-2", name: "Gudang Cabang", is_active: true },
  { id: 3, code: "WH-3", name: "Gudang Timur", is_active: true },
];

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 1,
    username: "superadmin",
    email: "superadmin@wms.local",
    full_name: "Super Administrator",
    role_id: 1,
    role_name: "Super Admin",
    is_active: true,
    has_all_warehouse_access: true,
    warehouse_ids: [1, 2, 3],
    warehouses: warehousesFixture,
    permissions: [
      "po:read",
      "po:create",
      "stock:read",
      "ledger:read",
      "master:read",
      "warehouse:read",
      "location:read",
    ],
    ...overrides,
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function mockCommonApiGet() {
  vi.spyOn(apiClient, "get").mockImplementation((async (url: string) => {
    if (url === "/menus/my-menu") {
      return {
        data: [
          {
            id: 1,
            code: "dashboard",
            name: "Dasbor",
            path: "/dashboard",
            icon: "layout-dashboard",
            menu_type: "item",
            parent_id: null,
            sort_order: 1,
            permission_code: null,
            children: [],
          },
        ],
      };
    }
    if (url === "/dashboard/summary") {
      return {
        data: {
          stock_summary: {
            total_active_items: 2,
            total_qty_on_hand: "10.0000",
            total_qty_in_transit: "0.0000",
            low_stock_items_count: 0,
          },
          pending_actions: {
            pending_po_receipt_count: 1,
            draft_gr_count: 0,
            pending_transfer_ship_count: 0,
            pending_transfer_receive_count: 0,
            active_opname_count: 0,
          },
          recent_activities: [],
          assigned_warehouses: warehousesFixture.map(({ id, code, name }) => ({ id, code, name })),
        },
      };
    }
    if (url === "/purchase-orders") {
      return { data: { items: [], total: 0, limit: 20, offset: 0 } };
    }
    if (url === "/suppliers") {
      return { data: { items: [] } };
    }
    if (url === "/warehouses") {
      return { data: { items: warehousesFixture } };
    }
    if (url === "/items") {
      return { data: { items: [] } };
    }
    if (url === "/stock/by-location") {
      return { data: { items: [], total: 0, limit: 25, offset: 0 } };
    }
    if (url === "/locations") {
      return {
        data: {
          items: [
            {
              id: 101,
              code: "A-01",
              name: "Rak Utama A",
              warehouse_id: 1,
              warehouse_code: "WH-1",
              warehouse_name: "Gudang Utama",
              description: null,
              is_active: true,
              created_at: "2026-11-01T00:00:00Z",
              updated_at: "2026-11-01T00:00:00Z",
            },
            {
              id: 202,
              code: "B-01",
              name: "Rak Cabang B",
              warehouse_id: 2,
              warehouse_code: "WH-2",
              warehouse_name: "Gudang Cabang",
              description: null,
              is_active: true,
              created_at: "2026-11-01T00:00:00Z",
              updated_at: "2026-11-01T00:00:00Z",
            },
          ],
          total: 2,
          limit: 200,
          offset: 0,
        },
      };
    }
    return { data: { items: [] } };
  }) as unknown as typeof apiClient.get);
}

describe("Tahap 25: Filter Gudang Top Bar & Cakupan Role", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useWarehouseScopeStore.getState().reset();
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "test-token",
      restoreError: null,
      user: makeUser(),
    });
  });

  it("Super Admin dapat memilih 'Semua gudang' atau gudang spesifik di top bar dan memperbarui query Dashboard", async () => {
    mockCommonApiGet();
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route element={<DashboardPage />} path="/dashboard" />
              <Route element={<PurchaseOrdersPage />} path="/purchase-orders" />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const select = (await screen.findByLabelText("Pilih gudang aktif")) as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(screen.getByRole("option", { name: "Semua gudang" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "WH-1 - Gudang Utama" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "WH-2 - Gudang Cabang" })).toBeInTheDocument();

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/dashboard/summary");
    });

    fireEvent.change(select, { target: { value: "2" } });

    await waitFor(() => {
      expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBe(2);
      expect(apiClient.get).toHaveBeenCalledWith("/dashboard/summary", {
        params: { warehouse_id: 2 },
      });
    });
    expect(screen.getByText(/Filter aktif: WH-2 - Gudang Cabang/i)).toBeInTheDocument();
  });

  it("Non-Super Admin dengan 1 gudang mengunci ke gudang miliknya dan membatasi filter modul Stok", async () => {
    useWarehouseScopeStore.getState().setSelectedWarehouseId(3);
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "staff-token",
      restoreError: null,
      user: makeUser({
        id: 7,
        username: "staff_wh1",
        email: "staff1@wms.local",
        full_name: "Staff Gudang 1",
        role_id: 3,
        role_name: "Warehouse Staff",
        has_all_warehouse_access: false,
        warehouse_ids: [1],
        warehouses: [warehousesFixture[0]],
      }),
    });
    mockCommonApiGet();
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/stock/balances"]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route element={<StockPage />} path="/stock/balances" />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.queryByLabelText("Pilih gudang aktif")).not.toBeInTheDocument();
    expect(await screen.findByText("WH-1 - Gudang Utama")).toBeInTheDocument();

    await waitFor(() => {
      expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBe(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/stock/by-location",
        expect.objectContaining({
          params: expect.objectContaining({ warehouse_id: "1" }),
        }),
      );
    });

    expect(screen.queryByLabelText("Gudang ID")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Gudang")).not.toBeInTheDocument();
  });

  it("Multi-gudang Non-Super Admin dapat memilih 'Semua gudang saya' atau gudang miliknya, dan StorageLocations memfilter sesuai hak akses", async () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "mgr-token",
      restoreError: null,
      user: makeUser({
        id: 9,
        username: "manager_multi",
        email: "mgr@wms.local",
        full_name: "Manager Multi WH",
        role_id: 2,
        role_name: "Warehouse Manager",
        has_all_warehouse_access: false,
        warehouse_ids: [1, 2],
        warehouses: [warehousesFixture[0], warehousesFixture[1]],
      }),
    });
    mockCommonApiGet();
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/locations"]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route element={<StorageLocationsPage />} path="/locations" />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const select = (await screen.findByLabelText("Pilih gudang aktif")) as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(screen.getByRole("option", { name: "Semua gudang saya" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Semua gudang" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "WH-1 - Gudang Utama" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "WH-2 - Gudang Cabang" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "WH-3 - Gudang Timur" })).not.toBeInTheDocument();

    // Mode "Semua gudang saya": tampilkan lokasi dari WH-1 dan WH-2
    await waitFor(() => {
      expect(screen.getByText("Rak Utama A")).toBeInTheDocument();
      expect(screen.getByText("Rak Cabang B")).toBeInTheDocument();
    });

    fireEvent.change(select, { target: { value: "2" } });

    await waitFor(() => {
      expect(screen.getByText("Rak Cabang B")).toBeInTheDocument();
      expect(screen.queryByText("Rak Utama A")).not.toBeInTheDocument();
    });

    const pageWhSelect = screen.getByLabelText("Filter berdasarkan gudang") as HTMLSelectElement;
    expect(pageWhSelect).toBeDisabled();
    expect(pageWhSelect.value).toBe("2");
    expect(screen.getByText("Mengikuti filter gudang Top Bar")).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "1" } });

    await waitFor(() => {
      expect(screen.getByText("Rak Utama A")).toBeInTheDocument();
      expect(screen.queryByText("Rak Cabang B")).not.toBeInTheDocument();
    });
  });

  it("Mereset warehouse scope store saat user logout", () => {
    useWarehouseScopeStore.getState().setSelectedWarehouseId(2);
    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBe(2);

    useAuthStore.getState().logout();

    expect(useWarehouseScopeStore.getState().selectedWarehouseId).toBeNull();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });
});
