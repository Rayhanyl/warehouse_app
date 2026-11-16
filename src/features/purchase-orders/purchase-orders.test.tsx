import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/features/auth/store";
import { apiClient } from "@/lib/api-client";
import { PurchaseOrderCreateForm } from "./components/PurchaseOrderCreateForm";
import {
  PurchaseOrderActionDialog,
  PurchaseOrderDetailModal,
} from "./components/PurchaseOrderDetailModal";
import { PO_CLOSE_REASON_PRESETS } from "./constants";
import {
  PurchaseOrderDetailPage,
  PurchaseOrdersPage,
} from "./pages/PurchaseOrdersPage";
import type { PurchaseOrder } from "./types";

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

const sampleDraftPo: PurchaseOrder = {
  id: 41,
  po_number: "PO-202611-0041",
  supplier_id: 2,
  supplier_code: "SUP-02",
  supplier_name: "PT Pemasok Uji",
  warehouse_id: 3,
  warehouse_code: "WH-03",
  warehouse_name: "Gudang Utama",
  order_date: "2026-11-10",
  expected_delivery_date: "2026-11-12",
  is_overdue: false,
  days_overdue: 0,
  revised_from_po_id: null,
  revised_from_po_number: null,
  status: "DRAFT",
  notes: "Catatan awal draft",
  issued_at: null,
  issued_by: null,
  closed_at: null,
  closed_by: null,
  closed_reason: null,
  created_by: 1,
  created_at: "2026-11-10T08:00:00Z",
  updated_at: "2026-11-10T08:00:00Z",
  line_count: 1,
  lines: [
    {
      id: 101,
      po_id: 41,
      item_id: 10,
      item_sku: "SKU-10",
      item_name: "Barang Sepuluh",
      uom_id: 1,
      uom_code: "PCS",
      allow_decimal: false,
      qty_ordered: "10",
      qty_received: "0",
      qty_closed: "0",
      qty_remaining: "10",
      line_status: "OPEN",
      line_closed_reason: null,
      notes: "Baris pertama",
      created_by: 1,
      created_at: "2026-11-10T08:00:00Z",
      updated_at: "2026-11-10T08:00:00Z",
    },
  ],
};

describe("Tahap 36 Purchase Order Enhancements", () => {
  it("renders short-close columns, overdue badge, CLOSED reason banner, and line/header actions", () => {
    const onAction = vi.fn();
    const onEdit = vi.fn();
    const issuedPartialPo: PurchaseOrder = {
      ...sampleDraftPo,
      status: "PARTIALLY_RECEIVED",
      is_overdue: true,
      days_overdue: 3,
      revised_from_po_id: 40,
      revised_from_po_number: "PO-202611-0040",
      lines: [
        {
          id: 101,
          po_id: 41,
          item_id: 10,
          item_sku: "SKU-10",
          item_name: "Barang Sepuluh",
          uom_id: 1,
          uom_code: "PCS",
          allow_decimal: false,
          qty_ordered: "10",
          qty_received: "6",
          qty_closed: "0",
          qty_remaining: "4",
          line_status: "PARTIALLY_RECEIVED",
          line_closed_reason: null,
          notes: "Parsial",
          created_by: 1,
          created_at: "2026-11-10T08:00:00Z",
          updated_at: "2026-11-10T08:00:00Z",
        },
        {
          id: 102,
          po_id: 41,
          item_id: 11,
          item_sku: "SKU-11",
          item_name: "Barang Sebelas",
          uom_id: 1,
          uom_code: "PCS",
          allow_decimal: false,
          qty_ordered: "5",
          qty_received: "0",
          qty_closed: "5",
          qty_remaining: "0",
          line_status: "CLOSED",
          line_closed_reason: "Stok supplier habis",
          notes: null,
          created_by: 1,
          created_at: "2026-11-10T08:00:00Z",
          updated_at: "2026-11-10T08:00:00Z",
        },
      ],
    };

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <PurchaseOrderDetailModal
          canCancel
          canClose
          canEdit
          canIssue
          isLoading={false}
          onAction={onAction}
          onClose={vi.fn()}
          onEdit={onEdit}
          purchaseOrder={issuedPartialPo}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Terlambat 3 hari")).toBeInTheDocument();
    expect(screen.getByText("PO-202611-0040")).toBeInTheDocument();
    expect(screen.getByText("Sisa Belum Diterima")).toBeInTheDocument();
    expect(screen.getByText("Ditutup (Short-Close)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hentikan Sisa" }));
    expect(onAction).toHaveBeenCalledWith(issuedPartialPo, "close-line", issuedPartialPo.lines?.[0]);

    rerender(
      <QueryClientProvider client={qc}>
        <PurchaseOrderDetailModal
          canCancel
          canClose
          canEdit
          canIssue
          isLoading={false}
          onAction={onAction}
          onClose={vi.fn()}
          onEdit={onEdit}
          purchaseOrder={{
            ...issuedPartialPo,
            status: "CLOSED",
            closed_reason: "Discontinued oleh supplier",
            closed_at: "2026-11-15T10:00:00Z",
          }}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/Discontinued oleh supplier/i)).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={qc}>
        <PurchaseOrderDetailModal
          canCancel
          canClose
          canEdit
          canIssue
          isLoading={false}
          onAction={onAction}
          onClose={vi.fn()}
          onEdit={onEdit}
          purchaseOrder={sampleDraftPo}
        />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Ubah Draft PO/i }));
    expect(onEdit).toHaveBeenCalledWith(sampleDraftPo);
  });

  it("applies preset short-close reasons in PurchaseOrderActionDialog", () => {
    const onReasonChange = vi.fn();
    renderWithQuery(
      <PurchaseOrderActionDialog
        action="close-line"
        closedReason=""
        isSubmitting={false}
        onClose={vi.fn()}
        onReasonChange={onReasonChange}
        onSubmit={vi.fn()}
        purchaseOrder={sampleDraftPo}
        targetLine={sampleDraftPo.lines?.[0]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: PO_CLOSE_REASON_PRESETS[0] }));
    expect(onReasonChange).toHaveBeenCalledWith(PO_CLOSE_REASON_PRESETS[0]);
  });

  it("populates PurchaseOrderCreateForm in edit mode and validates expected_delivery_date", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithQuery(
      <PurchaseOrderCreateForm
        initialPurchaseOrder={sampleDraftPo}
        isReferencesError={false}
        isReferencesLoading={false}
        isSubmitting={false}
        onClose={vi.fn()}
        onRetryReferences={vi.fn()}
        onSubmit={onSubmit}
        references={{
          suppliers: [{ id: 2, code: "SUP-02", name: "PT Pemasok Uji", is_active: true }],
          warehouses: [{ id: 3, code: "WH-03", name: "Gudang Utama", is_active: true }],
          items: [
            {
              id: 10,
              code: "SKU-10",
              sku: "SKU-10",
              name: "Barang Sepuluh",
              is_active: true,
              uom_code: "PCS",
              allow_decimal: false,
            },
          ],
        }}
        submitLabel="Simpan perubahan PO"
      />,
    );

    const etaInput = screen.getByLabelText(/Estimasi tanggal kirim/i) as HTMLInputElement;
    expect(etaInput.value).toBe("2026-11-12");

    fireEvent.change(etaInput, { target: { value: "2026-11-08" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan PO" }));

    const etaErrors = await screen.findAllByText(
      /Estimasi tanggal pengiriman tidak boleh lebih awal dari tanggal pesanan/i,
    );
    expect(etaErrors.length).toBeGreaterThan(0);
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(etaInput, { target: { value: "2026-11-18" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan PO" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        supplier_id: 2,
        warehouse_id: 3,
        order_date: "2026-11-10",
        expected_delivery_date: "2026-11-18",
      }),
    );
  });

  it("Tahap 41: navigates from PO list to dedicated PurchaseOrderDetailPage, renders related GR history & shortcut, and preserves filters on back", async () => {
    act(() => {
      useAuthStore.getState().setAuthenticated("token-po-41", {
        id: 1,
        username: "superadmin",
        email: "admin@wms.local",
        full_name: "Super Admin",
        role_id: 1,
        role_name: "Super Admin",
        is_active: true,
        has_all_warehouse_access: true,
        permissions: [
          "po:read",
          "po:create",
          "po:approve_l1",
          "po:approve_l2",
          "po:cancel",
          "po:close",
          "gr:read",
          "gr:create",
        ],
        warehouse_ids: [3],
      });
    });

    const issuedPo41: PurchaseOrder = {
      ...sampleDraftPo,
      status: "ISSUED",
      total_amount: "2500000.00",
    };

    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/purchase-orders") {
        return {
          data: { items: [issuedPo41], total: 1, limit: 20, offset: 0 },
        } as never;
      }
      if (url === "/purchase-orders/41") {
        return { data: issuedPo41 } as never;
      }
      if (url === "/goods-receipts") {
        return {
          data: {
            items: [
              {
                id: 301,
                gr_number: "GR-202611-0301",
                po_id: 41,
                po_number: "PO-202611-0041",
                supplier_id: 2,
                supplier_code: "SUP-02",
                supplier_name: "PT Pemasok Uji",
                warehouse_id: 3,
                warehouse_code: "WH-03",
                warehouse_name: "Gudang Utama",
                status: "POSTED",
                received_date: "2026-11-11",
                notes: "Penerimaan tahap pertama",
                line_count: 1,
                created_at: "2026-11-11T09:00:00Z",
                updated_at: "2026-11-11T09:00:00Z",
              },
            ],
            total: 1,
            limit: 50,
            offset: 0,
          },
        } as never;
      }
      return { data: { items: [], total: 0, limit: 200, offset: 0 } } as never;
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter
          initialEntries={["/purchase-orders?search=PO-202611&status=ISSUED"]}
        >
          <Routes>
            <Route element={<PurchaseOrdersPage />} path="/purchase-orders" />
            <Route
              element={<PurchaseOrderDetailPage />}
              path="/purchase-orders/:poId"
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const poBtn = await screen.findByRole("button", { name: "PO-202611-0041" });
    fireEvent.click(poBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: "Header dan aksi purchase order" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("region", { name: "Riwayat penerimaan barang terkait PO" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("GR-202611-0301")).toBeInTheDocument();

    const createGrLink = screen.getByRole("link", {
      name: /Buat Penerimaan \(GR\)/i,
    });
    expect(createGrLink).toHaveAttribute("href", "/goods-receipts/new?po_id=41");

    const backLink = screen.getByRole("link", { name: /Kembali ke daftar/i });
    expect(backLink).toHaveAttribute(
      "href",
      "/purchase-orders?search=PO-202611&status=ISSUED",
    );
    fireEvent.click(backLink);

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: /Filter daftar purchase order/i }),
      ).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(
      /Cari nomor, pemasok, atau catatan/i,
    ) as HTMLInputElement;
    expect(searchInput.value).toBe("PO-202611");

    vi.restoreAllMocks();
  });
});
