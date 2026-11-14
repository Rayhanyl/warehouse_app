import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { BarcodeScannerModal } from "@/components/ui/BarcodeScannerModal";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import { StockLookupModal } from "@/components/ui/StockLookupModal";
import { AuditLogsPage } from "@/features/audit-logs/pages/AuditLogsPage";
import type { AuditLog } from "@/features/audit-logs/types";
import { useAuthStore } from "@/features/auth/store";
import {
  initialSampleStockItems,
  sampleCategoryOptions,
  sampleUomOptions,
} from "@/features/master-data/stocks/api";
import { StocksPage } from "@/features/master-data/stocks/pages/StocksPage";
import { menuQueryKey } from "@/features/navigation/api";
import type { MenuItem } from "@/features/navigation/types";
import {
  PurchaseOrderCreatePage,
  PurchaseOrdersPage,
} from "@/features/purchase-orders/pages/PurchaseOrdersPage";
import type { PurchaseOrder } from "@/features/purchase-orders/types";
import { StockPage } from "@/features/stock/pages/StockPage";
import type { StockBalance } from "@/features/stock/types";
import { apiClient } from "@/lib/api-client";

interface MatchMediaController {
  setMobile: (mobile: boolean) => void;
}

function createMatchMediaController(initialMobile: boolean): MatchMediaController {
  let isMobile = initialMobile;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string): MediaQueryList => ({
      matches: query.includes("767px") ? isMobile : false,
      media: query,
      onchange: null,
      addEventListener: (_event: string, listener: EventListenerOrEventListenerObject) => {
        if (typeof listener === "function") {
          listeners.add(listener as (event: MediaQueryListEvent) => void);
        }
      },
      removeEventListener: (_event: string, listener: EventListenerOrEventListenerObject) => {
        if (typeof listener === "function") {
          listeners.delete(listener as (event: MediaQueryListEvent) => void);
        }
      },
      addListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
      dispatchEvent: () => true,
    })),
  });

  return {
    setMobile(mobile: boolean) {
      isMobile = mobile;
      const event = {
        matches: mobile,
        media: "(max-width: 767px)",
      } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
  };
}

const sampleMenus: MenuItem[] = [
  {
    id: 1,
    code: "dashboard",
    name: "Dasbor",
    short_name: "Dasbor",
    path: "/dashboard",
    icon: "layout-dashboard",
    menu_type: "item",
    parent_id: null,
    sort_order: 1,
    permission_code: null,
    children: [],
  },
];

const samplePo: PurchaseOrder = {
  id: 77,
  po_number: "PO-202611-0077",
  supplier_id: 2,
  supplier_code: "SUP-B2B",
  supplier_name: "PT Sumber Komponen",
  warehouse_id: 1,
  warehouse_code: "WH-JKT",
  warehouse_name: "Gudang Pusat Jakarta",
  status: "ISSUED",
  order_date: "2026-11-14",
  notes: "Prioritas pagi",
  line_count: 1,
  issued_at: "2026-11-14T08:00:00Z",
  issued_by: 1,
  closed_reason: null,
  closed_at: null,
  closed_by: null,
  created_by: 1,
  created_at: "2026-11-14T07:50:00Z",
  updated_at: "2026-11-14T08:00:00Z",
};

const sampleBalance: StockBalance = {
  warehouse_id: 1,
  warehouse_code: "WH-JKT",
  warehouse_name: "Gudang Pusat Jakarta",
  location_id: 3,
  location_code: "RAK-A01",
  location_name: "Rak Utama A01",
  item_id: 10,
  item_sku: "ELK-ESP32-01",
  item_barcode: "2000000000107",
  item_name: "Microcontroller ESP32-S3",
  category_id: 1,
  category_name: "Elektronik",
  uom_id: 1,
  uom_code: "PCS",
  qty_on_hand: "42.0000",
  qty_in_transit: "5.0000",
  updated_at: "2026-11-14T08:30:00Z",
};

const sampleAuditLog: AuditLog = {
  id: 301,
  user_id: 1,
  username: "budi.supervisor",
  action: "PO_ISSUED",
  entity_type: "purchase_orders",
  entity_id: "77",
  old_values: { status: "DRAFT" },
  new_values: { status: "ISSUED" },
  status: "SUCCESS",
  details: null,
  ip_address: "10.0.0.12",
  user_agent: "MobileSafari",
  request_id: "req-resp-301",
  created_at: "2026-11-14T09:00:00Z",
};

describe("Tahap 22: Responsive Mobile (375px) & Tablet (768px) Layouting", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    useAuthStore.getState().setAuthenticated("token-uji", {
      id: 1,
      username: "budi.supervisor",
      email: "budi@wms.local",
      full_name: "Budi Santoso",
      role_id: 2,
      role_name: "Warehouse Supervisor",
      is_active: true,
      permissions: [
        "items:read",
        "master:manage",
        "po:read",
        "po:create",
        "po:update",
        "po:issue",
        "stock:read",
        "audit:read",
        "warehouses:read",
      ],
      warehouse_ids: [1, 2],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().logout();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });
  });

  it("menampilkan kontrol pilih gudang aktif dan PageHeader responsif pada viewport mobile (375px) dan tablet (768px)", () => {
    const media = createMatchMediaController(true);
    const queryClient = new QueryClient();
    queryClient.setQueryData(menuQueryKey, sampleMenus);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/items"]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route
                path="/items"
                element={
                  <PageHeader
                    action={
                      <button type="button" className="min-h-11 px-4">
                        Tambah Barang
                      </button>
                    }
                    description="Daftar katalog barang"
                    title="Barang (SKU)"
                  />
                }
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const selects = screen.getAllByLabelText("Pilih gudang aktif") as HTMLSelectElement[];
    expect(selects).toHaveLength(1);
    fireEvent.change(selects[0], { target: { value: "2" } });
    expect(selects[0].value).toBe("2");

    expect(screen.getByRole("button", { name: "Tambah Barang" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Panduan/i }).length).toBeGreaterThanOrEqual(2);

    act(() => {
      media.setMobile(false);
    });
    expect(screen.getAllByLabelText("Pilih gudang aktif")).toHaveLength(1);
  });

  it("mengelola status buka/tutup CollapsibleFilterPanel beserta badge jumlah filter aktif", () => {
    createMatchMediaController(true);

    render(
      <CollapsibleFilterPanel
        activeCount={2}
        ariaLabel="Filter uji"
        title="Filter daftar dokumen"
      >
        <input aria-label="Kata kunci uji" type="text" />
      </CollapsibleFilterPanel>,
    );

    expect(screen.getByText("Filter daftar dokumen")).toBeInTheDocument();
    expect(screen.getByText("2 aktif")).toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "Tampilkan" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Sembunyikan" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("beralih antara tampilan kartu mobile (375px) dan tabel tablet (768px) pada PurchaseOrdersPage serta tombol hapus baris PO", async () => {
    const media = createMatchMediaController(true);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/purchase-orders") {
        return {
          data: { items: [samplePo], total: 1, limit: 20, offset: 0 },
        };
      }
      if (url === "/suppliers") {
        return {
          data: {
            items: [{ id: 2, code: "SUP-B2B", name: "PT Sumber Komponen", is_active: true }],
            total: 1,
            limit: 200,
            offset: 0,
          },
        };
      }
      if (url === "/warehouses") {
        return {
          data: {
            items: [{ id: 1, code: "WH-JKT", name: "Gudang Pusat Jakarta", is_active: true }],
            total: 1,
            limit: 200,
            offset: 0,
          },
        };
      }
      if (url === "/items") {
        return {
          data: {
            items: [
              {
                id: 10,
                sku: "ELK-ESP32-01",
                name: "Microcontroller ESP32-S3",
                uom_id: 1,
                uom_code: "PCS",
                allow_decimal: false,
                is_active: true,
              },
            ],
            total: 1,
            limit: 200,
            offset: 0,
          },
        };
      }
      if (url === "/uoms") {
        return {
          data: {
            items: [{ id: 1, code: "PCS", name: "Pieces", allow_decimal: false, is_active: true }],
            total: 1,
            limit: 200,
            offset: 0,
          },
        };
      }
      return { data: { items: [], total: 0, limit: 20, offset: 0 } };
    });

    const listView = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/purchase-orders"]}>
          <PurchaseOrdersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("PO-202611-0077")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Buat purchase order" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Daftar purchase order" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    act(() => {
      media.setMobile(false);
    });

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Daftar purchase order" })).not.toBeInTheDocument();
    listView.unmount();

    act(() => {
      media.setMobile(true);
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/purchase-orders/new"]}>
          <PurchaseOrderCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Tambah barang" })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "Tambah barang" }));
    expect(
      screen.getByRole("button", { name: "Hapus barang pesanan 1" }),
    ).toHaveTextContent("Hapus baris");
  });

  it("beralih antara kartu mobile (375px) dan tabel tablet (768px) pada StockPage", async () => {
    const media = createMatchMediaController(true);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/stock/by-location") {
        return {
          data: { items: [sampleBalance], total: 1, limit: 20, offset: 0 },
        };
      }
      return { data: { items: [], total: 0, limit: 200, offset: 0 } };
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/stock/by-location"]}>
          <StockPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Microcontroller ESP32-S3")).toBeInTheDocument();
    });

    expect(screen.getByRole("list", { name: "Daftar saldo stok" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    act(() => {
      media.setMobile(false);
    });

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Daftar saldo stok" })).not.toBeInTheDocument();
  });

  it("beralih antara kartu mobile (375px) dan tabel tablet (768px) pada Master Barang (StocksPage) dan AuditLogsPage", async () => {
    const media = createMatchMediaController(true);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/categories") {
        return { data: { items: sampleCategoryOptions, total: 3, limit: 200, offset: 0 } };
      }
      if (url === "/uoms") {
        return { data: { items: sampleUomOptions, total: 3, limit: 200, offset: 0 } };
      }
      if (url === "/items") {
        return {
          data: {
            items: initialSampleStockItems,
            total: initialSampleStockItems.length,
            limit: 200,
            offset: 0,
          },
        };
      }
      if (url === "/audit-logs") {
        return {
          data: { items: [sampleAuditLog], total: 1, limit: 20, offset: 0 },
        };
      }
      return { data: { items: [], total: 0, limit: 20, offset: 0 } };
    });

    const stocksView = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <StocksPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Microcontroller ESP32-S3")).toBeInTheDocument();
    });
    expect(screen.getByRole("list", { name: "Daftar barang (SKU)" })).toBeInTheDocument();

    act(() => {
      media.setMobile(false);
    });
    expect(screen.getByRole("table")).toBeInTheDocument();
    stocksView.unmount();

    act(() => {
      media.setMobile(true);
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuditLogsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("PO_ISSUED")).toBeInTheDocument();
    });
    expect(screen.getByRole("list", { name: "Daftar audit log" })).toBeInTheDocument();

    act(() => {
      media.setMobile(false);
    });
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("merender modal scanner barcode dan pencarian cepat stok secara ergonomis di mobile", () => {
    createMatchMediaController(true);

    const onCloseScanner = vi.fn();
    const { unmount } = render(
      <BarcodeScannerModal
        isOpen={true}
        onClose={onCloseScanner}
        onDetected={vi.fn()}
        title="Pindai Barcode Mobile"
      />,
    );
    expect(screen.getByRole("dialog", { name: "Pindai Barcode Mobile" })).toBeInTheDocument();
    unmount();

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <StockLookupModal
          isOpen={true}
          onClose={vi.fn()}
        />
      </QueryClientProvider>,
    );
    expect(
      screen.getByRole("dialog", { name: /Cek Stok & Posisi Rak Barang/i }),
    ).toBeInTheDocument();
  });
});
