import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/features/auth/store";
import { menuQueryKey } from "@/features/navigation/api";
import {
  resolveGuideModuleFromPath,
  simulateBarcodeScan,
} from "./guideContent";
import { useUserGuideStore } from "./store";

function NonDestructiveFormHarness() {
  const [notes, setNotes] = useState("Catatan PO Vendor A");
  const [qty, setQty] = useState("25");
  return (
    <div>
      <PageHeader
        description="Simulasi halaman transaksi"
        title="Buat penerimaan barang"
      />
      <input
        aria-label="Catatan transaksi"
        onChange={(event) => setNotes(event.target.value)}
        value={notes}
      />
      <input
        aria-label="Qty input"
        onChange={(event) => setQty(event.target.value)}
        value={qty}
      />
    </div>
  );
}

describe("Tahap 18: Fitur Tutorial & Panduan Input Data Interaktif", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useUserGuideStore.setState({
      isOpen: false,
      activeModuleId: "dashboard",
      activeTab: "module",
      walkthroughStep: 1,
      completedSteps: [],
    });
    useAuthStore.setState({
      user: {
        id: 1,
        username: "operator1",
        email: "op@wms.local",
        full_name: "Staf Gudang",
        role_id: 2,
        role_name: "Operator",
        is_active: true,
        permissions: ["po:read", "gr:read", "stock:read"],
        warehouse_ids: [1],
      },
      accessToken: "token-123",
      status: "authenticated",
    });
  });

  it("memetakan rute halaman ke modul panduan kontekstual & memvalidasi simulasi scan barcode", () => {
    expect(resolveGuideModuleFromPath("/purchase-orders/new")).toBe(
      "purchase-order-create",
    );
    expect(resolveGuideModuleFromPath("/purchasing/goods-receipts/new")).toBe(
      "goods-receipt-create",
    );
    expect(resolveGuideModuleFromPath("/stock/ledger")).toBe("stock-monitoring");
    expect(resolveGuideModuleFromPath("/stock-transfers")).toBe(
      "stock-transfers",
    );
    expect(resolveGuideModuleFromPath("/stock-opnames")).toBe("stock-opnames");
    expect(resolveGuideModuleFromPath("/admin/document-templates")).toBe(
      "document-templates",
    );
    expect(resolveGuideModuleFromPath("/master/uoms")).toBe("master-uoms");

    expect(simulateBarcodeScan("8991234567890")).toMatchObject({
      status: "VALID",
      detectedKind: "PRODUCT",
    });
    expect(simulateBarcodeScan("LOC-WHJKT-RACKA1")).toMatchObject({
      status: "VALID",
      detectedKind: "LOCATION",
    });
    expect(simulateBarcodeScan("PO-202611-0088")).toMatchObject({
      status: "VALID",
      detectedKind: "DOCUMENT",
    });
    expect(simulateBarcodeScan("AB 12")).toMatchObject({
      status: "INVALID",
      detectedKind: "UNKNOWN",
    });
  });

  it("membuka panduan dari PageHeader tanpa mengganggu data form yang sedang diinput dan mendukung walkthrough + kamus field + simulasi barcode", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/goods-receipts/new"]}>
        <NonDestructiveFormHarness />
      </MemoryRouter>,
    );

    const notesInput = screen.getByLabelText("Catatan transaksi") as HTMLInputElement;
    const qtyInput = screen.getByLabelText("Qty input") as HTMLInputElement;
    fireEvent.change(notesInput, { target: { value: "Barang datang sebagian" } });
    fireEvent.change(qtyInput, { target: { value: "42" } });

    const guideBtn = screen.getByRole("button", { name: "Panduan / Bantuan" });
    fireEvent.click(guideBtn);

    const dialog = screen.getByRole("dialog", {
      name: "Panduan Pengguna dan SOP WMS",
    });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Formulir Input Penerimaan Barang & Scan Barcode",
      ),
    ).toBeInTheDocument();

    // Pindah ke tab Alur Kerja WMS (Walkthrough 5 tahap)
    fireEvent.click(within(dialog).getByRole("tab", { name: /Alur Kerja WMS/i }));
    expect(
      within(dialog).getByText("1. Pengadaan Purchase Order (PO)"),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Tandai Selesai" }));
    expect(within(dialog).getByText("Selesai: 1/5 tahap")).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Langkah Berikutnya/i }),
    );
    expect(
      within(dialog).getByText("2. Penerimaan Barang (Goods Receipt / GRN)"),
    ).toBeInTheDocument();

    // Pindah ke tab Kamus Field & Contoh dan filter kata kunci
    fireEvent.click(
      within(dialog).getByRole("tab", { name: /Kamus Field & Contoh/i }),
    );
    const searchField = within(dialog).getByLabelText(
      "Cari penjelasan field transaksi",
    );
    fireEvent.change(searchField, { target: { value: "allow_decimal" } });
    expect(
      within(dialog).getByText("Satuan UoM Desimal vs Non-Desimal"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Kebijakan Stok Negatif per Gudang"),
    ).not.toBeInTheDocument();

    // Pindah ke tab Simulasi Scan
    fireEvent.click(within(dialog).getByRole("tab", { name: /Simulasi Scan/i }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: /QR \/ Barcode Lokasi Rak/i }),
    );
    expect(
      within(dialog).getByText("Kode / QR Lokasi Rak Simpan"),
    ).toBeInTheDocument();

    const simInput = within(dialog).getByLabelText("Input simulasi barcode");
    fireEvent.change(simInput, { target: { value: "XX" } });
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Simulasikan Scan/i }),
    );
    expect(within(dialog).getByText("Format Kode Tidak Valid")).toBeInTheDocument();

    // Tutup modal menggunakan tombol Lanjutkan Pekerjaan & pastikan data form tetap utuh
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Lanjutkan Pekerjaan" }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Panduan Pengguna dan SOP WMS" }),
    ).not.toBeInTheDocument();
    expect(notesInput.value).toBe("Barang datang sebagian");
    expect(qtyInput.value).toBe("42");
    expect(container.textContent).not.toMatch(/[—–]/);
  });

  it.each([
    { label: "ponsel", width: 375 },
    { label: "tablet", width: 768 },
    { label: "desktop", width: 1280 },
  ])(
    "membuka panduan tanpa duplikasi dialog di dalam AppShell pada ukuran layar $label ($width px)",
    ({ width }) => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: width,
      });
      const queryClient = new QueryClient();
      queryClient.setQueryData(menuQueryKey, []);

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/purchase-orders"]}>
            <Routes>
              <Route element={<AppShell />}>
                <Route
                  element={
                    <PageHeader
                      description="Daftar PO aktif"
                      title="Purchase Order"
                    />
                  }
                  path="/purchase-orders"
                />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      // Buka via tombol Bantuan di Topbar maupun tombol Panduan di PageHeader -> tetap hanya 1 dialog
      const headerGuideBtn = screen.getByRole("button", {
        name: "Panduan / Bantuan",
      });
      fireEvent.click(headerGuideBtn);
      expect(screen.getAllByRole("dialog")).toHaveLength(1);

      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      const topbarHelpBtn = screen.getByRole("button", {
        name: "Buka panduan / bantuan aplikasi",
      });
      fireEvent.click(topbarHelpBtn);
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(container.textContent).not.toMatch(/[—–]/);
    },
  );
});
