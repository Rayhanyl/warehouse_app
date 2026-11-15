import type {
  StockBalance,
  StockMovement,
  StockSummary,
  WarehouseStockBalance,
} from "../types";
import {
  StockCardList,
  StockTableFrame,
  StockTh,
} from "./StockShared";
import { formatStockDate, formatStockQuantity } from "../utils";

export function BalanceTable({
  items,
  showTransit,
  isMobile,
}: {
  items: StockBalance[];
  showTransit: boolean;
  isMobile: boolean;
}) {
  if (isMobile) {
    return (
      <StockCardList empty={items.length === 0}>
        <ul aria-label="Daftar saldo stok" className="divide-y divide-line-200">
          {items.map((item) => (
            <li
              className="space-y-2.5 p-4"
              key={`${item.warehouse_id}-${item.location_id}-${item.item_id}`}
            >
              <div>
                <p className="font-semibold text-ink-950">{item.item_name}</p>
                <p className="text-xs text-slate-600">
                  {item.item_sku} · {item.uom_code}
                  {item.item_barcode ? ` · BC: ${item.item_barcode}` : ""}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-canvas-50/70 p-3 text-xs">
                <div>
                  <p className="text-slate-600">Gudang</p>
                  <p className="mt-0.5 font-semibold text-ink-950">
                    {item.warehouse_code} · {item.warehouse_name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Lokasi</p>
                  <p className="mt-0.5 font-semibold text-ink-950">
                    {item.location_code} · {item.location_name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Saldo</p>
                  <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                    {formatStockQuantity(item.qty_on_hand)}
                  </p>
                </div>
                {showTransit && (
                  <div>
                    <p className="text-slate-600">Dalam perjalanan</p>
                    <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                      {formatStockQuantity(item.qty_in_transit)}
                    </p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </StockCardList>
    );
  }

  return (
    <StockTableFrame caption="Daftar saldo stok" empty={items.length === 0}>
      <thead>
        <tr>
          <StockTh>Barang</StockTh>
          <StockTh>Gudang</StockTh>
          <StockTh>Lokasi</StockTh>
          <StockTh align="right">Saldo</StockTh>
          {showTransit && <StockTh align="right">Dalam perjalanan</StockTh>}
        </tr>
      </thead>
      <tbody className="divide-y divide-line-200">
        {items.map((item) => (
          <tr key={`${item.warehouse_id}-${item.location_id}-${item.item_id}`}>
            <td className="px-4 py-4">
              <p className="font-semibold text-ink-950">{item.item_name}</p>
              <p className="text-xs text-slate-600">
                {item.item_sku} · {item.uom_code}
                {item.item_barcode ? ` · BC: ${item.item_barcode}` : ""}
              </p>
            </td>
            <td className="px-4 py-4">
              {item.warehouse_code} · {item.warehouse_name}
            </td>
            <td className="px-4 py-4">
              {item.location_code} · {item.location_name}
            </td>
            <td className="px-4 py-4 text-right tabular-nums">
              {formatStockQuantity(item.qty_on_hand)}
            </td>
            {showTransit && (
              <td className="px-4 py-4 text-right tabular-nums">
                {formatStockQuantity(item.qty_in_transit)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </StockTableFrame>
  );
}

export function WarehouseBalanceTable({
  items,
  isMobile,
}: {
  items: WarehouseStockBalance[];
  isMobile: boolean;
}) {
  if (isMobile) {
    return (
      <StockCardList empty={items.length === 0}>
        <ul aria-label="Saldo stok per gudang" className="divide-y divide-line-200">
          {items.map((item) => (
            <li className="space-y-2.5 p-4" key={`${item.warehouse_id}-${item.item_id}`}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink-950">{item.item_name}</p>
                  {item.is_critical && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                      Kritis
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {item.item_sku} · {item.uom_code}
                  {item.item_barcode ? ` · BC: ${item.item_barcode}` : ""}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-md)] bg-canvas-50/70 p-3 text-xs">
                <div className="col-span-3">
                  <p className="text-slate-600">Gudang</p>
                  <p className="mt-0.5 font-semibold text-ink-950">
                    {item.warehouse_code} · {item.warehouse_name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Saldo</p>
                  <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                    {formatStockQuantity(item.qty_on_hand)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Min. Stok</p>
                  <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                    {formatStockQuantity(item.min_stock ?? "0")}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Dalam perjalanan</p>
                  <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                    {formatStockQuantity(item.qty_in_transit)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </StockCardList>
    );
  }

  return (
    <StockTableFrame caption="Saldo stok per gudang" empty={items.length === 0}>
      <thead>
        <tr>
          <StockTh>Barang</StockTh>
          <StockTh>Gudang</StockTh>
          <StockTh align="right">Saldo</StockTh>
          <StockTh align="right">Min. Stok</StockTh>
          <StockTh align="right">Dalam perjalanan</StockTh>
        </tr>
      </thead>
      <tbody className="divide-y divide-line-200">
        {items.map((item) => (
          <tr key={`${item.warehouse_id}-${item.item_id}`}>
            <td className="px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-ink-950">{item.item_name}</p>
                {item.is_critical && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                    Kritis
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                {item.item_sku} · {item.uom_code}
                {item.item_barcode ? ` · BC: ${item.item_barcode}` : ""}
              </p>
            </td>
            <td className="px-4 py-4">
              {item.warehouse_code} · {item.warehouse_name}
            </td>
            <td className="px-4 py-4 text-right tabular-nums">
              {formatStockQuantity(item.qty_on_hand)}
            </td>
            <td className="px-4 py-4 text-right tabular-nums text-slate-600">
              {formatStockQuantity(item.min_stock ?? "0")}
            </td>
            <td className="px-4 py-4 text-right tabular-nums">
              {formatStockQuantity(item.qty_in_transit)}
            </td>
          </tr>
        ))}
      </tbody>
    </StockTableFrame>
  );
}

export function SummaryTable({
  items,
  isMobile,
}: {
  items: StockSummary[];
  isMobile: boolean;
}) {
  if (isMobile) {
    return (
      <StockCardList empty={items.length === 0}>
        <ul aria-label="Ringkasan stok" className="divide-y divide-line-200">
          {items.map((item) => (
            <li className="space-y-2.5 p-4" key={item.item_id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink-950">{item.item_name}</p>
                  {item.is_critical && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                      Kritis
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {item.item_sku} · {item.uom_code}
                  {item.item_barcode ? ` · BC: ${item.item_barcode}` : ""}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-md)] bg-canvas-50/70 p-3 text-xs">
                <div>
                  <p className="text-slate-600">Saldo</p>
                  <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                    {formatStockQuantity(item.qty_on_hand)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Min. Stok</p>
                  <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                    {formatStockQuantity(item.min_stock ?? "0")}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Dalam perjalanan</p>
                  <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                    {formatStockQuantity(item.qty_in_transit)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </StockCardList>
    );
  }

  return (
    <StockTableFrame caption="Ringkasan stok" empty={items.length === 0}>
      <thead>
        <tr>
          <StockTh>Barang</StockTh>
          <StockTh align="right">Saldo</StockTh>
          <StockTh align="right">Min. Stok</StockTh>
          <StockTh align="right">Dalam perjalanan</StockTh>
        </tr>
      </thead>
      <tbody className="divide-y divide-line-200">
        {items.map((item) => (
          <tr key={item.item_id}>
            <td className="px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-ink-950">{item.item_name}</p>
                {item.is_critical && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                    Kritis
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                {item.item_sku} · {item.uom_code}
                {item.item_barcode ? ` · BC: ${item.item_barcode}` : ""}
              </p>
            </td>
            <td className="px-4 py-4 text-right tabular-nums">
              {formatStockQuantity(item.qty_on_hand)}
            </td>
            <td className="px-4 py-4 text-right tabular-nums text-slate-600">
              {formatStockQuantity(item.min_stock ?? "0")}
            </td>
            <td className="px-4 py-4 text-right tabular-nums">
              {formatStockQuantity(item.qty_in_transit)}
            </td>
          </tr>
        ))}
      </tbody>
    </StockTableFrame>
  );
}

export function LedgerTable({
  items,
  isMobile,
}: {
  items: StockMovement[];
  isMobile: boolean;
}) {
  if (isMobile) {
    return (
      <StockCardList empty={items.length === 0}>
        <ul aria-label="Buku besar stok" className="divide-y divide-line-200">
          {items.map((item) => (
            <li className="space-y-2.5 p-4" key={item.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-950">{item.item_name}</p>
                  <p className="text-xs text-slate-600">
                    {item.item_sku} · {item.uom_code}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-canvas-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                  {item.movement_type}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {formatStockDate(item.created_at)} · {item.reference_type ?? "Tidak tersedia"} (ID{" "}
                {item.reference_id ?? "-"})
              </p>
              <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-md)] bg-canvas-50/70 p-3 text-xs">
                <div>
                  <p className="text-slate-600">Sebelum</p>
                  <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                    {formatStockQuantity(item.qty_before)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Perubahan</p>
                  <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                    {formatStockQuantity(item.qty_change)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Sesudah</p>
                  <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                    {formatStockQuantity(item.qty_after)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </StockCardList>
    );
  }

  return (
    <StockTableFrame caption="Buku besar stok" empty={items.length === 0}>
      <thead>
        <tr>
          <StockTh>Waktu</StockTh>
          <StockTh>Barang</StockTh>
          <StockTh>Jenis</StockTh>
          <StockTh>Referensi</StockTh>
          <StockTh align="right">Sebelum</StockTh>
          <StockTh align="right">Perubahan</StockTh>
          <StockTh align="right">Sesudah</StockTh>
        </tr>
      </thead>
      <tbody className="divide-y divide-line-200">
        {items.map((item) => (
          <tr key={item.id}>
            <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-700">
              {formatStockDate(item.created_at)}
            </td>
            <td className="px-4 py-4">
              <p className="font-semibold text-ink-950">{item.item_name}</p>
              <p className="text-xs text-slate-600">
                {item.item_sku} · {item.uom_code}
              </p>
            </td>
            <td className="px-4 py-4">{item.movement_type}</td>
            <td className="px-4 py-4">
              {item.reference_type ?? "Tidak tersedia"}
              <p className="text-xs text-slate-600">ID {item.reference_id ?? "-"}</p>
            </td>
            <td className="px-4 py-4 text-right tabular-nums">
              {formatStockQuantity(item.qty_before)}
            </td>
            <td className="px-4 py-4 text-right tabular-nums">
              {formatStockQuantity(item.qty_change)}
            </td>
            <td className="px-4 py-4 text-right tabular-nums">
              {formatStockQuantity(item.qty_after)}
            </td>
          </tr>
        ))}
      </tbody>
    </StockTableFrame>
  );
}
