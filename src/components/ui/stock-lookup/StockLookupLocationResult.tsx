import { Layers, MapPin, Package, Warehouse } from "lucide-react";
import { formatDecimal } from "@/lib/decimal";
import type { StockBalance } from "@/features/stock/types";
import { QrCodeVisual } from "../BarcodeVisual";
import type { LocationSummary } from "./stockLookupApi";

interface StockLookupLocationResultProps {
  locationInfo: LocationSummary;
  balances: StockBalance[];
  distinctItemsCount: number;
  totalOnHand: string;
}

/**
 * Renders multi-SKU inspection results when the lookup resolves to a rack location or warehouse.
 */
export function StockLookupLocationResult({
  locationInfo,
  balances,
  distinctItemsCount,
  totalOnHand,
}: StockLookupLocationResultProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-lg)] border border-line-400 bg-surface-0 p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                <MapPin aria-hidden="true" size={13} />
                {locationInfo.scope === "warehouse" ? "GUDANG" : "LOKASI RAK"}:{" "}
                {locationInfo.code}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                <Warehouse aria-hidden="true" size={13} />
                {locationInfo.warehouse_code} · {locationInfo.warehouse_name}
              </span>
            </div>
            <h3 className="mt-2 text-base font-bold text-ink-950 sm:text-lg">
              {locationInfo.name}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <QrCodeVisual
              className="hidden border border-line-200 sm:inline-flex"
              showValue={false}
              size={44}
              value={locationInfo.code}
            />
            <div className="rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-2 text-right">
              <p className="text-[11px] font-medium text-blue-800">Macam Barang (SKU)</p>
              <p className="text-lg font-bold text-blue-950 tabular-nums">
                {distinctItemsCount} <span className="text-xs font-normal text-blue-800">SKU</span>
              </p>
            </div>
            <div className="rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-2 text-right">
              <p className="text-[11px] font-medium text-teal-700">Total Unit Fisik</p>
              <p className="text-lg font-bold text-teal-950 tabular-nums">{totalOnHand}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers aria-hidden="true" className="text-teal-700" size={18} />
            <h4 className="text-sm font-bold text-ink-950">
              Daftar Macam Barang di Lokasi Ini
            </h4>
          </div>
          <span className="text-xs font-medium text-slate-600">
            {distinctItemsCount} macam SKU ({balances.length} baris stok)
          </span>
        </div>

        {balances.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
            <p className="font-semibold">Lokasi rak saat ini kosong</p>
            <p className="mt-0.5 text-amber-800">
              Tidak ada barang yang sedang tersimpan di lokasi rak {locationInfo.code}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-400">
            <table className="w-full min-w-[600px] text-left text-xs text-ink-950">
              <thead className="border-b border-line-400 bg-canvas-50 text-[11px] font-semibold text-slate-700">
                <tr>
                  <th className="px-3.5 py-2.5">SKU / Barcode</th>
                  <th className="px-3.5 py-2.5">Nama Barang</th>
                  <th className="px-3.5 py-2.5">Kategori</th>
                  <th className="px-3.5 py-2.5">Rak / Bin</th>
                  <th className="px-3.5 py-2.5 text-right">Qty Fisik</th>
                  <th className="px-3.5 py-2.5 text-right">In-Transit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-300 bg-surface-0">
                {balances.map((row) => (
                  <tr
                    className="transition hover:bg-canvas-50/80"
                    key={`${row.warehouse_id}-${row.location_id}-${row.item_id}`}
                  >
                    <td className="px-3.5 py-2.5 font-semibold tabular-nums">
                      <div className="flex items-center gap-1.5 text-teal-800">
                        <Package aria-hidden="true" size={13} />
                        <span>{row.item_sku}</span>
                      </div>
                      {row.item_barcode && (
                        <div className="mt-0.5 font-mono text-[10px] font-normal text-slate-500">
                          BC: {row.item_barcode}
                        </div>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 font-semibold text-ink-950">
                      {row.item_name}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-600">{row.category_name}</td>
                    <td className="px-3.5 py-2.5">
                      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono font-bold text-slate-800">
                        {row.location_code}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold tabular-nums text-ink-950">
                      {formatDecimal(row.qty_on_hand)} {row.uom_code}
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-600">
                      {formatDecimal(row.qty_in_transit)} {row.uom_code}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
