import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { BarcodePrintConfigurator } from "./BarcodePrintConfigurator";
import { BarcodeStickerSheet } from "./BarcodeVisual";
import {
  type BarcodeFormat,
  type BarcodePrintConfig,
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
    expect((cards[0] as HTMLElement).style.padding).toBe("3mm");
    expect(screen.getAllByLabelText("Visual QR code JKT-RAK-A1")).toHaveLength(6);
    expect(container.textContent).not.toMatch(/[—–]/);
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
});
