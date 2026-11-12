import { FormEvent, useEffect, useState } from "react";
import Decimal from "decimal.js";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePermission } from "@/hooks/usePermission";
import {
  mapPurchaseOrderError,
  usePurchaseOrder,
  usePurchaseOrderMutation,
  usePurchaseOrderReferences,
  usePurchaseOrders,
} from "../api";
import type {
  PurchaseOrder,
  PurchaseOrderCreatePayload,
  PurchaseOrderLinePayload,
  PurchaseOrderListParams,
  PurchaseOrderStatus,
  PurchaseOrderSortField,
  ReferenceOption,
  SortDirection,
} from "../types";

const initialParams: PurchaseOrderListParams = {
  limit: 20,
  offset: 0,
  search: "",
  status: "all",
  supplier_id: null,
  warehouse_id: null,
  date_from: "",
  date_to: "",
  sort_by: "id",
  sort_dir: "desc",
};

const statusLabels: Record<PurchaseOrderStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Diterbitkan",
  PARTIALLY_RECEIVED: "Diterima sebagian",
  RECEIVED: "Diterima",
  CLOSED: "Ditutup",
  CANCELLED: "Dibatalkan",
};

const statusClasses: Record<PurchaseOrderStatus, string> = {
  DRAFT: "bg-canvas-50 text-slate-700",
  ISSUED: "bg-blue-100 text-blue-700",
  PARTIALLY_RECEIVED: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-teal-100 text-teal-700",
  CLOSED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00`),
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermission();
  const canCreate = can("po:create");
  const canIssue = can("po:issue");
  const canCancel = can("po:cancel");
  const canClose = can("po:close");
  const [params, setParams] = useState(initialParams);
  const [draftParams, setDraftParams] = useState(initialParams);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [actionTarget, setActionTarget] = useState<PurchaseOrder | null>(null);
  const [actionType, setActionType] = useState<"issue" | "cancel" | "close" | null>(null);
  const [closedReason, setClosedReason] = useState("");
  const { data, isLoading, isError, error, refetch } = usePurchaseOrders(params);
  const references = usePurchaseOrderReferences();
  const detail = usePurchaseOrder(detailId);
  const actionMutation = usePurchaseOrderMutation(actionType ?? "issue");

  useEffect(() => {
    const state = location.state as { openPurchaseOrderId?: unknown } | null;
    if (typeof state?.openPurchaseOrderId !== "number") return;
    setDetailId(state.openPurchaseOrderId);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageEnd = Math.min(params.offset + params.limit, total);
  const hasFilters = Boolean(
    params.search || params.status !== "all" || params.supplier_id || params.warehouse_id ||
      params.date_from || params.date_to,
  );

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setParams({ ...draftParams, offset: 0 });
  }

  function resetFilters() {
    setDraftParams(initialParams);
    setParams(initialParams);
  }

  function openAction(po: PurchaseOrder, action: "issue" | "cancel" | "close") {
    setClosedReason("");
    setActionTarget(po);
    setActionType(action);
  }

  async function submitAction() {
    if (!actionTarget || !actionType) return;
    if (actionType === "close" && !closedReason.trim()) {
      toast.error("Alasan penutupan wajib diisi.");
      return;
    }
    try {
      const updated = await actionMutation.mutateAsync({
        id: actionTarget.id,
        closedReason,
      });
      setActionTarget(null);
      setActionType(null);
      toast.success(`Purchase order ${updated.po_number} berhasil diperbarui.`);
    } catch (actionError) {
      const mapped = mapPurchaseOrderError(actionError, "Aksi purchase order belum berhasil.");
      toast.error(mapped.message);
    }
  }

  return (
    <>
      <PageHeader
        title="Purchase order"
        description="Catat pesanan barang ke pemasok dan pantau status penerimaannya per gudang."
        action={
          canCreate ? (
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
              to="/purchase-orders/new"
            >
              <Plus aria-hidden="true" size={17} />
              Buat purchase order
            </Link>
          ) : (
            <span className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-xs font-semibold text-slate-600">
              Mode baca saja
            </span>
          )
        }
      />

      <section
        aria-label="Filter daftar purchase order"
        className="mb-6 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-5"
      >
        <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={applyFilters}>
          <label className="text-sm font-semibold text-ink-950">
            Pencarian
            <div className="relative mt-2">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input
                className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 pr-3 pl-9 text-sm font-normal text-ink-950 placeholder:text-slate-600 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                onChange={(event) => setDraftParams((current) => ({ ...current, search: event.target.value }))}
                placeholder="Cari nomor, pemasok, atau catatan..."
                type="search"
                value={draftParams.search}
              />
            </div>
          </label>
          <label className="text-sm font-semibold text-ink-950">
            Status purchase order
            <select
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) => setDraftParams((current) => ({ ...current, status: event.target.value as PurchaseOrderStatus | "all" }))}
              value={draftParams.status}
            >
              <option value="all">Semua status</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <ReferenceSelect label="Pemasok" value={draftParams.supplier_id} options={references.data?.suppliers ?? []} onChange={(value) => setDraftParams((current) => ({ ...current, supplier_id: value }))} />
          <ReferenceSelect label="Gudang tujuan" value={draftParams.warehouse_id} options={references.data?.warehouses ?? []} onChange={(value) => setDraftParams((current) => ({ ...current, warehouse_id: value }))} />
          <label className="text-sm font-semibold text-ink-950">
            Tanggal mulai
            <input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => setDraftParams((current) => ({ ...current, date_from: event.target.value }))} type="date" value={draftParams.date_from} />
          </label>
          <label className="text-sm font-semibold text-ink-950">
            Tanggal akhir
            <input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => setDraftParams((current) => ({ ...current, date_to: event.target.value }))} type="date" value={draftParams.date_to} />
          </label>
          <label className="text-sm font-semibold text-ink-950">
            Urutkan berdasarkan
            <select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => setDraftParams((current) => ({ ...current, sort_by: event.target.value as PurchaseOrderSortField }))} value={draftParams.sort_by}>
              <option value="id">ID purchase order</option><option value="po_number">Nomor dokumen</option><option value="order_date">Tanggal pesanan</option><option value="status">Status</option><option value="created_at">Waktu dibuat</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-ink-950">
            Arah urutan
            <select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => setDraftParams((current) => ({ ...current, sort_dir: event.target.value as SortDirection }))} value={draftParams.sort_dir}>
              <option value="desc">Terbaru</option><option value="asc">Terlama</option>
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2 lg:col-span-4">
            <button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700" type="submit"><Filter aria-hidden="true" size={16} />Terapkan filter</button>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50" onClick={resetFilters} type="button"><RotateCcw aria-hidden="true" size={16} />Atur ulang filter</button>
          </div>
        </form>
      </section>

      {isLoading ? (
        <div className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-8 text-sm text-slate-700 shadow-[var(--shadow-1)]" role="status">Memuat daftar purchase order...</div>
      ) : isError ? (
        <div className="rounded-[var(--radius-lg)] border border-red-600/30 bg-red-100 p-6 text-sm text-red-700" role="alert">
          <p className="font-semibold">Daftar purchase order belum dapat dimuat</p>
          <p className="mt-1 text-slate-700">{mapPurchaseOrderError(error, "Terjadi kendala saat menghubungi server.").message}</p>
          <button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-red-600 px-4 font-semibold text-surface-0 hover:bg-red-700" onClick={() => void refetch()} type="button">Coba lagi</button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-line-500 bg-surface-0 p-8 text-center shadow-[var(--shadow-1)]">
          <p className="font-semibold text-ink-950">{hasFilters ? "Tidak ada data yang cocok dengan filter" : "Belum ada purchase order di gudang ini"}</p>
          <p className="mx-auto mt-2 max-w-[55ch] text-sm leading-6 text-slate-700">{hasFilters ? "Periksa kata kunci pencarian atau hapus beberapa filter untuk melihat kembali seluruh daftar." : "Catat pengadaan pertama untuk mulai memproses penerimaan barang di gudang terpilih."}</p>
          {hasFilters ? <button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50" onClick={resetFilters} type="button"><RotateCcw size={16} />Atur ulang filter</button> : canCreate ? <Link className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700" to="/purchase-orders/new"><Plus size={16} />Buat purchase order</Link> : null}
        </div>
      ) : (
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-collapse text-left text-sm">
              <caption className="sr-only">Daftar purchase order</caption>
              <thead className="bg-canvas-50 text-xs font-semibold text-slate-700"><tr><th className="px-4 py-3">Nomor dokumen</th><th className="px-4 py-3">Pemasok</th><th className="px-4 py-3">Gudang tujuan</th><th className="px-4 py-3">Tanggal pesanan</th><th className="px-4 py-3">Baris</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
              <tbody className="divide-y divide-line-200">
                {items.map((po) => <tr key={po.id} className="hover:bg-canvas-50/60"><td className="px-4 py-4"><button className="font-semibold text-teal-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-600" onClick={() => setDetailId(po.id)} type="button">{po.po_number}</button><p className="mt-1 text-xs text-slate-600 tabular-nums">ID #{po.id}</p></td><td className="px-4 py-4"><p className="font-semibold text-ink-950">{po.supplier_name}</p><p className="mt-1 text-xs text-slate-600">{po.supplier_code}</p></td><td className="px-4 py-4"><p className="text-ink-950">{po.warehouse_name}</p><p className="mt-1 text-xs text-slate-600">{po.warehouse_code}</p></td><td className="px-4 py-4 text-slate-700 tabular-nums">{formatDate(po.order_date)}</td><td className="px-4 py-4 text-slate-700 tabular-nums">{po.line_count}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[po.status]}`}>{statusLabels[po.status]}</span></td><td className="px-4 py-4 text-right"><button aria-label={`Lihat detail purchase order ${po.po_number}`} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-semibold text-ink-950 hover:bg-canvas-50" onClick={() => setDetailId(po.id)} type="button"><Eye size={16} />Detail</button></td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-200 px-4 py-3 text-sm text-slate-700"><span className="tabular-nums">Menampilkan {params.offset + 1} sampai {pageEnd} dari {total} purchase order</span><div className="flex gap-2"><button aria-label="Halaman sebelumnya" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:opacity-40" disabled={params.offset === 0} onClick={() => setParams((current) => ({ ...current, offset: Math.max(0, current.offset - current.limit) }))} type="button"><ChevronLeft size={17} /></button><button aria-label="Halaman berikutnya" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:opacity-40" disabled={pageEnd >= total} onClick={() => setParams((current) => ({ ...current, offset: current.offset + current.limit }))} type="button"><ChevronRight size={17} /></button></div></div>
        </section>
      )}

      {detailId !== null && <PurchaseOrderDetail purchaseOrder={detail.data} isLoading={detail.isLoading} canIssue={canIssue} canCancel={canCancel || canCreate} canClose={canClose} onClose={() => setDetailId(null)} onAction={openAction} />}
      {actionTarget && actionType && <ActionDialog purchaseOrder={actionTarget} action={actionType} closedReason={closedReason} isSubmitting={actionMutation.isPending} onReasonChange={setClosedReason} onClose={() => { setActionTarget(null); setActionType(null); }} onSubmit={() => void submitAction()} />}
    </>
  );
}

export function PurchaseOrderCreatePage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const references = usePurchaseOrderReferences();
  const createMutation = usePurchaseOrderMutation("create");

  if (!can("po:create")) return <Navigate replace to="/purchase-orders" />;

  async function createDraft(payload: PurchaseOrderCreatePayload) {
    try {
      const created = await createMutation.mutateAsync({ payload });
      toast.success(`Draft ${created.po_number} berhasil dibuat.`);
      navigate("/purchase-orders", { replace: true, state: { openPurchaseOrderId: created.id } });
    } catch (createError) {
      const mapped = mapPurchaseOrderError(createError, "Draft purchase order belum dapat dibuat.");
      toast.error(mapped.message);
      throw createError;
    }
  }

  return <>
    <PageHeader
      title="Buat purchase order"
      description="Isi informasi pesanan dan barang yang akan dibeli. Dokumen disimpan sebagai draft untuk diperiksa sebelum diterbitkan."
      action={<Link className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600" to="/purchase-orders"><ChevronLeft aria-hidden="true" size={17} />Kembali ke daftar</Link>}
    />
    <PurchaseOrderForm
      references={references.data}
      isSubmitting={createMutation.isPending}
      isReferencesLoading={references.isLoading}
      isReferencesError={references.isError}
      onRetryReferences={() => void references.refetch()}
      onClose={() => navigate("/purchase-orders")}
      onSubmit={createDraft}
    />
  </>;
}

function ReferenceSelect({ label, value, options, onChange }: { label: string; value: number | null; options: ReferenceOption[]; onChange: (value: number | null) => void }) {
  return <label className="text-sm font-semibold text-ink-950">{label}<select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)} value={value ?? ""}><option value="">Semua {label.toLocaleLowerCase()}</option>{options.filter((option) => option.is_active).map((option) => <option key={option.id} value={option.id}>{option.code} · {option.name}</option>)}</select></label>;
}

function PurchaseOrderForm({ references, isSubmitting, isReferencesLoading, isReferencesError, onRetryReferences, onClose, onSubmit }: { references?: { suppliers: ReferenceOption[]; warehouses: ReferenceOption[]; items: ReferenceOption[] }; isSubmitting: boolean; isReferencesLoading: boolean; isReferencesError: boolean; onRetryReferences: () => void; onClose: () => void; onSubmit: (payload: PurchaseOrderCreatePayload) => Promise<void> }) {
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PurchaseOrderLinePayload[]>([]);
  const [error, setError] = useState("");
  const activeItems = references?.items.filter((item) => item.is_active) ?? [];
  const selectedItems = new Set(lines.map((line) => line.item_id));
  const availableItems = activeItems.filter((item) => !selectedItems.has(item.id));

  function addLine() {
    const firstItem = availableItems[0];
    if (firstItem) setLines((current) => [...current, { item_id: firstItem.id, qty_ordered: "", notes: null }]);
  }
  function updateLine(index: number, patch: Partial<PurchaseOrderLinePayload>) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supplierId || !warehouseId || !orderDate) { setError("Pemasok, gudang tujuan, dan tanggal pesanan wajib diisi."); return; }
    if (lines.some((line) => {
      const item = activeItems.find((option) => option.id === line.item_id);
      const quantity = line.qty_ordered;
      if (!item || !/^\d+(\.\d{1,4})?$/.test(quantity)) return true;
      const parsedQuantity = new Decimal(quantity);
      if (!parsedQuantity.isPositive() || parsedQuantity.greaterThan("99999999999999.9999")) return true;
      return item.allow_decimal === false && !parsedQuantity.isInteger();
    })) { setError("Periksa barang dan kuantitas. Jumlah harus lebih dari nol, maksimal empat angka desimal, dan mengikuti satuan barang."); return; }
    if (new Set(lines.map((line) => line.item_id)).size !== lines.length) { setError("Barang tidak boleh dipilih lebih dari satu kali."); return; }
    setError("");
    await onSubmit({ supplier_id: Number(supplierId), warehouse_id: Number(warehouseId), order_date: orderDate, notes: notes.trim() || null, lines: lines.map((line) => ({ ...line, notes: line.notes?.trim() || null })) });
  }
  return <section aria-label="Formulir purchase order" className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)]">
      {isReferencesLoading && <p className="mt-4 rounded-[var(--radius-md)] bg-canvas-50 p-3 text-sm text-slate-700" role="status">Memuat daftar pemasok, gudang, dan barang...</p>}
      {isReferencesError && <p className="mt-4 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">Daftar pemasok, gudang, dan barang belum dapat dimuat. <button className="ml-1 font-semibold underline" onClick={onRetryReferences} type="button">Coba lagi</button></p>}
      {error && <p className="mt-4 rounded-[var(--radius-md)] border border-red-600/30 bg-red-100 p-3 text-sm text-red-900" role="alert">{error}</p>}
      <form className="mt-5 space-y-5" onSubmit={(event) => void submit(event)}>
        <section aria-label="Informasi pesanan" className="grid gap-4 rounded-[var(--radius-md)] bg-canvas-50 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <SelectField label="Pemasok" required value={supplierId} options={references?.suppliers ?? []} onChange={setSupplierId} />
          <SelectField label="Gudang tujuan" required value={warehouseId} options={references?.warehouses ?? []} onChange={setWarehouseId} />
          <label className="text-sm font-semibold text-ink-950">Tanggal pesanan<input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => setOrderDate(event.target.value)} required type="date" value={orderDate} /></label>
        </section>

        <section aria-labelledby="po-lines-title" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold text-ink-950" id="po-lines-title">Barang pesanan</h2><span className="text-sm text-slate-600">{lines.length} baris</span></div>
          {lines.length === 0 ? <p className="rounded-[var(--radius-md)] border border-dashed border-line-500 p-5 text-sm text-slate-700">{activeItems.length > 0 ? "Belum ada barang. Tambahkan baris untuk mengisi SKU dan kuantitas. Draft kosong tetap dapat disimpan dan dilengkapi sebelum diterbitkan." : "Belum ada barang aktif yang bisa ditambahkan. Draft kosong tetap dapat disimpan, tetapi perlu barang aktif sebelum diterbitkan."}</p> : <div className="space-y-3">
            {lines.map((line, index) => {
              const selectedItem = activeItems.find((item) => item.id === line.item_id);
              const itemOptions = activeItems.filter((item) => item.id === line.item_id || !lines.some((other, otherIndex) => otherIndex !== index && other.item_id === item.id));
              return <div aria-label={`Barang pesanan ${index + 1}`} className="rounded-[var(--radius-md)] border border-line-200 p-4" key={`${line.item_id}-${index}`} role="group">
                <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.45fr)_auto]">
                  <label className="text-sm font-semibold text-ink-950">Barang {index + 1}<select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => updateLine(index, { item_id: Number(event.target.value) })} value={line.item_id}>{itemOptions.map((item) => <option key={item.id} value={item.id}>{item.sku ?? item.code} · {item.name}</option>)}</select></label>
                  <label className="text-sm font-semibold text-ink-950">Kuantitas{selectedItem?.uom_code && <span className="font-normal text-slate-600"> ({selectedItem.uom_code})</span>}<input aria-label={`Kuantitas baris ${index + 1}${selectedItem?.uom_code ? ` dalam ${selectedItem.uom_code}` : ""}`} className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm tabular-nums text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" inputMode="decimal" maxLength={20} onChange={(event) => updateLine(index, { qty_ordered: event.target.value.replace(",", ".") })} placeholder={selectedItem?.allow_decimal === false ? "Bilangan bulat" : "0.0000"} type="text" value={line.qty_ordered} /></label>
                  <button aria-label={`Hapus barang pesanan ${index + 1}`} className="mb-0 grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-red-300 text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-700" onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} type="button"><X aria-hidden="true" size={17} /></button>
                </div>
                {selectedItem && <p className="mt-2 text-xs text-slate-600">{selectedItem.allow_decimal === false ? "Gunakan bilangan bulat." : "Kuantitas dapat memakai hingga empat angka desimal."}</p>}
                <label className="mt-3 block text-sm font-semibold text-ink-950">Catatan barang <span className="font-normal text-slate-600">(opsional)</span><input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" maxLength={500} onChange={(event) => updateLine(index, { notes: event.target.value })} placeholder="Instruksi khusus untuk barang ini" value={line.notes ?? ""} /></label>
              </div>;
            })}
          </div>}
          <button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50" disabled={availableItems.length === 0 || isReferencesLoading || isReferencesError} onClick={addLine} type="button"><Plus aria-hidden="true" size={16} />Tambah barang</button>
          {lines.length > 0 && availableItems.length === 0 && <p className="text-sm text-slate-700">Semua barang aktif sudah ditambahkan ke pesanan.</p>}
        </section>

        <label className="block text-sm font-semibold text-ink-950">Catatan umum <span className="font-normal text-slate-600">(opsional)</span><textarea className="mt-2 min-h-20 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 p-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" maxLength={1000} onChange={(event) => setNotes(event.target.value)} placeholder="Contoh: jadwal pengiriman atau instruksi untuk pemasok" value={notes} /></label>

        <div className="flex flex-wrap justify-end gap-2 border-t border-line-200 pt-4">
          <button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600" disabled={isSubmitting} onClick={onClose} type="button">Kembali ke daftar</button>
          <button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" disabled={isSubmitting || isReferencesLoading || isReferencesError} type="submit">{isSubmitting ? "Menyimpan draft PO..." : "Simpan draft PO"}</button>
        </div>
      </form>
  </section>;
}

function SelectField({ label, value, options, onChange, required }: { label: string; value: string; options: ReferenceOption[]; onChange: (value: string) => void; required?: boolean }) {
  return <label className="text-sm font-semibold text-ink-950">{label}<select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => onChange(event.target.value)} required={required} value={value}><option value="">Pilih {label.toLocaleLowerCase()}</option>{options.filter((option) => option.is_active).map((option) => <option key={option.id} value={option.id}>{option.code} · {option.name}</option>)}</select></label>;
}

function PurchaseOrderDetail({ purchaseOrder, isLoading, canIssue, canCancel, canClose, onClose, onAction }: { purchaseOrder?: PurchaseOrder; isLoading: boolean; canIssue: boolean; canCancel: boolean; canClose: boolean; onClose: () => void; onAction: (po: PurchaseOrder, action: "issue" | "cancel" | "close") => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-4" onMouseDown={onClose}><div aria-labelledby="po-detail-title" aria-modal="true" className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6" onMouseDown={(event) => event.stopPropagation()} role="dialog">{isLoading || !purchaseOrder ? <div className="p-8 text-sm text-slate-700" role="status">Memuat detail purchase order...</div> : <><div className="flex items-start justify-between gap-3 border-b border-line-200 pb-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-ink-950" id="po-detail-title">{purchaseOrder.po_number}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[purchaseOrder.status]}`}>{statusLabels[purchaseOrder.status]}</span></div><p className="mt-1 text-sm text-slate-700">Dibuat pada {formatDateTime(purchaseOrder.created_at)}</p></div><button aria-label="Tutup detail purchase order" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] text-slate-700 transition-colors hover:bg-canvas-50 hover:text-ink-950" onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button></div><dl className="grid gap-4 py-5 text-sm sm:grid-cols-3"><div><dt className="text-xs text-slate-600">Pemasok</dt><dd className="mt-1 font-semibold text-ink-950">{purchaseOrder.supplier_code} · {purchaseOrder.supplier_name}</dd></div><div><dt className="text-xs text-slate-600">Gudang tujuan</dt><dd className="mt-1 font-semibold text-ink-950">{purchaseOrder.warehouse_code} · {purchaseOrder.warehouse_name}</dd></div><div><dt className="text-xs text-slate-600">Tanggal pesanan</dt><dd className="mt-1 font-semibold text-ink-950">{formatDate(purchaseOrder.order_date)}</dd></div></dl><div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-200"><table className="min-w-[620px] w-full text-left text-sm"><caption className="sr-only">Baris barang {purchaseOrder.po_number}</caption><thead className="bg-canvas-50 text-xs text-slate-700"><tr><th className="px-3 py-3">Barang</th><th className="px-3 py-3">Pesanan</th><th className="px-3 py-3">Diterima</th><th className="px-3 py-3">Catatan</th></tr></thead><tbody className="divide-y divide-line-200">{(purchaseOrder.lines ?? []).length === 0 ? <tr><td className="px-3 py-5 text-slate-700" colSpan={4}>Belum ada baris barang.</td></tr> : (purchaseOrder.lines ?? []).map((line) => <tr key={line.id}><td className="px-3 py-3"><p className="font-semibold text-ink-950">{line.item_sku} · {line.item_name}</p><p className="text-xs text-slate-600">{line.uom_code}</p></td><td className="px-3 py-3 tabular-nums">{line.qty_ordered}</td><td className="px-3 py-3 tabular-nums">{line.qty_received}</td><td className="px-3 py-3 text-slate-700">{line.notes || "-"}</td></tr>)}</tbody></table></div>{purchaseOrder.notes && <p className="mt-4 rounded-[var(--radius-md)] bg-canvas-50 p-3 text-sm text-slate-700">{purchaseOrder.notes}</p>}<div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line-200 pt-4">{purchaseOrder.status === "DRAFT" && canIssue && <button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700" onClick={() => onAction(purchaseOrder, "issue")} type="button">Terbitkan purchase order</button>}{(purchaseOrder.status === "DRAFT" || purchaseOrder.status === "ISSUED") && canCancel && <button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-red-600/40 px-4 text-sm font-semibold text-red-700 hover:bg-red-100" onClick={() => onAction(purchaseOrder, "cancel")} type="button">Batalkan purchase order</button>}{(purchaseOrder.status === "ISSUED" || purchaseOrder.status === "PARTIALLY_RECEIVED") && canClose && <button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-amber-700/40 px-4 text-sm font-semibold text-amber-700 hover:bg-amber-100" onClick={() => onAction(purchaseOrder, "close")} type="button">Tutup purchase order</button>}<button className="inline-flex min-h-11 min-w-20 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-canvas-50 px-4 text-sm font-semibold text-ink-950 transition-colors hover:border-ink-800 hover:bg-surface-0" onClick={onClose} type="button"><X aria-hidden="true" size={16} />Tutup</button></div></>}</div></div>;
}

function ActionDialog({ purchaseOrder, action, closedReason, isSubmitting, onReasonChange, onClose, onSubmit }: { purchaseOrder: PurchaseOrder; action: "issue" | "cancel" | "close"; closedReason: string; isSubmitting: boolean; onReasonChange: (value: string) => void; onClose: () => void; onSubmit: () => void }) {
  const actionLabels = { issue: "Terbitkan purchase order", cancel: "Batalkan purchase order", close: "Tutup purchase order" };
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-950/55 p-4" onMouseDown={onClose}><div aria-labelledby="po-action-title" aria-modal="true" className="w-full max-w-lg rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6" onMouseDown={(event) => event.stopPropagation()} role="dialog"><h2 className="text-lg font-bold text-ink-950" id="po-action-title">{actionLabels[action]}</h2><p className="mt-2 text-sm leading-6 text-slate-700">Aksi ini akan mengubah status {purchaseOrder.po_number}. Pastikan isi dokumen sudah diperiksa.</p>{action === "close" && <label className="mt-4 block text-sm font-semibold text-ink-950">Alasan penutupan<textarea className="mt-2 min-h-24 w-full rounded-[var(--radius-md)] border border-line-500 p-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => onReasonChange(event.target.value)} value={closedReason} /></label>}<div className="mt-5 flex justify-end gap-2"><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50" disabled={isSubmitting} onClick={onClose} type="button">Kembali periksa</button><button className={`inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-semibold text-surface-0 ${action === "cancel" ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"}`} disabled={isSubmitting} onClick={onSubmit} type="button">{isSubmitting ? "Memproses..." : actionLabels[action]}</button></div></div></div>;
}
