import { MapPin, ScanBarcode, Warehouse } from "lucide-react";
import { formatDecimal } from "@/lib/decimal";
import type { StockBalance } from "@/features/stock/types";
import { BarcodeVisual } from "../BarcodeVisual";
import type { ItemSummary } from "./stockLookupApi";

interface StockLookupItemResultProps {
  itemInfo: ItemSummary;
  balances: StockBalance[];
  distinctWarehousesCount: number;
  totalOnHand: string;
  totalInTransit: string;
}

/**
 * Renders single-item stock summary and per-rack distribution when a lookup matches an item SKU/barcode.
 */
export function StockLookupItemResult({
  itemInfo,
  balances,
  distinctWarehousesCount,
  totalOnHand,
  totalInTransit,
}: StockLookupItemResultProps) {
  return (
    <div className="space-y-6">
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

          <div className="flex flex-wrap items-center gap-3">
            <BarcodeVisual
              className="hidden border border-line-200 sm:inline-flex"
              height={32}
              showValue={false}
              value={itemInfo.barcode || itemInfo.sku}
            />
            <div className="rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-2 text-right">
              <p className="text-[11px] font-medium text-teal-700">Total Saldo Fisik</p>
              <p className="text-lg font-bold text-teal-950 tabular-nums">
                {totalOnHand}{" "}
                <span className="text-xs font-normal text-teal-700">
                  {itemInfo.uom_code || ""}
                </span>
              </p>
            </div>
            <div className="rounded-lg border border-line-300 bg-canvas-50 px-4 py-2 text-right">
              <p className="text-[11px] font-medium text-slate-600">Dalam Pengiriman</p>
              <p className="text-lg font-bold text-ink-950 tabular-nums">
                {totalInTransit}{" "}
                <span className="text-xs font-normal text-slate-600">
                  {itemInfo.uom_code || ""}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
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
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-400">
            <table className="w-full min-w-[600px] text-left text-xs text-ink-950">
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
                          <span className="font-mono text-[10px] text-slate-500">
                            ({row.warehouse_code})
                          </span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono font-bold text-teal-800">
                          {row.location_code}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700">{row.location_name}</td>
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
  );
}
