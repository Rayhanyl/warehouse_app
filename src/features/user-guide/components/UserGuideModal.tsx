import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  HelpCircle,
  ScanBarcode,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BARCODE_SIMULATION_PRESETS,
  GUIDE_FIELDS,
  MODULE_GUIDES,
  WALKTHROUGH_STAGES,
  simulateBarcodeScan,
} from "../guideContent";
import { useUserGuideStore } from "../store";
import type {
  BarcodeSimulationResult,
  GuideModuleId,
  GuideTabKey,
} from "../types";

const MODULE_LIST = Object.values(MODULE_GUIDES);

const GUIDE_TABS: Array<{
  key: GuideTabKey;
  label: string;
  icon: typeof BookOpen;
}> = [
  { key: "module", label: "Panduan Halaman", icon: BookOpen },
  { key: "walkthrough", label: "Alur Kerja WMS", icon: Compass },
  { key: "fields", label: "Kamus Field & Contoh", icon: FileText },
  { key: "barcode-sim", label: "Simulasi Scan", icon: ScanBarcode },
];

/**
 * Modal panduan interaktif, kamus field transaksi, walkthrough alur WMS, dan simulator barcode.
 * Dirancang sebagai overlay non-destruktif agar data form yang sedang diinput tidak hilang.
 */
export function UserGuideModal() {
  const navigate = useNavigate();
  const isOpen = useUserGuideStore((s) => s.isOpen);
  const activeModuleId = useUserGuideStore((s) => s.activeModuleId);
  const activeTab = useUserGuideStore((s) => s.activeTab);
  const walkthroughStep = useUserGuideStore((s) => s.walkthroughStep);
  const completedSteps = useUserGuideStore((s) => s.completedSteps);
  const closeGuide = useUserGuideStore((s) => s.closeGuide);
  const setModuleId = useUserGuideStore((s) => s.setModuleId);
  const setTab = useUserGuideStore((s) => s.setTab);
  const setWalkthroughStep = useUserGuideStore((s) => s.setWalkthroughStep);
  const toggleStepCompleted = useUserGuideStore((s) => s.toggleStepCompleted);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeGuide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeGuide]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/60 p-0 sm:items-center sm:p-4"
      onMouseDown={closeGuide}
    >
      <div
        aria-label="Panduan Pengguna dan SOP WMS"
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)] sm:rounded-[var(--radius-lg)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-200 bg-surface-0 px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
              <Sparkles aria-hidden="true" size={14} />
              <span>Panduan Interaktif & Quick SOP Guide</span>
            </div>
            <h2 className="mt-0.5 truncate text-base font-bold text-ink-950 sm:text-lg">
              Pusat Bantuan Operasional JejakStok
            </h2>
            <p className="text-xs text-slate-600">
              Data formulir yang sedang Anda ketik tetap aman saat membaca panduan ini.
            </p>
          </div>
          <button
            aria-label="Tutup panduan"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] border border-line-200 text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950"
            onClick={closeGuide}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <nav
          aria-label="Tab panduan pengguna"
          className="flex gap-1 overflow-x-auto border-b border-line-200 bg-surface-50 px-3 pt-2 sm:px-6"
          role="tablist"
        >
          {GUIDE_TABS.map(({ key, label, icon: Icon }) => {
            const selected = activeTab === key;
            return (
              <button
                aria-selected={selected}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  selected
                    ? "border-teal-600 bg-surface-0 text-teal-800"
                    : "border-transparent text-slate-700 hover:border-line-500 hover:text-ink-950"
                }`}
                key={key}
                onClick={() => setTab(key)}
                role="tab"
                type="button"
              >
                <Icon aria-hidden="true" size={15} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {activeTab === "module" && (
            <ModuleGuideTab
              activeModuleId={activeModuleId}
              onOpenFieldsTab={() => setTab("fields")}
              onSelectModule={setModuleId}
            />
          )}
          {activeTab === "walkthrough" && (
            <WalkthroughTab
              completedSteps={completedSteps}
              onNavigateToRoute={(route) => {
                closeGuide();
                navigate(route);
              }}
              onSelectStep={setWalkthroughStep}
              onToggleComplete={toggleStepCompleted}
              walkthroughStep={walkthroughStep}
            />
          )}
          {activeTab === "fields" && (
            <FieldDictionaryTab activeModuleId={activeModuleId} />
          )}
          {activeTab === "barcode-sim" && <BarcodeSimulationTab />}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-200 bg-surface-50 px-4 py-3 text-xs text-slate-600 sm:px-6">
          <span>
            Tekan <kbd className="rounded border border-line-200 bg-surface-0 px-1.5 py-0.5 font-mono text-[11px]">Esc</kbd> untuk menutup panduan kapan saja.
          </span>
          <button
            className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] bg-teal-600 px-4 text-xs font-semibold text-surface-0 transition hover:bg-teal-700"
            onClick={closeGuide}
            type="button"
          >
            Lanjutkan Pekerjaan
          </button>
        </div>
      </div>
    </div>
  );
}

function ModuleGuideTab({
  activeModuleId,
  onSelectModule,
  onOpenFieldsTab,
}: {
  activeModuleId: GuideModuleId;
  onSelectModule: (id: GuideModuleId) => void;
  onOpenFieldsTab: () => void;
}) {
  const guide = MODULE_GUIDES[activeModuleId] ?? MODULE_GUIDES.dashboard;
  const relatedFields = useMemo(
    () => GUIDE_FIELDS.filter((field) => guide.fieldIds.includes(field.id)),
    [guide.fieldIds],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800">
            Modul: {guide.category}
          </span>
          <h3 className="mt-1 text-base font-bold text-ink-950">{guide.title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-slate-700">{guide.summary}</p>
        </div>
        <div className="shrink-0 sm:w-64">
          <label
            className="mb-1 block text-[11px] font-semibold text-slate-600"
            htmlFor="guide-module-select"
          >
            Lihat SOP Modul Lain
          </label>
          <select
            className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-2.5 text-xs font-medium text-ink-950"
            id="guide-module-select"
            onChange={(event) =>
              onSelectModule(event.target.value as GuideModuleId)
            }
            value={guide.id}
          >
            {MODULE_LIST.map((item) => (
              <option key={item.id} value={item.id}>
                {item.category}: {item.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-line-200 bg-surface-0 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
            Kapan Digunakan & Prasyarat
          </h4>
          <p className="mt-2 text-xs leading-5 text-slate-700">{guide.whenToUse}</p>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
            {guide.prerequisites.map((req) => (
              <li className="flex items-start gap-2" key={req}>
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-teal-600"
                  size={14}
                />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--radius-md)] border border-line-200 bg-surface-0 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
            Langkah Penggunaan
          </h4>
          <ol className="mt-2 space-y-2 text-xs leading-5 text-slate-700">
            {guide.stepByStep.map((step, index) => (
              <li className="flex items-start gap-2.5" key={step}>
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-teal-600 text-[11px] font-bold text-surface-0 tabular-nums">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4">
        <h4 className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
          <HelpCircle aria-hidden="true" size={15} />
          Tips Menghindari Kesalahan Input
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-950">
          {guide.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      {relatedFields.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
              Field Penting pada Modul Ini
            </h4>
            <button
              className="text-xs font-semibold text-teal-700 hover:underline"
              onClick={onOpenFieldsTab}
              type="button"
            >
              Buka Semua Kamus Field
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {relatedFields.map((field) => (
              <div
                className="rounded-[var(--radius-md)] border border-line-200 bg-surface-0 p-3 text-xs"
                key={field.id}
              >
                <p className="font-bold text-ink-950">{field.label}</p>
                <p className="mt-1 leading-5 text-slate-700">{field.description}</p>
                <p className="mt-2 rounded bg-teal-50 px-2 py-1 font-medium text-teal-900">
                  Contoh: {field.exampleValid}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WalkthroughTab({
  walkthroughStep,
  completedSteps,
  onSelectStep,
  onToggleComplete,
  onNavigateToRoute,
}: {
  walkthroughStep: number;
  completedSteps: number[];
  onSelectStep: (stepNumber: number) => void;
  onToggleComplete: (stepNumber: number) => void;
  onNavigateToRoute: (route: string) => void;
}) {
  const stage =
    WALKTHROUGH_STAGES.find((item) => item.stepNumber === walkthroughStep) ??
    WALKTHROUGH_STAGES[0];
  const isCompleted = completedSteps.includes(stage.stepNumber);

  return (
    <div className="space-y-5">
      <div className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-50 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-700">
            Alur Inti WMS: Pengadaan PO -&gt; Penerimaan GR -&gt; Penyimpanan Rak -&gt; Transfer Gudang -&gt; Stock Opname
          </p>
          <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800 tabular-nums">
            Selesai: {completedSteps.length}/{WALKTHROUGH_STAGES.length} tahap
          </span>
        </div>

        <div
          aria-label="Langkah alur kerja WMS"
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
        >
          {WALKTHROUGH_STAGES.map((item) => {
            const active = item.stepNumber === stage.stepNumber;
            const done = completedSteps.includes(item.stepNumber);
            return (
              <button
                aria-current={active ? "step" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-left text-xs font-semibold transition ${
                  active
                    ? "border-teal-600 bg-teal-600 text-surface-0"
                    : done
                      ? "border-teal-200 bg-teal-50 text-teal-900"
                      : "border-line-200 bg-surface-0 text-slate-700 hover:bg-surface-50"
                }`}
                key={item.stepNumber}
                onClick={() => onSelectStep(item.stepNumber)}
                type="button"
              >
                <span className="tabular-nums">{item.stepNumber}.</span>
                <span>{item.shortTitle}</span>
                {done && !active && (
                  <CheckCircle2
                    aria-hidden="true"
                    className="text-teal-700"
                    size={13}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <article className="space-y-4 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-teal-700">
              Aktor: {stage.actorRole}
            </span>
            <h3 className="mt-0.5 text-lg font-bold text-ink-950">{stage.title}</h3>
            <p className="mt-1 text-sm text-slate-700">{stage.goal}</p>
          </div>
          <button
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-xs font-semibold transition ${
              isCompleted
                ? "border-teal-600 bg-teal-50 text-teal-800"
                : "border-line-200 bg-surface-0 text-slate-700 hover:bg-surface-50"
            }`}
            onClick={() => onToggleComplete(stage.stepNumber)}
            type="button"
          >
            <CheckCircle2 aria-hidden="true" size={15} />
            {isCompleted ? "Tahap Dipahami" : "Tandai Selesai"}
          </button>
        </div>

        <ol className="space-y-2 rounded-[var(--radius-md)] bg-surface-50 p-3.5 text-xs leading-5 text-slate-800 sm:text-sm">
          {stage.actions.map((action, idx) => (
            <li className="flex items-start gap-2.5" key={action}>
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ink-950 text-[11px] font-bold text-surface-0 tabular-nums">
                {idx + 1}
              </span>
              <span>{action}</span>
            </li>
          ))}
        </ol>

        <div className="rounded-[var(--radius-md)] border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-950">
          <strong>Dampak Sistem Selanjutnya:</strong> {stage.whatHappensNext}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-200 pt-3">
          <div className="flex items-center gap-2">
            <button
              className="inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-md)] border border-line-200 px-3 text-xs font-semibold text-slate-700 hover:bg-surface-50 disabled:opacity-40"
              disabled={stage.stepNumber <= 1}
              onClick={() => onSelectStep(stage.stepNumber - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={15} />
              Sebelumnya
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-md)] border border-line-200 px-3 text-xs font-semibold text-slate-700 hover:bg-surface-50 disabled:opacity-40"
              disabled={stage.stepNumber >= WALKTHROUGH_STAGES.length}
              onClick={() => onSelectStep(stage.stepNumber + 1)}
              type="button"
            >
              Langkah Berikutnya
              <ChevronRight aria-hidden="true" size={15} />
            </button>
          </div>
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-md)] border border-teal-600 bg-surface-0 px-3.5 text-xs font-semibold text-teal-800 hover:bg-teal-50"
            onClick={() => onNavigateToRoute(stage.targetRoute)}
            type="button"
          >
            <span>Buka Modul Ini</span>
            <ArrowRight aria-hidden="true" size={14} />
          </button>
        </div>
      </article>
    </div>
  );
}

function FieldDictionaryTab({
  activeModuleId,
}: {
  activeModuleId: GuideModuleId;
}) {
  const [query, setQuery] = useState("");
  const currentGuide = MODULE_GUIDES[activeModuleId];

  const filteredFields = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return GUIDE_FIELDS;
    }
    return GUIDE_FIELDS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.fieldName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.appliesTo.some((mod) => mod.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-700">
          Referensi aturan validasi field penting (sedang aktif: <strong>{currentGuide.title}</strong>).
        </p>
        <div className="relative w-full sm:w-72">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={15}
          />
          <input
            aria-label="Cari penjelasan field transaksi"
            className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 bg-surface-0 pl-9 pr-3 text-xs"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari UoM, ISSUED, rak, variance..."
            type="search"
            value={query}
          />
        </div>
      </div>

      {filteredFields.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-line-200 p-6 text-center text-xs text-slate-600">
          Tidak ada penjelasan field yang cocok dengan kata kunci pencarian Anda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {filteredFields.map((field) => (
            <div
              className="flex flex-col justify-between rounded-[var(--radius-md)] border border-line-200 bg-surface-0 p-4 text-xs"
              key={field.id}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-teal-800">
                    {field.fieldName}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {field.appliesTo.join(" | ")}
                  </span>
                </div>
                <h4 className="mt-1 text-sm font-bold text-ink-950">
                  {field.label}
                </h4>
                <p className="mt-1.5 leading-5 text-slate-700">
                  {field.description}
                </p>
              </div>
              <div className="mt-3 space-y-1.5 pt-2">
                <p className="rounded border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-teal-950">
                  <strong>Contoh Isian Benar:</strong> {field.exampleValid}
                </p>
                <p className="rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-red-900">
                  <strong>Hindari:</strong> {field.commonMistake}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BarcodeSimulationTab() {
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
          Simulator Pemindaian Barcode & QR (Mode Latihan Aman)
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-700">
          Uji coba hasil pembacaan hardware barcode gun USB/Bluetooth atau input kode manual di sini. Simulasi ini berjalan offline di browser dan tidak memengaruhi transaksi nyata.
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
            <dd className="font-mono font-bold">
              {result.normalizedCode || "(kosong)"}
            </dd>
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
