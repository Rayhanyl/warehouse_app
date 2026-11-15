import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/features/auth/store";
import { DashboardKpiGrid } from "@/features/dashboard/components/DashboardKpiGrid";
import { StockFormDialog } from "@/features/master-data/stocks/components/StockFormDialog";
import { SupplierFormDialog } from "@/features/master-data/suppliers/components/SupplierFormDialog";
import { PurchaseOrderPrintSheet } from "@/features/purchase-orders/components/PurchaseOrderPrintSheet";
import type { PurchaseOrder } from "@/features/purchase-orders/types";
import { useWarehouseScopeStore } from "@/stores/warehouseScopeStore";
import { StockPage } from "./pages/StockPage";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

function renderWithProviders(ui: React.ReactElement, initialEntries = ["/"]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Tahap 37 Frontend UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWarehouseScopeStore.getState().reset();
    useAuthStore.setState({
      user: {
        id: 1,
        username: "superadmin",
        email: "admin@test.id",
        full_name: "Super Admin",
        role_id: 1,
        role_name: "Super Admin",
        permissions: ["stock:read", "ledger:read"],
        is_active: true,
        warehouse_ids: [1],
        warehouses: [{ id: 1, code: "WH-A", name: "Gudang Alpha", is_active: true }],
      },
      accessToken: "token",
      status: "authenticated",
      restoreError: null,
    });
  });

  it("DashboardKpiGrid links critical stock card to /stock/by-warehouse?critical=true", () => {
    renderWithProviders(
      <DashboardKpiGrid
        isError={false}
        isLoading={false}
        stockSummary={{
          total_active_items: 12,
          total_qty_on_hand: "100.0000",
          total_qty_in_transit: "5.0000",
          low_stock_items_count: 4,
        }}
      />,
    );

    const cardLink = screen.getByRole("link", { name: /Perhatian Stok Kritis/i });
    expect(cardLink).toHaveAttribute("href", "/stock/by-warehouse?critical=true");
    expect(screen.getByText(/Min\. Stok/i)).toBeInTheDocument();
  });

  it("StockPage activates critical_only when navigated with ?critical=true and shows Kritis badge", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        items: [
          {
            warehouse_id: 1,
            warehouse_code: "WH-A",
            warehouse_name: "Gudang Alpha",
            item_id: 10,
            item_sku: "SKU-37",
            item_barcode: null,
            item_name: "Baut M10",
            category_id: 1,
            category_name: "Logam",
            uom_id: 1,
            uom_code: "PCS",
            min_stock: "15.0000",
            is_critical: true,
            qty_on_hand: "5.0000",
            qty_in_transit: "0.0000",
          },
        ],
        total: 1,
        limit: 25,
        offset: 0,
      },
    });

    renderWithProviders(<StockPage />, ["/stock/by-warehouse?critical=true"]);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        "/stock/by-warehouse",
        expect.objectContaining({
          params: expect.objectContaining({ critical_only: true }),
        }),
      );
    });

    expect(await screen.findByText("Kritis")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("StockFormDialog validates and submits min_stock", () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <StockFormDialog
        categoryOptions={[{ id: 1, name: "Umum" }]}
        initialItem={null}
        isOpen={true}
        mode="create"
        onClose={vi.fn()}
        onSubmit={onSubmit}
        uomOptions={[{ id: 1, code: "PCS", name: "Pieces", allow_decimal: false }]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Kode SKU/i), { target: { value: "SKU-37A" } });
    fireEvent.change(screen.getByLabelText(/Nama barang/i), { target: { value: "Item Baru" } });
    fireEvent.change(screen.getByLabelText(/Batas stok kritis/i), { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: /Simpan barang/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        sku: "SKU-37A",
        min_stock: "25",
      }),
    );
  });

  it("SupplierFormDialog submits fax, bank account, NPWP, payment terms, and notes", () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <SupplierFormDialog
        initialSupplier={null}
        isOpen={true}
        mode="create"
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Kode pemasok/i), { target: { value: "SUP-37" } });
    fireEvent.change(screen.getByLabelText(/Nama pemasok/i), { target: { value: "PT Sumber Jaya" } });
    fireEvent.change(screen.getByLabelText(/Nomor fax/i), { target: { value: "021-888999" } });
    fireEvent.change(screen.getByLabelText(/NPWP/i), { target: { value: "01.234.567.8-901.000" } });
    fireEvent.change(screen.getByLabelText(/Termin pembayaran/i), { target: { value: "NET 30" } });
    fireEvent.change(screen.getByLabelText(/Nama bank/i), { target: { value: "BCA" } });
    fireEvent.change(screen.getByLabelText(/Nomor rekening/i), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText(/Atas nama rekening/i), { target: { value: "PT Sumber Jaya" } });
    fireEvent.change(screen.getByLabelText(/Catatan tambahan pemasok/i), {
      target: { value: "Bongkar muat jam kerja" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Simpan pemasok/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "SUP-37",
        fax: "021-888999",
        npwp: "01.234.567.8-901.000",
        payment_terms: "NET 30",
        bank_name: "BCA",
        bank_account_number: "9876543210",
        bank_account_holder: "PT Sumber Jaya",
        notes: "Bongkar muat jam kerja",
      }),
    );
  });

  it("PurchaseOrderPrintSheet displays supplier fax, bank account, NPWP, and payment terms", () => {
    const po: PurchaseOrder = {
      id: 99,
      po_number: "PO-202611-0099",
      supplier_id: 5,
      supplier_code: "SUP-05",
      supplier_name: "PT Lengkap Abadi",
      supplier_phone: "021-777000",
      supplier_fax: "021-777001",
      supplier_bank_name: "Mandiri",
      supplier_bank_account_number: "1122334455",
      supplier_bank_account_holder: "PT Lengkap Abadi",
      supplier_npwp: "02.111.222.3-444.000",
      supplier_payment_terms: "NET 14",
      warehouse_id: 1,
      warehouse_code: "WH-A",
      warehouse_name: "Gudang Alpha",
      status: "ISSUED",
      order_date: "2026-11-15",
      notes: null,
      line_count: 0,
      issued_at: "2026-11-15T08:00:00Z",
      issued_by: 1,
      closed_reason: null,
      closed_at: null,
      closed_by: null,
      created_by: 1,
      created_at: "2026-11-15T07:50:00Z",
      updated_at: "2026-11-15T08:00:00Z",
      lines: [],
    };

    renderWithProviders(<PurchaseOrderPrintSheet purchaseOrder={po} visibleOnScreen />);

    expect(screen.getByText(/Fax: 021-777001/)).toBeInTheDocument();
    expect(screen.getByText(/Mandiri 1122334455/)).toBeInTheDocument();
    expect(screen.getByText(/NPWP: 02\.111\.222\.3-444\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Termin: NET 14/)).toBeInTheDocument();
  });
});
