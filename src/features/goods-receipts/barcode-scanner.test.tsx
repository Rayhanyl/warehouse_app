import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BarcodeScanBar } from "@/components/ui/BarcodeScannerModal";
import { useAuthStore } from "@/features/auth/store";
import { GoodsReceiptsPage } from "@/features/goods-receipts/pages/GoodsReceiptsPage";
import { StockOpnamesPage } from "@/features/stock-opnames/pages/StockOpnamesPage";
import { StockTransfersPage } from "@/features/stock-transfers/pages/StockTransfersPage";
import { apiClient } from "@/lib/api-client";

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe("AC-33: Barcode / QR Scanner & Hardware Gun Integration", () => {
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
        permissions: [
          "gr:read",
          "gr:manage",
          "transfer:read",
          "transfer:create",
          "transfer:approve",
          "transfer:ship",
          "transfer:receive",
          "opname:read",
          "opname:manage",
          "opname:count",
          "opname:approve",
        ],
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

  it("menangkap input USB/Bluetooth HID barcode gun cepat dan manual di BarcodeScanBar", () => {
    const onScan = vi.fn();
    render(
      <BarcodeScanBar
        label="Scan Barcode Uji"
        onScan={onScan}
        placeholder="Scan barcode..."
      />,
    );

    const input = screen.getByLabelText("Scan Barcode Uji");
    fireEvent.change(input, { target: { value: "8991002101012" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onScan).toHaveBeenCalledWith("8991002101012");
    expect((input as HTMLInputElement).value).toBe("");

    // Hardware HID gun rapid keystrokes simulation when not focused on an input
    input.blur();
    const code = "8997009510123";
    for (const ch of code) {
      fireEvent.keyDown(window, { key: ch });
    }
    fireEvent.keyDown(window, { key: "Enter" });

    expect(onScan).toHaveBeenCalledWith("8997009510123");
  });

  it("menambah kuantitas terima (+1) dan memilih lokasi default saat scan barcode barang pada form Goods Receipt", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/goods-receipts") {
        return { data: { items: [], total: 0, limit: 20, offset: 0 } };
      }
      if (url === "/purchase-orders") {
        return {
          data: {
            items: [
              {
                id: 10,
                po_number: "PO-20261111-0001",
                supplier_id: 2,
                supplier_code: "SUP-01",
                supplier_name: "PT Sumber Makmur",
                warehouse_id: 1,
                warehouse_code: "WH-JKT",
                warehouse_name: "Gudang Utama Jakarta",
                status: "ISSUED",
                order_date: "2026-11-10",
                notes: null,
                line_count: 1,
                lines: [
                  {
                    id: 101,
                    po_id: 10,
                    item_id: 50,
                    item_sku: "ELK-MCU-001",
                    item_barcode: "8991002101012",
                    item_name: "Microcontroller ESP32-S3",
                    uom_id: 1,
                    uom_code: "PCS",
                    allow_decimal: false,
                    qty_ordered: "10",
                    qty_received: "0",
                    notes: null,
                  },
                ],
              },
            ],
            total: 1,
            limit: 100,
            offset: 0,
          },
        };
      }
      if (url === "/purchase-orders/10") {
        return {
          data: {
            id: 10,
            po_number: "PO-20261111-0001",
            supplier_id: 2,
            supplier_code: "SUP-01",
            supplier_name: "PT Sumber Makmur",
            warehouse_id: 1,
            warehouse_code: "WH-JKT",
            warehouse_name: "Gudang Utama Jakarta",
            status: "ISSUED",
            order_date: "2026-11-10",
            notes: null,
            line_count: 1,
            lines: [
              {
                id: 101,
                po_id: 10,
                item_id: 50,
                item_sku: "ELK-MCU-001",
                item_barcode: "8991002101012",
                item_name: "Microcontroller ESP32-S3",
                uom_id: 1,
                uom_code: "PCS",
                allow_decimal: false,
                qty_ordered: "10",
                qty_received: "0",
                notes: null,
              },
            ],
          },
        };
      }
      if (url === "/locations") {
        return {
          data: {
            items: [
              {
                id: 5,
                code: "RAK-A1",
                name: "Rak Utama A1",
                warehouse_id: 1,
                is_active: true,
              },
            ],
            total: 1,
            limit: 200,
            offset: 0,
          },
        };
      }
      return { data: { items: [], total: 0, limit: 20, offset: 0 } };
    });

    const queryClient = createTestClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <GoodsReceiptsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const createButtons = await screen.findAllByRole("button", { name: /Buat penerimaan/i });
    fireEvent.click(createButtons[0]);

    const poSelect = await screen.findByLabelText(/Purchase order/i);
    await waitFor(() => {
      expect(poSelect.querySelectorAll("option").length).toBeGreaterThan(1);
    });
    fireEvent.change(poSelect, { target: { value: "10" } });

    const scanInput = await screen.findByLabelText(/Scan Barcode \/ SKU Barang PO/i);
    fireEvent.change(scanInput, { target: { value: "8991002101012" } });
    fireEvent.keyDown(scanInput, { key: "Enter" });

    const qtyInput = screen.getByLabelText("Kuantitas terima ELK-MCU-001") as HTMLInputElement;
    const locSelect = screen.getByLabelText("Lokasi terima ELK-MCU-001") as HTMLSelectElement;
    expect(qtyInput.value).toBe("1");
    expect(locSelect.value).toBe("5");

    // Scan again to increment to 2
    fireEvent.change(scanInput, { target: { value: "8991002101012" } });
    fireEvent.keyDown(scanInput, { key: "Enter" });
    expect(qtyInput.value).toBe("2");
  });

  it("menambah baris barang dan kuantitas (+1) saat scan barcode di form Stock Transfer", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/stock-transfers") {
        return { data: { items: [], total: 0, limit: 20, offset: 0 } };
      }
      if (url === "/warehouses") {
        return {
          data: {
            items: [
              { id: 1, code: "WH-JKT", name: "Gudang Jakarta", is_active: true },
              { id: 2, code: "WH-BDG", name: "Toko Cabang Bandung", is_active: true },
            ],
          },
        };
      }
      if (url === "/locations") {
        return {
          data: {
            items: [
              { id: 1, code: "RAK-A1", name: "Rak A1", warehouse_id: 1, is_active: true },
              { id: 2, code: "ETALASE-1", name: "Etalase 1", warehouse_id: 2, is_active: true },
            ],
          },
        };
      }
      if (url === "/items") {
        return {
          data: {
            items: [
              {
                id: 50,
                sku: "ELK-MCU-001",
                barcode: "8991002101012",
                name: "Microcontroller ESP32-S3",
                is_active: true,
              },
            ],
          },
        };
      }
      return { data: { items: [], total: 0, limit: 20, offset: 0 } };
    });

    const queryClient = createTestClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <StockTransfersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const createBtns = await screen.findAllByRole("button", { name: /Buat transfer/i });
    fireEvent.click(createBtns[0]);

    const scanInput = await screen.findByLabelText(/Scan Barcode \/ SKU Barang Transfer/i);
    await waitFor(() => {
      expect(screen.getByLabelText("Gudang asal").querySelectorAll("option").length).toBeGreaterThan(1);
    });

    fireEvent.change(scanInput, { target: { value: "8991002101012" } });
    fireEvent.keyDown(scanInput, { key: "Enter" });

    const qtyInput = (await screen.findByLabelText("Kuantitas barang 1")) as HTMLInputElement;
    expect(qtyInput.value).toBe("1");

    // Second scan increments quantity to 2
    fireEvent.change(scanInput, { target: { value: "8991002101012" } });
    fireEvent.keyDown(scanInput, { key: "Enter" });
    expect(qtyInput.value).toBe("2");
  });

  it("menambah hasil hitung fisik (+1) saat scan barcode pada sesi Stock Opname IN_PROGRESS", async () => {
    const sampleOpname = {
      id: 77,
      opname_number: "OPN-20261111-0001",
      warehouse_id: 1,
      warehouse_code: "WH-JKT",
      warehouse_name: "Gudang Jakarta",
      location_id: 1,
      location_code: "RAK-A1",
      location_name: "Rak A1",
      status: "IN_PROGRESS",
      notes: null,
      line_count: 1,
      rejection_reason: null,
      created_at: "2026-11-11T08:00:00Z",
      updated_at: "2026-11-11T08:05:00Z",
      lines: [
        {
          id: 501,
          location_id: 1,
          location_code: "RAK-A1",
          location_name: "Rak A1",
          item_id: 50,
          item_sku: "ELK-MCU-001",
          item_barcode: "8991002101012",
          item_name: "Microcontroller ESP32-S3",
          uom_code: "PCS",
          allow_decimal: false,
          qty_system: "5",
          qty_physical: "2",
          qty_variance: "-3",
          notes: null,
        },
      ],
    };

    vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/stock-opnames") {
        return { data: { items: [sampleOpname], total: 1, limit: 20, offset: 0 } };
      }
      if (url === "/stock-opnames/77") {
        return { data: sampleOpname };
      }
      if (url === "/warehouses" || url === "/locations" || url === "/items") {
        return { data: { items: [], total: 0, limit: 200, offset: 0 } };
      }
      return { data: { items: [], total: 0, limit: 20, offset: 0 } };
    });

    const queryClient = createTestClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <StockOpnamesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const detailBtn = await screen.findByRole("button", { name: "Lihat detail OPN-20261111-0001" });
    fireEvent.click(detailBtn);

    const scanInput = await screen.findByLabelText(/Scan Barcode \/ SKU Hitung Fisik/i);
    const physicalInput = (await screen.findByLabelText("Hasil fisik ELK-MCU-001")) as HTMLInputElement;
    expect(physicalInput.value).toBe("2");

    fireEvent.change(scanInput, { target: { value: "8991002101012" } });
    fireEvent.keyDown(scanInput, { key: "Enter" });

    expect(physicalInput.value).toBe("3");
  });
});
