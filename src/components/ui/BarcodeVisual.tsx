import QRCode from "qrcode";
import { isValidEan13 } from "@/features/master-data/stocks/utils/barcode";
import {
  type BarcodePrintConfig,
  computeVisualDimensionsPx,
  getDefaultBarcodePrintConfig,
} from "./barcode-print-presets";

const EAN13_PARITY = [
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLL",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
];

const EAN13_L = [
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
];

const EAN13_G = [
  "0100111",
  "0110011",
  "0011011",
  "0100001",
  "0011101",
  "0111001",
  "0000101",
  "0010001",
  "0001001",
  "0010111",
];

const EAN13_R = [
  "1110010",
  "1100110",
  "1101100",
  "1000010",
  "1011100",
  "1001110",
  "1010000",
  "1000100",
  "1001000",
  "1110100",
];

// Standar pola lebar bar/space Code-128 (0..106)
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312",
  "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222",
  "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131",
  "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321",
  "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121",
  "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224",
  "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114",
  "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112",
  "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
  "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412",
  "211214", "211232", "2331112",
];

function patternToBits(pattern: string): string {
  let bits = "";
  for (let i = 0; i < pattern.length; i += 1) {
    const width = Number(pattern[i]);
    bits += (i % 2 === 0 ? "1" : "0").repeat(width);
  }
  return bits;
}

export function encodeEan13Bits(code: string): string {
  const firstDigit = Number(code[0]);
  const parity = EAN13_PARITY[firstDigit] ?? "LLLLLL";
  let bits = "101";
  for (let i = 1; i <= 6; i += 1) {
    const digit = Number(code[i]);
    const mode = parity[i - 1];
    bits += mode === "G" ? EAN13_G[digit] : EAN13_L[digit];
  }
  bits += "01010";
  for (let i = 7; i <= 12; i += 1) {
    const digit = Number(code[i]);
    bits += EAN13_R[digit];
  }
  bits += "101";
  return bits;
}

export function encodeCode128BBits(value: string): string {
  const clean = value.trim();
  const startCodeB = 104;
  let checksum = startCodeB;
  let bits = patternToBits(CODE128_PATTERNS[startCodeB]);

  for (let i = 0; i < clean.length; i += 1) {
    const charCode = clean.charCodeAt(i);
    const symbolValue = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    checksum += symbolValue * (i + 1);
    bits += patternToBits(CODE128_PATTERNS[symbolValue]);
  }

  const checkSymbol = checksum % 103;
  bits += patternToBits(CODE128_PATTERNS[checkSymbol]);
  bits += patternToBits(CODE128_PATTERNS[106]);
  return bits;
}

export interface BarcodeVisualProps {
  value: string;
  height?: number;
  showValue?: boolean;
  subtitle?: string;
  className?: string;
  compact?: boolean;
  svgClassName?: string;
  svgStyle?: React.CSSProperties;
}

export function BarcodeVisual({
  value,
  height = 44,
  showValue = true,
  subtitle,
  className = "",
  compact = false,
  svgClassName = "w-full max-w-[260px]",
  svgStyle,
}: BarcodeVisualProps) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isEan = isValidEan13(trimmed);
  const bits = isEan ? encodeEan13Bits(trimmed) : encodeCode128BBits(trimmed);
  const quietZone = 8;
  const totalUnits = bits.length + quietZone * 2;

  const rects: Array<{ x: number; width: number }> = [];
  let index = 0;
  while (index < bits.length) {
    if (bits[index] === "1") {
      let runLength = 1;
      while (index + runLength < bits.length && bits[index + runLength] === "1") {
        runLength += 1;
      }
      rects.push({ x: quietZone + index, width: runLength });
      index += runLength;
    } else {
      index += 1;
    }
  }

  return (
    <div
      aria-label={`Visual barcode ${trimmed}`}
      className={`inline-flex flex-col items-center rounded-[var(--radius-sm)] bg-white ${
        compact ? "px-1 py-0.5" : "px-2.5 py-1.5"
      } text-ink-950 ${className}`}
    >
      <svg
        aria-hidden="true"
        className={svgClassName}
        height={height}
        preserveAspectRatio="none"
        role="img"
        shapeRendering="crispEdges"
        style={svgStyle}
        viewBox={`0 0 ${totalUnits} ${height}`}
      >
        <rect fill="#ffffff" height={height} width={totalUnits} x={0} y={0} />
        {rects.map((bar) => (
          <rect
            fill="#090d16"
            height={height}
            key={bar.x}
            shapeRendering="crispEdges"
            width={bar.width}
            x={bar.x}
            y={0}
          />
        ))}
      </svg>
      {showValue && (
        <span
          className={`${
            compact ? "mt-0.5 text-[9px] tracking-wider" : "mt-1 text-xs tracking-widest"
          } font-mono font-bold text-ink-950 tabular-nums`}
        >
          {trimmed}
        </span>
      )}
      {subtitle && (
        <span className="text-[10px] font-medium text-slate-600">
          {subtitle}
        </span>
      )}
    </div>
  );
}

export interface QrCodeVisualProps {
  value: string;
  size?: number;
  showValue?: boolean;
  subtitle?: string;
  className?: string;
  compact?: boolean;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export function QrCodeVisual({
  value,
  size = 80,
  showValue = true,
  subtitle,
  className = "",
  compact = false,
  errorCorrectionLevel = "M",
}: QrCodeVisualProps) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  let viewBoxSize: number;
  let path = "";
  try {
    const qr = QRCode.create(trimmed, { errorCorrectionLevel });
    const moduleCount = qr.modules.size;
    const margin = 2;
    viewBoxSize = moduleCount + margin * 2;

    for (let r = 0; r < moduleCount; r += 1) {
      for (let c = 0; c < moduleCount; c += 1) {
        if (qr.modules.get(r, c)) {
          path += `M${c + margin},${r + margin}h1v1h-1z `;
        }
      }
    }
  } catch {
    return null;
  }

  return (
    <div
      aria-label={`Visual QR code ${trimmed}`}
      className={`inline-flex flex-col items-center rounded-[var(--radius-sm)] bg-white ${
        compact ? "p-0.5" : "p-1.5"
      } text-ink-950 ${className}`}
    >
      <svg
        aria-hidden="true"
        className="shrink-0"
        height={size}
        role="img"
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        width={size}
      >
        <rect fill="#ffffff" height={viewBoxSize} width={viewBoxSize} x={0} y={0} />
        <path d={path.trim()} fill="#090d16" shapeRendering="crispEdges" />
      </svg>
      {showValue && (
        <span
          className={`${
            compact ? "mt-0.5 text-[9px]" : "mt-1 text-xs"
          } font-mono font-bold tracking-wider text-ink-950 tabular-nums`}
        >
          {trimmed}
        </span>
      )}
      {subtitle && (
        <span className="text-[10px] font-medium text-slate-600">
          {subtitle}
        </span>
      )}
    </div>
  );
}

export interface BarcodeStickerSheetProps {
  title: string;
  code: string;
  secondaryCode?: string | null;
  metaLabel?: string | null;
  badgeText?: string;
  visibleOnScreen?: boolean;
  format?: "barcode" | "qr";
  config?: BarcodePrintConfig;
}

export function BarcodeStickerSheet({
  title,
  code,
  secondaryCode,
  metaLabel,
  badgeText = "LABEL BARANG WMS",
  visibleOnScreen = false,
  format = "barcode",
  config,
}: BarcodeStickerSheetProps) {
  const effectiveConfig = config ?? getDefaultBarcodePrintConfig();
  const safeWidthMm = Number.isFinite(effectiveConfig.widthMm)
    ? Math.min(210, Math.max(25, effectiveConfig.widthMm))
    : 50;
  const safeHeightMm = Number.isFinite(effectiveConfig.heightMm)
    ? Math.min(297, Math.max(15, effectiveConfig.heightMm))
    : 30;
  const safeMarginMm = Number.isFinite(effectiveConfig.marginMm)
    ? Math.min(15, Math.max(1, effectiveConfig.marginMm))
    : 2;
  const safeCopies = Math.min(60, Math.max(1, Math.trunc(effectiveConfig.copies || 1)));
  const isMini = safeHeightMm <= 24 || safeWidthMm <= 44;
  const isLarge = safeWidthMm >= 80 && safeHeightMm >= 42;

  const { barcodeHeightPx, barcodeMaxWidthPercent, qrSizePx } =
    computeVisualDimensionsPx(effectiveConfig);

  const alignClass =
    effectiveConfig.codeAlign === "left"
      ? "justify-start text-left"
      : effectiveConfig.codeAlign === "right"
        ? "justify-end text-right"
        : "justify-center text-center";

  const pageCssRule =
    effectiveConfig.paperMode === "a4"
      ? `@page { size: A4 portrait; margin: ${effectiveConfig.pageMarginMm || 8}mm; }`
      : `@page { size: ${safeWidthMm}mm ${safeHeightMm}mm; margin: 0; }`;

  const gridStyle: React.CSSProperties | undefined =
    effectiveConfig.paperMode === "a4"
      ? {
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(1, effectiveConfig.columns || 3)}, ${safeWidthMm}mm)`,
          gap: `${Math.max(0, effectiveConfig.gapMm ?? 2)}mm`,
          justifyContent: "start",
        }
      : {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "3mm",
        };

  return (
    <section
      aria-label={`Label stiker ${format === "qr" ? "QR code" : "barcode"} ${code}`}
      className={`printable-document-sheet ${
        visibleOnScreen ? "mt-3 block overflow-x-auto" : "hidden"
      } text-ink-950 print:mt-0 print:block print:overflow-visible`}
      data-paper-mode={effectiveConfig.paperMode}
      data-preset-id={effectiveConfig.presetId}
    >
      <style>{`@media print { ${pageCssRule} .print-sticker-card { break-inside: avoid; page-break-inside: avoid; } }`}</style>
      <div className="mx-auto w-fit" style={gridStyle}>
        {Array.from({ length: safeCopies }).map((_, copyIdx) => (
          <article
            key={copyIdx}
            className="print-sticker-card box-border flex flex-col justify-between overflow-hidden rounded-[var(--radius-sm)] border border-dashed border-ink-950/60 bg-white text-ink-950 print:rounded-none print:border-solid print:border-ink-950"
            style={{
              width: `${safeWidthMm}mm`,
              minHeight: `${safeHeightMm}mm`,
              padding: `${safeMarginMm}mm`,
            }}
          >
            <div
              className={`flex items-center justify-between gap-1.5 border-b border-ink-950/30 pb-0.5 font-bold tracking-wider uppercase ${
                isMini ? "text-[7px]" : isLarge ? "text-[11px]" : "text-[9px]"
              }`}
            >
              <span>JEJAKSTOK</span>
              <span className="truncate">{badgeText}</span>
            </div>

            <p
              className={`mt-0.5 line-clamp-2 font-bold text-ink-950 ${
                effectiveConfig.codeAlign === "left"
                  ? "text-left"
                  : effectiveConfig.codeAlign === "right"
                    ? "text-right"
                    : "text-center"
              } ${
                isMini
                  ? "text-[8px] leading-3"
                  : isLarge
                    ? "text-sm leading-5"
                    : "text-[11px] leading-4"
              }`}
            >
              {title}
            </p>

            <div className={`my-0.5 flex w-full items-center ${alignClass}`}>
              {format === "qr" ? (
                <QrCodeVisual
                  className="py-0.5"
                  compact={isMini}
                  size={qrSizePx}
                  value={code}
                />
              ) : (
                <BarcodeVisual
                  className="py-0.5"
                  compact={isMini}
                  height={barcodeHeightPx}
                  svgClassName="w-full"
                  svgStyle={{ width: `${barcodeMaxWidthPercent}%`, maxWidth: "100%" }}
                  value={code}
                />
              )}
            </div>

            {effectiveConfig.showMeta && (
              <div
                className={`mt-0.5 flex flex-wrap items-center justify-between gap-1 border-t border-ink-950/30 pt-0.5 font-semibold text-slate-700 tabular-nums ${
                  isMini ? "text-[7px]" : isLarge ? "text-[11px]" : "text-[9px]"
                }`}
              >
                <span className="truncate">
                  {secondaryCode ? `SKU: ${secondaryCode}` : `KODE: ${code}`}
                </span>
                {metaLabel && <span className="truncate">{metaLabel}</span>}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
