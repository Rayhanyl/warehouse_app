import { type FormEvent, useState } from "react";
import { ScanBarcode } from "lucide-react";
import { BARCODE_SIMULATION_PRESETS, simulateBarcodeScan } from "../guideContent";
import type { BarcodeSimulationResult } from "../types";

export function BarcodeSimulationTab() {
  const [scanInput, setScanInput] = useState("8991234567890");
  const [result, setResult] = useState<BarcodeSimulationResult>(() =>
    simulateBarcodeScan("8991234567890"),
  );

  const runSimulation = (codeToTest: string) => {
    setScanInput(codeToTest);
    setResult(simulateBarcodeScan(codeToTest));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    runSimulation(scanInput);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] border border-line-200 bg-surface-50 p-4">
        <h3 className="text-sm font-bold text-ink-950">
          Simulator Pemindaian Barcode &amp; QR (Mode Latihan Aman)
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-700">
          Uji coba hasil pembacaan hardware barcode gun USB/Bluetooth atau input kode manual di
          sini. Simulasi ini berjalan offline di browser dan tidak memengaruhi transaksi nyata.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {BARCODE_SIMULATION_PRESETS.map((preset) => (
            <button
              className="inline-flex min-h-9 items-center rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-xs font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-800"
              key={preset.id}
              onClick={() => runSimulation(preset.sampleCode)}
              type="button"
            >
              {preset.label}: <span className="ml-1 font-mono">{preset.sampleCode}</span>
            </button>
          ))}
        </div>

        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
          <input
            aria-label="Input simulasi barcode"
            className="min-h-11 flex-1 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 font-mono text-sm"
            onChange={(event) => setScanInput(event.target.value)}
            placeholder="Scan atau ketik kode barcode lalu tekan Enter..."
            type="text"
            value={scanInput}
          />
          <button
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-teal-600 px-4 text-xs font-semibold text-surface-0 hover:bg-teal-700"
            type="submit"
          >
            <ScanBarcode aria-hidden="true" size={16} />
            Simulasikan Scan
          </button>
        </form>
      </div>

      <div
        className={`rounded-[var(--radius-md)] border p-4 text-xs ${
          result.status === "VALID"
            ? "border-teal-200 bg-teal-50/70 text-teal-950"
            : "border-red-200 bg-red-50 text-red-900"
        }`}
        role="status"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-bold">{result.detectedLabel}</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              result.status === "VALID"
                ? "bg-teal-600 text-surface-0"
                : "bg-red-600 text-surface-0"
            }`}
          >
            {result.status} ({result.detectedKind})
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-600">Kode Terbaca</dt>
            <dd className="font-mono font-bold">{result.normalizedCode || "(kosong)"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-600">Modul Tujuan Otomatis</dt>
            <dd className="font-semibold">{result.recommendedScreen}</dd>
          </div>
        </dl>
        <p className="mt-3 leading-5">
          <strong>Reaksi Sistem:</strong> {result.systemBehavior}
        </p>
        <p className="mt-1 leading-5">
          <strong>Status Validasi:</strong> {result.validationMessage}
        </p>
      </div>
    </div>
  );
}
