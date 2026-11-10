import { FormEvent, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatDecimal } from "@/lib/decimal";
import {
  useStockBalances,
  useStockMovements,
  useStockSummary,
  useWarehouseBalances,
} from "../api";
import type {
  StockBalance,
  StockListParams,
  StockMovement,
  StockSummary,
  WarehouseStockBalance,
} from "../types";

const initialParams: StockListParams = {
  limit: 25,
  offset: 0,
  search: "",
  warehouse_id: "",
  location_id: "",
  item_id: "",
  category_id: "",
  date_from: "",
  date_to: "",
  movement_type: "",
  reference_type: "",
  reference_id: "",
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatQuantity(value: string) {
  return formatDecimal(value);
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
}

export function StockPage() {
  const { pathname } = useLocation();
  const [params, setParams] = useState(initialParams);
  const [draft, setDraft] = useState(initialParams);
  const isWarehouseView =
    pathname === "/stock/by-warehouse" || pathname === "/stock/warehouse";
  const isSummaryView = pathname === "/stock/summary";
  const isTransitView = pathname === "/stock/in-transit";
  const isLedgerView = pathname === "/stock/ledger";
  const title = isLedgerView
    ? "Buku besar stok"
    : isWarehouseView
      ? "Saldo stok per gudang"
      : isSummaryView
        ? "Ringkasan stok"
        : isTransitView
          ? "Stok dalam perjalanan"
          : "Saldo stok per lokasi";

  const balances = useStockBalances(params, !isWarehouseView && !isSummaryView && !isLedgerView);
  const warehouseBalances = useWarehouseBalances(params, isWarehouseView);
  const summary = useStockSummary(params, isSummaryView);
  const movements = useStockMovements(params, isLedgerView);
  const query = isLedgerView
    ? movements
    : isWarehouseView
      ? warehouseBalances
      : isSummaryView
        ? summary
        : balances;

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setParams({ ...draft, offset: 0 });
  }

  function reset() {
    setDraft(initialParams);
    setParams(initialParams);
  }

  return (
    <>
      <PageHeader
        description={
          isLedgerView
            ? "Riwayat pergerakan stok yang tercatat dari dokumen transaksi."
            : "Baca posisi stok aktual tanpa mengubah saldo dari halaman ini."
        }
        title={title}
      />
      <StockNavigation activePath={pathname} />
      <form
        className="mb-6 grid gap-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={apply}
      >
        {!isLedgerView && (
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Cari barang atau SKU</span>
            <span className="flex h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3">
              <Search aria-hidden="true" className="text-slate-600" size={16} />
              <input
                aria-label="Cari barang atau SKU"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                onChange={(event) => setDraft({ ...draft, search: event.target.value })}
                placeholder="Contoh: MCU atau kardus"
                value={draft.search}
              />
            </span>
          </label>
        )}
        {isLedgerView && (
          <>
            <Field label="Gudang ID" type="number" value={draft.warehouse_id} onChange={(value) => setDraft({ ...draft, warehouse_id: value })} />
            <Field label="Lokasi ID" type="number" value={draft.location_id} onChange={(value) => setDraft({ ...draft, location_id: value })} />
            <Field label="Barang ID" type="number" value={draft.item_id} onChange={(value) => setDraft({ ...draft, item_id: value })} />
            <SelectField label="Jenis mutasi" value={draft.movement_type} onChange={(value) => setDraft({ ...draft, movement_type: value })} options={[["", "Semua jenis"], ["IN_PURCHASE", "Penerimaan pembelian"], ["OUT_TRANSFER", "Pengeluaran transfer"], ["IN_TRANSFER", "Penerimaan transfer"], ["ADJUSTMENT_PLUS", "Penyesuaian tambah"], ["ADJUSTMENT_MINUS", "Penyesuaian kurang"]]} />
            <SelectField label="Jenis referensi" value={draft.reference_type} onChange={(value) => setDraft({ ...draft, reference_type: value })} options={[["", "Semua referensi"], ["GOODS_RECEIPT", "Goods receipt"], ["STOCK_TRANSFER", "Stock transfer"], ["STOCK_OPNAME", "Stock opname"]]} />
            <Field label="Reference ID" type="number" value={draft.reference_id} onChange={(value) => setDraft({ ...draft, reference_id: value })} />
            <Field label="Mulai tanggal" type="date" value={draft.date_from} onChange={(value) => setDraft({ ...draft, date_from: value })} />
            <Field label="Sampai tanggal" type="date" value={draft.date_to} onChange={(value) => setDraft({ ...draft, date_to: value })} />
          </>
        )}
        {!isLedgerView && (
          <>
            <Field label="Gudang ID" type="number" value={draft.warehouse_id} onChange={(value) => setDraft({ ...draft, warehouse_id: value })} />
            {(!isWarehouseView && !isSummaryView) && <Field label="Lokasi ID" type="number" value={draft.location_id} onChange={(value) => setDraft({ ...draft, location_id: value })} />}
            <Field label="Barang ID" type="number" value={draft.item_id} onChange={(value) => setDraft({ ...draft, item_id: value })} />
            <Field label="Kategori ID" type="number" value={draft.category_id} onChange={(value) => setDraft({ ...draft, category_id: value })} />
          </>
        )}
        <div className="flex items-end gap-2">
          <button className="min-h-11 rounded-[var(--radius-md)] bg-ink-950 px-4 text-sm font-semibold text-surface-0 hover:bg-ink-800" type="submit">
            Terapkan
          </button>
          <button aria-label="Atur ulang filter" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 text-ink-950 hover:bg-canvas-50" onClick={reset} type="button">
            <RotateCcw aria-hidden="true" size={16} />
          </button>
        </div>
      </form>
      {query.isLoading ? (
        <State text="Memuat data stok..." />
      ) : query.isError ? (
        <State error onRetry={() => void query.refetch()} text="Data stok belum dapat dimuat. Periksa koneksi lalu coba lagi." />
      ) : isLedgerView ? (
        <LedgerTable items={movements.data?.items ?? []} />
      ) : isSummaryView ? (
        <SummaryTable items={summary.data?.items ?? []} />
      ) : isWarehouseView ? (
        <WarehouseBalanceTable items={warehouseBalances.data?.items ?? []} />
      ) : (
        <BalanceTable items={balances.data?.items ?? []} showTransit={isTransitView} />
      )}
      {query.data && query.data.items.length > 0 && (
        <p className="mt-4 text-xs text-slate-600">
          Menampilkan {query.data.items.length} baris dari {query.data.total} data.
        </p>
      )}
    </>
  );
}

function StockNavigation({ activePath }: { activePath: string }) {
  const links = [
    ["/stock/by-location", "Per lokasi"],
    ["/stock/by-warehouse", "Per gudang"],
    ["/stock/summary", "Ringkasan"],
    ["/stock/in-transit", "Dalam perjalanan"],
    ["/stock/ledger", "Buku besar"],
  ];
  return (
    <nav aria-label="Tampilan stok" className="mb-6 flex gap-1 overflow-x-auto border-b border-line-200">
      {links.map(([path, label]) => (
        <Link
          className={`min-h-11 shrink-0 border-b-2 px-3 py-2 text-sm font-semibold ${activePath === path ? "border-teal-600 text-teal-700" : "border-transparent text-slate-700 hover:border-line-500 hover:text-ink-950"}`}
          key={path}
          to={path}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Field({ label, value, onChange, type = "number" }: { label: string; value: string; onChange: (value: string) => void; type?: "number" | "date" }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      <input className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm text-ink-950" min={type === "number" ? 1 : undefined} onChange={(event) => onChange(event.target.value)} type={type} value={value} />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      <select className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm text-ink-950" onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function BalanceTable({ items, showTransit }: { items: StockBalance[]; showTransit: boolean }) {
  return (
    <TableFrame caption="Daftar saldo stok" empty={items.length === 0}>
      <thead><tr><Th>Barang</Th><Th>Gudang</Th><Th>Lokasi</Th><Th align="right">Saldo</Th><Th align="right">Tersedia</Th>{showTransit && <Th align="right">Dalam perjalanan</Th>}</tr></thead>
      <tbody className="divide-y divide-line-200">{items.map((item) => <tr key={`${item.warehouse_id}-${item.location_id}-${item.item_id}`}><td className="px-4 py-4"><p className="font-semibold text-ink-950">{item.item_name}</p><p className="text-xs text-slate-600">{item.item_sku} · {item.uom_code}</p></td><td className="px-4 py-4">{item.warehouse_code} · {item.warehouse_name}</td><td className="px-4 py-4">{item.location_code} · {item.location_name}</td><td className="px-4 py-4 text-right tabular-nums">{formatQuantity(item.qty_on_hand)}</td>{showTransit && <td className="px-4 py-4 text-right tabular-nums">{formatQuantity(item.qty_in_transit)}</td>}</tr>)}</tbody>
    </TableFrame>
  );
}

function WarehouseBalanceTable({ items }: { items: WarehouseStockBalance[] }) {
  return (
    <TableFrame caption="Saldo stok per gudang" empty={items.length === 0}>
      <thead><tr><Th>Barang</Th><Th>Gudang</Th><Th align="right">Saldo</Th><Th align="right">Dalam perjalanan</Th></tr></thead>
      <tbody className="divide-y divide-line-200">{items.map((item) => <tr key={`${item.warehouse_id}-${item.item_id}`}><td className="px-4 py-4"><p className="font-semibold text-ink-950">{item.item_name}</p><p className="text-xs text-slate-600">{item.item_sku} · {item.uom_code}</p></td><td className="px-4 py-4">{item.warehouse_code} · {item.warehouse_name}</td><td className="px-4 py-4 text-right tabular-nums">{formatQuantity(item.qty_on_hand)}</td><td className="px-4 py-4 text-right tabular-nums">{formatQuantity(item.qty_in_transit)}</td></tr>)}</tbody>
    </TableFrame>
  );
}

function SummaryTable({ items }: { items: StockSummary[] }) {
  return <TableFrame caption="Ringkasan stok" empty={items.length === 0}><thead><tr><Th>Barang</Th><Th align="right">Saldo</Th><Th align="right">Dalam perjalanan</Th></tr></thead><tbody className="divide-y divide-line-200">{items.map((item) => <tr key={item.item_id}><td className="px-4 py-4"><p className="font-semibold text-ink-950">{item.item_name}</p><p className="text-xs text-slate-600">{item.item_sku} · {item.uom_code}</p></td><td className="px-4 py-4 text-right tabular-nums">{formatQuantity(item.qty_on_hand)}</td><td className="px-4 py-4 text-right tabular-nums">{formatQuantity(item.qty_in_transit)}</td></tr>)}</tbody></TableFrame>;
}

function LedgerTable({ items }: { items: StockMovement[] }) {
  return <TableFrame caption="Buku besar stok" empty={items.length === 0}><thead><tr><Th>Waktu</Th><Th>Barang</Th><Th>Jenis</Th><Th>Referensi</Th><Th align="right">Sebelum</Th><Th align="right">Perubahan</Th><Th align="right">Sesudah</Th></tr></thead><tbody className="divide-y divide-line-200">{items.map((item) => <tr key={item.id}><td className="whitespace-nowrap px-4 py-4 text-xs text-slate-700">{formatDate(item.created_at)}</td><td className="px-4 py-4"><p className="font-semibold text-ink-950">{item.item_name}</p><p className="text-xs text-slate-600">{item.item_sku} · {item.uom_code}</p></td><td className="px-4 py-4">{item.movement_type}</td><td className="px-4 py-4">{item.reference_type ?? "Tidak tersedia"}<p className="text-xs text-slate-600">ID {item.reference_id ?? "-"}</p></td><td className="px-4 py-4 text-right tabular-nums">{formatQuantity(item.qty_before)}</td><td className="px-4 py-4 text-right tabular-nums">{formatQuantity(item.qty_change)}</td><td className="px-4 py-4 text-right tabular-nums">{formatQuantity(item.qty_after)}</td></tr>)}</tbody></TableFrame>;
}

function TableFrame({ caption, children, empty }: { caption: string; children: React.ReactNode; empty: boolean }) {
  return <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">{empty ? <State text="Belum ada data untuk filter ini." /> : <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><caption className="sr-only">{caption}</caption>{children}</table></div>}</section>;
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <th className={`bg-canvas-50 px-4 py-3 text-xs font-semibold text-slate-700 ${align === "right" ? "text-right" : ""}`}>{children}</th>;
}

function State({ text, error = false, onRetry }: { text: string; error?: boolean; onRetry?: () => void }) {
  return <div className={`rounded-[var(--radius-lg)] border ${error ? "border-red-200 bg-red-50" : "border-dashed border-line-500 bg-surface-0"} p-8 text-center`}><p className="font-semibold text-ink-950">{text}</p>{!error && <p className="mt-1 text-sm text-slate-700">Data akan muncul setelah transaksi stok tercatat.</p>}{error && onRetry && <button className="mt-4 min-h-11 rounded-[var(--radius-md)] bg-red-700 px-4 font-semibold text-surface-0" onClick={onRetry} type="button">Coba lagi</button>}</div>;
}
