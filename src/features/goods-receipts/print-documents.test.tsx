import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { useAuthStore } from "@/features/auth/store";
import { StockTransfersPage } from "@/features/stock-transfers/pages/StockTransfersPage";
import { apiClient } from "@/lib/api-client";
import { GoodsReceiptsPage } from "./pages/GoodsReceiptsPage";
import type { GoodsReceipt } from "./types";
import type { StockTransfer } from "@/features/stock-transfers/types";

const samplePostedReceipt: GoodsReceipt = {
  id: 10,
  gr_number: "GR-202611-0010",
  po_id: 5,
  po_number: "PO-202611-0005",
  supplier_id: 2,
  supplier_code: "SUP-B2B",
  supplier_name: "PT Distribusi Nusantara",
  warehouse_id: 1,
  warehouse_code: "WH-JKT",
  warehouse_name: "Gudang Pusat Jakarta",
  status: "POSTED",
  received_date: "2026-11-11",
  notes: "Pengiriman lengkap via truk boks",
  line_count: 1,
  posted_at: "2026-11-11T08:30:00Z",
  posted_by: 1,
  created_at: "2026-11-11T08:00:00Z",
  updated_at: "2026-11-11T08:30:00Z",
  lines: [
    {
      id: 101,
      gr_id: 10,
      po_id: 5,
      warehouse_id: 1,
      po_line_id: 51,
      item_id: 7,
      item_sku: "SKU-RETAIL-01",
      item_barcode: "8991234567890",
      item_name: "Kopi Bubuk 250g",
      uom_id: 1,
      uom_code: "PCS",
      allow_decimal: false,
      location_id: 3,
      location_code: "RAK-A1",
      location_name: "Rak Utama A1",
      qty_received: "50.0000",
      notes: "Kondisi segel baik",
      created_at: "2026-11-11T08:00:00Z",
      updated_at: "2026-11-11T08:00:00Z",
    },
  ],
};

const sampleShippedTransfer: StockTransfer = {
  id: 20,
  transfer_number: "TRF-202611-0020",
  source_warehouse_id: 1,
  source_warehouse_code: "WH-JKT",
  source_warehouse_name: "Gudang Pusat Jakarta",
  source_location_id: 3,
  source_location_code: "RAK-A1",
  source_location_name: "Rak Utama A1",
  destination_warehouse_id: 2,
  destination_warehouse_code: "WH-BDG",
  destination_warehouse_name: "Toko Cabang Bandung",
  destination_location_id: 8,
  destination_location_code: "DSP-01",
  destination_location_name: "Display Depan 01",
  status: "SHIPPED",
  notes: "Kirim ke cabang Bandung pagi",
  line_count: 1,
  shipped_at: "2026-11-11T09:15:00Z",
  created_at: "2026-11-11T08:45:00Z",
  updated_at: "2026-11-11T09:15:00Z",
  lines: [
    {
      id: 201,
      transfer_id: 20,
      item_id: 7,
      item_sku: "SKU-RETAIL-01",
      item_barcode: "8991234567890",
      item_name: "Kopi Bubuk 250g",
      uom_code: "PCS",
      allow_decimal: false,
      qty: "25.0000",
      qty_received: null,
      qty_variance: null,
      variance_reason: null,
    },
  ],
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe("AC-32 Cetak Dokumen Fisik (Bukti Penerimaan Barang & Surat Jalan Transfer)", () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.getState().setAuthenticated("token-admin", {
        id: 1,
        username: "manager.jkt",
        email: "manager@wms.local",
        full_name: "Rina Manajer",
        role_id: 2,
        role_name: "Warehouse Manager",
        is_active: true,
        permissions: ["gr:read", "gr:manage", "transfer:read", "transfer:create", "transfer:approve", "transfer:ship", "transfer:receive"],
        warehouse_ids: [1, 2],
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  it("menampilkan tombol Cetak Bukti Penerimaan pada GR berstatus POSTED dan memicu window.print()", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/goods-receipts/10") {
        return { data: samplePostedReceipt };
      }
      if (url === "/goods-receipts") {
        return {
          data: {
            items: [samplePostedReceipt],
            total: 1,
            limit: 20,
            offset: 0,
          },
        };
      }
      return { data: { items: [], total: 0, limit: 200, offset: 0 } };
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/goods-receipts"]}>
          <GoodsReceiptsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const detailBtn = await screen.findByRole("button", {
      name: /Lihat detail penerimaan GR-202611-0010/i,
    });
    fireEvent.click(detailBtn);

    const printBtn = await screen.findByRole("button", {
      name: /Cetak Bukti Penerimaan/i,
    });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/BUKTI PENERIMAAN BARANG \(GOODS RECEIPT NOTE\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Diserahkan Oleh/i)).toBeInTheDocument();
    expect(screen.getByText(/Diterima & Diperiksa Oleh/i)).toBeInTheDocument();
    expect(screen.getByText(/Diketahui Oleh/i)).toBeInTheDocument();
    expect(screen.getByText(/BC: 8991234567890/i)).toBeInTheDocument();
  });

  it("menampilkan tombol Cetak Surat Jalan pada Transfer berstatus SHIPPED dan memicu window.print()", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/stock-transfers/20") {
        return { data: sampleShippedTransfer };
      }
      if (url === "/stock-transfers") {
        return {
          data: {
            items: [sampleShippedTransfer],
            total: 1,
            limit: 20,
            offset: 0,
          },
        };
      }
      return { data: { items: [], total: 0, limit: 200, offset: 0 } };
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/stock-transfers"]}>
          <StockTransfersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const trfLink = await screen.findByRole("button", {
      name: "TRF-202611-0020",
    });
    fireEvent.click(trfLink);

    const printBtn = await screen.findByRole("button", {
      name: /Cetak Surat Jalan/i,
    });
    await waitFor(() => {
      expect(printBtn).toBeInTheDocument();
    });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/SURAT JALAN TRANSFER STOK/i)).toBeInTheDocument();
    expect(screen.getByText(/Diserahkan Oleh/i)).toBeInTheDocument();
    expect(screen.getByText(/Dibawa Oleh/i)).toBeInTheDocument();
    expect(screen.getByText(/Diterima Oleh/i)).toBeInTheDocument();
    expect(screen.getByText(/BC: 8991234567890/i)).toBeInTheDocument();
  });
});
