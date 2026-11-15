import QRCode from "qrcode";
import { isValidEan13 } from "@/features/master-data/stocks/utils/barcode";
import {
  type BarcodePrintConfig,
  computeVisualDimensionsPx,
  getDefaultBarcodePrintConfig,
} from "./barcode-print-presets";
import { encodeCode128BBits, encodeEan13Bits } from "./barcode-encoding";

export interface BarcodeVisualProps {
  value: string;
  height?: number;
  showValue?: boolean;
  subtitle?: string;
  className?: string;
  compact?: boolean;
  stickerMode?: boolean;
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
  stickerMode = false,
  svgClassName = "w-full max-w-[260px]",
  svgStyle,
}: BarcodeVisualProps) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isEan = isValidEan13(trimmed);
  const bits = isEan ? encodeEan13Bits(trimmed) : encodeCode128BBits(trimmed);
  const quietZone = 10;
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
        stickerMode ? "p-0" : compact ? "px-1 py-0.5" : "px-2.5 py-1.5"
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
            stickerMode
              ? compact
                ? "mt-0.5 text-[7px] leading-none tracking-wider"
                : "mt-0.5 text-[9.5px] leading-none tracking-wider"
              : compact
                ? "mt-0.5 text-[9px] tracking-wider"
                : "mt-1 text-xs tracking-widest"
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
  stickerMode?: boolean;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export function QrCodeVisual({
  value,
  size = 80,
  showValue = true,
  subtitle,
  className = "",
  compact = false,
  stickerMode = false,
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
    const margin = 3;
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
        stickerMode ? "p-0" : compact ? "p-0.5" : "p-1.5"
      } text-ink-950 ${className}`}
    >
      <svg
        aria-hidden="true"
        className="shrink-0"
        height={size}
        role="img"
        style={{ maxWidth: "100%", maxHeight: "100%" }}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        width={size}
      >
        <rect fill="#ffffff" height={viewBoxSize} width={viewBoxSize} x={0} y={0} />
        <path d={path.trim()} fill="#090d16" shapeRendering="crispEdges" />
      </svg>
      {showValue && (
        <span
          className={`${
            stickerMode
              ? compact
                ? "mt-0.5 text-[7px] leading-none tracking-wider"
                : "mt-0.5 text-[9.5px] leading-none tracking-wider"
              : compact
                ? "mt-0.5 text-[9px] tracking-wider"
                : "mt-1 text-xs tracking-wider"
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

export interface BarcodeStickerSheetProps {
  title: string;
  code: string;
  secondaryCode?: string | null;
  secondaryLabel?: string;
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
  secondaryLabel = "SKU",
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
      ? `@page { size: A4 portrait; margin: ${effectiveConfig.pageMarginMm || 5}mm; }`
      : `@page { size: ${safeWidthMm}mm ${safeHeightMm}mm; margin: 0; }`;

  const thermalPrintSafeHeightMm = Math.max(
    12,
    Number((safeHeightMm - 0.4).toFixed(2)),
  );
  const thermalCardOverrideCss =
    effectiveConfig.paperMode === "thermal"
      ? `.printable-sticker-sheet[data-paper-mode="thermal"] .print-sticker-card { width: ${safeWidthMm}mm !important; height: ${thermalPrintSafeHeightMm}mm !important; max-height: ${thermalPrintSafeHeightMm}mm !important; overflow: hidden !important; }`
      : "";

  const gridStyle: React.CSSProperties =
    effectiveConfig.paperMode === "a4"
      ? {
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(1, effectiveConfig.columns || 3)}, ${safeWidthMm}mm)`,
          gap: `${Math.max(0, effectiveConfig.gapMm ?? 1.5)}mm`,
          justifyContent: "center",
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
      className={`printable-document-sheet printable-sticker-sheet ${
        visibleOnScreen ? "mt-3 block overflow-x-auto" : "hidden"
      } text-ink-950 print:mt-0 print:block print:overflow-visible`}
      data-paper-mode={effectiveConfig.paperMode}
      data-preset-id={effectiveConfig.presetId}
      data-slot="barcode-sticker-sheet"
    >
      <style>{`${pageCssRule} @media print { .print-sticker-card { break-inside: avoid; page-break-inside: avoid; } ${thermalCardOverrideCss} }`}</style>
      <div className="printable-sticker-grid mx-auto w-fit" style={gridStyle}>
        {Array.from({ length: safeCopies }).map((_, copyIdx) => (
          <article
            key={copyIdx}
            className="print-sticker-card box-border flex flex-col justify-between overflow-hidden rounded-[var(--radius-sm)] border border-dashed border-ink-950/60 bg-white text-ink-950 print:rounded-none print:border-0"
            style={{
              width: `${safeWidthMm}mm`,
              height: `${safeHeightMm}mm`,
              padding: `${safeMarginMm}mm`,
            }}
          >
            <div
              className={`flex shrink-0 items-center justify-between gap-1.5 border-b border-ink-950/30 pb-0.5 leading-none font-bold tracking-wider uppercase ${
                isMini ? "text-[6px]" : isLarge ? "text-[9.5px]" : "text-[7.5px]"
              }`}
            >
              <span className="shrink-0">JEJAKSTOK</span>
              <span className="min-w-0 truncate">{badgeText}</span>
            </div>

            <p
              className={`mt-0.5 shrink-0 font-bold text-ink-950 ${
                effectiveConfig.codeAlign === "left"
                  ? "text-left"
                  : effectiveConfig.codeAlign === "right"
                    ? "text-right"
                    : "text-center"
              } ${
                isMini
                  ? "line-clamp-1 text-[7px] leading-tight"
                  : isLarge
                    ? "line-clamp-2 text-[13px] leading-tight"
                    : "line-clamp-2 text-[9.5px] leading-tight"
              }`}
            >
              {title}
            </p>

            <div className={`my-auto flex min-h-0 flex-1 w-full items-center overflow-hidden ${alignClass}`}>
              {format === "qr" ? (
                <QrCodeVisual
                  className="max-h-full max-w-full"
                  compact={isMini}
                  size={qrSizePx}
                  stickerMode={true}
                  value={code}
                />
              ) : (
                <BarcodeVisual
                  className="max-h-full w-full max-w-full"
                  compact={isMini}
                  height={barcodeHeightPx}
                  stickerMode={true}
                  svgClassName="mx-auto"
                  svgStyle={{
                    width: `${Math.min(100, barcodeMaxWidthPercent)}%`,
                    maxWidth: "100%",
                  }}
                  value={code}
                />
              )}
            </div>

            {effectiveConfig.showMeta && (
              <div
                className={`mt-0.5 flex shrink-0 items-center justify-between gap-1.5 border-t border-ink-950/30 pt-0.5 leading-none font-semibold text-slate-700 tabular-nums ${
                  isMini ? "text-[6px]" : isLarge ? "text-[9.5px]" : "text-[7.5px]"
                }`}
              >
                <span className="min-w-0 truncate">
                  {secondaryCode
                    ? secondaryLabel
                      ? `${secondaryLabel}: ${secondaryCode}`
                      : secondaryCode
                    : `KODE: ${code}`}
                </span>
                {metaLabel && <span className="min-w-0 truncate text-right">{metaLabel}</span>}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
