import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { ModularDocumentPrintSheet } from "@/components/print/ModularDocumentPrintSheet";
import { useAuthStore } from "@/features/auth/store";
import { PurchaseOrdersPage } from "@/features/purchase-orders/pages/PurchaseOrdersPage";
import type { PurchaseOrder } from "@/features/purchase-orders/types";
import { apiClient } from "@/lib/api-client";
import { DocumentTemplateSettingsPanel } from "./components/DocumentTemplateSettingsPanel";
import { DEFAULT_DOCUMENT_TEMPLATES, type DocumentTemplate } from "./types";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

const samplePo: PurchaseOrder = {
  id: 88,
  po_number: "PO-202611-0088",
  supplier_id: 2,
  supplier_code: "SUP-B2B",
  supplier_name: "PT Distribusi Nusantara",
  warehouse_id: 1,
  warehouse_code: "WH-JKT",
  warehouse_name: "Gudang Pusat Jakarta",
  status: "ISSUED",
  order_date: "2026-11-14",
  notes: "Kirim ke pintu loading dock 2",
  line_count: 1,
  issued_at: "2026-11-14T08:00:00Z",
  issued_by: 1,
  closed_reason: null,
  closed_at: null,
  closed_by: null,
  created_by: 1,
  created_at: "2026-11-14T07:50:00Z",
  updated_at: "2026-11-14T08:00:00Z",
  lines: [
    {
      id: 881,
      po_id: 88,
      item_id: 7,
      item_sku: "SKU-RETAIL-01",
      item_barcode: "8991234567890",
      item_name: "Kopi Bubuk 250g",
      uom_id: 1,
      uom_code: "PCS",
      allow_decimal: false,
      qty_ordered: "100.0000",
      qty_received: "0.0000",
      notes: "Kemasan karton baru",
      created_by: 1,
      created_at: "2026-11-14T07:50:00Z",
      updated_at: "2026-11-14T07:50:00Z",
    },
  ],
};

describe("Modular Document Templates (Tahap 17)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      user: {
        id: 1,
        username: "admin",
        email: "admin@wms.local",
        full_name: "Admin WMS",
        role_id: 1,
        role_name: "Admin",
        is_active: true,
        permissions: [
          "user:manage",
          "po:read",
          "po:create",
          "po:issue",
          "gr:read",
        ],
        warehouse_ids: [1, 2],
      },
      accessToken: "test-token",
      status: "authenticated",
    });
  });

  it("merender ModularDocumentPrintSheet sesuai urutan bagian, kolom, logo, kertas F4 landscape, dan tanda tangan", () => {
    const customTemplate: DocumentTemplate = {
      ...DEFAULT_DOCUMENT_TEMPLATES.GOODS_RECEIPT,
      document_title: "BUKTI TERIMA KHUSUS CABANG",
      company_name: "PT LOGISTIK NUSANTARA",
      company_contact: "Telp: 021-8888-9999",
      logo_url: "/uploads/document_logos/logo-pt.png",
      logo_position: "CENTER",
      logo_size: "LARGE",
      header_notes: "Wajib stempel basah di halaman pertama.",
      footer_notes: "Arsip internal gudang pusat.",
      paper_size: "F4",
      orientation: "LANDSCAPE",
      margin_mm: 18,
      show_barcode: false,
      show_line_notes: false,
      show_company_contact: false,
      section_order: ["HEADER", "METADATA", "SIGNATURES", "TABLE", "NOTES"],
      table_columns: [
        { key: "no", label: "Urut", visible: true },
        { key: "item_name", label: "Produk", visible: true },
        { key: "uom", label: "Satuan", visible: false },
        { key: "qty_received", label: "Jumlah Masuk", visible: true },
        { key: "notes", label: "Catatan Baris", visible: true },
      ],
      signature_layout: [
        {
          title: "Pengirim",
          subtitle: "Ekspedisi",
          placeholder: "( TTD Pengirim )",
        },
        {
          title: "Penerima",
          subtitle: "Gudang",
          placeholder: "( TTD Penerima )",
        },
      ],
    };

    const { container } = render(
      <ModularDocumentPrintSheet
        ariaLabel="Dokumen kustom GRN"
        documentBarcodeValue="GRN-001"
        documentNotes="Catatan pengiriman rahasia"
        documentNumberLabel="No. GRN: GRN-001"
        metadata={[{ label: "Gudang", value: "WH-JKT" }]}
        rows={[
          {
            id: 1,
            cells: {
              no: 1,
              item_name: "Kopi Bubuk 250g",
              uom: "PCS",
              qty_received: "50",
              notes: "Catatan baris tersembunyi",
            },
          },
        ]}
        statusLabel="Status: POSTED"
        template={customTemplate}
        visibleOnScreen={true}
      />,
    );

    expect(screen.getByText("BUKTI TERIMA KHUSUS CABANG")).toBeInTheDocument();
    expect(screen.getByText("PT LOGISTIK NUSANTARA")).toBeInTheDocument();
    expect(
      screen.getByText("Wajib stempel basah di halaman pertama."),
    ).toBeInTheDocument();
    expect(screen.getByText("Arsip internal gudang pusat.")).toBeInTheDocument();
    expect(screen.queryByText("Telp: 021-8888-9999")).not.toBeInTheDocument();

    // show_barcode=false menyembunyikan barcode SVG, show_line_notes=false menyembunyikan kolom notes per baris sementara catatan dokumen tetap tampil
    expect(container.querySelector("svg[aria-label*='Barcode']")).toBeNull();
    expect(screen.queryByText("Catatan baris tersembunyi")).not.toBeInTheDocument();
    expect(screen.getByText("Catatan pengiriman rahasia")).toBeInTheDocument();

    // Kolom tersembunyi (uom) tidak dirender; label kustom (Jumlah Masuk) dirender
    expect(screen.queryByText("Satuan")).not.toBeInTheDocument();
    expect(screen.getByText("Jumlah Masuk")).toBeInTheDocument();

    // Logo tengah & CSS @page sesuai F4 landscape 18mm
    const logoImg = screen.getByAltText("Logo PT LOGISTIK NUSANTARA");
    expect(logoImg).toHaveAttribute("src", expect.stringContaining("/uploads/document_logos/logo-pt.png"));
    expect(container.textContent).toContain("@page");
    expect(container.textContent).toContain("210mm 330mm landscape");
    expect(container.textContent).toContain("margin: 18mm");

    // Urutan SIGNATURES sebelum TABLE
    const html = container.innerHTML;
    expect(html.indexOf("( TTD Pengirim )")).toBeLessThan(
      html.indexOf("Jumlah Masuk"),
    );
    expect(container.textContent).not.toMatch(/[—–]/);
  });

  it("mendukung pratinjau & cetak Purchase Order menggunakan template PURCHASE_ORDER", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url.startsWith("/document-templates/PURCHASE_ORDER")) {
        return {
          data: {
            ...DEFAULT_DOCUMENT_TEMPLATES.PURCHASE_ORDER,
            document_title: "SURAT PO RESMI TEST",
            company_name: "PT SUKSES MAKMUR",
          },
        };
      }
      if (url === "/purchase-orders") {
        return { data: { items: [samplePo], total: 1, limit: 20, offset: 0 } };
      }
      if (url === "/purchase-orders/88") {
        return { data: samplePo };
      }
      return { data: { items: [], total: 0, limit: 200, offset: 0 } };
    });

    const { container } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/purchase-orders"]}>
          <PurchaseOrdersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const poLink = await screen.findByRole("button", { name: "PO-202611-0088" });
    fireEvent.click(poLink);

    const previewBtn = await screen.findByRole("button", {
      name: /Pratinjau PO cetak/i,
    });
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/SURAT PO RESMI TEST/i).length).toBeGreaterThan(0);
    });

    const printButtons = screen.getAllByRole("button", {
      name: /Cetak Purchase Order/i,
    });
    fireEvent.click(printButtons[0]);
    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText("PT SUKSES MAKMUR").length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/[—–]/);
  });

  it("mengelola pengaturan template di admin, validasi form, unggah logo, dan simpan ke backend", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/document-templates") {
        return {
          data: [
            DEFAULT_DOCUMENT_TEMPLATES.GOODS_RECEIPT,
            DEFAULT_DOCUMENT_TEMPLATES.STOCK_TRANSFER,
            DEFAULT_DOCUMENT_TEMPLATES.PURCHASE_ORDER,
          ],
        };
      }
      return { data: [] };
    });

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        logo_url: "/uploads/document_logos/uploaded-abc.png",
        filename: "uploaded-abc.png",
        content_type: "image/png",
        size_bytes: 128,
      },
    });

    const putSpy = vi.spyOn(apiClient, "put").mockImplementation(
      async (_url: string, body: unknown) => ({
        data: {
          ...DEFAULT_DOCUMENT_TEMPLATES.GOODS_RECEIPT,
          ...(body as object),
          updated_at: "2026-11-14T12:30:00Z",
        },
      }),
    );

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <DocumentTemplateSettingsPanel />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText("Judul Dokumen Cetak *"),
      ).toHaveValue("BUKTI PENERIMAAN BARANG (GOODS RECEIPT NOTE)");
    });

    // Validasi menolak judul kosong sebelum memanggil PUT
    const titleInput = screen.getByLabelText("Judul Dokumen Cetak *");
    fireEvent.change(titleInput, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /Simpan Template/i }));

    expect(
      (await screen.findAllByText(/Judul dokumen wajib diisi/i)).length,
    ).toBeGreaterThan(0);
    expect(putSpy).not.toHaveBeenCalled();

    // Perbaiki judul, ubah nama perusahaan, pakai preset 2 kolom, naikkan bagian 2, upload logo, lalu simpan
    fireEvent.change(titleInput, { target: { value: "GRN GUDANG BARU" } });
    fireEvent.change(screen.getByLabelText("Nama Perusahaan / Gudang *"), {
      target: { value: "PT JAYA LOGISTIK" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preset 2 Kolom" }));
    fireEvent.click(screen.getByLabelText("Naikkan bagian METADATA"));

    const fileInput = screen.getByLabelText("Unggah file logo perusahaan");
    const pngFile = new File(["pngbytes"], "logo.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [pngFile] } });

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        "/document-templates/upload-logo",
        expect.any(FormData),
        expect.any(Object),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /Simpan Template/i }));

    await waitFor(() => {
      expect(putSpy).toHaveBeenCalledWith(
        "/document-templates/GOODS_RECEIPT",
        expect.objectContaining({
          document_title: "GRN GUDANG BARU",
          company_name: "PT JAYA LOGISTIK",
          logo_url: "/uploads/document_logos/uploaded-abc.png",
          section_order: ["METADATA", "HEADER", "TABLE", "NOTES", "SIGNATURES"],
          signature_layout: expect.arrayContaining([
            expect.objectContaining({ title: "Disiapkan Oleh" }),
            expect.objectContaining({ title: "Disetujui Oleh" }),
          ]),
        }),
      );
    });
  });
});
