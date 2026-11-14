import QRCode from "qrcode";
import { isValidEan13 } from "@/features/master-data/stocks/utils/barcode";

export type BarcodeLabelPresetId =
  | "50x30"
  | "40x20"
  | "70x40"
  | "100x50"
  | "a4-3x8"
  | "a4-4x10"
  | "custom";

export type BarcodePaperMode = "thermal" | "a4";
export type BarcodeCodeAlign = "left" | "center" | "right";
export type BarcodeFormat = "barcode" | "qr";

export interface BarcodePrintConfig {
  presetId: BarcodeLabelPresetId;
  paperMode: BarcodePaperMode;
  widthMm: number;
  heightMm: number;
  marginMm: number;
  codeAlign: BarcodeCodeAlign;
  codeScale: number;
  copies: number;
  columns: number;
  pageMarginMm: number;
  gapMm: number;
  showMeta: boolean;
}

export interface BarcodeLabelPreset {
  id: Exclude<BarcodeLabelPresetId, "custom">;
  label: string;
  shortLabel: string;
  description: string;
  paperMode: BarcodePaperMode;
  widthMm: number;
  heightMm: number;
  marginMm: number;
  columns: number;
  rows: number;
  pageMarginMm: number;
  gapMm: number;
  defaultCopies: number;
}

export const BARCODE_LABEL_PRESETS: BarcodeLabelPreset[] = [
  {
    id: "50x30",
    label: "Barang Standar (50 x 30 mm)",
    shortLabel: "50 x 30 mm",
    description: "Standar kemasan box retail atau curah",
    paperMode: "thermal",
    widthMm: 50,
    heightMm: 30,
    marginMm: 2,
    columns: 1,
    rows: 1,
    pageMarginMm: 0,
    gapMm: 0,
    defaultCopies: 1,
  },
  {
    id: "40x20",
    label: "Barang Mini (40 x 20 mm)",
    shortLabel: "40 x 20 mm",
    description: "Kemasan kecil, unit elektronik, atau sachet",
    paperMode: "thermal",
    widthMm: 40,
    heightMm: 20,
    marginMm: 1.5,
    columns: 1,
    rows: 1,
    pageMarginMm: 0,
    gapMm: 0,
    defaultCopies: 1,
  },
  {
    id: "70x40",
    label: "Rak Lorong (70 x 40 mm)",
    shortLabel: "70 x 40 mm",
    description: "Label bibir rak & bin penyimpanan",
    paperMode: "thermal",
    widthMm: 70,
    heightMm: 40,
    marginMm: 3,
    columns: 1,
    rows: 1,
    pageMarginMm: 0,
    gapMm: 0,
    defaultCopies: 1,
  },
  {
    id: "100x50",
    label: "Rak Jarak Jauh (100 x 50 mm)",
    shortLabel: "100 x 50 mm",
    description: "Label palet & zona gudang jarak jauh",
    paperMode: "thermal",
    widthMm: 100,
    heightMm: 50,
    marginMm: 4,
    columns: 1,
    rows: 1,
    pageMarginMm: 0,
    gapMm: 0,
    defaultCopies: 1,
  },
  {
    id: "a4-3x8",
    label: "Kertas A4 3x8 (24 label)",
    shortLabel: "A4 3x8",
    description: "Lembar stiker A4 (63,5 x 33,9 mm per stiker)",
    paperMode: "a4",
    widthMm: 63.5,
    heightMm: 33.9,
    marginMm: 2.5,
    columns: 3,
    rows: 8,
    pageMarginMm: 8,
    gapMm: 2,
    defaultCopies: 24,
  },
  {
    id: "a4-4x10",
    label: "Kertas A4 4x10 (40 label)",
    shortLabel: "A4 4x10",
    description: "Lembar stiker A4 padat (47,5 x 25,7 mm per stiker)",
    paperMode: "a4",
    widthMm: 47.5,
    heightMm: 25.7,
    marginMm: 2,
    columns: 4,
    rows: 10,
    pageMarginMm: 8,
    gapMm: 2,
    defaultCopies: 40,
  },
];

export const BARCODE_LIMITS = {
  minWidthMm: 25,
  maxWidthMm: 210,
  minHeightMm: 15,
  maxHeightMm: 297,
  minMarginMm: 1,
  maxMarginMm: 15,
  minScalePct: 70,
  maxScalePct: 120,
  minCopies: 1,
  maxCopies: 60,
} as const;

export function getPresetById(
  presetId: BarcodeLabelPresetId,
): BarcodeLabelPreset | undefined {
  if (presetId === "custom") {
    return undefined;
  }
  return BARCODE_LABEL_PRESETS.find((preset) => preset.id === presetId);
}

export function createConfigFromPreset(
  presetId: BarcodeLabelPresetId = "50x30",
  overrides?: Partial<BarcodePrintConfig>,
): BarcodePrintConfig {
  const preset = getPresetById(presetId) ?? BARCODE_LABEL_PRESETS[0];
  return {
    presetId,
    paperMode: preset.paperMode,
    widthMm: preset.widthMm,
    heightMm: preset.heightMm,
    marginMm: preset.marginMm,
    codeAlign: "center",
    codeScale: 100,
    copies: preset.defaultCopies,
    columns: preset.columns,
    pageMarginMm: preset.pageMarginMm,
    gapMm: preset.gapMm,
    showMeta: true,
    ...overrides,
  };
}

export function getDefaultBarcodePrintConfig(): BarcodePrintConfig {
  return createConfigFromPreset("50x30");
}

export function validateBarcodePrintConfig(
  config: BarcodePrintConfig,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (
    !Number.isFinite(config.widthMm) ||
    config.widthMm < BARCODE_LIMITS.minWidthMm ||
    config.widthMm > BARCODE_LIMITS.maxWidthMm
  ) {
    errors.widthMm = `Lebar harus antara ${BARCODE_LIMITS.minWidthMm} sampai ${BARCODE_LIMITS.maxWidthMm} mm.`;
  }
  if (
    !Number.isFinite(config.heightMm) ||
    config.heightMm < BARCODE_LIMITS.minHeightMm ||
    config.heightMm > BARCODE_LIMITS.maxHeightMm
  ) {
    errors.heightMm = `Tinggi harus antara ${BARCODE_LIMITS.minHeightMm} sampai ${BARCODE_LIMITS.maxHeightMm} mm.`;
  }
  if (
    !Number.isFinite(config.marginMm) ||
    config.marginMm < BARCODE_LIMITS.minMarginMm ||
    config.marginMm > BARCODE_LIMITS.maxMarginMm
  ) {
    errors.marginMm = `Margin label harus antara ${BARCODE_LIMITS.minMarginMm} sampai ${BARCODE_LIMITS.maxMarginMm} mm.`;
  } else if (
    Number.isFinite(config.widthMm) &&
    Number.isFinite(config.heightMm) &&
    (config.marginMm * 2 >= config.widthMm - 10 ||
      config.marginMm * 2 >= config.heightMm - 6)
  ) {
    errors.marginMm = "Margin terlalu besar dibandingkan ukuran label.";
  }
  if (
    !Number.isInteger(config.copies) ||
    config.copies < BARCODE_LIMITS.minCopies ||
    config.copies > BARCODE_LIMITS.maxCopies
  ) {
    errors.copies = `Jumlah stiker harus bilangan bulat ${BARCODE_LIMITS.minCopies} sampai ${BARCODE_LIMITS.maxCopies}.`;
  }
  return errors;
}

export interface ScannabilityEvaluation {
  status: "optimal" | "caution" | "warning";
  moduleSizeMm: number;
  message: string;
}

/**
 * Menghitung perkiraan lebar modul bar/QR aktual dalam mm agar hasil cetak
 * tetap tajam dan mudah dipindai oleh scanner gun maupun kamera HP.
 */
export function evaluateBarcodeScannability(
  code: string,
  format: BarcodeFormat,
  config: BarcodePrintConfig,
): ScannabilityEvaluation {
  const trimmed = code.trim();
  const safeWidth = Math.max(BARCODE_LIMITS.minWidthMm, config.widthMm || 50);
  const safeHeight = Math.max(BARCODE_LIMITS.minHeightMm, config.heightMm || 30);
  const safeMargin = Math.max(1, config.marginMm || 2);
  const scaleFactor =
    Math.min(BARCODE_LIMITS.maxScalePct, Math.max(BARCODE_LIMITS.minScalePct, config.codeScale || 100)) /
    100;

  const innerWidthMm = Math.max(12, safeWidth - safeMargin * 2);
  const headerFooterAllowanceMm = safeHeight <= 24 ? 7 : 10;
  const innerHeightMm = Math.max(6, safeHeight - safeMargin * 2 - headerFooterAllowanceMm);

  if (format === "qr") {
    let moduleCount = 25;
    try {
      if (trimmed) {
        moduleCount = QRCode.create(trimmed, { errorCorrectionLevel: "M" }).modules.size;
      }
    } catch {
      moduleCount = 29;
    }
    const quietModules = 4; // margin=2 di kedua sisi
    const qrSideMm = Math.min(innerWidthMm, innerHeightMm) * scaleFactor;
    const moduleSizeMm = qrSideMm / (moduleCount + quietModules);

    if (moduleSizeMm < 0.25) {
      return {
        status: "warning",
        moduleSizeMm,
        message:
          "Ukuran QR sangat kecil (< 0,25 mm/modul). Perbesar tinggi label atau kurangi margin agar cepat terbaca.",
      };
    }
    if (moduleSizeMm < 0.35) {
      return {
        status: "caution",
        moduleSizeMm,
        message: "Ukuran QR cukup padat; pastikan printer minimal 203 DPI.",
      };
    }
    return {
      status: "optimal",
      moduleSizeMm,
      message: "Proporsi QR Code optimal dan tajam untuk kamera & scanner 2D.",
    };
  }

  const totalUnits = isValidEan13(trimmed)
    ? 95 + 16
    : 11 * Math.max(1, trimmed.length) + 35 + 16;
  const barcodeWidthMm = Math.min(innerWidthMm, 68) * scaleFactor;
  const moduleSizeMm = barcodeWidthMm / totalUnits;

  if (moduleSizeMm < 0.17 || innerHeightMm < 5.5) {
    return {
      status: "warning",
      moduleSizeMm,
      message:
        "Garis barcode terlalu rapat untuk panjang kode ini. Gunakan lebar >= 50 mm, kecilkan margin, atau pilih QR Code.",
    };
  }
  if (moduleSizeMm < 0.23) {
    return {
      status: "caution",
      moduleSizeMm,
      message: "Kerapatan garis cukup rapat; lakukan uji pindai sebelum cetak massal.",
    };
  }
  return {
    status: "optimal",
    moduleSizeMm,
    message: "Kerapatan garis barcode & quiet zone aman untuk scanner 1D.",
  };
}

export function computeVisualDimensionsPx(
  config: BarcodePrintConfig,
): { barcodeHeightPx: number; barcodeMaxWidthPercent: number; qrSizePx: number } {
  const safeHeight = Math.max(BARCODE_LIMITS.minHeightMm, config.heightMm || 30);
  const safeWidth = Math.max(BARCODE_LIMITS.minWidthMm, config.widthMm || 50);
  const safeMargin = Math.max(1, config.marginMm || 2);
  const scaleFactor =
    Math.min(BARCODE_LIMITS.maxScalePct, Math.max(BARCODE_LIMITS.minScalePct, config.codeScale || 100)) /
    100;

  // ~3.78 px per mm pada layar 96 DPI sebagai proporsi SVG yang bersih
  const pxPerMm = 3.2;
  const headerFooterAllowance = safeHeight <= 24 ? 8 : 11;
  const availableHeightMm = Math.max(6, safeHeight - safeMargin * 2 - headerFooterAllowance);
  const availableWidthMm = Math.max(14, safeWidth - safeMargin * 2);

  const barcodeHeightPx = Math.round(
    Math.min(72, Math.max(22, availableHeightMm * pxPerMm * scaleFactor)),
  );
  const qrSizePx = Math.round(
    Math.min(
      132,
      Math.max(36, Math.min(availableWidthMm, availableHeightMm) * pxPerMm * scaleFactor),
    ),
  );

  return {
    barcodeHeightPx,
    barcodeMaxWidthPercent: Math.round(scaleFactor * 100),
    qrSizePx,
  };
}
