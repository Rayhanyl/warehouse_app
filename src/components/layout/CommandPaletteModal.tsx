import type { KeyboardEvent, RefObject } from "react";
import { Command, X } from "lucide-react";
import type { FlattenedMenuEntry } from "./routeContext";

interface CommandPaletteModalProps {
  isOpen: boolean;
  search: string;
  activeIndex: number;
  results: FlattenedMenuEntry[];
  inputRef: RefObject<HTMLInputElement | null>;
  onSearchChange: (value: string) => void;
  onActiveIndexChange: (index: number) => void;
  onSelectPath: (path: string) => void;
  onClose: () => void;
}

/**
 * Modal command palette for quick keyboard-driven navigation across accessible menu entries.
 */
export function CommandPaletteModal({
  isOpen,
  search,
  activeIndex,
  results,
  inputRef,
  onSearchChange,
  onActiveIndexChange,
  onSelectPath,
  onClose,
}: CommandPaletteModalProps) {
  if (!isOpen) {
    return null;
  }

  const safeActiveIndex =
    results.length > 0 ? Math.min(activeIndex, results.length - 1) : 0;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length > 0) {
        onActiveIndexChange((safeActiveIndex + 1) % results.length);
      }
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length > 0) {
        onActiveIndexChange((safeActiveIndex - 1 + results.length) % results.length);
      }
      return;
    }
    if (event.key === "Enter" && results[safeActiveIndex]) {
      event.preventDefault();
      onSelectPath(results[safeActiveIndex].item.path);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-4"
      onMouseDown={onClose}
    >
      <div
        aria-label="Pencarian menu"
        aria-modal="true"
        className="max-h-[min(80vh,36rem)] w-full max-w-2xl rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-3 shadow-[var(--shadow-2)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-center gap-2 border-b border-line-200 px-2 pb-3">
          <Command aria-hidden="true" className="shrink-0 text-teal-600" size={19} />
          <input
            aria-label="Ketik nama menu atau rute"
            className="min-h-11 flex-1 border-0 bg-transparent text-sm text-ink-950 placeholder:text-slate-600 focus:outline-none"
            onChange={(event) => {
              onSearchChange(event.target.value);
              onActiveIndexChange(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Cari menu atau halaman..."
            ref={inputRef}
            value={search}
          />
          <button
            aria-label="Tutup pencarian"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto py-2" role="listbox">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-700">
              Tidak ada menu yang cocok. Periksa ejaan atau gunakan kata kunci lain.
            </p>
          ) : (
            results.map(({ item, groupName: parent }, index) => {
              const isHighlighted = index === safeActiveIndex;
              return (
                <button
                  aria-selected={isHighlighted}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition ${
                    isHighlighted
                      ? "bg-teal-100 text-teal-700"
                      : "text-ink-950 hover:bg-canvas-50"
                  }`}
                  key={item.id}
                  onClick={() => onSelectPath(item.path)}
                  onMouseEnter={() => onActiveIndexChange(index)}
                  role="option"
                  type="button"
                >
                  <span className="font-semibold">{item.name}</span>
                  {parent && (
                    <span className="rounded-full bg-canvas-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {parent}
                    </span>
                  )}
                  <span className="ml-auto text-xs font-normal text-slate-600 tabular-nums">
                    {item.path}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
