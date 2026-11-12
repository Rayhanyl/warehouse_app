import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/features/auth/store";
import { DashboardPage } from "@/pages/DashboardPage";
import type { DashboardSummaryOut } from "./types";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockSummaryData: DashboardSummaryOut = {
  stock_summary: {
    total_active_items: 24,
    total_qty_on_hand: "150.0000",
    total_qty_in_transit: "25.0000",
    low_stock_items_count: 3,
  },
  pending_actions: {
    pending_po_receipt_count: 2,
    draft_gr_count: 1,
    pending_transfer_ship_count: 4,
    pending_transfer_receive_count: 3,
    active_opname_count: 1,
  },
  recent_activities: [
    {
      id: 101,
      movement_type: "IN_PURCHASE",
      reference_type: "GOODS_RECEIPT",
      reference_id: 201,
      reference_number: "GR-202611-0001",
      item_id: 1,
      item_sku: "SKU-TEST-001",
      item_name: "Barang Uji Penerimaan",
      warehouse_id: 1,
      warehouse_code: "WH-A",
      warehouse_name: "Gudang Utama A",
      qty_change: "50.0000",
      qty_after: "150.0000",
      created_at: "2026-11-12T10:00:00Z",
      actor_name: "Operator A",
    },
    {
      id: 102,
      movement_type: "TRF_OUT",
      reference_type: "STOCK_TRANSFER",
      reference_id: 301,
      reference_number: "TR-202611-0001",
      item_id: 2,
      item_sku: "SKU-TEST-002",
      item_name: "Barang Uji Transfer",
      warehouse_id: 1,
      warehouse_code: "WH-A",
      warehouse_name: "Gudang Utama A",
      qty_change: "-10.0000",
      qty_after: "40.0000",
      created_at: "2026-11-12T11:00:00Z",
      actor_name: "Operator B",
    },
  ],
  assigned_warehouses: [
    {
      id: 1,
      code: "WH-A",
      name: "Gudang Utama A",
    },
    {
      id: 2,
      code: "WH-B",
      name: "Gudang Cabang B",
    },
  ],
};

function renderDashboard(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AC-38 & DSH-F01: Dashboard Summary Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    useAuthStore.setState({
      user: {
        id: 1,
        username: "superadmin",
        full_name: "Super Administrator WMS",
        email: "admin@wms.local",
        role_id: 1,
        role_name: "Super Admin",
        permissions: ["dashboard:read"],
        is_active: true,
        warehouse_ids: [1, 2],
      },
      accessToken: "test-token",
      status: "authenticated",
      restoreError: null,
    });
  });

  it("merender 4 kartu metrik KPI, antrean pending actions, dan aktivitas mutasi terkini", async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === "/dashboard/summary") {
        return { data: mockSummaryData } as any;
      }
      if (url === "/menus/my-menu") {
        return { data: [] } as any;
      }
      return { data: null } as any;
    });

    renderDashboard(queryClient);

    // Verifikasi salam & judul
    expect(
      screen.getByRole("heading", { name: "Selamat datang, Super Administrator WMS" }),
    ).toBeInTheDocument();

    // Tunggu data dimuat
    await waitFor(() => {
      expect(screen.getByText("Total Katalog SKU")).toBeInTheDocument();
    });

    // 1. Verifikasi 4 Kartu KPI
    expect(screen.getByText("24")).toBeInTheDocument(); // total_active_items
    expect(screen.getAllByText("150").length).toBeGreaterThanOrEqual(1); // on-hand formatDecimal
    expect(screen.getByText("25")).toBeInTheDocument(); // in-transit formatDecimal
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1); // low stock count & pending count

    // 2. Verifikasi Cakupan Gudang
    expect(screen.getAllByText("WH-A").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("WH-B")).toBeInTheDocument();
    expect(screen.getByText("(2 gudang)")).toBeInTheDocument();

    // 3. Verifikasi Tugas Tertunda (Action items)
    expect(screen.getByText("Tugas Tertunda")).toBeInTheDocument();
    expect(screen.getByText("PO Siap Diterima")).toBeInTheDocument();
    expect(screen.getByText("Draft Penerimaan (GR)")).toBeInTheDocument();
    expect(screen.getByText("Transfer Siap Dikirim")).toBeInTheDocument();
    expect(screen.getByText("Transfer Siap Diterima")).toBeInTheDocument();
    expect(screen.getByText("Stock Opname Berjalan")).toBeInTheDocument();
    // Total antrean = 2 + 1 + 4 + 3 + 1 = 11 antrean
    expect(screen.getByText("11 antrean")).toBeInTheDocument();

    // 4. Verifikasi Aktivitas Mutasi Terkini
    expect(screen.getByText("Aktivitas Mutasi Terkini")).toBeInTheDocument();
    expect(screen.getByText("Barang Uji Penerimaan")).toBeInTheDocument();
    expect(screen.getByText("SKU-TEST-001")).toBeInTheDocument();
    expect(screen.getByText("+50")).toBeInTheDocument();
    expect(screen.getByText("Penerimaan PO")).toBeInTheDocument();

    expect(screen.getByText("Barang Uji Transfer")).toBeInTheDocument();
    expect(screen.getByText("SKU-TEST-002")).toBeInTheDocument();
    expect(screen.getByText("-10")).toBeInTheDocument();
    expect(screen.getByText("Transfer Keluar")).toBeInTheDocument();
  });

  it("menangani empty state mutasi terkini dan tombol segarkan", async () => {
    const emptySummary: DashboardSummaryOut = {
      stock_summary: {
        total_active_items: 0,
        total_qty_on_hand: "0.0000",
        total_qty_in_transit: "0.0000",
        low_stock_items_count: 0,
      },
      pending_actions: {
        pending_po_receipt_count: 0,
        draft_gr_count: 0,
        pending_transfer_ship_count: 0,
        pending_transfer_receive_count: 0,
        active_opname_count: 0,
      },
      recent_activities: [],
      assigned_warehouses: [],
    };

    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === "/dashboard/summary") {
        return { data: emptySummary } as any;
      }
      if (url === "/menus/my-menu") {
        return { data: [] } as any;
      }
      return { data: null } as any;
    });

    renderDashboard(queryClient);

    await waitFor(() => {
      expect(screen.getByText("Lengkap")).toBeInTheDocument();
    });

    expect(screen.getByText("Belum ada mutasi stok tercatat")).toBeInTheDocument();
    expect(
      screen.getByText("Tidak ada gudang yang ditugaskan atau akun berstatus non-operasional."),
    ).toBeInTheDocument();

    // Klik tombol Segarkan
    const refreshBtn = screen.getByRole("button", { name: "Segarkan data ringkasan" });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/dashboard/summary");
    });
  });

  it("tidak melempar DecimalError ketika nilai kuantitas/saldo bernilai undefined atau null", async () => {
    const undefinedQtySummary: any = {
      stock_summary: {
        total_active_items: 5,
        total_qty_on_hand: undefined,
        total_qty_in_transit: null,
        low_stock_items_count: 0,
      },
      pending_actions: {
        pending_po_receipt_count: 0,
        draft_gr_count: 0,
        pending_transfer_ship_count: 0,
        pending_transfer_receive_count: 0,
        active_opname_count: 0,
      },
      recent_activities: [
        {
          id: 999,
          movement_type: "IN_PURCHASE",
          reference_type: "GOODS_RECEIPT",
          reference_id: 1,
          item_id: 1,
          item_sku: "SKU-EMPTY",
          item_name: "Barang Nilai Kosong",
          warehouse_id: 1,
          qty_change: undefined,
          qty_after: null,
          created_at: "2026-11-12T10:00:00Z",
        },
      ],
      assigned_warehouses: [{ id: 1, code: "WH-A", name: "Gudang A" }],
    };

    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === "/dashboard/summary") {
        return { data: undefinedQtySummary } as any;
      }
      if (url === "/menus/my-menu") {
        return { data: [] } as any;
      }
      return { data: null } as any;
    });

    // Harus render tanpa melempar DecimalError
    renderDashboard(queryClient);

    await waitFor(() => {
      expect(screen.getByText("Barang Nilai Kosong")).toBeInTheDocument();
    });

    // formatDecimal fallback ke "0"
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1);
  });
});
