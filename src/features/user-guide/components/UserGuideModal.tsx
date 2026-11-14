import { useEffect } from "react";
import {
  BookOpen,
  Compass,
  FileText,
  ScanBarcode,
  Sparkles,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserGuideStore } from "../store";
import type { GuideTabKey } from "../types";
import { BarcodeSimulationTab } from "./BarcodeSimulationTab";
import { FieldDictionaryTab } from "./FieldDictionaryTab";
import { ModuleGuideTab } from "./ModuleGuideTab";
import { WalkthroughTab } from "./WalkthroughTab";

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
              <span>Panduan Interaktif &amp; Quick SOP Guide</span>
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
            Tekan{" "}
            <kbd className="rounded border border-line-200 bg-surface-0 px-1.5 py-0.5 font-mono text-[11px]">
              Esc
            </kbd>{" "}
            untuk menutup panduan kapan saja.
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
