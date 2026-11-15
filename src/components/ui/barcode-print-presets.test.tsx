import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { StockDetailDialog } from "@/features/master-data/stocks/components/StockDetailDialog";
import { StorageLocationDetailDialog } from "@/features/master-data/storage-locations/components/StorageLocationDetailDialog";
import { WarehouseDetailDialog } from "@/features/master-data/warehouses/components/WarehouseDetailDialog";
import { BarcodePrintConfigurator } from "./BarcodePrintConfigurator";
import { BarcodeStickerSheet } from "./BarcodeVisual";
import {
  BARCODE_LABEL_PRESETS,
  type BarcodeFormat,
  type BarcodePrintConfig,
  computeVisualDimensionsPx,
  createConfigFromPreset,
  evaluateBarcodeScannability,
  validateBarcodePrintConfig,
} from "./barcode-print-presets";

function ConfiguratorHarness({
  initialFormat = "barcode",
  code = "8991234567890",
  onPrintSpy,
}: {
  initialFormat?: BarcodeFormat;
  code?: string;
  onPrintSpy: () => void;
}) {
  const [format, setFormat] = useState<BarcodeFormat>(initialFormat);
  const [config, setConfig] = useState<BarcodePrintConfig>(() =>
    createConfigFromPreset("50x30"),
  );

  return (
    <BarcodePrintConfigurator
      badgeText="LABEL BARANG WMS"
      code={code}
      config={config}
      format={format}
      metaLabel="PCS · Elektronik"
      onConfigChange={setConfig}
      onFormatChange={setFormat}
      onPrint={onPrintSpy}
      secondaryCode="ELK-ESP32"
      title="Microcontroller ESP32-S3"
      visibleOnScreen={true}
    />
  );
}

describe("Tahap 16: Fleksibilitas Ukuran Cetak QR Code dan Barcode", () => {
  it("membuat konfigurasi preset (40x20, 50x30, 70x40, 100x50, A4 3x8, A4 4x10) beserta validasi batas kustom", () => {
    const mini = createConfigFromPreset("40x20");
    expect(mini).toMatchObject({
      presetId: "40x20",
      paperMode: "thermal",
      widthMm: 40,
      heightMm: 20,
      copies: 1,
    });

    const a4 = createConfigFromPreset("a4-3x8");
    expect(a4).toMatchObject({
      presetId: "a4-3x8",
      paperMode: "a4",
      columns: 3,
      copies: 24,
    });

    const invalid = validateBarcodePrintConfig({
      ...mini,
      presetId: "custom",
      widthMm: 10,
      heightMm: 500,
      marginMm: 18,
      copies: 0,
    });
    expect(invalid.widthMm).toBeTruthy();
    expect(invalid.heightMm).toBeTruthy();
    expect(invalid.marginMm).toBeTruthy();
    expect(invalid.copies).toBeTruthy();
  });

  it("mengevaluasi keterbacaan barcode 1D sempit vs lebar dan QR code", () => {
    const narrowLongBarcode = evaluateBarcodeScannability(
      "VERY-LONG-WAREHOUSE-SKU-1234567890",
      "barcode",
      createConfigFromPreset("40x20", { marginMm: 5, codeScale: 70 }),
    );
    expect(narrowLongBarcode.status).toBe("warning");

    const wideQr = evaluateBarcodeScannability(
      "VERY-LONG-WAREHOUSE-SKU-1234567890",
      "qr",
      createConfigFromPreset("70x40"),
    );
    expect(wideQr.status).toBe("optimal");
    expect(wideQr.moduleSizeMm).toBeGreaterThanOrEqual(0.35);
  });

  it("merender BarcodeStickerSheet untuk A4 grid multi-salinan dan dimensi kustom dengan alignment & margin", () => {
    const a4Config = createConfigFromPreset("a4-3x8", {
      copies: 6,
      codeAlign: "left",
      marginMm: 3,
    });
    const { container } = render(
      <BarcodeStickerSheet
        badgeText="LABEL LOKASI RAK"
        code="JKT-RAK-A1"
        config={a4Config}
        format="qr"
        metaLabel="GUDANG: WH-JKT"
        secondaryCode="WH-JKT"
        title="Rak A1 Utama"
        visibleOnScreen={true}
      />,
    );

    const cards = container.querySelectorAll("article.print-sticker-card");
    expect(cards).toHaveLength(6);
    expect((cards[0] as HTMLElement).style.width).toBe("63.5mm");
    expect((cards[0] as HTMLElement).style.height).toBe("33.9mm");
    expect((cards[0] as HTMLElement).style.padding).toBe("3mm");
    expect(screen.getAllByLabelText("Visual QR code JKT-RAK-A1")).toHaveLength(6);
    expect(container.textContent).not.toMatch(/[—–]/);
  });

  it("memastikan kalibrasi grid preset A4 muat di halaman 210x297mm tanpa luber ke halaman berikutnya", () => {
    const a4Presets = BARCODE_LABEL_PRESETS.filter((preset) => preset.paperMode === "a4");
    expect(a4Presets.length).toBeGreaterThanOrEqual(2);

    for (const preset of a4Presets) {
      const totalWidthMm =
        preset.columns * preset.widthMm +
        (preset.columns - 1) * preset.gapMm +
        preset.pageMarginMm * 2;
      const totalHeightMm =
        preset.rows * preset.heightMm +
        (preset.rows - 1) * preset.gapMm +
        preset.pageMarginMm * 2;
      expect(totalWidthMm).toBeLessThanOrEqual(210);
      expect(totalHeightMm).toBeLessThanOrEqual(297);
    }
  });

  it("memungkinkan pemilihan preset, edit ukuran kustom, ganti posisi, validasi error, dan trigger cetak pada BarcodePrintConfigurator", () => {
    const printSpy = vi.fn();
    render(<ConfiguratorHarness onPrintSpy={printSpy} />);

    // Pilih preset Rak Lorong 70 x 40 mm
    fireEvent.click(screen.getByRole("button", { name: /Rak Lorong \(70 x 40 mm\)/i }));
    const widthInput = screen.getByLabelText("Lebar Label (mm)") as HTMLInputElement;
    const heightInput = screen.getByLabelText("Tinggi Label (mm)") as HTMLInputElement;
    expect(widthInput.value).toBe("70");
    expect(heightInput.value).toBe("40");

    // Pilih preset A4 4x10 -> jumlah stiker menjadi 40
    fireEvent.click(screen.getByRole("button", { name: /Kertas A4 4x10/i }));
    const copiesInput = screen.getByLabelText("Jumlah Stiker") as HTMLInputElement;
    expect(copiesInput.value).toBe("40");

    // Kembali ke ukuran standar dan uji posisi Kiri + 2D QR Code + cetak
    fireEvent.click(screen.getByRole("button", { name: /Barang Standar \(50 x 30 mm\)/i }));
    fireEvent.click(screen.getByRole("button", { name: "Kiri" }));
    fireEvent.click(screen.getByRole("button", { name: "2D QR Code" }));
    expect(screen.getByLabelText("Label stiker QR code 8991234567890")).toBeInTheDocument();

    // Isi lebar tidak valid -> tombol cetak nonaktif & pesan error muncul
    fireEvent.change(widthInput, { target: { value: "10" } });
    expect(screen.getByText(/Lebar harus antara 25 sampai 210 mm/i)).toBeInTheDocument();
    const printBtn = screen.getByRole("button", { name: /Cetak Sekarang/i });
    expect(printBtn).toBeDisabled();

    // Perbaiki lebar -> tombol cetak aktif kembali dan memanggil onPrintSpy
    fireEvent.change(widthInput, { target: { value: "80" } });
    expect(printBtn).not.toBeDisabled();
    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("mengisolasi lembar cetak stiker terdedikasi dari konten halaman <main>, overlay, header, metadata, dan footer modal detail", () => {
    const { unmount } = render(
      <div id="root">
        <main>
          <h1>Halaman Latar Belakang Barang</h1>
        </main>
        <StockDetailDialog
          canManage={false}
          item={{
            id: 10,
            sku: "ELK-ESP32-01",
            barcode: "2000000000107",
            name: "Microcontroller ESP32-S3",
            description: "Board MCU",
            category_id: 1,
            category_name: "Elektronik",
            uom_id: 1,
            uom_code: "PCS",
            uom_name: "Pieces",
            allow_decimal: false,
            is_active: true,
            created_by: 1,
            created_at: "2026-11-10T08:00:00Z",
            updated_at: "2026-11-14T08:00:00Z",
          }}
          onClose={vi.fn()}
          onEdit={vi.fn()}
          onToggleStatus={vi.fn()}
        />
      </div>,
    );

    expect(document.body).toHaveClass("wms-sticker-print-mode");
    const dialog = screen.getByRole("dialog", { name: "Microcontroller ESP32-S3" });
    expect(dialog).toHaveAttribute("data-sticker-print-dialog", "true");
    // Portal shadcn Dialog berada di luar #root sehingga #root bisa disembunyikan utuh saat cetak
    expect(dialog.closest("#root")).toBeNull();

    const metadata = dialog.querySelector('[data-slot="sticker-dialog-metadata"]');
    expect(metadata).not.toBeNull();
    expect(metadata).toHaveClass("no-print");

    const header = dialog.querySelector('[data-slot="dialog-header"]');
    const footer = dialog.querySelector('[data-slot="dialog-footer"]');
    expect(header).toHaveClass("no-print");
    expect(footer).toHaveClass("no-print");

    const stickerSheet = dialog.querySelector('[data-slot="barcode-sticker-sheet"]');
    const stickerBody = dialog.querySelector('[data-slot="sticker-dialog-body"]');
    expect(stickerBody).not.toBeNull();
    expect(stickerSheet).not.toBeNull();
    expect(stickerSheet).toHaveClass("printable-sticker-sheet");
    expect(stickerSheet).not.toHaveClass("no-print");
    expect(stickerSheet?.closest(".no-print")).toBeNull();

    unmount();
    expect(document.body).not.toHaveClass("wms-sticker-print-mode");

    const locView = render(
      <StorageLocationDetailDialog
        canManage={false}
        location={{
          id: "3",
          warehouse_id: "1",
          warehouse_code: "WH-JKT",
          warehouse_name: "Gudang Pusat Jakarta",
          code: "RAK-A01",
          name: "Rak Utama A01",
          is_active: true,
          created_by: "1",
          created_at: "2026-11-10T08:00:00Z",
          updated_at: "2026-11-14T08:00:00Z",
        }}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(document.body).toHaveClass("wms-sticker-print-mode");
    expect(
      screen.getByRole("dialog", { name: "Rak Utama A01" }),
    ).toHaveAttribute("data-sticker-print-dialog", "true");
    locView.unmount();

    const whView = render(
      <WarehouseDetailDialog
        canManage={false}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        warehouse={{
          id: 1,
          code: "WH-JKT",
          name: "Gudang Pusat Jakarta",
          address: "Jl. Industri No. 1",
          allow_negative_stock: false,
          is_active: true,
          created_by: 1,
          created_at: "2026-11-10T08:00:00Z",
          updated_at: "2026-11-14T08:00:00Z",
        }}
      />,
    );
    expect(document.body).toHaveClass("wms-sticker-print-mode");
    expect(
      screen.getByRole("dialog", { name: "Gudang Pusat Jakarta" }),
    ).toHaveAttribute("data-sticker-print-dialog", "true");
    whView.unmount();
    expect(document.body).not.toHaveClass("wms-sticker-print-mode");
  });

  it("uses GUDANG footer label on Location and Warehouse stickers instead of SKU", () => {
    const locView = render(
      <StorageLocationDetailDialog
        canManage={false}
        location={{
          id: "21",
          warehouse_id: "1",
          warehouse_code: "WH-JKT-01",
          warehouse_name: "Gudang Pusat Jakarta",
          code: "JKT-RCV-01",
          name: "Area Receiving & Inbound Staging",
          is_active: true,
          created_by: "1",
          created_at: "2026-11-10T08:00:00Z",
          updated_at: "2026-11-14T08:00:00Z",
        }}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    const locSheet = locView.container.ownerDocument.querySelector(
      '[data-slot="barcode-sticker-sheet"]',
    );
    expect(locSheet).toHaveTextContent(/GUDANG:\s*Gudang Pusat Jakarta/i);
    expect(locSheet).not.toHaveTextContent(/SKU:/i);
    locView.unmount();

    const whView = render(
      <WarehouseDetailDialog
        canManage={false}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        warehouse={{
          id: 2,
          code: "WH-JKT-01",
          name: "Gudang Pusat Jakarta",
          address: "Jl. Industri No. 1",
          allow_negative_stock: false,
          is_active: true,
          created_by: 1,
          created_at: "2026-11-10T08:00:00Z",
          updated_at: "2026-11-14T08:00:00Z",
        }}
      />,
    );

    const whSheet = whView.container.ownerDocument.querySelector(
      '[data-slot="barcode-sticker-sheet"]',
    );
    expect(whSheet).toHaveTextContent(/GUDANG:\s*WH-JKT-01/i);
    expect(whSheet).not.toHaveTextContent(/SKU:/i);
    whView.unmount();
  });

  it("emits top-level @page rule and clamps SVG dimensions inside card height", () => {
    const cfg = createConfigFromPreset("70x40");
    cfg.codeScale = 115;

    const { container } = render(
      <BarcodeStickerSheet
        badgeText="LABEL LOKASI RAK"
        code="JKT-RCV-01"
        config={cfg}
        format="qr"
        metaLabel="WH-JKT-01"
        secondaryCode="Gudang Pusat Jakarta"
        secondaryLabel="GUDANG"
        title="JKT-RCV-01 · Area Receiving & Inbound Staging"
      />,
    );

    const styleEl = container.querySelector("style");
    const cssText = styleEl?.textContent ?? "";
    expect(cssText).toContain("@page { size: 70mm 40mm; margin: 0; }");
    expect(cssText).toContain("height: 39.6mm !important;");
    expect(cssText.indexOf("@page")).toBeLessThan(
      cssText.indexOf("@media print"),
    );

    for (const preset of BARCODE_LABEL_PRESETS) {
      const testCfg = createConfigFromPreset(preset.id);
      testCfg.codeScale = 115;
      const dims = computeVisualDimensionsPx(testCfg);
      const maxCardHeightPx = testCfg.heightMm * 3.78;
      expect(dims.barcodeHeightPx).toBeGreaterThanOrEqual(16);
      expect(dims.barcodeHeightPx).toBeLessThan(maxCardHeightPx);
      expect(dims.qrSizePx).toBeGreaterThanOrEqual(18);
      expect(dims.qrSizePx).toBeLessThan(maxCardHeightPx);
    }
  });
});
