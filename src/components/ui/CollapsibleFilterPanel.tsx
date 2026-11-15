import { type ReactNode, useId, useState } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";

interface CollapsibleFilterPanelProps {
  title?: string;
  activeCount?: number;
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  defaultMobileOpen?: boolean;
}

/**
 * Panel filter yang dapat dilipat pada viewport ponsel (< 768px) agar data daftar langsung terlihat,
 * sambil tetap terbuka penuh pada viewport tablet dan desktop.
 */
export function CollapsibleFilterPanel({
  title = "Filter & pencarian",
  activeCount = 0,
  ariaLabel,
  children,
  className = "mb-6 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)]",
  defaultMobileOpen = false,
}: CollapsibleFilterPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(defaultMobileOpen);
  const contentId = useId();

  return (
    <section aria-label={ariaLabel} className={className}>
      <div className="flex items-center justify-between gap-2 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <SlidersHorizontal aria-hidden="true" className="shrink-0 text-teal-700" size={16} />
          <span className="truncate text-sm font-semibold text-ink-950">{title}</span>
          {activeCount > 0 && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
              {activeCount} aktif
            </span>
          )}
        </div>
        <button
          aria-controls={contentId}
          aria-expanded={mobileOpen}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50 px-3 text-xs font-semibold text-ink-950 transition hover:bg-canvas-100"
          onClick={() => setMobileOpen((prev) => !prev)}
          type="button"
        >
          <span>{mobileOpen ? "Sembunyikan" : "Tampilkan"}</span>
          {mobileOpen ? (
            <ChevronUp aria-hidden="true" size={15} />
          ) : (
            <ChevronDown aria-hidden="true" size={15} />
          )}
        </button>
      </div>
      <div className={mobileOpen ? "mt-3 block md:mt-0" : "hidden md:block"} id={contentId}>
        {children}
      </div>
    </section>
  );
}
