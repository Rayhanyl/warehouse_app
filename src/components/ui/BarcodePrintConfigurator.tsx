import { AlertTriangle, CheckCircle2, Info, Printer, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import { BarcodeStickerSheet } from "./BarcodeVisual";
import {
  BARCODE_LABEL_PRESETS,
  BARCODE_LIMITS,
  type BarcodeCodeAlign,
  type BarcodeFormat,
  type BarcodeLabelPresetId,
  type BarcodePaperMode,
  type BarcodePrintConfig,
  createConfigFromPreset,
  evaluateBarcodeScannability,
  validateBarcodePrintConfig,
} from "./barcode-print-presets";

export interface BarcodePrintConfiguratorProps {
  title: string;
  code: string;
  secondaryCode?: string | null;
  metaLabel?: string | null;
  badgeText?: string;
  format: BarcodeFormat;
  onFormatChange?: (nextFormat: BarcodeFormat) => void;
  config: BarcodePrintConfig;
  onConfigChange: (nextConfig: BarcodePrintConfig) => void;
  visibleOnScreen: boolean;
  onPrint: () => void;
  defaultPresetId?: BarcodeLabelPresetId;
}

const ALIGN_OPTIONS: Array<{ value: BarcodeCodeAlign; label: string }> = [
  { value: "left", label: "Kiri" },
  { value: "center", label: "Tengah" },
  { value: "right", label: "Kanan" },
];

const SCALE_OPTIONS = [75, 90, 100, 115];

export function BarcodePrintConfigurator({
  title,
  code,
  secondaryCode,
  metaLabel,
  badgeText = "LABEL BARANG WMS",
  format,
  onFormatChange,
  config,
  onConfigChange,
  visibleOnScreen,
  onPrint,
  defaultPresetId = "50x30",
}: BarcodePrintConfiguratorProps) {
  const validationErrors = useMemo(() => validateBarcodePrintConfig(config), [config]);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const scannability = useMemo(
    () => evaluateBarcodeScannability(code, format, config),
    [code, format, config],
  );

  function selectPreset(presetId: BarcodeLabelPresetId) {
    if (presetId === "custom") {
      onConfigChange({ ...config, presetId: "custom" });
      return;
    }
    onConfigChange(
      createConfigFromPreset(presetId, {
        codeAlign: config.codeAlign,
        codeScale: config.codeScale,
        showMeta: config.showMeta,
      }),
    );
  }

  function updateField<K extends keyof BarcodePrintConfig>(
    key: K,
    value: BarcodePrintConfig[K],
    markCustom = false,
  ) {
    onConfigChange({
      ...config,
      ...(markCustom ? { presetId: "custom" as const } : {}),
      [key]: value,
    });
  }

  function handlePaperModeChange(nextMode: BarcodePaperMode) {
    onConfigChange({
      ...config,
      presetId: "custom",
      paperMode: nextMode,
      columns: nextMode === "a4" ? Math.max(2, config.columns || 3) : 1,
      pageMarginMm: nextMode === "a4" ? config.pageMarginMm || 8 : 0,
      gapMm: nextMode === "a4" ? config.gapMm || 2 : 0,
      copies: nextMode === "a4" && config.copies === 1 ? 12 : config.copies,
    });
  }

  return (
    <div className={visibleOnScreen ? "mt-4" : ""}>
      {visibleOnScreen && (
        <div
          aria-label="Pengaturan ukuran cetak label barcode dan QR code"
          className="no-print rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/75 p-4 text-left"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-ink-950">
                Pengaturan Ukuran, Tata Letak & Pratinjau Cetak
              </h3>
              <p className="mt-0.5 text-xs text-slate-600">
                Pilih preset stiker printer termal, kertas lembaran A4, atau atur ukuran kustom (mm).
              </p>
            </div>
            <button
              className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-line-300 bg-surface-0 px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-canvas-50"
              onClick={() => onConfigChange(createConfigFromPreset(defaultPresetId))}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={13} />
              Reset Bawaan
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <span className="block text-xs font-semibold text-ink-950">
                Preset Ukuran Label & Media Kertas
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {BARCODE_LABEL_PRESETS.map((preset) => {
                  const active = config.presetId === preset.id;
                  return (
                    <button
                      aria-pressed={active}
                      className={`rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-teal-700 bg-teal-700 text-surface-0 shadow-sm"
                          : "border-line-300 bg-surface-0 text-ink-950 hover:bg-canvas-50"
                      }`}
                      key={preset.id}
                      onClick={() => selectPreset(preset.id)}
                      title={preset.description}
                      type="button"
                    >
                      {preset.label}
                    </button>
                  );
                })}
                <button
                  aria-pressed={config.presetId === "custom"}
                  className={`rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-xs font-semibold transition ${
                    config.presetId === "custom"
                      ? "border-teal-700 bg-teal-700 text-surface-0 shadow-sm"
                      : "border-line-300 bg-surface-0 text-ink-950 hover:bg-canvas-50"
                  }`}
                  onClick={() => selectPreset("custom")}
                  type="button"
                >
                  Ukuran Kustom
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  className="block text-xs font-semibold text-slate-700"
                  htmlFor="barcode-width-mm"
                >
                  Lebar Label (mm)
                </label>
                <input
                  className="mt-1 w-full rounded-[var(--radius-sm)] border border-line-300 bg-surface-0 px-2.5 py-1.5 text-xs font-semibold text-ink-950 tabular-nums"
                  id="barcode-width-mm"
                  max={BARCODE_LIMITS.maxWidthMm}
                  min={BARCODE_LIMITS.minWidthMm}
                  onChange={(e) => updateField("widthMm", Number(e.target.value), true)}
                  step="0.5"
                  type="number"
                  value={Number.isFinite(config.widthMm) ? config.widthMm : ""}
                />
                {validationErrors.widthMm && (
                  <p className="mt-1 text-[11px] font-medium text-red-700">
                    {validationErrors.widthMm}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-slate-700"
                  htmlFor="barcode-height-mm"
                >
                  Tinggi Label (mm)
                </label>
                <input
                  className="mt-1 w-full rounded-[var(--radius-sm)] border border-line-300 bg-surface-0 px-2.5 py-1.5 text-xs font-semibold text-ink-950 tabular-nums"
                  id="barcode-height-mm"
                  max={BARCODE_LIMITS.maxHeightMm}
                  min={BARCODE_LIMITS.minHeightMm}
                  onChange={(e) => updateField("heightMm", Number(e.target.value), true)}
                  step="0.5"
                  type="number"
                  value={Number.isFinite(config.heightMm) ? config.heightMm : ""}
                />
                {validationErrors.heightMm && (
                  <p className="mt-1 text-[11px] font-medium text-red-700">
                    {validationErrors.heightMm}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-slate-700"
                  htmlFor="barcode-margin-mm"
                >
                  Margin Dalam (mm)
                </label>
                <input
                  className="mt-1 w-full rounded-[var(--radius-sm)] border border-line-300 bg-surface-0 px-2.5 py-1.5 text-xs font-semibold text-ink-950 tabular-nums"
                  id="barcode-margin-mm"
                  max={BARCODE_LIMITS.maxMarginMm}
                  min={BARCODE_LIMITS.minMarginMm}
                  onChange={(e) => updateField("marginMm", Number(e.target.value), true)}
                  step="0.5"
                  type="number"
                  value={Number.isFinite(config.marginMm) ? config.marginMm : ""}
                />
                {validationErrors.marginMm && (
                  <p className="mt-1 text-[11px] font-medium text-red-700">
                    {validationErrors.marginMm}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-slate-700"
                  htmlFor="barcode-copies-count"
                >
                  Jumlah Stiker
                </label>
                <input
                  className="mt-1 w-full rounded-[var(--radius-sm)] border border-line-300 bg-surface-0 px-2.5 py-1.5 text-xs font-semibold text-ink-950 tabular-nums"
                  id="barcode-copies-count"
                  max={BARCODE_LIMITS.maxCopies}
                  min={BARCODE_LIMITS.minCopies}
                  onChange={(e) =>
                    updateField("copies", Math.trunc(Number(e.target.value) || 0))
                  }
                  step="1"
                  type="number"
                  value={Number.isFinite(config.copies) ? config.copies : ""}
                />
                {validationErrors.copies && (
                  <p className="mt-1 text-[11px] font-medium text-red-700">
                    {validationErrors.copies}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-line-200 pt-3">
              <div>
                <span className="block text-xs font-semibold text-slate-700">
                  Media Kertas
                </span>
                <div className="mt-1 inline-flex rounded-[var(--radius-sm)] border border-line-300 bg-surface-0 p-0.5 text-xs">
                  <button
                    aria-pressed={config.paperMode === "thermal"}
                    className={`rounded px-2.5 py-1 font-semibold transition ${
                      config.paperMode === "thermal"
                        ? "bg-teal-700 text-surface-0"
                        : "text-slate-600 hover:text-ink-950"
                    }`}
                    onClick={() => handlePaperModeChange("thermal")}
                    type="button"
                  >
                    Roll Thermal
                  </button>
                  <button
                    aria-pressed={config.paperMode === "a4"}
                    className={`rounded px-2.5 py-1 font-semibold transition ${
                      config.paperMode === "a4"
                        ? "bg-teal-700 text-surface-0"
                        : "text-slate-600 hover:text-ink-950"
                    }`}
                    onClick={() => handlePaperModeChange("a4")}
                    type="button"
                  >
                    Lembar A4 Grid
                  </button>
                </div>
              </div>

              {config.paperMode === "a4" && (
                <div>
                  <label
                    className="block text-xs font-semibold text-slate-700"
                    htmlFor="barcode-a4-columns"
                  >
                    Kolom A4
                  </label>
                  <select
                    className="mt-1 rounded-[var(--radius-sm)] border border-line-300 bg-surface-0 px-2.5 py-1 text-xs font-semibold text-ink-950"
                    id="barcode-a4-columns"
                    onChange={(e) => updateField("columns", Number(e.target.value), true)}
                    value={config.columns}
                  >
                    <option value={2}>2 kolom</option>
                    <option value={3}>3 kolom</option>
                    <option value={4}>4 kolom</option>
                    <option value={5}>5 kolom</option>
                  </select>
                </div>
              )}

              <div>
                <span className="block text-xs font-semibold text-slate-700">
                  Posisi Kode
                </span>
                <div className="mt-1 inline-flex rounded-[var(--radius-sm)] border border-line-300 bg-surface-0 p-0.5 text-xs">
                  {ALIGN_OPTIONS.map((opt) => (
                    <button
                      aria-pressed={config.codeAlign === opt.value}
                      className={`rounded px-2.5 py-1 font-semibold transition ${
                        config.codeAlign === opt.value
                          ? "bg-ink-950 text-surface-0"
                          : "text-slate-600 hover:text-ink-950"
                      }`}
                      key={opt.value}
                      onClick={() => updateField("codeAlign", opt.value)}
                      type="button"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700">
                  Skala Kode
                </span>
                <div className="mt-1 inline-flex rounded-[var(--radius-sm)] border border-line-300 bg-surface-0 p-0.5 text-xs">
                  {SCALE_OPTIONS.map((scalePct) => (
                    <button
                      aria-pressed={config.codeScale === scalePct}
                      className={`rounded px-2 py-1 font-semibold tabular-nums transition ${
                        config.codeScale === scalePct
                          ? "bg-ink-950 text-surface-0"
                          : "text-slate-600 hover:text-ink-950"
                      }`}
                      key={scalePct}
                      onClick={() => updateField("codeScale", scalePct)}
                      type="button"
                    >
                      {scalePct}%
                    </button>
                  ))}
                </div>
              </div>

              {onFormatChange && (
                <div>
                  <span className="block text-xs font-semibold text-slate-700">
                    Jenis Kode Cetak
                  </span>
                  <div className="mt-1 inline-flex rounded-[var(--radius-sm)] border border-line-300 bg-surface-0 p-0.5 text-xs">
                    <button
                      aria-pressed={format === "barcode"}
                      className={`rounded px-2.5 py-1 font-semibold transition ${
                        format === "barcode"
                          ? "bg-teal-700 text-surface-0"
                          : "text-slate-600 hover:text-ink-950"
                      }`}
                      onClick={() => onFormatChange("barcode")}
                      type="button"
                    >
                      1D Barcode
                    </button>
                    <button
                      aria-pressed={format === "qr"}
                      className={`rounded px-2.5 py-1 font-semibold transition ${
                        format === "qr"
                          ? "bg-teal-700 text-surface-0"
                          : "text-slate-600 hover:text-ink-950"
                      }`}
                      onClick={() => onFormatChange("qr")}
                      type="button"
                    >
                      2D QR Code
                    </button>
                  </div>
                </div>
              )}

              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                <input
                  checked={config.showMeta}
                  onChange={(e) => updateField("showMeta", e.target.checked)}
                  type="checkbox"
                />
                Tampilkan footer SKU & info
              </label>
            </div>

            <div
              className={`flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border px-3 py-2 text-xs ${
                scannability.status === "warning"
                  ? "border-red-300 bg-red-50 text-red-900"
                  : scannability.status === "caution"
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-emerald-300 bg-emerald-50 text-emerald-900"
              }`}
            >
              <div className="flex items-start gap-2">
                {scannability.status === "warning" ? (
                  <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
                ) : scannability.status === "caution" ? (
                  <Info aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
                ) : (
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
                )}
                <span>
                  <strong>Keterbacaan:</strong> {scannability.message}{" "}
                  <span className="font-mono tabular-nums">
                    ({scannability.moduleSizeMm.toFixed(2)} mm/modul)
                  </span>
                </span>
              </div>
              <button
                className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-teal-700 px-3 text-xs font-semibold text-surface-0 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={hasValidationErrors}
                onClick={onPrint}
                type="button"
              >
                <Printer aria-hidden="true" size={14} />
                Cetak Sekarang ({config.widthMm} x {config.heightMm} mm)
              </button>
            </div>
          </div>
        </div>
      )}

      <BarcodeStickerSheet
        badgeText={badgeText}
        code={code}
        config={config}
        format={format}
        metaLabel={metaLabel}
        secondaryCode={secondaryCode}
        title={title}
        visibleOnScreen={visibleOnScreen}
      />
    </div>
  );
}
