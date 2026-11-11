import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  MapPin,
  RefreshCw,
  ScanBarcode,
  Search,
  Warehouse,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { formatDecimal, toDecimal } from "@/lib/decimal";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { BarcodeScannerModal } from "./BarcodeScannerModal";
import type { StockBalance } from "@/features/stock/types";
import type { Paginated } from "@/types/api";

export interface StockLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface ItemSummary {
  id: number;
  sku: string;
  barcode: string | null;
  name: string;
  category_name?: string;
  uom_code?: string;
}

export function StockLookupModal({
  isOpen,
  onClose,
  initialQuery = "",
}: StockLookupModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [itemInfo, setItemInfo] = useState<ItemSummary | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSearchTerm("");
      setBalances([]);
      setItemInfo(null);
      setHasSearched(false);
      setError(null);
      setIsCameraOpen(false);
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  // If initialQuery is passed when opening
  useEffect(() => {
    if (isOpen && initialQuery.trim()) {
      setQuery(initialQuery.trim());
      executeLookup(initialQuery.trim());
    }
  }, [isOpen, initialQuery]);

  // Hardware barcode scanner support (USB / Bluetooth HID)
  useBarcodeScanner({
    enabled: isOpen && !isCameraOpen,
    onScan: (scannedCode) => {
      const trimmed = scannedCode.trim();
      if (trimmed) {
        setQuery(trimmed);
        executeLookup(trimmed);
      }
    },
  });

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isCameraOpen) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCameraOpen, onClose]);

  async function executeLookup(keyword: string) {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setSearchTerm(trimmed);
    setHasSearched(true);

    try {
      // 1. Cari saldo lokasi berdasarkan barcode / SKU
      const { data: balanceData } = await apiClient.get<Paginated<StockBalance>>(
        "/stock/by-location",
        {
          params: {
            search: trimmed,
            limit: 100,
          },
        },
      );

      const items = balanceData?.items || [];
      setBalances(items);

      if (items.length > 0) {
        // Ambil info barang dari baris saldo pertama
        const first = items[0];
        setItemInfo({
          id: first.item_id,
          sku: first.item_sku,
          barcode: first.item_barcode || null,
          name: first.item_name,
          category_name: first.category_name,
          uom_code: first.uom_code,
        });
      } else {
        // 2. Jika saldo kosong di seluruh rak, cek apakah barang terdaftar di master data
        try {
          const { data: itemData } = await apiClient.get<
            Paginated<{
              id: number;
              sku: string;
              barcode: string | null;
              name: string;
              category_name: string;
              uom_code: string;
            }>
          >("/items", {
            params: {
              search: trimmed,
              limit: 5,
            },
          });

          const matched = itemData?.items?.find(
            (it) =>
              it.sku.toLowerCase() === trimmed.toLowerCase() ||
              (it.barcode && it.barcode.toLowerCase() === trimmed.toLowerCase()),
          ) || itemData?.items?.[0];

          if (matched) {
            setItemInfo({
              id: matched.id,
              sku: matched.sku,
              barcode: matched.barcode,
              name: matched.name,
              category_name: matched.category_name,
              uom_code: matched.uom_code,
            });
          } else {
            setItemInfo(null);
          }
        } catch {
          setItemInfo(null);
        }
      }
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

  // Ringkasan kalkulasi saldo
  const { totalOnHand, totalInTransit, distinctWarehousesCount } = useMemo(() => {
    let onHandSum = toDecimal("0");
    let inTransitSum = toDecimal("0");
    const warehouseSet = new Set<string>();

    for (const b of balances) {
      onHandSum = onHandSum.plus(toDecimal(b.qty_on_hand || "0"));
      inTransitSum = inTransitSum.plus(toDecimal(b.qty_in_transit || "0"));
      warehouseSet.add(b.warehouse_code);
    }

    return {
      totalOnHand: formatDecimal(onHandSum.toString()),
      totalInTransit: formatDecimal(inTransitSum.toString()),
      distinctWarehousesCount: warehouseSet.size,
    };
  }, [balances]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby="stock-lookup-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-[var(--radius-lg)] border border-line-500 bg-surface-0 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <ScanBarcode aria-hidden="true" size={22} />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-ink-950"
                id="stock-lookup-title"
              >
                Cek Stok & Posisi Rak Barang
              </h2>
              <p className="text-xs text-slate-600">
                Pindai barcode fisik atau masukkan SKU untuk melihat detail barang dan posisi rak gudang secara langsung.
              </p>
            </div>
          </div>
          <button
            aria-label="Tutup pencarian stok"
            className="grid size-9 place-items-center rounded-[var(--radius-md)] text-slate-600 transition hover:bg-canvas-100 hover:text-ink-950"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        {/* Search & Scan Toolbar */}
        <div className="border-b border-line-300 bg-canvas-50/50 px-6 py-3.5">
          <form className="flex flex-wrap items-center gap-2 sm:flex-nowrap" onSubmit={handleSubmit}>
            <div className="relative flex-1">
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
                placeholder="Pindai barcode atau ketik SKU / Barcode..."
                ref={inputRef}
                type="text"
                value={query}
              />
            </div>
            <button
              className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-md)] bg-teal-700 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-teal-800 disabled:opacity-60"
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
              className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-xs font-semibold text-ink-950 hover:bg-canvas-100"
              onClick={() => setIsCameraOpen(true)}
              type="button"
            >
              <Camera aria-hidden="true" size={16} />
              <span className="hidden sm:inline">Pindai Kamera</span>
            </button>
          </form>
        </div>

        {/* Modal Body / Results */}
        <div className="flex-1 overflow-y-auto p-6">
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
                Arahkan scanner barcode fisik ke produk, gunakan kamera, atau ketik SKU/barcode pada kolom pencarian di atas untuk memeriksa posisi rak dan saldo stok.
              </p>
            </div>
          )}

          {!isLoading && hasSearched && !itemInfo && balances.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-line-300 bg-canvas-50 py-12 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700">
                <AlertCircle aria-hidden="true" size={26} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-ink-950">
                Barang tidak ditemukan
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Tidak ada barang atau saldo stok yang cocok dengan kata kunci &quot;{searchTerm}&quot;.
              </p>
            </div>
          )}

          {!isLoading && hasSearched && itemInfo && (
            <div className="space-y-6">
              {/* Item Card */}
              <div className="rounded-[var(--radius-lg)] border border-line-400 bg-surface-0 p-5 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                        {itemInfo.sku}
                      </span>
                      {itemInfo.barcode ? (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 tabular-nums">
                          <ScanBarcode aria-hidden="true" size={13} />
                          {itemInfo.barcode}
                        </span>
                      ) : (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          Tanpa Barcode
                        </span>
                      )}
                      {itemInfo.category_name && (
                        <span className="rounded border border-line-400 px-2 py-0.5 text-xs text-slate-700">
                          {itemInfo.category_name}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-base font-bold text-ink-950 sm:text-lg">
                      {itemInfo.name}
                    </h3>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-2 text-right">
                      <p className="text-[11px] font-medium text-teal-700">Total Saldo Fisik</p>
                      <p className="text-lg font-bold text-teal-950 tabular-nums">
                        {totalOnHand} <span className="text-xs font-normal text-teal-700">{itemInfo.uom_code || ""}</span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-line-300 bg-canvas-50 px-4 py-2 text-right">
                      <p className="text-[11px] font-medium text-slate-600">Dalam Pengiriman</p>
                      <p className="text-lg font-bold text-ink-950 tabular-nums">
                        {totalInTransit} <span className="text-xs font-normal text-slate-600">{itemInfo.uom_code || ""}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rack Location Table */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin aria-hidden="true" className="text-teal-700" size={18} />
                    <h4 className="text-sm font-bold text-ink-950">
                      Sebaran Posisi Rak & Gudang Penyimpanan
                    </h4>
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    {balances.length} lokasi rak ({distinctWarehousesCount} gudang)
                  </span>
                </div>

                {balances.length === 0 ? (
                  <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
                    <p className="font-semibold">Saldo belum tersedia di rak gudang</p>
                    <p className="mt-0.5 text-amber-800">
                      Barang terdaftar pada master data, namun belum memiliki kuantitas aktif pada rak gudang mana pun.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-line-400">
                    <table className="w-full text-left text-xs text-ink-950">
                      <thead className="border-b border-line-400 bg-canvas-50 text-[11px] font-semibold text-slate-700">
                        <tr>
                          <th className="px-3.5 py-2.5">Gudang</th>
                          <th className="px-3.5 py-2.5">Kode Rak / Bin</th>
                          <th className="px-3.5 py-2.5">Nama Lokasi</th>
                          <th className="px-3.5 py-2.5 text-right">Qty Fisik</th>
                          <th className="px-3.5 py-2.5 text-right">In-Transit</th>
                          <th className="px-3.5 py-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-300 bg-surface-0">
                        {balances.map((row) => {
                          const onHand = parseFloat(row.qty_on_hand || "0");
                          const isAvailable = onHand > 0;
                          return (
                            <tr
                              className="transition hover:bg-canvas-50/80"
                              key={`${row.warehouse_id}-${row.location_id}-${row.item_id}`}
                            >
                              <td className="px-3.5 py-2.5 font-medium">
                                <div className="flex items-center gap-1.5">
                                  <Warehouse aria-hidden="true" className="text-slate-500" size={14} />
                                  <span>{row.warehouse_name}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">({row.warehouse_code})</span>
                                </div>
                              </td>
                              <td className="px-3.5 py-2.5">
                                <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono font-bold text-teal-800">
                                  {row.location_code}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-700">
                                {row.location_name}
                              </td>
                              <td className="px-3.5 py-2.5 text-right font-bold tabular-nums text-ink-950">
                                {formatDecimal(row.qty_on_hand)} {row.uom_code}
                              </td>
                              <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-600">
                                {formatDecimal(row.qty_in_transit)} {row.uom_code}
                              </td>
                              <td className="px-3.5 py-2.5 text-center">
                                <span
                                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    isAvailable
                                      ? "bg-green-100 text-green-800"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {isAvailable ? "Tersedia" : "Kosong"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-line-500 bg-canvas-50/50 px-6 py-3">
          <p className="text-[11px] text-slate-600">
            Tekan <kbd className="rounded border border-line-300 bg-surface-0 px-1 py-0.5 font-mono text-[10px]">Esc</kbd> untuk menutup jendela pencarian.
          </p>
          <button
            className="rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-canvas-100"
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
          title="Pindai Barcode Fisik Barang"
        />
      )}
    </div>
  );
}
