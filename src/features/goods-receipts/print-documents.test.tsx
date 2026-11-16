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
        permissions: ["gr:read", "gr:create", "gr:post", "transfer:read", "transfer:create", "transfer:approve", "transfer:ship", "transfer:receive"],
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

  it("Tahap 42: mendukung halaman penuh GoodsReceiptCreatePage (?po_id=5) dan GoodsReceiptEditPage (PATCH draft GR)", async () => {
    const draftGr: GoodsReceipt = {
      ...samplePostedReceipt,
      id: 11,
      gr_number: "GR-202611-0011",
      status: "DRAFT",
      posted_at: null,
      posted_by: null,
    };

    const samplePo5 = {
      id: 5,
      po_number: "PO-202611-0005",
      supplier_id: 2,
      supplier_code: "SUP-B2B",
      supplier_name: "PT Distribusi Nusantara",
      warehouse_id: 1,
      warehouse_code: "WH-JKT",
      warehouse_name: "Gudang Pusat Jakarta",
      status: "ISSUED",
      order_date: "2026-11-10",
      notes: null,
      line_count: 1,
      lines: [
        {
          id: 51,
          po_id: 5,
          item_id: 7,
          item_sku: "SKU-RETAIL-01",
          item_barcode: "8991234567890",
          item_name: "Kopi Bubuk 250g",
          uom_id: 1,
          uom_code: "PCS",
          allow_decimal: false,
          qty_ordered: "100",
          qty_received: "0",
          qty_closed: "0",
          qty_remaining: "100",
          line_status: "OPEN",
          notes: null,
        },
      ],
    };

    vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/goods-receipts") {
        return { data: { items: [draftGr], total: 1, limit: 20, offset: 0 } };
      }
      if (url === "/goods-receipts/11") {
        return { data: draftGr };
      }
      if (url === "/purchase-orders") {
        return { data: { items: [samplePo5], total: 1, limit: 200, offset: 0 } };
      }
      if (url === "/purchase-orders/5") {
        return { data: samplePo5 };
      }
      if (url === "/locations") {
        return {
          data: {
            items: [
              {
                id: 3,
                code: "RAK-A1",
                name: "Rak Utama A1",
                warehouse_id: 1,
                is_active: true,
              },
            ],
          },
        };
      }
      return { data: { items: [], total: 0, limit: 200, offset: 0 } };
    });

    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({
      data: {
        ...draftGr,
        notes: "Catatan revisi draft GR",
      },
    } as never);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/goods-receipts"]}>
          <GoodsReceiptsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const editBtn = await screen.findByRole("button", {
      name: /Ubah draft penerimaan GR-202611-0011/i,
    });
    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: "Form ubah draft penerimaan barang" }),
      ).toBeInTheDocument();
    });

    const qtyInput = await screen.findByLabelText("Kuantitas terima SKU-RETAIL-01");
    expect((qtyInput as HTMLInputElement).value).toBe("50");

    fireEvent.change(qtyInput, { target: { value: "60" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan GR" }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        "/goods-receipts/11",
        expect.objectContaining({
          received_date: "2026-11-11",
          lines: [
            expect.objectContaining({
              po_line_id: 51,
              location_id: 3,
              qty_received: "60",
            }),
          ],
        }),
      );
    });
  });

  it("Tahap 42: menampilkan stok tersedia lokasi asal, peringatan opname aktif, dan validasi stok tidak cukup pada TransferForm", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/stock-transfers") {
        return { data: { items: [], total: 0, limit: 20, offset: 0 } };
      }
      if (url === "/warehouses") {
        return {
          data: {
            items: [
              { id: 1, code: "WH-JKT", name: "Gudang Jakarta", is_active: true },
              { id: 2, code: "WH-BDG", name: "Toko Bandung", is_active: true },
            ],
          },
        };
      }
      if (url === "/locations") {
        return {
          data: {
            items: [
              { id: 3, code: "RAK-A1", name: "Rak Utama A1", warehouse_id: 1, is_active: true },
              { id: 8, code: "DSP-01", name: "Display Depan 01", warehouse_id: 2, is_active: true },
            ],
          },
        };
      }
      if (url === "/items") {
        return {
          data: {
            items: [
              {
                id: 7,
                code: "SKU-RETAIL-01",
                sku: "SKU-RETAIL-01",
                barcode: "8991234567890",
                name: "Kopi Bubuk 250g",
                uom_code: "PCS",
                allow_decimal: false,
                is_active: true,
              },
            ],
          },
        };
      }
      if (url === "/stock/by-location") {
        return {
          data: {
            items: [
              {
                item_id: 7,
                qty_on_hand: "12.0000",
                uom_code: "PCS",
              },
            ],
            total: 1,
            limit: 200,
            offset: 0,
          },
        };
      }
      if (url === "/stock-opnames") {
        return {
          data: {
            items: [
              {
                id: 99,
                opname_number: "OPN-202611-0001",
                scope_type: "PARTIAL",
                location_ids: [3],
              },
            ],
            total: 1,
            limit: 50,
            offset: 0,
          },
        };
      }
      return { data: { items: [], total: 0, limit: 200, offset: 0 } };
    });

    const postSpy = vi.spyOn(apiClient, "post");

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/stock-transfers"]}>
          <StockTransfersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const createBtns = await screen.findAllByRole("button", { name: /Buat transfer/i });
    fireEvent.click(createBtns[0]);

    const srcWh = await screen.findByLabelText("Gudang asal");
    fireEvent.change(srcWh, { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Lokasi asal"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Gudang tujuan"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Lokasi tujuan"), { target: { value: "8" } });

    await waitFor(() => {
      expect(
        screen.getByText(/Lokasi asal sedang dibekukan oleh sesi Stock Opname aktif \(OPN-202611-0001\)/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Tambah barang" }));
    fireEvent.change(screen.getByLabelText("Barang 1"), { target: { value: "7" } });

    await waitFor(() => {
      expect(screen.getByText("Stok tersedia: 12 PCS")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Kuantitas barang 1"), {
      target: { value: "20" },
    });

    expect(
      screen.getByText(/Kuantitas transfer \(20\) melebihi stok tersedia \(12 PCS\)/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Simpan draft" }));
    expect(postSpy).not.toHaveBeenCalled();
  });
});
