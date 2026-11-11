import { FormEvent, useEffect, useState } from "react";
import { Edit3, Eye, Plus, Printer, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { BarcodeScanBar } from "@/components/ui/BarcodeScannerModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePermission } from "@/hooks/usePermission";
import { mapTransferError, useTransfer, useTransferMutation, useTransferReferences, useTransfers } from "../api";
import { StockTransferPrintSheet } from "../components/StockTransferPrintSheet";
import type { StockTransfer, StockTransferCreatePayload, StockTransferStatus, StockTransferUpdatePayload, TransferReceiveLinePayload } from "../types";

const statuses: Record<StockTransferStatus, string> = { DRAFT: "Draft", APPROVED: "Disetujui", SHIPPED: "Dikirim", RECEIVED: "Diterima", CANCELLED: "Dibatalkan" };
const statusClass: Record<StockTransferStatus, string> = { DRAFT: "bg-canvas-50 text-slate-700", APPROVED: "bg-blue-100 text-blue-800", SHIPPED: "bg-amber-100 text-amber-800", RECEIVED: "bg-teal-100 text-teal-800", CANCELLED: "bg-slate-200 text-slate-700" };

function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value)); }

export function StockTransfersPage() {
  const { can } = usePermission();
  const [params, setParams] = useState({ limit: 20, offset: 0, search: "", status: "all", date_from: "", date_to: "" });
  const [draft, setDraft] = useState(params);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<StockTransfer | null>(null);
  const query = useTransfers(params);
  const detail = useTransfer(detailId);
  const refs = useTransferReferences();
  const create = useTransferMutation("create");
  const update = useTransferMutation("update");
  const approve = useTransferMutation("approve");
  const ship = useTransferMutation("ship");
  const cancel = useTransferMutation("cancel");
  const receive = useTransferMutation("receive");
  const canCreate = can("transfer:create");

  async function createTransfer(payload: StockTransferCreatePayload) {
    try { const result = await create.mutateAsync({ payload }); setFormOpen(false); setDetailId(result.id); toast.success(`Draft ${result.transfer_number} berhasil dibuat.`); }
    catch (error) { toast.error(mapTransferError(error, "Draft transfer belum dapat dibuat.")); throw error; }
  }
  async function updateTransfer(id: number, payload: StockTransferUpdatePayload) {
    try { const result = await update.mutateAsync({ id, payload }); setFormOpen(false); setEditingTransfer(null); setDetailId(result.id); toast.success(`Draft ${result.transfer_number} berhasil diperbarui.`); }
    catch (error) { toast.error(mapTransferError(error, "Draft transfer belum dapat diperbarui.")); throw error; }
  }
  function apply(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setParams({ ...draft, offset: 0 }); }
  function reset() { setDraft({ limit: 20, offset: 0, search: "", status: "all", date_from: "", date_to: "" }); setParams({ limit: 20, offset: 0, search: "", status: "all", date_from: "", date_to: "" }); }
  function openCreateForm() { setEditingTransfer(null); setFormOpen(true); }

  if (formOpen) {
    return <><PageHeader title={editingTransfer ? "Ubah draft transfer" : "Buat transfer stok"} description="Tambahkan seluruh barang dalam satu transfer sebelum menyimpan draft." action={<button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50" onClick={() => { setFormOpen(false); setEditingTransfer(null); }} type="button"><X size={17} />Kembali ke daftar</button>} /><TransferForm initialTransfer={editingTransfer} references={refs.data} isSubmitting={create.isPending || update.isPending} onClose={() => { setFormOpen(false); setEditingTransfer(null); }} onSubmit={createTransfer} onUpdate={updateTransfer} /></>;
  }

  return <><div className="no-print"><PageHeader title="Transfer stok" description="Pindahkan stok antar lokasi atau gudang melalui persetujuan, pengiriman, dan penerimaan tujuan." action={canCreate ? <button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700" onClick={openCreateForm} type="button"><Plus size={17} />Buat transfer</button> : <span className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-line-200 px-3 text-xs font-semibold text-slate-600">Mode baca saja</span>} />
    <form className="mb-6 grid gap-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] md:grid-cols-4" onSubmit={apply}><input className="h-11 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-teal-600/20" onChange={(e) => setDraft({ ...draft, search: e.target.value })} placeholder="Cari nomor transfer..." value={draft.search} /><select className="h-11 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm text-ink-950" onChange={(e) => setDraft({ ...draft, status: e.target.value })} value={draft.status}><option value="all">Semua status</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><input className="h-11 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm text-ink-950" onChange={(e) => setDraft({ ...draft, date_from: e.target.value })} type="date" value={draft.date_from} /><div className="flex gap-2"><button className="min-h-11 rounded-[var(--radius-md)] bg-ink-950 px-4 text-sm font-semibold text-surface-0" type="submit">Terapkan</button><button aria-label="Atur ulang filter" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 text-ink-950" onClick={reset} type="button"><RotateCcw size={16} /></button></div></form>
    {query.isLoading ? <State text="Memuat daftar transfer..." /> : query.isError ? <State text="Daftar transfer belum dapat dimuat." error onRetry={() => void query.refetch()} /> : query.data?.items.length === 0 ? <State text="Belum ada transfer stok" empty action={canCreate ? openCreateForm : undefined} /> : <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]"><div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><caption className="sr-only">Daftar transfer stok</caption><thead className="bg-canvas-50 text-xs font-semibold text-slate-700"><tr><th className="px-4 py-3">Nomor</th><th className="px-4 py-3">Asal</th><th className="px-4 py-3">Tujuan</th><th className="px-4 py-3">Dibuat</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-line-200">{query.data?.items.map((item) => <tr key={item.id}><td className="px-4 py-4"><button className="font-semibold text-teal-700 underline-offset-2 hover:underline" onClick={() => setDetailId(item.id)} type="button">{item.transfer_number}</button><p className="text-xs text-slate-600">ID #{item.id}</p></td><td className="px-4 py-4 text-ink-950">{item.source_warehouse_code} · {item.source_location_code}</td><td className="px-4 py-4 text-ink-950">{item.destination_warehouse_code} · {item.destination_location_code}</td><td className="px-4 py-4 text-slate-700">{formatDate(item.created_at)}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[item.status]}`}>{statuses[item.status]}</span></td><td className="px-4 py-4 text-right"><button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 font-semibold text-ink-950" onClick={() => setDetailId(item.id)} type="button"><Eye size={16} />Detail</button></td></tr>)}</tbody></table></div></section>}
    </div>
    {detailId !== null && <TransferDetail transfer={detail.data} isLoading={detail.isLoading} can={can} actions={{ approve, ship, cancel, receive }} onEdit={(transfer) => { setEditingTransfer(transfer); setFormOpen(true); setDetailId(null); }} onClose={() => setDetailId(null)} />}
  </>;
}

function State({ text, error = false, empty = false, onRetry, action }: { text: string; error?: boolean; empty?: boolean; onRetry?: () => void; action?: () => void }) { return <div className={`rounded-[var(--radius-lg)] border ${error ? "border-red-200 bg-red-50" : "border-dashed border-line-500 bg-surface-0"} p-8 text-center`}><p className="font-semibold text-ink-950">{text}</p>{error && onRetry && <button className="mt-4 min-h-11 rounded-[var(--radius-md)] bg-red-700 px-4 font-semibold text-surface-0" onClick={onRetry} type="button">Coba lagi</button>}{empty && action && <button className="mt-4 min-h-11 rounded-[var(--radius-md)] bg-teal-600 px-4 font-semibold text-surface-0" onClick={action} type="button">Buat transfer</button>}</div>; }

function TransferForm({ initialTransfer, references, isSubmitting, onClose, onSubmit, onUpdate }: { initialTransfer: StockTransfer | null; references?: Awaited<ReturnType<typeof useTransferReferences>>["data"]; isSubmitting: boolean; onClose: () => void; onSubmit: (payload: StockTransferCreatePayload) => Promise<void>; onUpdate: (id: number, payload: StockTransferUpdatePayload) => Promise<void> }) {
  const [sourceWarehouse, setSourceWarehouse] = useState(String(initialTransfer?.source_warehouse_id ?? "")); const [sourceLocation, setSourceLocation] = useState(String(initialTransfer?.source_location_id ?? "")); const [destinationWarehouse, setDestinationWarehouse] = useState(String(initialTransfer?.destination_warehouse_id ?? "")); const [destinationLocation, setDestinationLocation] = useState(String(initialTransfer?.destination_location_id ?? "")); const [lines, setLines] = useState((initialTransfer?.lines ?? []).map((line) => ({ item: String(line.item_id), qty: line.qty, notes: line.notes ?? "" }))); const [notes, setNotes] = useState(initialTransfer?.notes ?? ""); const [error, setError] = useState("");
  const locations = references?.locations ?? []; const sourceLocations = locations.filter((x) => x.warehouse_id === Number(sourceWarehouse)); const destinationLocations = locations.filter((x) => x.warehouse_id === Number(destinationWarehouse) && !(sourceWarehouse === destinationWarehouse && x.id === Number(sourceLocation)));
  useEffect(() => { const close = (e: KeyboardEvent) => { if (e.key === "Escape" && !isSubmitting) onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [isSubmitting, onClose]);
  const locationConflict = Boolean(sourceWarehouse && sourceLocation && destinationWarehouse === sourceWarehouse && destinationLocation === sourceLocation);

  function handleScanTransferItem(scannedCode: string) {
    const normalized = scannedCode.trim().toLowerCase();
    const matched = (references?.items ?? []).find(
      (item) =>
        item.barcode?.toLowerCase() === normalized ||
        item.sku?.toLowerCase() === normalized ||
        item.code?.toLowerCase() === normalized,
    );
    if (!matched) {
      toast.error(`Barang dengan barcode / SKU "${scannedCode}" tidak ditemukan.`);
      return;
    }
    const itemIdStr = String(matched.id);
    setLines((current) => {
      const existingIndex = current.findIndex((line) => line.item === itemIdStr);
      if (existingIndex >= 0) {
        return current.map((line, index) =>
          index === existingIndex
            ? { ...line, qty: String(Number(line.qty || 0) + 1) }
            : line,
        );
      }
      const emptyIndex = current.findIndex((line) => !line.item);
      if (emptyIndex >= 0) {
        return current.map((line, index) =>
          index === emptyIndex ? { ...line, item: itemIdStr, qty: line.qty || "1" } : line,
        );
      }
      return [...current, { item: itemIdStr, qty: "1", notes: "" }];
    });
    toast.success(`${matched.sku || matched.code} · ${matched.name} (+1)`);
  }

  async function submit(event: FormEvent) { event.preventDefault(); if (!sourceWarehouse || !sourceLocation || !destinationWarehouse || !destinationLocation || lines.length === 0 || lines.some((line) => !line.item || !line.qty || Number(line.qty) <= 0)) { setError("Asal, tujuan, minimal satu barang, dan kuantitas wajib diisi."); return; } if (locationConflict) { setError("Lokasi tujuan harus berbeda dari lokasi asal."); return; } if (new Set(lines.map((line) => line.item)).size !== lines.length) { setError("Barang tidak boleh dipilih lebih dari satu kali."); return; } setError(""); const payload = { source_warehouse_id: Number(sourceWarehouse), source_location_id: Number(sourceLocation), destination_warehouse_id: Number(destinationWarehouse), destination_location_id: Number(destinationLocation), notes: notes.trim() || null, lines: lines.map((line) => ({ item_id: Number(line.item), qty: line.qty, notes: line.notes.trim() || null })) }; if (initialTransfer) await onUpdate(initialTransfer.id, payload); else await onSubmit(payload); }
  return <section className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)]"><form className="space-y-5" onSubmit={(e) => void submit(e)}><div className="grid gap-4 rounded-[var(--radius-md)] bg-canvas-50 p-4 sm:grid-cols-2"><Select label="Gudang asal" value={sourceWarehouse} options={references?.warehouses ?? []} onChange={(value) => { setSourceWarehouse(value); setSourceLocation(""); }} /><Select label="Lokasi asal" value={sourceLocation} options={sourceLocations} onChange={(value) => { setSourceLocation(value); if (value === destinationLocation && sourceWarehouse === destinationWarehouse) setDestinationLocation(""); }} /><Select label="Gudang tujuan" value={destinationWarehouse} options={references?.warehouses ?? []} onChange={(value) => { setDestinationWarehouse(value); setDestinationLocation(""); }} /><Select label="Lokasi tujuan" value={destinationLocation} options={destinationLocations} onChange={setDestinationLocation} /></div>{locationConflict && <p className="rounded-[var(--radius-md)] bg-red-50 p-3 text-sm font-semibold text-red-900" role="alert">Lokasi tujuan harus berbeda dari lokasi asal.</p>}<BarcodeScanBar label="Scan Barcode / SKU Barang Transfer (+1 Kuantitas)" onScan={handleScanTransferItem} placeholder="Scan atau ketik Barcode / SKU barang untuk menambah baris transfer..." /><div className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-bold text-ink-950">Barang transfer</h2><span className="text-sm text-slate-600">{lines.length} baris</span></div>{lines.map((line, index) => <div className="grid gap-4 rounded-[var(--radius-md)] border border-line-200 p-4 sm:grid-cols-[1fr_1fr_auto]" key={`${index}-${line.item}`}><Select label={`Barang ${index + 1}`} value={line.item} options={references?.items ?? []} onChange={(value) => setLines((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, item: value } : entry))} /><label className="text-sm font-semibold text-ink-950">Kuantitas<input aria-label={`Kuantitas barang ${index + 1}`} className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm" min="0" onChange={(e) => setLines((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, qty: e.target.value } : entry))} step="0.0001" type="number" value={line.qty} /></label>{lines.length > 1 && <button aria-label={`Hapus barang ${index + 1}`} className="mt-7 min-h-11 min-w-11 rounded-[var(--radius-md)] border border-red-300 text-red-700" onClick={() => setLines((current) => current.filter((_, entryIndex) => entryIndex !== index))} type="button"><X size={16} /></button>}</div>)}<button className="min-h-11 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-semibold" onClick={() => setLines((current) => [...current, { item: "", qty: "", notes: "" }])} type="button">Tambah barang</button></div><label className="block text-sm font-semibold text-ink-950">Catatan<input className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm" maxLength={1000} onChange={(e) => setNotes(e.target.value)} value={notes} /></label>{error && <p className="rounded-[var(--radius-md)] bg-red-50 p-3 text-sm font-semibold text-red-900" role="alert">{error}</p>}<Actions isSubmitting={isSubmitting} onClose={onClose} submitLabel={initialTransfer ? "Simpan perubahan" : "Simpan draft"} /></form></section>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: { id: number; code: string; name: string }[]; onChange: (value: string) => void }) { return <label className="text-sm font-semibold text-ink-950">{label}<select className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal" onChange={(e) => onChange(e.target.value)} value={value}><option value="">Pilih {label.toLowerCase()}</option>{options.map((x) => <option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select></label>; }
function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="print-dialog-backdrop fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-4" onMouseDown={onClose}><div aria-modal="true" className="print-dialog-panel max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)]" onMouseDown={(e) => e.stopPropagation()} role="dialog"><div className="no-print mb-5 flex items-start justify-between border-b border-line-200 pb-4"><h2 className="text-lg font-bold text-ink-950">{title}</h2><button aria-label="Tutup dialog" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] hover:bg-canvas-50" onClick={onClose} type="button"><X size={18} /></button></div>{children}</div></div>; }
function Actions({ isSubmitting, onClose, submitLabel }: { isSubmitting: boolean; onClose: () => void; submitLabel: string }) { return <div className="flex justify-end gap-2 border-t border-line-200 pt-4"><button className="min-h-11 rounded-[var(--radius-md)] border border-line-500 px-4 font-semibold" onClick={onClose} type="button">Batal</button><button className="min-h-11 rounded-[var(--radius-md)] bg-teal-600 px-4 font-semibold text-surface-0 disabled:opacity-50" disabled={isSubmitting} type="submit">{isSubmitting ? "Menyimpan..." : submitLabel}</button></div>; }

function TransferDetail({ transfer, isLoading, can, actions, onEdit, onClose }: { transfer?: StockTransfer; isLoading: boolean; can: (permission: string) => boolean; actions: { approve: ReturnType<typeof useTransferMutation>; ship: ReturnType<typeof useTransferMutation>; cancel: ReturnType<typeof useTransferMutation>; receive: ReturnType<typeof useTransferMutation> }; onEdit: (transfer: StockTransfer) => void; onClose: () => void }) {
  const [confirmation, setConfirmation] = useState<"approve" | "ship" | "cancel" | "receive" | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    setShowPrintPreview(false);
  }, [transfer?.id]);

  async function run(actionName: "approve" | "ship" | "cancel") {
    if (!transfer) return;
    try { await actions[actionName].mutateAsync({ id: transfer.id }); toast.success("Status transfer berhasil diperbarui."); } catch (error) { toast.error(mapTransferError(error, "Aksi transfer belum berhasil.")); }
  }
  async function receiveTransfer() {
    if (!transfer) return;
    const lines: TransferReceiveLinePayload[] = (transfer.lines ?? []).map((line) => ({ line_id: line.id, qty_received: line.qty, variance_reason: null }));
    try { await actions.receive.mutateAsync({ id: transfer.id, lines }); toast.success("Transfer berhasil diterima."); } catch (error) { toast.error(mapTransferError(error, "Penerimaan transfer belum berhasil.")); }
  }
  function handlePrint() {
    setShowPrintPreview(true);
    window.print();
  }
  const canPrint = Boolean(transfer && (transfer.status === "APPROVED" || transfer.status === "SHIPPED" || transfer.status === "RECEIVED"));
  const confirm = confirmation && transfer ? {
    title: confirmation === "cancel" ? "Batalkan transfer?" : confirmation === "receive" ? "Terima transfer?" : `${confirmation === "approve" ? "Setujui" : "Kirim"} transfer?`,
    message: confirmation === "ship" ? `Stok asal transfer ${transfer.transfer_number} akan berkurang.` : confirmation === "receive" ? `Stok tujuan transfer ${transfer.transfer_number} akan bertambah.` : `Konfirmasi aksi untuk transfer ${transfer.transfer_number}.`,
  } : null;
  const isConfirmationPending = confirmation === "receive" ? actions.receive.isPending : confirmation ? actions[confirmation].isPending : false;
  return <Dialog title={transfer?.transfer_number ?? "Detail transfer"} onClose={onClose}>{isLoading || !transfer ? <p role="status">Memuat detail transfer...</p> : <><div className="no-print"><p className="text-sm text-slate-700">{transfer.source_warehouse_name} / {transfer.source_location_name ?? transfer.source_location_code} ke {transfer.destination_warehouse_name} / {transfer.destination_location_name ?? transfer.destination_location_code}</p><div className="mt-5 overflow-x-auto rounded-[var(--radius-md)] border border-line-200"><table className="min-w-[620px] w-full text-left text-sm"><thead className="bg-canvas-50 text-xs"><tr><th className="px-3 py-3">Barang</th><th className="px-3 py-3">Jumlah</th><th className="px-3 py-3">Diterima</th></tr></thead><tbody className="divide-y divide-line-200">{(transfer.lines ?? []).map((line) => <tr key={line.id}><td className="px-3 py-3"><div>{line.item_sku} · {line.item_name}</div>{line.item_barcode && <div className="text-xs text-slate-600">Barcode: {line.item_barcode}</div>}</td><td className="px-3 py-3 tabular-nums">{line.qty}</td><td className="px-3 py-3 tabular-nums">{line.qty_received ?? "-"}</td></tr>)}</tbody></table></div></div>{canPrint && <StockTransferPrintSheet transfer={transfer} visibleOnScreen={showPrintPreview} />}<div className="no-print mt-5 flex flex-wrap justify-end gap-2">{canPrint && <><button className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold" onClick={() => setShowPrintPreview((prev) => !prev)} type="button">{showPrintPreview ? "Sembunyikan pratinjau cetak" : "Pratinjau surat jalan"}</button><button className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] bg-ink-950 px-4 text-sm font-semibold text-surface-0 hover:bg-ink-800" onClick={handlePrint} type="button"><Printer aria-hidden="true" size={16} />Cetak Surat Jalan</button></>}{transfer.status === "DRAFT" && can("transfer:create") && <button className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] border border-line-500 px-4 font-semibold" onClick={() => onEdit(transfer)} type="button"><Edit3 size={16} />Ubah draft</button>}{transfer.status === "DRAFT" && can("transfer:approve") && <button className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] bg-teal-600 px-4 font-semibold text-surface-0" onClick={() => setConfirmation("approve")} type="button">Setujui</button>}{transfer.status === "APPROVED" && can("transfer:ship") && <button className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] bg-teal-600 px-4 font-semibold text-surface-0" onClick={() => setConfirmation("ship")} type="button">Kirim</button>}{transfer.status === "SHIPPED" && can("transfer:receive") && <button className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] bg-teal-600 px-4 font-semibold text-surface-0" onClick={() => setConfirmation("receive")} type="button">Terima transfer</button>}{(transfer.status === "DRAFT" || transfer.status === "APPROVED") && can("transfer:create") && <button className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] border border-red-600/40 px-4 font-semibold text-red-700" onClick={() => setConfirmation("cancel")} type="button">Batalkan</button>}<button className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] border border-line-500 px-4 font-semibold" onClick={onClose} type="button">Tutup</button></div></>}{confirm && <ConfirmDialog danger={confirmation === "cancel"} confirmLabel={confirmation === "cancel" ? "Batalkan" : "Konfirmasi"} isPending={isConfirmationPending} message={confirm.message} onClose={() => setConfirmation(null)} onConfirm={() => { const selected = confirmation; setConfirmation(null); if (selected === "receive") void receiveTransfer(); else if (selected) void run(selected); }} title={confirm.title} />}</Dialog>;
}
