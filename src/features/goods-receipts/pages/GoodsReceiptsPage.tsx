import { FormEvent, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Plus, Printer, RotateCcw, Search, X } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { BarcodeScanBar } from "@/components/ui/BarcodeScannerModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePermission } from "@/hooks/usePermission";
import { usePurchaseOrder } from "@/features/purchase-orders/api";
import { mapGoodsReceiptError, useGoodsReceipt, useGoodsReceiptMutation, useGoodsReceiptReferences, useGoodsReceipts } from "../api";
import { GoodsReceiptPrintSheet } from "../components/GoodsReceiptPrintSheet";
import type { GoodsReceipt, GoodsReceiptCreatePayload, GoodsReceiptListParams, GoodsReceiptStatus } from "../types";

const initialParams: GoodsReceiptListParams = {
  limit: 20,
  offset: 0,
  search: "",
  status: "all",
  warehouse_id: null,
  po_id: null,
  date_from: "",
  date_to: "",
};

const statusLabels: Record<GoodsReceiptStatus, string> = {
  DRAFT: "Draft",
  POSTED: "Diposting",
  CANCELLED: "Dibatalkan",
};

const statusClasses: Record<GoodsReceiptStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  POSTED: "bg-teal-100 text-teal-800",
  CANCELLED: "bg-slate-200 text-slate-700",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function GoodsReceiptsPage({ initialOpenCreate = false }: { initialOpenCreate?: boolean } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isCreateRoute = location.pathname.endsWith("/new") || initialOpenCreate;
  const { can } = usePermission();
  const canManage = can("gr:manage");
  const [params, setParams] = useState(initialParams);
  const [draftParams, setDraftParams] = useState(initialParams);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(isCreateRoute && canManage);

  useEffect(() => {
    if (isCreateRoute && canManage) {
      setFormOpen(true);
    }
  }, [isCreateRoute, canManage]);

  const { data, isLoading, isError, refetch } = useGoodsReceipts(params);
  const references = useGoodsReceiptReferences();
  const detail = useGoodsReceipt(detailId);
  const createMutation = useGoodsReceiptMutation("create");
  const postMutation = useGoodsReceiptMutation("post");
  const cancelMutation = useGoodsReceiptMutation("cancel");

  if (isCreateRoute && !canManage) {
    const fallbackPath = location.pathname.startsWith("/purchasing")
      ? "/purchasing/goods-receipts"
      : "/goods-receipts";
    return <Navigate replace to={fallbackPath} />;
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageEnd = Math.min(params.offset + params.limit, total);
  const hasFilters = Boolean(params.search || params.status !== "all" || params.date_from || params.date_to);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setParams({ ...draftParams, offset: 0 });
  }

  function resetFilters() {
    setDraftParams(initialParams);
    setParams(initialParams);
  }

  function handleCloseForm() {
    setFormOpen(false);
    if (location.pathname.endsWith("/new")) {
      const parentPath = location.pathname.startsWith("/purchasing")
        ? "/purchasing/goods-receipts"
        : "/goods-receipts";
      navigate(parentPath, { replace: true });
    }
  }

  async function createReceipt(payload: GoodsReceiptCreatePayload) {
    try {
      const created = await createMutation.mutateAsync({ payload });
      setFormOpen(false);
      setDetailId(created.id);
      toast.success(`Draft ${created.gr_number} berhasil dibuat.`);
      if (location.pathname.endsWith("/new")) {
        const parentPath = location.pathname.startsWith("/purchasing")
          ? "/purchasing/goods-receipts"
          : "/goods-receipts";
        navigate(parentPath, { replace: true });
      }
    } catch (error) {
      toast.error(mapGoodsReceiptError(error, "Draft penerimaan belum dapat dibuat."));
      throw error;
    }
  }

  async function runAction(receipt: GoodsReceipt, action: "post" | "cancel") {
    try {
      const updated = await (action === "post" ? postMutation : cancelMutation).mutateAsync({ id: receipt.id });
      setDetailId(updated.id);
      toast.success(`${updated.gr_number} berhasil ${action === "post" ? "diposting" : "dibatalkan"}.`);
    } catch (error) {
      toast.error(mapGoodsReceiptError(error, "Aksi penerimaan belum berhasil."));
    }
  }

  return (
    <>
      <div className="no-print">
      <PageHeader
        title="Penerimaan barang"
        description="Catat barang yang diterima terhadap purchase order, lalu posting untuk menambah saldo stok pada lokasi."
        action={canManage ? <button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700" onClick={() => setFormOpen(true)} type="button"><Plus aria-hidden="true" size={17} />Buat penerimaan</button> : <span className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-xs font-semibold text-slate-600">Mode baca saja</span>}
      />
      <section aria-label="Filter daftar penerimaan barang" className="mb-6 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-5">
        <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={applyFilters}>
          <label className="text-sm font-semibold text-ink-950">Pencarian<div className="relative mt-2"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} /><input className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 pr-3 pl-9 text-sm font-normal text-ink-950 placeholder:text-slate-600 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => setDraftParams((current) => ({ ...current, search: event.target.value }))} placeholder="Cari nomor GR, PO, atau pemasok..." type="search" value={draftParams.search} /></div></label>
          <label className="text-sm font-semibold text-ink-950">Status<select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => setDraftParams((current) => ({ ...current, status: event.target.value as GoodsReceiptStatus | "all" }))} value={draftParams.status}><option value="all">Semua status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-sm font-semibold text-ink-950">Tanggal mulai<input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => setDraftParams((current) => ({ ...current, date_from: event.target.value }))} type="date" value={draftParams.date_from} /></label>
          <label className="text-sm font-semibold text-ink-950">Tanggal akhir<input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => setDraftParams((current) => ({ ...current, date_to: event.target.value }))} type="date" value={draftParams.date_to} /></label>
          <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-4"><button className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] bg-ink-950 px-4 text-sm font-semibold text-surface-0 hover:bg-ink-900" type="submit">Terapkan filter</button><button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50" onClick={resetFilters} type="button"><RotateCcw size={16} />Atur ulang</button></div>
        </form>
      </section>
      {isLoading ? <div className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-8 text-center text-sm text-slate-700" role="status">Memuat daftar penerimaan...</div> : isError ? <div className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50 p-8 text-center"><p className="font-semibold text-red-900">Daftar penerimaan belum dapat dimuat.</p><button className="mt-4 inline-flex min-h-11 rounded-[var(--radius-md)] bg-red-700 px-4 text-sm font-semibold text-surface-0 hover:bg-red-800" onClick={() => void refetch()} type="button">Coba lagi</button></div> : items.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-dashed border-line-500 bg-surface-0 p-8 text-center shadow-[var(--shadow-1)]"><p className="font-semibold text-ink-950">{hasFilters ? "Tidak ada data yang cocok dengan filter" : "Belum ada penerimaan barang"}</p><p className="mx-auto mt-2 max-w-[55ch] text-sm leading-6 text-slate-700">{hasFilters ? "Periksa kata kunci atau rentang tanggal, lalu coba lagi." : "Buat draft penerimaan dari purchase order yang sudah diterbitkan."}</p>{hasFilters ? <button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50" onClick={resetFilters} type="button"><RotateCcw size={16} />Atur ulang filter</button> : canManage ? <button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700" onClick={() => setFormOpen(true)} type="button"><Plus size={16} />Buat penerimaan</button> : null}</div> : <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]"><div className="overflow-x-auto"><table className="min-w-[900px] w-full border-collapse text-left text-sm"><caption className="sr-only">Daftar penerimaan barang</caption><thead className="bg-canvas-50 text-xs font-semibold text-slate-700"><tr><th className="px-4 py-3">Nomor dokumen</th><th className="px-4 py-3">Purchase order</th><th className="px-4 py-3">Pemasok</th><th className="px-4 py-3">Gudang</th><th className="px-4 py-3">Tanggal terima</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-line-200">{items.map((receipt) => <tr className="hover:bg-canvas-50/60" key={receipt.id}><td className="px-4 py-4"><button className="font-semibold text-teal-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-600" onClick={() => setDetailId(receipt.id)} type="button">{receipt.gr_number}</button><p className="mt-1 text-xs text-slate-600 tabular-nums">ID #{receipt.id}</p></td><td className="px-4 py-4 font-semibold text-ink-950">{receipt.po_number}</td><td className="px-4 py-4"><p className="font-semibold text-ink-950">{receipt.supplier_name}</p><p className="mt-1 text-xs text-slate-600">{receipt.supplier_code}</p></td><td className="px-4 py-4 text-ink-950">{receipt.warehouse_name}</td><td className="px-4 py-4 text-slate-700 tabular-nums">{formatDate(receipt.received_date)}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[receipt.status]}`}>{statusLabels[receipt.status]}</span></td><td className="px-4 py-4 text-right"><button aria-label={`Lihat detail penerimaan ${receipt.gr_number}`} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-semibold text-ink-950 hover:bg-canvas-50" onClick={() => setDetailId(receipt.id)} type="button"><Eye size={16} />Detail</button></td></tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-200 px-4 py-3 text-sm text-slate-700"><span className="tabular-nums">Menampilkan {total === 0 ? 0 : params.offset + 1} sampai {pageEnd} dari {total} penerimaan</span><div className="flex gap-2"><button aria-label="Halaman sebelumnya" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:opacity-40" disabled={params.offset === 0} onClick={() => setParams((current) => ({ ...current, offset: Math.max(0, current.offset - current.limit) }))} type="button"><ChevronLeft size={17} /></button><button aria-label="Halaman berikutnya" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:opacity-40" disabled={pageEnd >= total} onClick={() => setParams((current) => ({ ...current, offset: current.offset + current.limit }))} type="button"><ChevronRight size={17} /></button></div></div></section>}
      </div>
      {formOpen && <GoodsReceiptForm references={references.data} isSubmitting={createMutation.isPending} onClose={handleCloseForm} onSubmit={createReceipt} />}
      {detailId !== null && <GoodsReceiptDetail receipt={detail.data} isLoading={detail.isLoading} canManage={canManage} isMutating={postMutation.isPending || cancelMutation.isPending} onClose={() => setDetailId(null)} onAction={runAction} />}
    </>
  );
}

function GoodsReceiptForm({ references, isSubmitting, onClose, onSubmit }: { references?: Awaited<ReturnType<typeof useGoodsReceiptReferences>>["data"]; isSubmitting: boolean; onClose: () => void; onSubmit: (payload: GoodsReceiptCreatePayload) => Promise<void> }) {
  const [poId, setPoId] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [locations, setLocations] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const poDetail = usePurchaseOrder(poId ? Number(poId) : null);
  const purchaseOrderSummary = references?.purchaseOrders.find((po) => po.id === Number(poId));
  const purchaseOrder = purchaseOrderSummary
    ? { ...purchaseOrderSummary, lines: poDetail.data?.lines ?? purchaseOrderSummary.lines }
    : undefined;
  const availableLocations = references?.locations.filter((location) => location.warehouse_id === purchaseOrder?.warehouse_id && location.is_active) ?? [];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  function handleScanPoLine(scannedCode: string) {
    if (!purchaseOrder) return;
    const normalized = scannedCode.trim().toLowerCase();
    const matchedLine = (purchaseOrder.lines ?? []).find(
      (line) =>
        line.item_barcode?.toLowerCase() === normalized ||
        line.item_sku.toLowerCase() === normalized,
    );
    if (!matchedLine) {
      toast.error(`Barang dengan barcode / SKU "${scannedCode}" tidak ditemukan pada PO ${purchaseOrder.po_number}.`);
      return;
    }
    const remaining = Number(matchedLine.qty_ordered) - Number(matchedLine.qty_received);
    const currentQty = Number(quantities[matchedLine.id] || 0);
    if (currentQty >= remaining) {
      toast.error(`Kuantitas ${matchedLine.item_sku} sudah mencapai sisa PO (${remaining}).`);
      return;
    }
    const nextQty = Math.min(remaining, currentQty + 1);
    setQuantities((current) => ({ ...current, [matchedLine.id]: String(nextQty) }));
    if (!locations[matchedLine.id] && availableLocations.length > 0) {
      setLocations((current) => ({ ...current, [matchedLine.id]: String(availableLocations[0].id) }));
    }
    toast.success(`${matchedLine.item_sku} · ${matchedLine.item_name} (+1 -> ${nextQty})`);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!purchaseOrder || !receivedDate) { setError("Purchase order dan tanggal penerimaan wajib diisi."); return; }
    if (receivedDate < purchaseOrder.order_date) { setError("Tanggal penerimaan tidak boleh lebih awal dari tanggal pesanan."); return; }
    const lines = purchaseOrder.lines?.flatMap((line) => {
      const quantity = quantities[line.id]?.trim();
      const locationId = Number(locations[line.id]);
      return quantity && Number(quantity) > 0 && locationId > 0 ? [{ po_line_id: line.id, location_id: locationId, qty_received: quantity, notes: null }] : [];
    }) ?? [];
    if (lines.length === 0) { setError("Isi kuantitas dan lokasi pada minimal satu baris barang."); return; }
    setError("");
    await onSubmit({ po_id: purchaseOrder.id, received_date: receivedDate, notes: notes.trim() || null, lines });
  }

  return <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-4" onMouseDown={onClose}><div aria-labelledby="gr-form-title" aria-modal="true" className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6" onMouseDown={(event) => event.stopPropagation()} role="dialog"><div className="flex items-start justify-between gap-3 border-b border-line-200 pb-4"><div><h2 className="text-lg font-bold text-ink-950" id="gr-form-title">Buat penerimaan barang</h2><p className="mt-1 text-sm text-slate-700">Simpan sebagai draft sebelum saldo stok berubah.</p></div><button aria-label="Tutup form penerimaan" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] text-slate-700 hover:bg-canvas-50" onClick={onClose} type="button"><X size={18} /></button></div>{!references ? <p className="p-8 text-sm text-slate-700" role="status">Memuat purchase order dan lokasi...</p> : <form className="space-y-5 pt-5" onSubmit={(event) => void submit(event)}><label className="block text-sm font-semibold text-ink-950">Purchase order<select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => { setPoId(event.target.value); setQuantities({}); setLocations({}); }} value={poId}><option value="">Pilih purchase order</option>{references.purchaseOrders.map((po) => <option key={po.id} value={po.id}>{po.po_number} · {po.supplier_name} · {po.warehouse_name}{po.status === "PARTIALLY_RECEIVED" ? " (Diterima sebagian)" : ""}</option>)}</select></label>{purchaseOrder && <><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-ink-950">Tanggal penerimaan<input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => setReceivedDate(event.target.value)} type="date" value={receivedDate} /></label><label className="text-sm font-semibold text-ink-950">Catatan<input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" maxLength={1000} onChange={(event) => setNotes(event.target.value)} placeholder="Opsional" value={notes} /></label></div><BarcodeScanBar label="Scan Barcode / SKU Barang PO (+1 Kuantitas Terima)" onScan={handleScanPoLine} placeholder="Scan atau ketik Barcode / SKU barang pada PO ini lalu Enter..." /><div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-200"><table className="min-w-[720px] w-full text-left text-sm"><caption className="sr-only">Baris barang purchase order {purchaseOrder.po_number}</caption><thead className="bg-canvas-50 text-xs text-slate-700"><tr><th className="px-3 py-3">Barang</th><th className="px-3 py-3">Sisa PO</th><th className="px-3 py-3">Kuantitas terima</th><th className="px-3 py-3">Lokasi</th></tr></thead><tbody className="divide-y divide-line-200">{(purchaseOrder.lines ?? []).map((line) => { const remaining = Number(line.qty_ordered) - Number(line.qty_received); return <tr key={line.id}><td className="px-3 py-3"><p className="font-semibold text-ink-950">{line.item_sku} · {line.item_name}</p><p className="text-xs text-slate-600">{line.uom_code}{line.item_barcode ? ` · BC: ${line.item_barcode}` : ""}</p></td><td className="px-3 py-3 tabular-nums">{remaining}</td><td className="px-3 py-3"><input aria-label={`Kuantitas terima ${line.item_sku}`} className="h-11 w-36 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" min="0" onChange={(event) => setQuantities((current) => ({ ...current, [line.id]: event.target.value }))} step={line.allow_decimal ? "0.0001" : "1"} type="number" value={quantities[line.id] ?? ""} /></td><td className="px-3 py-3"><select aria-label={`Lokasi terima ${line.item_sku}`} className="h-11 min-w-52 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(event) => setLocations((current) => ({ ...current, [line.id]: event.target.value }))} value={locations[line.id] ?? ""}><option value="">Pilih lokasi</option>{availableLocations.map((location) => <option key={location.id} value={location.id}>{location.code} · {location.name}</option>)}</select></td></tr>; })}</tbody></table></div></>}{error && <p className="rounded-[var(--radius-md)] bg-red-50 p-3 text-sm font-semibold text-red-900" role="alert">{error}</p>}<div className="flex flex-wrap justify-end gap-2 border-t border-line-200 pt-4"><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50" disabled={isSubmitting} onClick={onClose} type="button">Batal</button><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700 disabled:opacity-50" disabled={isSubmitting || !purchaseOrder} type="submit">{isSubmitting ? "Menyimpan..." : "Simpan draft"}</button></div></form>}</div></div>;
}

function GoodsReceiptDetail({ receipt, isLoading, canManage, isMutating, onClose, onAction }: { receipt?: GoodsReceipt; isLoading: boolean; canManage: boolean; isMutating: boolean; onClose: () => void; onAction: (receipt: GoodsReceipt, action: "post" | "cancel") => Promise<void> }) {
  const [confirmation, setConfirmation] = useState<"cancel" | "post" | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    setShowPrintPreview(false);
  }, [receipt?.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isMutating) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMutating, onClose]);

  function handlePrint() {
    toast.dismiss();
    setShowPrintPreview(true);
    window.print();
  }

  if (!receipt && !isLoading) return null;
  return <div className="print-dialog-backdrop fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-4" onMouseDown={onClose}><div aria-labelledby="gr-detail-title" aria-modal="true" className="print-dialog-panel max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6" onMouseDown={(event) => event.stopPropagation()} role="dialog">{isLoading || !receipt ? <div className="p-8 text-sm text-slate-700" role="status">Memuat detail penerimaan...</div> : <><div className="no-print flex items-start justify-between gap-3 border-b border-line-200 pb-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-ink-950" id="gr-detail-title">{receipt.gr_number}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[receipt.status]}`}>{statusLabels[receipt.status]}</span></div><p className="mt-1 text-sm text-slate-700">Dibuat pada {formatDateTime(receipt.created_at)}</p></div><button aria-label="Tutup detail penerimaan" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] text-slate-700 hover:bg-canvas-50" onClick={onClose} type="button"><X size={18} /></button></div><div className="no-print"><dl className="grid gap-4 py-5 text-sm sm:grid-cols-4"><div><dt className="text-xs text-slate-600">Purchase order</dt><dd className="mt-1 font-semibold text-ink-950">{receipt.po_number}</dd></div><div><dt className="text-xs text-slate-600">Pemasok</dt><dd className="mt-1 font-semibold text-ink-950">{receipt.supplier_code} · {receipt.supplier_name}</dd></div><div><dt className="text-xs text-slate-600">Gudang</dt><dd className="mt-1 font-semibold text-ink-950">{receipt.warehouse_code} · {receipt.warehouse_name}</dd></div><div><dt className="text-xs text-slate-600">Tanggal terima</dt><dd className="mt-1 font-semibold text-ink-950">{formatDate(receipt.received_date)}</dd></div></dl><div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-200"><table className="min-w-[680px] w-full text-left text-sm"><caption className="sr-only">Baris penerimaan {receipt.gr_number}</caption><thead className="bg-canvas-50 text-xs text-slate-700"><tr><th className="px-3 py-3">Barang</th><th className="px-3 py-3">Lokasi</th><th className="px-3 py-3">Diterima</th><th className="px-3 py-3">Catatan</th></tr></thead><tbody className="divide-y divide-line-200">{(receipt.lines ?? []).length === 0 ? <tr><td className="px-3 py-5 text-slate-700" colSpan={4}>Belum ada baris penerimaan.</td></tr> : (receipt.lines ?? []).map((line) => <tr key={line.id}><td className="px-3 py-3"><p className="font-semibold text-ink-950">{line.item_sku} · {line.item_name}</p><p className="text-xs text-slate-600">{line.uom_code}{line.item_barcode ? ` · Barcode: ${line.item_barcode}` : ""}</p></td><td className="px-3 py-3 text-ink-950">{line.location_code} · {line.location_name}</td><td className="px-3 py-3 tabular-nums">{line.qty_received}</td><td className="px-3 py-3 text-slate-700">{line.notes || "-"}</td></tr>)}</tbody></table></div>{receipt.notes && <p className="mt-4 rounded-[var(--radius-md)] bg-canvas-50 p-3 text-sm text-slate-700">{receipt.notes}</p>}</div>{receipt.status === "POSTED" && <GoodsReceiptPrintSheet receipt={receipt} visibleOnScreen={showPrintPreview} />}<div className="no-print mt-5 flex flex-wrap justify-end gap-2 border-t border-line-200 pt-4">{receipt.status === "POSTED" && <><button className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold leading-5 text-ink-950 hover:bg-canvas-50" onClick={() => setShowPrintPreview((prev) => !prev)} type="button">{showPrintPreview ? "Sembunyikan pratinjau cetak" : "Pratinjau dokumen cetak"}</button><button className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold leading-5 text-surface-0 hover:bg-teal-700" onClick={handlePrint} type="button"><Printer aria-hidden="true" size={16} />Cetak Bukti Penerimaan</button></>}{canManage && receipt.status === "DRAFT" && <><button className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] border border-red-600/40 px-4 text-sm font-semibold leading-5 text-red-700 hover:bg-red-50 disabled:opacity-50" disabled={isMutating} onClick={() => setConfirmation("cancel")} type="button">Batalkan draft</button><button className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold leading-5 text-surface-0 hover:bg-teal-700 disabled:opacity-50" disabled={isMutating} onClick={() => setConfirmation("post")} type="button">{isMutating ? "Memproses..." : "Posting penerimaan"}</button></>}<button className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold leading-5 text-ink-950 hover:bg-canvas-50" onClick={onClose} type="button">Tutup</button></div></>}</div>{confirmation && receipt && <ConfirmDialog danger={confirmation === "cancel"} confirmLabel={confirmation === "cancel" ? "Batalkan draft" : "Posting penerimaan"} isPending={isMutating} message={confirmation === "cancel" ? `Draft ${receipt.gr_number} akan dibatalkan.` : `Posting ${receipt.gr_number} akan menambah saldo stok.`} onClose={() => setConfirmation(null)} onConfirm={() => { setConfirmation(null); void onAction(receipt, confirmation); }} title={confirmation === "cancel" ? "Batalkan draft penerimaan?" : "Posting penerimaan?"} />}</div>;
}

export function GoodsReceiptCreatePage() {
  return <GoodsReceiptsPage initialOpenCreate={true} />;
}
