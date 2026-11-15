import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { AdministrationPage } from "@/features/administration/pages/AdministrationPage";
import { useAuthStore } from "@/features/auth/store";
import { GoodsReceiptDetailModal } from "@/features/goods-receipts/components/GoodsReceiptDetailModal";
import type { GoodsReceipt } from "@/features/goods-receipts/types";
import { OpnameDetailModal } from "@/features/stock-opnames/components/OpnameDetailModal";
import type { StockOpname } from "@/features/stock-opnames/types";
import { StockTransfersPage } from "@/features/stock-transfers/pages/StockTransfersPage";
import type { StockTransfer } from "@/features/stock-transfers/types";
import { apiClient } from "@/lib/api-client";
import { PurchaseOrderCreateForm } from "./components/PurchaseOrderCreateForm";
import { PurchaseOrderDetailModal } from "./components/PurchaseOrderDetailModal";
import type { PurchaseOrder } from "./types";

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function setUser(overrides: Partial<Parameters<ReturnType<typeof useAuthStore.getState>["setAuthenticated"]>[1]>) {
  act(() => {
    useAuthStore.getState().setAuthenticated("token-test", {
      id: 10,
      username: "tester",
      email: "tester@wms.local",
      full_name: "Tester",
      role_id: 2,
      role_name: "Warehouse Supervisor",
      is_active: true,
      permissions: [],
      warehouse_ids: [1],
      ...overrides,
    });
  });
}

const samplePoBase: PurchaseOrder = {
  id: 501,
  po_number: "PO-202611-0501",
  supplier_id: 2,
  supplier_code: "SUP-01",
  supplier_name: "PT Sumber Jaya",
  warehouse_id: 1,
  warehouse_code: "WH-JKT",
  warehouse_name: "Gudang Jakarta",
  status: "WAITING_L1_APPROVAL",
  order_date: "2026-11-15",
  expected_delivery_date: "2026-11-22",
  is_overdue: false,
  days_overdue: 0,
  notes: "Order prioritas",
  line_count: 1,
  total_amount: "15000000.00",
  created_by: 10,
  submitted_by: 10,
  submitted_at: "2026-11-15T08:00:00Z",
  l1_approved_by: null,
  l1_approved_at: null,
  l2_approved_by: null,
  l2_approved_at: null,
  rejection_reason: null,
  issued_at: null,
  issued_by: null,
  closed_reason: null,
  closed_at: null,
  closed_by: null,
  created_at: "2026-11-15T07:50:00Z",
  updated_at: "2026-11-15T08:00:00Z",
  lines: [
    {
      id: 1,
      po_id: 501,
      item_id: 7,
      item_sku: "SKU-007",
      item_name: "Kopi Arabika",
      uom_id: 1,
      uom_code: "PCS",
      allow_decimal: false,
      qty_ordered: "100",
      unit_price: "150000.00",
      line_subtotal: "15000000.00",
      qty_received: "0",
      qty_closed: "0",
      qty_remaining: "100",
      line_status: "OPEN",
      notes: null,
      created_by: 10,
      created_at: "2026-11-15T07:50:00Z",
      updated_at: "2026-11-15T07:50:00Z",
    },
  ],
  approval_logs: [
    {
      id: 1,
      doc_type: "PURCHASE_ORDER",
      doc_id: 501,
      approval_level: 0,
      action: "SUBMITTED",
      actor_id: 10,
      actor_name: "Budi Staff",
      actor_role: "Purchasing",
      notes: "Mohon disetujui",
      created_at: "2026-11-15T08:00:00Z",
    },
  ],
};

describe("Tahap 34 & 38 Frontend Controls (Approval, Settings, SoD)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  it("renders /admin/settings tab and updates po_l2_approval_threshold", async () => {
    setUser({ id: 1, role_name: "Super Admin", permissions: ["user:manage", "settings:manage"] });
    const getSpy = vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/settings/approval") {
        return {
          data: {
            po_l2_approval_threshold: "10000000.00",
            description: "Threshold L2 PO",
            updated_by: 1,
            updated_by_name: "Super Admin",
            updated_at: "2026-11-15T08:00:00Z",
          },
        } as never;
      }
      return { data: { items: [], total: 0, limit: 25, offset: 0 } } as never;
    });
    const putSpy = vi.spyOn(apiClient, "put").mockResolvedValue({
      data: {
        po_l2_approval_threshold: "25000000.00",
        description: "Threshold L2 PO",
        updated_by: 1,
        updated_by_name: "Super Admin",
        updated_at: "2026-11-15T09:00:00Z",
      },
    } as never);

    render(
      <QueryClientProvider client={makeClient()}>
        <MemoryRouter initialEntries={["/admin/settings"]}>
          <AdministrationPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const input = await screen.findByLabelText(/Ambang Batas L2 PO/i);
    expect((input as HTMLInputElement).value).toBe("10000000");

    fireEvent.change(input, { target: { value: "25000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan Pengaturan" }));

    await waitFor(() => {
      expect(putSpy).toHaveBeenCalledWith("/settings/approval", {
        po_l2_approval_threshold: "25000000",
      });
    });
    expect(getSpy).toHaveBeenCalled();
  });

  it("supports optional unit_price in PurchaseOrderCreateForm and calculates Total Estimasi PO", async () => {
    setUser({ id: 5, role_name: "Purchasing", permissions: ["po:create"] });
    const onSubmit = vi.fn(async () => undefined);

    render(
      <QueryClientProvider client={makeClient()}>
        <PurchaseOrderCreateForm
          isReferencesError={false}
          isReferencesLoading={false}
          isSubmitting={false}
          onClose={() => {}}
          onRetryReferences={() => {}}
          onSubmit={onSubmit}
          references={{
            suppliers: [{ id: 2, code: "SUP-01", name: "PT Sumber Jaya", is_active: true }],
            warehouses: [{ id: 1, code: "WH-JKT", name: "Gudang Jakarta", is_active: true }],
            items: [
              {
                id: 7,
                code: "SKU-007",
                sku: "SKU-007",
                name: "Kopi Arabika",
                uom_code: "PCS",
                allow_decimal: false,
                is_active: true,
              },
            ],
          }}
        />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText(/^Pemasok/i), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Tambah barang" }));
    fireEvent.change(screen.getByLabelText(/Kuantitas baris 1/i), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText(/Harga satuan baris 1/i), {
      target: { value: "150000" },
    });

    expect(screen.getByText(/Total Estimasi PO/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1\.500\.000/).length).toBeGreaterThanOrEqual(2);

    fireEvent.click(screen.getByRole("button", { name: "Simpan draft PO" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          lines: [
            expect.objectContaining({
              item_id: 7,
              qty_ordered: "10",
              unit_price: "150000",
            }),
          ],
        }),
      );
    });
  });

  it("blocks PO print before ISSUED, renders approval timeline, and enforces SoD on PO L1/L2", () => {
    const queryClient = makeClient();

    // Non-Super-Admin who created/submitted PO cannot self-approve L1
    setUser({ id: 10, role_name: "Warehouse Supervisor", permissions: ["po:approve_l1"] });
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <PurchaseOrderDetailModal
          canApproveL1
          canApproveL2={false}
          canCancel={false}
          canClose={false}
          canIssue
          isLoading={false}
          onAction={() => {}}
          onClose={() => {}}
          purchaseOrder={samplePoBase}
        />
      </QueryClientProvider>,
    );

    expect(screen.queryByRole("button", { name: /Cetak Purchase Order/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Setujui Level 1/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Aturan Pemisahan Tugas \(SoD\)/i)).toBeInTheDocument();
    expect(screen.getByText("Riwayat Persetujuan")).toBeInTheDocument();
    expect(screen.getByText(/Budi Staff/)).toBeInTheDocument();

    // Different Procurement Manager on WAITING_L2_APPROVAL sees Setujui Level 2 (Final) when not L1 actor
    setUser({ id: 99, role_name: "Procurement Manager", permissions: ["po:approve_l2"] });
    const l2Po: PurchaseOrder = {
      ...samplePoBase,
      status: "WAITING_L2_APPROVAL",
      l1_approved_by: 22,
      l1_approved_at: "2026-11-15T08:15:00Z",
    };
    rerender(
      <QueryClientProvider client={queryClient}>
        <PurchaseOrderDetailModal
          canApproveL1={false}
          canApproveL2
          canCancel={false}
          canClose={false}
          canIssue={false}
          isLoading={false}
          onAction={() => {}}
          onClose={() => {}}
          purchaseOrder={l2Po}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("button", { name: /Setujui Level 2 \(Final\)/i })).toBeInTheDocument();

    // Super Admin receives override notice and is still allowed to approve
    setUser({ id: 10, role_name: "Super Admin", permissions: ["po:approve_l1"] });
    rerender(
      <QueryClientProvider client={queryClient}>
        <PurchaseOrderDetailModal
          canApproveL1
          canApproveL2={false}
          canCancel
          canClose={false}
          canIssue
          isLoading={false}
          onAction={() => {}}
          onClose={() => {}}
          purchaseOrder={samplePoBase}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/Mode Override Super Admin/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Setujui Level 1/i })).toBeInTheDocument();
  });

  it("enforces gr:create vs gr:post split and SoD guard on GoodsReceiptDetailModal", () => {
    const queryClient = makeClient();
    const draftGr: GoodsReceipt = {
      id: 77,
      gr_number: "GR-202611-0077",
      po_id: 501,
      po_number: "PO-202611-0501",
      supplier_id: 2,
      supplier_code: "SUP-01",
      supplier_name: "PT Sumber Jaya",
      warehouse_id: 1,
      warehouse_code: "WH-JKT",
      warehouse_name: "Gudang Jakarta",
      status: "DRAFT",
      received_date: "2026-11-15",
      notes: null,
      line_count: 1,
      posted_at: null,
      posted_by: null,
      created_by: 10,
      created_at: "2026-11-15T09:00:00Z",
      updated_at: "2026-11-15T09:00:00Z",
      lines: [],
    };

    // Creator with gr:post cannot self-post
    setUser({ id: 10, role_name: "Warehouse Supervisor", permissions: ["gr:create", "gr:post"] });
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <GoodsReceiptDetailModal
          canCreate
          canPost
          isLoading={false}
          isMutating={false}
          onAction={async () => {}}
          onClose={() => {}}
          receipt={draftGr}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: "Batalkan draft" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Posting penerimaan" })).not.toBeInTheDocument();
    expect(screen.getByText(/Aturan Pemisahan Tugas \(SoD\)/i)).toBeInTheDocument();

    // Different Supervisor with gr:post can post
    setUser({ id: 25, role_name: "Warehouse Supervisor", permissions: ["gr:post"] });
    rerender(
      <QueryClientProvider client={queryClient}>
        <GoodsReceiptDetailModal
          canCreate={false}
          canPost
          isLoading={false}
          isMutating={false}
          onAction={async () => {}}
          onClose={() => {}}
          receipt={draftGr}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("button", { name: "Posting penerimaan" })).toBeInTheDocument();
  });

  it("enforces SoD guard on StockTransfersPage Setujui button", async () => {
    const draftTransfer: StockTransfer = {
      id: 88,
      transfer_number: "TRF-202611-0088",
      source_warehouse_id: 1,
      source_warehouse_code: "WH-JKT",
      source_warehouse_name: "Gudang Jakarta",
      source_location_id: 1,
      source_location_code: "RAK-A1",
      destination_warehouse_id: 1,
      destination_warehouse_code: "WH-JKT",
      destination_warehouse_name: "Gudang Jakarta",
      destination_location_id: 2,
      destination_location_code: "RAK-B1",
      status: "DRAFT",
      notes: null,
      line_count: 1,
      created_by: 10,
      created_at: "2026-11-15T09:00:00Z",
      updated_at: "2026-11-15T09:00:00Z",
      lines: [],
    };

    setUser({ id: 10, role_name: "Warehouse Supervisor", permissions: ["transfer:read", "transfer:approve"] });
    vi.spyOn(apiClient, "get").mockImplementation(async (url) => {
      if (url === "/stock-transfers") {
        return { data: { items: [draftTransfer], total: 1, limit: 20, offset: 0 } } as never;
      }
      if (url === "/stock-transfers/88") {
        return { data: draftTransfer } as never;
      }
      return { data: { items: [] } } as never;
    });

    render(
      <QueryClientProvider client={makeClient()}>
        <MemoryRouter>
          <StockTransfersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Detail" }));
    expect(await screen.findByText(/Aturan Pemisahan Tugas \(SoD\)/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Setujui" })).not.toBeInTheDocument();
  });

  it("supports 2-level Stock Opname approval and enforces SoD against counter/submitter/L1 approver", () => {
    const queryClient = makeClient();
    const l1Opname: StockOpname = {
      id: 99,
      opname_number: "OPN-202611-0099",
      warehouse_id: 1,
      warehouse_code: "WH-JKT",
      warehouse_name: "Gudang Jakarta",
      location_id: 1,
      location_code: "RAK-A1",
      location_name: "Rak A1",
      status: "WAITING_L1_APPROVAL",
      notes: null,
      line_count: 1,
      rejection_reason: null,
      submitted_by: 10,
      l1_approved_by: null,
      l1_approved_at: null,
      created_at: "2026-11-15T08:00:00Z",
      updated_at: "2026-11-15T08:30:00Z",
      lines: [
        {
          id: 1,
          location_id: 1,
          location_code: "RAK-A1",
          location_name: "Rak A1",
          item_id: 7,
          item_sku: "SKU-007",
          item_name: "Kopi Arabika",
          uom_code: "PCS",
          allow_decimal: false,
          qty_system: "10",
          qty_physical: "9",
          qty_variance: "-1",
          counted_by: 10,
          notes: null,
        },
      ],
      approval_logs: [
        {
          id: 1,
          doc_type: "STOCK_OPNAME",
          doc_id: 99,
          approval_level: 0,
          action: "SUBMITTED",
          actor_id: 10,
          actor_name: "Budi Staff",
          actor_role: "Warehouse Staff",
          notes: null,
          created_at: "2026-11-15T08:30:00Z",
        },
      ],
    };

    // Counter/submitter cannot self-approve L1
    setUser({ id: 10, role_name: "Warehouse Supervisor", permissions: ["opname:approve_l1"] });
    const canFn = (code: string) =>
      useAuthStore.getState().user?.permissions.includes(code) ?? false;

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <OpnameDetailModal
          can={canFn}
          isError={false}
          isLoading={false}
          onClose={() => {}}
          onEdit={() => {}}
          onRetry={() => {}}
          opname={l1Opname}
        />
      </QueryClientProvider>,
    );
    expect(screen.queryByRole("button", { name: "Setujui Level 1" })).not.toBeInTheDocument();
    expect(screen.getByText(/Aturan Pemisahan Tugas \(SoD\)/i)).toBeInTheDocument();

    // L1 approver cannot self-approve L2
    const l2Opname: StockOpname = {
      ...l1Opname,
      status: "WAITING_L2_APPROVAL",
      l1_approved_by: 20,
      l1_approved_at: "2026-11-15T09:00:00Z",
    };
    setUser({
      id: 20,
      role_name: "Warehouse Manager",
      permissions: ["opname:approve_l1", "opname:approve_l2"],
    });
    rerender(
      <QueryClientProvider client={queryClient}>
        <OpnameDetailModal
          can={canFn}
          isError={false}
          isLoading={false}
          onClose={() => {}}
          onEdit={() => {}}
          onRetry={() => {}}
          opname={l2Opname}
        />
      </QueryClientProvider>,
    );
    expect(screen.queryByRole("button", { name: "Setujui Level 2 (Final)" })).not.toBeInTheDocument();

    // Independent Warehouse Manager sees Setujui Level 2 (Final)
    setUser({ id: 30, role_name: "Warehouse Manager", permissions: ["opname:approve_l2"] });
    rerender(
      <QueryClientProvider client={queryClient}>
        <OpnameDetailModal
          can={canFn}
          isError={false}
          isLoading={false}
          onClose={() => {}}
          onEdit={() => {}}
          onRetry={() => {}}
          opname={l2Opname}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("button", { name: "Setujui Level 2 (Final)" })).toBeInTheDocument();
  });
});
