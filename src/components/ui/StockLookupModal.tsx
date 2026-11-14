import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  RefreshCw,
  ScanBarcode,
  Search,
  X,
} from "lucide-react";
import { formatDecimal, toDecimal } from "@/lib/decimal";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import type { StockBalance } from "@/features/stock/types";
import { BarcodeScannerModal } from "./BarcodeScannerModal";
import { StockLookupItemResult } from "./stock-lookup/StockLookupItemResult";
import { StockLookupLocationResult } from "./stock-lookup/StockLookupLocationResult";
import {
  fetchStockLookupResult,
  type ItemSummary,
  type LocationSummary,
} from "./stock-lookup/stockLookupApi";

export interface StockLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

/**
 * Interactive modal for looking up real-time item stock or bin location contents via search or barcode scanner.
 */
export function StockLookupModal({
  isOpen,
  onClose,
  initialQuery = "",
}: StockLookupModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <StockLookupModalInner
      initialQuery={initialQuery}
      key={initialQuery}
      onClose={onClose}
    />
  );
}

function StockLookupModalInner({
  onClose,
  initialQuery = "",
}: Omit<StockLookupModalProps, "isOpen">) {
  const trimmedInitial = initialQuery.trim();
  const [query, setQuery] = useState(trimmedInitial);
  const [searchTerm, setSearchTerm] = useState(trimmedInitial);
  const [isLoading, setIsLoading] = useState(Boolean(trimmedInitial));
  const [hasSearched, setHasSearched] = useState(Boolean(trimmedInitial));
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [itemInfo, setItemInfo] = useState<ItemSummary | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationSummary | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!trimmedInitial) {
      return;
    }

    let active = true;
    void fetchStockLookupResult(trimmedInitial)
      .then((result) => {
        if (!active) return;
        setBalances(result.balances);
        setItemInfo(result.itemInfo);
        setLocationInfo(result.locationInfo);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Gagal memuat informasi stok barang.";
        setError(message);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [trimmedInitial]);

  useBarcodeScanner({
    enabled: !isCameraOpen,
    onScan: (scannedCode) => {
      const trimmed = scannedCode.trim();
      if (trimmed) {
        setQuery(trimmed);
        void executeLookup(trimmed);
      }
    },
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isCameraOpen) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCameraOpen, onClose]);

  async function executeLookup(keyword: string) {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setSearchTerm(trimmed);
    setHasSearched(true);

    try {
      const result = await fetchStockLookupResult(trimmed);
      setBalances(result.balances);
      setItemInfo(result.itemInfo);
      setLocationInfo(result.locationInfo);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat informasi stok barang.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    executeLookup(query);
  }

  function handleCameraDetected(code: string) {
    setIsCameraOpen(false);
    setQuery(code);
    executeLookup(code);
  }

  const {
    totalOnHand,
    totalInTransit,
    distinctWarehousesCount,
    distinctItemsCount,
  } = useMemo(() => {
    let onHandSum = toDecimal("0");
    let inTransitSum = toDecimal("0");
    const warehouseSet = new Set<string>();
    const itemSet = new Set<number>();

    for (const b of balances) {
      onHandSum = onHandSum.plus(toDecimal(b.qty_on_hand || "0"));
      inTransitSum = inTransitSum.plus(toDecimal(b.qty_in_transit || "0"));
      warehouseSet.add(b.warehouse_code);
      itemSet.add(b.item_id);
    }

    return {
      totalOnHand: formatDecimal(onHandSum.toString()),
      totalInTransit: formatDecimal(inTransitSum.toString()),
      distinctWarehousesCount: warehouseSet.size,
      distinctItemsCount: itemSet.size,
    };
  }, [balances]);

  return (
    <div
      aria-labelledby="stock-lookup-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-xs sm:p-4"
      role="dialog"
    >
      <div className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line-500 bg-surface-0 shadow-2xl sm:max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line-500 px-4 py-3.5 sm:items-center sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <ScanBarcode aria-hidden="true" size={22} />
            </div>
            <div className="min-w-0">
              <h2
                className="text-base font-bold text-ink-950 sm:text-lg"
                id="stock-lookup-title"
              >
                Cek Stok & Posisi Rak Barang
              </h2>
              <p className="text-xs text-slate-600">
                Pindai barcode barang, SKU, atau barcode lokasi rak/gudang untuk memeriksa posisi dan rincian isi stok secara langsung.
              </p>
            </div>
          </div>
          <button
            aria-label="Tutup pencarian stok"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-600 transition hover:bg-canvas-100 hover:text-ink-950"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        {/* Search & Scan Toolbar */}
        <div className="shrink-0 border-b border-line-300 bg-canvas-50/50 px-4 py-3 sm:px-6 sm:py-3.5">
          <form className="flex flex-wrap items-center gap-2 sm:flex-nowrap" onSubmit={handleSubmit}>
            <div className="relative min-w-[180px] flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                aria-label="Cari barcode atau SKU"
                className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 pl-10 pr-4 text-sm font-semibold text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                id="stock-lookup-input"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pindai barcode barang, SKU, atau kode rak (mis. RAK-A1)..."
                ref={inputRef}
                type="text"
                value={query}
              />
            </div>
            <button
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-teal-700 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-teal-800 disabled:opacity-60"
              disabled={isLoading || !query.trim()}
              type="submit"
            >
              {isLoading ? (
                <RefreshCw aria-hidden="true" className="animate-spin" size={15} />
              ) : (
                <Search aria-hidden="true" size={15} />
              )}
              Cari
            </button>
            <button
              aria-label="Pindai barcode dengan kamera"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-xs font-semibold text-ink-950 hover:bg-canvas-100"
              onClick={() => setIsCameraOpen(true)}
              type="button"
            >
              <Camera aria-hidden="true" size={16} />
              <span className="hidden sm:inline">Pindai Kamera</span>
            </button>
          </form>
        </div>

        {/* Modal Body / Results */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2.5 rounded-[var(--radius-md)] border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-800">
              <AlertCircle aria-hidden="true" size={16} />
              <span>{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <RefreshCw aria-hidden="true" className="animate-spin text-teal-700" size={32} />
              <p className="mt-3 text-sm font-semibold text-ink-950">
                Memuat data stok dan sebaran rak...
              </p>
              <p className="text-xs text-slate-500">
                Menghubungi basis data gudang secara real-time.
              </p>
            </div>
          )}

          {!isLoading && !hasSearched && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-400 py-12 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-canvas-100 text-slate-600">
                <ScanBarcode aria-hidden="true" size={26} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-ink-950">
                Belum ada barcode yang dipindai
              </h3>
              <p className="mt-1 max-w-md text-xs leading-5 text-slate-600">
                Arahkan scanner barcode fisik ke produk atau label rak gudang, gunakan kamera, atau ketik SKU/barcode pada kolom pencarian di atas.
              </p>
            </div>
          )}

          {!isLoading && hasSearched && !itemInfo && !locationInfo && balances.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-line-300 bg-canvas-50 py-12 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700">
                <AlertCircle aria-hidden="true" size={26} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-ink-950">Barang tidak ditemukan</h3>
              <p className="mt-1 text-xs text-slate-600">
                Tidak ada barang, lokasi rak, atau saldo stok yang cocok dengan kata kunci &quot;{searchTerm}&quot;.
              </p>
            </div>
          )}

          {!isLoading && hasSearched && locationInfo && (
            <StockLookupLocationResult
              balances={balances}
              distinctItemsCount={distinctItemsCount}
              locationInfo={locationInfo}
              totalOnHand={totalOnHand}
            />
          )}

          {!isLoading && hasSearched && itemInfo && (
            <StockLookupItemResult
              balances={balances}
              distinctWarehousesCount={distinctWarehousesCount}
              itemInfo={itemInfo}
              totalInTransit={totalInTransit}
              totalOnHand={totalOnHand}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line-500 bg-canvas-50/50 px-4 py-3 sm:px-6">
          <p className="text-[11px] text-slate-600">
            Tekan <kbd className="rounded border border-line-300 bg-surface-0 px-1 py-0.5 font-mono text-[10px]">Esc</kbd> untuk menutup jendela pencarian.
          </p>
          <button
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-canvas-100 sm:w-auto"
            onClick={onClose}
            type="button"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Nested Camera Scanner Modal */}
      {isCameraOpen && (
        <BarcodeScannerModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onDetected={handleCameraDetected}
          title="Pindai Barcode Barang atau Rak"
        />
      )}
    </div>
  );
}
