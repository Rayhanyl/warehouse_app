import { FormEvent, useEffect, useState } from "react";
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
  const { can } = usePermission();
  const canCreate = can("po:create");
  const canIssue = can("po:issue");
  const canCancel = can("po:cancel");
  const canClose = can("po:close");
  const [params, setParams] = useState(initialParams);
  const [draftParams, setDraftParams] = useState(initialParams);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<PurchaseOrder | null>(null);
  const [actionType, setActionType] = useState<"issue" | "cancel" | "close" | null>(null);
  const [closedReason, setClosedReason] = useState("");
  const { data, isLoading, isError, error, refetch } = usePurchaseOrders(params);
  const references = usePurchaseOrderReferences();
  const detail = usePurchaseOrder(detailId);
  const createMutation = usePurchaseOrderMutation("create");
  const actionMutation = usePurchaseOrderMutation(actionType ?? "issue");

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

  async function createDraft(payload: PurchaseOrderCreatePayload) {
    try {
      const created = await createMutation.mutateAsync({ payload });
      setFormOpen(false);
      setDetailId(created.id);
      toast.success(`Draft ${created.po_number} berhasil dibuat.`);
    } catch (createError) {
      const mapped = mapPurchaseOrderError(createError, "Draft purchase order belum dapat dibuat.");
      toast.error(mapped.message);
      throw createError;
    }
  }

  return (
    <>
      <PageHeader
        title="Purchase order"
        description="Catat pesanan barang ke pemasok dan pantau status penerimaannya per gudang."
        action={
          canCreate ? (
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
              onClick={() => setFormOpen(true)}
              type="button"
            >
              <Plus aria-hidden="true" size={17} />
              Buat purchase order
            </button>
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
          {hasFilters ? <button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50" onClick={resetFilters} type="button"><RotateCcw size={16} />Atur ulang filter</button> : canCreate ? <button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700" onClick={() => setFormOpen(true)} type="button"><Plus size={16} />Buat purchase order</button> : null}
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

      {formOpen && <PurchaseOrderForm references={references.data} isSubmitting={createMutation.isPending} onClose={() => setFormOpen(false)} onSubmit={createDraft} />}
      {detailId !== null && <PurchaseOrderDetail purchaseOrder={detail.data} isLoading={detail.isLoading} canIssue={canIssue} canCancel={canCancel || canCreate} canClose={canClose} onClose={() => setDetailId(null)} onAction={openAction} />}
      {actionTarget && actionType && <ActionDialog purchaseOrder={actionTarget} action={actionType} closedReason={closedReason} isSubmitting={actionMutation.isPending} onReasonChange={setClosedReason} onClose={() => { setActionTarget(null); setActionType(null); }} onSubmit={() => void submitAction()} />}
    </>
  );
}

function ReferenceSelect({ label, value, options, onChange }: { label: string; value: number | null; options: ReferenceOption[]; onChange: (value: number | null) => void }) {
  return <label className="text-sm font-semibold text-ink-950">{label}<select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)} value={value ?? ""}><option value="">Semua {label.toLocaleLowerCase()}</option>{options.filter((option) => option.is_active).map((option) => <option key={option.id} value={option.id}>{option.code} · {option.name}</option>)}</select></label>;
}

function PurchaseOrderForm({ references, isSubmitting, onClose, onSubmit }: { references?: { suppliers: ReferenceOption[]; warehouses: ReferenceOption[]; items: ReferenceOption[] }; isSubmitting: boolean; onClose: () => void; onSubmit: (payload: PurchaseOrderCreatePayload) => Promise<void> }) {
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PurchaseOrderLinePayload[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  function addLine() {
    const firstItem = references?.items.find((item) => item.is_active && !lines.some((line) => line.item_id === item.id));
    if (firstItem) setLines((current) => [...current, { item_id: firstItem.id, qty_ordered: "", notes: null }]);
  }
  function updateLine(index: number, patch: Partial<PurchaseOrderLinePayload>) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supplierId || !warehouseId || !orderDate) { setError("Pemasok, gudang tujuan, dan tanggal pesanan wajib diisi."); return; }
    if (lines.some((line) => !line.qty_ordered || Number(line.qty_ordered) <= 0)) { setError("Setiap baris harus memiliki kuantitas lebih dari nol."); return; }
    if (new Set(lines.map((line) => line.item_id)).size !== lines.length) { setError("Barang tidak boleh dipilih lebih dari satu kali."); return; }
    setError("");
    await onSubmit({ supplier_id: Number(supplierId), warehouse_id: Number(warehouseId), order_date: orderDate, notes: notes.trim() || null, lines });
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-4" onMouseDown={onClose}><div aria-labelledby="po-form-title" aria-modal="true" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6" onMouseDown={(event) => event.stopPropagation()} role="dialog"><div className="flex items-start justify-between gap-3 border-b border-line-200 pb-4"><div><h2 className="text-lg font-bold text-ink-950" id="po-form-title">Buat purchase order</h2><p className="mt-1 text-xs leading-5 text-slate-700">Simpan dokumen sebagai draft untuk diperiksa sebelum diterbitkan.</p></div><button aria-label="Tutup formulir purchase order" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] text-slate-700 hover:bg-canvas-50" onClick={onClose} type="button"><X size={18} /></button></div>{error && <p className="mt-4 rounded-[var(--radius-md)] border border-red-600/30 bg-red-100 p-3 text-sm text-red-700" role="alert">{error}</p>}<form className="mt-5 space-y-4" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-3"><SelectField label="Pemasok" required value={supplierId} options={references?.suppliers ?? []} onChange={setSupplierId} /><SelectField label="Gudang tujuan" required value={warehouseId} options={references?.warehouses ?? []} onChange={setWarehouseId} /><label className="text-sm font-semibold text-ink-950">Tanggal pesanan<input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => setOrderDate(event.target.value)} required type="date" value={orderDate} /></label></div><label className="block text-sm font-semibold text-ink-950">Catatan<textarea className="mt-2 min-h-24 w-full rounded-[var(--radius-md)] border border-line-500 p-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => setNotes(event.target.value)} maxLength={500} value={notes} /></label><div className="rounded-[var(--radius-md)] border border-line-200"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-200 bg-canvas-50 p-3"><div><h3 className="font-semibold text-ink-950">Baris barang</h3><p className="text-xs text-slate-700">Barang unik, kuantitas lebih dari nol, maksimal empat angka desimal.</p></div><button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-semibold text-ink-950 hover:bg-surface-0 disabled:opacity-40" disabled={!references?.items.some((item) => item.is_active && !lines.some((line) => line.item_id === item.id))} onClick={addLine} type="button"><Plus size={16} />Tambah baris</button></div>{lines.length === 0 ? <p className="p-5 text-sm text-slate-700">Belum ada baris barang. Draft boleh disimpan tanpa baris dan diterbitkan setelah dilengkapi.</p> : <div className="divide-y divide-line-200">{lines.map((line, index) => <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_10rem_2.75rem]" key={`${line.item_id}-${index}`}><label className="text-sm font-semibold text-ink-950">Barang<select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => updateLine(index, { item_id: Number(event.target.value) })} value={line.item_id}>{(references?.items ?? []).filter((item) => item.is_active && (item.id === line.item_id || !lines.some((other, otherIndex) => otherIndex !== index && other.item_id === item.id))).map((item) => <option key={item.id} value={item.id}>{item.sku ?? item.code} · {item.name}</option>)}</select></label><label className="text-sm font-semibold text-ink-950">Kuantitas<input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm tabular-nums text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" inputMode="decimal" maxLength={20} onChange={(event) => updateLine(index, { qty_ordered: event.target.value.replace(",", ".") })} placeholder="0.0000" type="text" value={line.qty_ordered} /></label><button aria-label={`Hapus baris barang ${index + 1}`} className="mt-7 grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] text-red-700 hover:bg-red-100" onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} type="button"><X size={17} /></button></div>)}</div>}</div><div className="flex flex-wrap justify-end gap-2 border-t border-line-200 pt-4"><button className="inline-flex min-h-11 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50" onClick={onClose} type="button">Batal</button><button className="inline-flex min-h-11 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700 disabled:opacity-50" disabled={isSubmitting} type="submit">{isSubmitting ? "Menyimpan draft PO..." : "Simpan draft PO"}</button></div></form></div></div>;
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

  return <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-4" onMouseDown={onClose}><div aria-labelledby="po-detail-title" aria-modal="true" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6" onMouseDown={(event) => event.stopPropagation()} role="dialog">{isLoading || !purchaseOrder ? <div className="p-8 text-sm text-slate-700" role="status">Memuat detail purchase order...</div> : <><div className="flex items-start justify-between gap-3 border-b border-line-200 pb-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-ink-950" id="po-detail-title">{purchaseOrder.po_number}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[purchaseOrder.status]}`}>{statusLabels[purchaseOrder.status]}</span></div><p className="mt-1 text-sm text-slate-700">Dibuat pada {formatDateTime(purchaseOrder.created_at)}</p></div><button aria-label="Tutup detail purchase order" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] text-slate-700 hover:bg-canvas-50" onClick={onClose} type="button"><X size={18} /></button></div><dl className="grid gap-4 py-5 text-sm sm:grid-cols-3"><div><dt className="text-xs text-slate-600">Pemasok</dt><dd className="mt-1 font-semibold text-ink-950">{purchaseOrder.supplier_code} · {purchaseOrder.supplier_name}</dd></div><div><dt className="text-xs text-slate-600">Gudang tujuan</dt><dd className="mt-1 font-semibold text-ink-950">{purchaseOrder.warehouse_code} · {purchaseOrder.warehouse_name}</dd></div><div><dt className="text-xs text-slate-600">Tanggal pesanan</dt><dd className="mt-1 font-semibold text-ink-950">{formatDate(purchaseOrder.order_date)}</dd></div></dl><div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-200"><table className="min-w-[620px] w-full text-left text-sm"><caption className="sr-only">Baris barang {purchaseOrder.po_number}</caption><thead className="bg-canvas-50 text-xs text-slate-700"><tr><th className="px-3 py-3">Barang</th><th className="px-3 py-3">Pesanan</th><th className="px-3 py-3">Diterima</th><th className="px-3 py-3">Catatan</th></tr></thead><tbody className="divide-y divide-line-200">{(purchaseOrder.lines ?? []).length === 0 ? <tr><td className="px-3 py-5 text-slate-700" colSpan={4}>Belum ada baris barang.</td></tr> : (purchaseOrder.lines ?? []).map((line) => <tr key={line.id}><td className="px-3 py-3"><p className="font-semibold text-ink-950">{line.item_sku} · {line.item_name}</p><p className="text-xs text-slate-600">{line.uom_code}</p></td><td className="px-3 py-3 tabular-nums">{line.qty_ordered}</td><td className="px-3 py-3 tabular-nums">{line.qty_received}</td><td className="px-3 py-3 text-slate-700">{line.notes || "-"}</td></tr>)}</tbody></table></div>{purchaseOrder.notes && <p className="mt-4 rounded-[var(--radius-md)] bg-canvas-50 p-3 text-sm text-slate-700">{purchaseOrder.notes}</p>}<div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line-200 pt-4">{purchaseOrder.status === "DRAFT" && canIssue && <button className="inline-flex min-h-11 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700" onClick={() => onAction(purchaseOrder, "issue")} type="button">Terbitkan purchase order</button>}{(purchaseOrder.status === "DRAFT" || purchaseOrder.status === "ISSUED") && canCancel && <button className="inline-flex min-h-11 rounded-[var(--radius-md)] border border-red-600/40 px-4 text-sm font-semibold text-red-700 hover:bg-red-100" onClick={() => onAction(purchaseOrder, "cancel")} type="button">Batalkan purchase order</button>}{(purchaseOrder.status === "ISSUED" || purchaseOrder.status === "PARTIALLY_RECEIVED") && canClose && <button className="inline-flex min-h-11 rounded-[var(--radius-md)] border border-amber-700/40 px-4 text-sm font-semibold text-amber-700 hover:bg-amber-100" onClick={() => onAction(purchaseOrder, "close")} type="button">Tutup purchase order</button>}<button className="inline-flex min-h-11 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50" onClick={onClose} type="button">Tutup</button></div></>}</div></div>;
}

function ActionDialog({ purchaseOrder, action, closedReason, isSubmitting, onReasonChange, onClose, onSubmit }: { purchaseOrder: PurchaseOrder; action: "issue" | "cancel" | "close"; closedReason: string; isSubmitting: boolean; onReasonChange: (value: string) => void; onClose: () => void; onSubmit: () => void }) {
  const actionLabels = { issue: "Terbitkan purchase order", cancel: "Batalkan purchase order", close: "Tutup purchase order" };
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-950/55 p-4" onMouseDown={onClose}><div aria-labelledby="po-action-title" aria-modal="true" className="w-full max-w-md rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6" onMouseDown={(event) => event.stopPropagation()} role="dialog"><h2 className="text-lg font-bold text-ink-950" id="po-action-title">{actionLabels[action]}</h2><p className="mt-2 text-sm leading-6 text-slate-700">Aksi ini akan mengubah status {purchaseOrder.po_number}. Pastikan isi dokumen sudah diperiksa.</p>{action === "close" && <label className="mt-4 block text-sm font-semibold text-ink-950">Alasan penutupan<textarea className="mt-2 min-h-24 w-full rounded-[var(--radius-md)] border border-line-500 p-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => onReasonChange(event.target.value)} value={closedReason} /></label>}<div className="mt-5 flex justify-end gap-2"><button className="inline-flex min-h-11 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50" disabled={isSubmitting} onClick={onClose} type="button">Kembali periksa</button><button className={`inline-flex min-h-11 rounded-[var(--radius-md)] px-4 text-sm font-semibold text-surface-0 ${action === "cancel" ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"}`} disabled={isSubmitting} onClick={onSubmit} type="button">{isSubmitting ? "Memproses..." : actionLabels[action]}</button></div></div></div>;
}
