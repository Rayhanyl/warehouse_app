import { FormEvent, useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
import { ChevronLeft, ChevronRight, Edit3, Eye, Plus, RotateCcw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { BarcodeScanBar } from "@/components/ui/BarcodeScannerModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePermission } from "@/hooks/usePermission";
import { mapApiFormError } from "@/lib/errors";
import { validateDecimalQtyInput } from "@/lib/validation";
import { mapOpnameError, useOpname, useOpnameMutation, useOpnameReferences, useOpnames } from "../api";
import type { StockOpname, StockOpnameCountLinePayload, StockOpnameCreatePayload, StockOpnameStatus, StockOpnameUpdatePayload } from "../types";

type Filters = { limit: number; offset: number; search: string; status: StockOpnameStatus | "all"; warehouse_id: number | null; date_from: string; date_to: string };
const initialFilters: Filters = { limit: 20, offset: 0, search: "", status: "all", warehouse_id: null, date_from: "", date_to: "" };
const statuses: Record<StockOpnameStatus, string> = { DRAFT: "Draft", IN_PROGRESS: "Sedang dihitung", WAITING_APPROVAL: "Menunggu persetujuan", COMPLETED: "Selesai", CANCELLED: "Dibatalkan" };
const statusClass: Record<StockOpnameStatus, string> = { DRAFT: "bg-canvas-50 text-slate-700", IN_PROGRESS: "bg-amber-100 text-amber-800", WAITING_APPROVAL: "bg-blue-100 text-blue-800", COMPLETED: "bg-teal-100 text-teal-800", CANCELLED: "bg-slate-200 text-slate-700" };
const fieldClass = "mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20";
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function StockOpnamesPage() {
  const { can } = usePermission();
  const [params, setParams] = useState<Filters>(initialFilters);
  const [draft, setDraft] = useState<Filters>(initialFilters);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingOpname, setEditingOpname] = useState<StockOpname | null>(null);
  const query = useOpnames(params);
  const detail = useOpname(detailId);
  const refs = useOpnameReferences();
  const create = useOpnameMutation("create");
  const update = useOpnameMutation("update");
  const canManage = can("opname:manage");
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const pageEnd = Math.min(params.offset + params.limit, total);
  const hasFilters = Boolean(params.search || params.status !== "all" || params.warehouse_id || params.date_from || params.date_to);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setParams({ ...draft, offset: 0 });
  }

  function reset() {
    setDraft(initialFilters);
    setParams(initialFilters);
  }

  async function createSession(payload: StockOpnameCreatePayload) {
    try {
      const result = await create.mutateAsync({ payload });
      setFormOpen(false);
      setDetailId(result.id);
      toast.success(`Draft ${result.opname_number} berhasil dibuat.`);
    } catch (error) {
      toast.error(mapOpnameError(error, "Sesi opname belum dapat dibuat."));
      throw error;
    }
  }

  async function updateSession(id: number, payload: StockOpnameUpdatePayload) {
    try {
      const result = await update.mutateAsync({ id, payload });
      setFormOpen(false);
      setEditingOpname(null);
      setDetailId(result.id);
      toast.success(`Draft ${result.opname_number} berhasil diperbarui.`);
    } catch (error) {
      toast.error(mapOpnameError(error, "Draft opname belum dapat diperbarui."));
      throw error;
    }
  }

  return <>
    <PageHeader title="Stock opname" description="Bekukan lokasi, catat hasil hitung fisik, lalu ajukan selisih untuk persetujuan." action={canManage ? <button className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2" onClick={() => { setEditingOpname(null); setFormOpen(true); }} type="button"><Plus aria-hidden="true" size={17} />Buat sesi opname</button> : <span className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-xs font-semibold text-slate-600">Mode baca saja</span>} />

    <section aria-label="Filter daftar stock opname" className="mb-6 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-5">
      <form className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" onSubmit={apply}>
        <label className="text-sm font-semibold text-ink-950">Pencarian<div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-600" size={16} /><input className={`${fieldClass} pl-9`} maxLength={100} onChange={(event) => setDraft((current) => ({ ...current, search: event.target.value }))} placeholder="Nomor atau catatan sesi" type="search" value={draft.search} /></div></label>
        <label className="text-sm font-semibold text-ink-950">Status<select className={fieldClass} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as Filters["status"] }))} value={draft.status}><option value="all">Semua status</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="text-sm font-semibold text-ink-950">Gudang<select className={fieldClass} onChange={(event) => setDraft((current) => ({ ...current, warehouse_id: event.target.value ? Number(event.target.value) : null }))} value={draft.warehouse_id ?? ""}><option value="">Semua gudang</option>{refs.data?.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}</select></label>
        <label className="text-sm font-semibold text-ink-950">Tanggal mulai<input className={fieldClass} max={draft.date_to || undefined} onChange={(event) => setDraft((current) => ({ ...current, date_from: event.target.value }))} type="date" value={draft.date_from} /></label>
        <label className="text-sm font-semibold text-ink-950">Tanggal akhir<input className={fieldClass} min={draft.date_from || undefined} onChange={(event) => setDraft((current) => ({ ...current, date_to: event.target.value }))} type="date" value={draft.date_to} /></label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 xl:col-span-3"><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-ink-950 px-4 text-sm font-semibold text-surface-0 hover:bg-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-600" type="submit">Terapkan filter</button><button className={buttonClass} onClick={reset} type="button"><RotateCcw aria-hidden="true" size={16} />Atur ulang</button></div>
      </form>
      {refs.isError && <p className="mt-3 text-sm text-red-800" role="alert">Referensi gudang dan lokasi belum dapat dimuat. <button className="font-semibold underline" onClick={() => void refs.refetch()} type="button">Coba lagi</button></p>}
    </section>

    {query.isLoading ? <State text="Memuat daftar stock opname..." /> : query.isError ? <State error text="Daftar stock opname belum dapat dimuat." onRetry={() => void query.refetch()} /> : items.length === 0 ? <State empty text={hasFilters ? "Tidak ada sesi yang cocok dengan filter" : "Belum ada sesi stock opname"} action={hasFilters ? reset : canManage ? () => setFormOpen(true) : undefined} actionLabel={hasFilters ? "Atur ulang filter" : "Buat sesi opname"} /> : <section aria-label="Daftar sesi stock opname" className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]"><div className="overflow-x-auto"><table className="min-w-[860px] w-full border-collapse text-left text-sm"><caption className="sr-only">Daftar stock opname</caption><thead className="bg-canvas-50 text-xs font-semibold text-slate-700"><tr><th className="px-4 py-3">Nomor dan tanggal</th><th className="px-4 py-3">Gudang</th><th className="px-4 py-3">Cakupan</th><th className="px-4 py-3 text-right">Baris</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-line-200">{items.map((item) => <tr className="hover:bg-canvas-50/60" key={item.id}><td className="px-4 py-4"><button className="font-semibold text-teal-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-600" onClick={() => setDetailId(item.id)} type="button">{item.opname_number}</button><p className="mt-1 text-xs text-slate-600 tabular-nums">{formatDateTime(item.created_at)}</p></td><td className="px-4 py-4">{item.warehouse_code} · {item.warehouse_name}</td><td className="px-4 py-4">{item.location_code ? `${item.location_code} · ${item.location_name}` : "Seluruh lokasi aktif"}</td><td className="px-4 py-4 text-right tabular-nums">{item.line_count}</td><td className="px-4 py-4"><span className={`inline-flex rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-semibold ${statusClass[item.status]}`}>{statuses[item.status]}</span></td><td className="px-4 py-4 text-right"><button aria-label={`Lihat detail ${item.opname_number}`} className={buttonClass} onClick={() => setDetailId(item.id)} type="button"><Eye aria-hidden="true" size={16} />Detail</button></td></tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-200 px-4 py-3 text-sm text-slate-700"><span className="tabular-nums">Menampilkan {total === 0 ? 0 : params.offset + 1} sampai {pageEnd} dari {total} sesi</span><div className="flex gap-2"><button aria-label="Halaman sebelumnya" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:opacity-40" disabled={params.offset === 0} onClick={() => setParams((current) => ({ ...current, offset: Math.max(0, current.offset - current.limit) }))} type="button"><ChevronLeft aria-hidden="true" size={17} /></button><button aria-label="Halaman berikutnya" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:opacity-40" disabled={pageEnd >= total} onClick={() => setParams((current) => ({ ...current, offset: current.offset + current.limit }))} type="button"><ChevronRight aria-hidden="true" size={17} /></button></div></div></section>}

    {formOpen && <OpnameForm initialOpname={editingOpname} references={refs.data} isSubmitting={create.isPending || update.isPending} onClose={() => { setFormOpen(false); setEditingOpname(null); }} onSubmit={createSession} onUpdate={updateSession} />}
    {detailId !== null && <OpnameDetail opname={detail.data} isLoading={detail.isLoading} isError={detail.isError} can={can} onRetry={() => void detail.refetch()} onEdit={(opname) => { setEditingOpname(opname); setFormOpen(true); setDetailId(null); }} onClose={() => setDetailId(null)} />}
  </>;
}

function State({ text, error = false, empty = false, onRetry, action, actionLabel }: { text: string; error?: boolean; empty?: boolean; onRetry?: () => void; action?: () => void; actionLabel?: string }) {
  return <div className={`rounded-[var(--radius-lg)] border ${error ? "border-red-200 bg-red-50" : "border-dashed border-line-500 bg-surface-0"} p-8 text-center`} role={error ? "alert" : "status"}><p className="font-semibold text-ink-950">{text}</p>{error && onRetry && <button className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-red-700 px-4 font-semibold text-surface-0 hover:bg-red-800" onClick={onRetry} type="button">Coba lagi</button>}{empty && action && <button className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 px-4 font-semibold hover:bg-canvas-50" onClick={action} type="button">{actionLabel}</button>}</div>;
}

function OpnameForm({ initialOpname, references, isSubmitting, onClose, onSubmit, onUpdate }: { initialOpname: StockOpname | null; references?: Awaited<ReturnType<typeof useOpnameReferences>>["data"]; isSubmitting: boolean; onClose: () => void; onSubmit: (payload: StockOpnameCreatePayload) => Promise<void>; onUpdate: (id: number, payload: StockOpnameUpdatePayload) => Promise<void> }) {
  const [warehouse, setWarehouse] = useState(initialOpname ? String(initialOpname.warehouse_id) : "");
  const [location, setLocation] = useState(initialOpname?.location_id ? String(initialOpname.location_id) : "");
  const [notes, setNotes] = useState(initialOpname?.notes ?? "");
  const [error, setError] = useState("");
  const locations = references?.locations.filter((entry) => entry.warehouse_id === Number(warehouse)) ?? [];
  useEscapeClose(onClose, isSubmitting);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!warehouse) { setError("Gudang wajib dipilih."); return; }
    setError("");
    try {
      if (initialOpname) {
        await onUpdate(initialOpname.id, {
          location_id: location ? Number(location) : null,
          clear_location: !location,
          notes: notes.trim() || null,
        });
      } else {
        await onSubmit({
          warehouse_id: Number(warehouse),
          location_id: location ? Number(location) : null,
          notes: notes.trim() || null,
        });
      }
    } catch (submitErr) {
      const mapped = mapApiFormError(submitErr, "Sesi stock opname belum dapat disimpan.");
      setError(mapped.formMessage);
    }
  }

  return <Dialog title={initialOpname ? "Ubah draft stock opname" : "Buat sesi stock opname"} onClose={onClose}><form className="space-y-4" noValidate onSubmit={(event) => void submit(event)}>
    <label className="block text-sm font-semibold text-ink-950">Gudang<select className={fieldClass} disabled={Boolean(initialOpname)} onChange={(event) => { setWarehouse(event.target.value); setLocation(""); }} required value={warehouse}><option value="">Pilih gudang</option>{references?.warehouses.map((entry) => <option key={entry.id} value={entry.id}>{entry.code} · {entry.name}</option>)}</select></label>
    <label className="block text-sm font-semibold text-ink-950">Lokasi (opsional)<select className={fieldClass} onChange={(event) => setLocation(event.target.value)} value={location}><option value="">Seluruh lokasi aktif</option>{locations.map((entry) => <option key={entry.id} value={entry.id}>{entry.code} · {entry.name}</option>)}</select></label>
    <label className="block text-sm font-semibold text-ink-950">Catatan<input className={fieldClass} maxLength={1000} onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
    {references?.warehouses.length === 0 && <p className="text-sm text-amber-800" role="status">Tidak ada gudang aktif yang tersedia.</p>}{error && <p className="rounded-[var(--radius-md)] bg-red-50 p-3 text-sm font-semibold text-red-900" role="alert">{error}</p>}
    <div className="flex justify-end gap-2 border-t border-line-200 pt-4"><button className={buttonClass} onClick={onClose} type="button">Batal</button><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 font-semibold text-surface-0 hover:bg-teal-700 disabled:opacity-50" disabled={isSubmitting || !references?.warehouses.length} type="submit">{isSubmitting ? "Menyimpan..." : initialOpname ? "Simpan perubahan" : "Simpan draft"}</button></div>
  </form></Dialog>;
}

function useEscapeClose(onClose: () => void, isBusy: boolean) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !isBusy) onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [isBusy, onClose]);
}

function Dialog({ title, children, onClose, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-3 sm:p-4" onMouseDown={onClose}><div aria-labelledby="opname-dialog-title" aria-modal="true" className={`max-h-[94vh] w-full ${wide ? "max-w-[min(96vw,92rem)]" : "max-w-5xl"} overflow-y-auto rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6`} onMouseDown={(event) => event.stopPropagation()} role="dialog"><div className="mb-5 flex items-start justify-between border-b border-line-200 pb-4"><h2 className="text-lg font-bold text-ink-950" id="opname-dialog-title">{title}</h2><button aria-label="Tutup dialog" className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600" onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button></div>{children}</div></div>;
}

type PendingAction = "start" | "submit" | "approve" | "cancel";
type CountDraft = { qty: string; notes: string };
type FoundDraft = { location_id: string; item_id: string; qty: string; notes: string };

function OpnameDetail({ opname, isLoading, isError, can, onRetry, onEdit, onClose }: { opname?: StockOpname; isLoading: boolean; isError: boolean; can: (permission: string) => boolean; onRetry: () => void; onEdit: (opname: StockOpname) => void; onClose: () => void }) {
  const start = useOpnameMutation("start");
  const count = useOpnameMutation("count");
  const submit = useOpnameMutation("submit");
  const approve = useOpnameMutation("approve");
  const reject = useOpnameMutation("reject");
  const cancel = useOpnameMutation("cancel");
  const refs = useOpnameReferences();
  const [counts, setCounts] = useState<Record<number, CountDraft>>({});
  const [found, setFound] = useState<FoundDraft[]>([]);
  const [rejectionOpen, setRejectionOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [confirmation, setConfirmation] = useState<{ action: PendingAction; title: string; message: string } | null>(null);
  const busy = start.isPending || count.isPending || submit.isPending || approve.isPending || reject.isPending || cancel.isPending;
  useEscapeClose(onClose, busy);

  const locations = useMemo(() => refs.data?.locations.filter((entry) => entry.warehouse_id === opname?.warehouse_id) ?? [], [refs.data?.locations, opname?.warehouse_id]);
  const opnameLines = opname?.lines ?? [];
  const reportedLines = opnameLines.filter((line) => {
    const quantity = counts[line.id]?.qty || line.qty_physical || "";
    return validQuantity(quantity, line.allow_decimal);
  }).length;
  const reportedFound = found.filter((line) => {
    const item = refs.data?.items.find((entry) => entry.id === Number(line.item_id));
    return Boolean(item && line.location_id && validQuantity(line.qty, item.allow_decimal));
  }).length;
  const reportLineCount = opnameLines.length + found.length;
  const reportedCount = reportedLines + reportedFound;
  const uncounted = reportLineCount - reportedCount;
  const varianceCount = opnameLines.filter((line) => {
    const quantity = counts[line.id]?.qty || line.qty_physical;
    return quantity !== null && quantity !== undefined && quantity !== "" && validQuantity(quantity, line.allow_decimal) && !new Decimal(quantity).minus(line.qty_system).isZero();
  }).length + found.filter((line) => validQuantity(line.qty, Boolean(refs.data?.items.find((item) => item.id === Number(line.item_id))?.allow_decimal)) && new Decimal(line.qty).greaterThan(0)).length;
  const hasPendingCount = Object.keys(counts).length > 0 || found.length > 0;
  const hasSavableCount = opnameLines.some((line) => counts[line.id] && validQuantity(counts[line.id].qty || line.qty_physical || "", line.allow_decimal)) || found.some((line) => {
    const item = refs.data?.items.find((entry) => entry.id === Number(line.item_id));
    return Boolean(item && line.location_id && validQuantity(line.qty, item.allow_decimal));
  });

  async function run(action: PendingAction, payload?: unknown) {
    if (!opname) return;
    const mutation = { start, submit, approve, cancel }[action];
    try {
      const result = await mutation.mutateAsync({ id: opname.id, payload });
      toast.success(`${result.opname_number} berhasil diperbarui.`);
      setCounts({});
      if (action === "cancel" || action === "approve") onClose();
    } catch (error) {
      toast.error(mapOpnameError(error, "Aksi stock opname belum berhasil."));
    }
  }

  function validQuantity(value: string, allowDecimal: boolean) {
    return validateDecimalQtyInput(value, { allowZero: true, allowDecimal }) === null;
  }

  function handleScanOpnameItem(scannedCode: string) {
    if (!opname) return;
    const normalized = scannedCode.trim().toLowerCase();
    const matchedLine = (opname.lines ?? []).find(
      (line) =>
        line.item_barcode?.toLowerCase() === normalized ||
        line.item_sku.toLowerCase() === normalized,
    );
    if (matchedLine) {
      const currentRaw = counts[matchedLine.id]?.qty ?? matchedLine.qty_physical ?? "0";
      const nextQty = new Decimal(currentRaw || "0").plus(1);
      const formatted = matchedLine.allow_decimal && !nextQty.isInteger() ? nextQty.toFixed(4) : nextQty.toFixed(0);
      setCounts((currentCounts) => ({
        ...currentCounts,
        [matchedLine.id]: {
          qty: formatted,
          notes: currentCounts[matchedLine.id]?.notes ?? matchedLine.notes ?? "",
        },
      }));
      toast.success(`${matchedLine.item_sku} · ${matchedLine.item_name} (+1 -> ${formatted})`);
      return;
    }

    const matchedRef = (refs.data?.items ?? []).find(
      (item) =>
        item.barcode?.toLowerCase() === normalized ||
        item.sku.toLowerCase() === normalized,
    );
    if (matchedRef) {
      const defaultLocationId = opname.location_id
        ? String(opname.location_id)
        : locations[0]
          ? String(locations[0].id)
          : "";
      setFound((currentFound) => {
        const existingIdx = currentFound.findIndex(
          (entry) => entry.item_id === String(matchedRef.id),
        );
        if (existingIdx >= 0) {
          return currentFound.map((entry, idx) =>
            idx === existingIdx
              ? { ...entry, qty: String(Number(entry.qty || 0) + 1) }
              : entry,
          );
        }
        return [
          ...currentFound,
          {
            location_id: defaultLocationId,
            item_id: String(matchedRef.id),
            qty: "1",
            notes: "",
          },
        ];
      });
      toast.success(`Barang temuan: ${matchedRef.sku} · ${matchedRef.name} (+1)`);
      return;
    }

    toast.error(`Barang dengan barcode / SKU "${scannedCode}" tidak ditemukan.`);
  }

  async function saveCounts() {
    if (!opname) return;
    const lines: StockOpnameCountLinePayload[] = [];
    for (const line of opname.lines ?? []) {
      const draft = counts[line.id];
      const qty = draft?.qty ?? line.qty_physical ?? "";
      if (!draft && line.qty_physical === null) continue;
      if (!validQuantity(qty, line.allow_decimal)) { toast.error(`Jumlah untuk ${line.item_sku} belum valid.`); return; }
      lines.push({ line_id: line.id, qty_physical: qty, notes: draft?.notes ?? line.notes });
    }
    const countedItems = new Set((opname.lines ?? []).map((line) => `${line.location_id}:${line.item_id}`));
    for (const line of found) {
      const item = refs.data?.items.find((entry) => entry.id === Number(line.item_id));
      if (!line.item_id || !line.location_id || !item || !validQuantity(line.qty, Boolean(item.allow_decimal))) { toast.error("Lengkapi lokasi, barang, dan jumlah barang temuan dengan format yang valid."); return; }
      if (line.notes.length > 500) { toast.error("Catatan per baris maksimal 500 karakter."); return; }
      const itemKey = `${line.location_id}:${line.item_id}`;
      if (countedItems.has(itemKey)) { toast.error(`${item.sku} sudah tercatat pada lokasi tersebut.`); return; }
      countedItems.add(itemKey);
      lines.push({ location_id: Number(line.location_id), item_id: Number(line.item_id), qty_physical: line.qty, notes: line.notes.trim() || null });
    }
    if (lines.length === 0) { toast.error("Isi minimal satu hasil hitung."); return; }
    try {
      await count.mutateAsync({ id: opname.id, payload: { lines } });
      setCounts({});
      setFound([]);
      toast.success("Hasil hitung berhasil disimpan.");
    } catch (error) {
      toast.error(mapOpnameError(error, "Hasil hitung belum berhasil disimpan."));
    }
  }

  async function rejectOpname(event: FormEvent) {
    event.preventDefault();
    const reason = rejectionReason.trim();
    if (!reason || reason.length > 500) { setRejectionError("Alasan wajib diisi dan maksimal 500 karakter."); return; }
    if (!opname) return;
    try {
      await reject.mutateAsync({ id: opname.id, payload: { rejection_reason: reason } });
      setRejectionOpen(false);
      setRejectionReason("");
      toast.success("Hasil hitung dikembalikan untuk dihitung ulang.");
    } catch (error) {
      toast.error(mapOpnameError(error, "Hasil opname belum dapat ditolak."));
    }
  }

  return <Dialog title={opname?.opname_number ?? "Detail stock opname"} onClose={onClose} wide>
    {isLoading ? <p className="p-4 text-sm text-slate-700" role="status">Memuat detail stock opname...</p> : isError || !opname ? <div className="p-4"><p className="text-sm font-semibold text-red-900" role="alert">Detail stock opname belum dapat dimuat.</p><button className={`${buttonClass} mt-3`} onClick={onRetry} type="button">Coba lagi</button></div> : <>
      <div className="grid gap-3 border-b border-line-200 pb-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><Info label="Gudang" value={`${opname.warehouse_code} · ${opname.warehouse_name}`} /><Info label="Cakupan" value={opname.location_name ? `${opname.location_code} · ${opname.location_name}` : "Seluruh lokasi aktif"} /><Info label="Status" value={statuses[opname.status]} /><Info label="Dibuat" value={formatDateTime(opname.created_at)} /></div>
      {opname.notes && <p className="mt-4 text-sm text-slate-700">Catatan sesi: {opname.notes}</p>}{opname.rejection_reason && <p className="mt-4 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Alasan penolakan:</strong> {opname.rejection_reason}</p>}
      {opname.status === "IN_PROGRESS" && can("opname:count") && <section aria-labelledby="opname-count-title" className="mt-5 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-ink-950" id="opname-count-title">Laporan hitung fisik</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700">Masukkan jumlah yang ditemukan pada setiap lokasi. Simpan hasil hitung sebelum mengajukan laporan.</p></div><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600" onClick={() => setFound((current) => [...current, { location_id: opname.location_id ? String(opname.location_id) : "", item_id: "", qty: "", notes: "" }])} type="button"><Plus aria-hidden="true" size={16} />Tambah barang temuan</button></div>
        <div className="mt-4"><BarcodeScanBar label="Scan Barcode / SKU Hitung Fisik (+1)" onScan={handleScanOpnameItem} placeholder="Scan atau ketik Barcode / SKU barang untuk menambah hasil fisik (+1)..." /></div>
        <div aria-live="polite" className="mt-4 grid gap-3 sm:grid-cols-3"><Summary label="Jumlah terisi" value={`${reportedCount} dari ${reportLineCount}`} /><Summary label="Baris dengan selisih" value={String(varianceCount)} /><Summary label="Perubahan belum disimpan" value={hasPendingCount ? "Ada" : "Tidak ada"} /></div>
        <div className="mt-4"><div aria-valuemax={Math.max(reportLineCount, 1)} aria-valuemin={0} aria-valuenow={reportedCount} aria-label="Progres pengisian laporan" className="h-2 overflow-hidden rounded-full bg-line-200" role="progressbar"><div className="h-full rounded-full bg-teal-600 transition-[width] duration-150" style={{ width: `${reportLineCount === 0 ? 0 : (reportedCount / reportLineCount) * 100}%` }} /></div><p className="mt-2 text-sm text-slate-700">{reportLineCount === 0 ? "Snapshot tidak menemukan saldo stok. Tambahkan barang temuan untuk melanjutkan." : uncounted > 0 ? `${uncounted} baris masih perlu diisi.` : hasPendingCount ? "Semua jumlah sudah diisi. Simpan perubahan sebelum mengajukan." : "Semua jumlah sudah tersimpan dan siap diajukan."}</p></div>
      </section>}
      <div className="mt-4 overflow-x-auto rounded-[var(--radius-md)] border border-line-200"><table className="min-w-[780px] w-full border-collapse text-left text-sm"><caption className="sr-only">Baris hitung stock opname</caption><thead className="bg-canvas-50 text-xs font-semibold text-slate-700"><tr><th className="px-3 py-3">Barang dan lokasi</th><th className="px-3 py-3 text-right">Saldo sistem</th><th className="px-3 py-3">Hasil fisik</th><th className="px-3 py-3 text-right">Selisih</th><th className="px-3 py-3">Catatan hitung</th></tr></thead><tbody className="divide-y divide-line-200">{(opname.lines ?? []).map((line) => {
        const editable = opname.status === "IN_PROGRESS" && can("opname:count");
        const current = counts[line.id];
        const variance = current?.qty !== undefined && current.qty !== "" && Number.isFinite(Number(current.qty)) ? new Decimal(current.qty).minus(line.qty_system).toFixed(4) : line.qty_variance;
        return <tr key={line.id}><td className="px-3 py-3"><p className="font-semibold text-ink-950">{line.item_sku} · {line.item_name}</p><p className="text-xs text-slate-600">{line.location_code} · {line.location_name}</p></td><td className="px-3 py-3 text-right tabular-nums">{line.qty_system}</td><td className="px-3 py-3">{editable ? <input aria-label={`Hasil fisik ${line.item_sku}`} className="h-11 w-36 rounded-[var(--radius-md)] border border-line-500 px-3 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600" inputMode="decimal" min="0" onChange={(event) => setCounts((currentCounts) => ({ ...currentCounts, [line.id]: { qty: event.target.value, notes: currentCounts[line.id]?.notes ?? line.notes ?? "" } }))} step={line.allow_decimal ? "0.0001" : "1"} type="number" value={current?.qty ?? line.qty_physical ?? ""} /> : line.qty_physical ?? "-"}</td><td className="px-3 py-3 text-right tabular-nums">{variance ?? "-"}</td><td className="px-3 py-3">{editable ? <input aria-label={`Catatan hitung ${line.item_sku}`} className="h-11 min-w-48 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" maxLength={500} onChange={(event) => setCounts((currentCounts) => ({ ...currentCounts, [line.id]: { qty: currentCounts[line.id]?.qty ?? line.qty_physical ?? "", notes: event.target.value } }))} value={current?.notes ?? line.notes ?? ""} /> : line.notes || "-"}</td></tr>;
      })}{found.map((line, index) => <tr className="bg-amber-50/60" key={`found-${index}`}><td className="min-w-64 px-3 py-3"><div className="grid gap-2"><select aria-label={`Lokasi barang temuan ${index + 1}`} className="h-11 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-2" onChange={(event) => setFound((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, location_id: event.target.value } : entry))} value={line.location_id}><option value="">Pilih lokasi</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.code} · {location.name}</option>)}</select><select aria-label={`Barang temuan ${index + 1}`} className="h-11 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-2" onChange={(event) => setFound((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, item_id: event.target.value } : entry))} value={line.item_id}><option value="">Pilih barang</option>{refs.data?.items.map((item) => <option key={item.id} value={item.id}>{item.sku} · {item.name}</option>)}</select></div></td><td className="px-3 py-3 text-right tabular-nums">0</td><td className="px-3 py-3"><input aria-label={`Jumlah barang temuan ${index + 1}`} className="h-11 w-36 rounded-[var(--radius-md)] border border-line-500 px-3 tabular-nums" min="0" onChange={(event) => setFound((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, qty: event.target.value } : entry))} step={refs.data?.items.find((item) => item.id === Number(line.item_id))?.allow_decimal ? "0.0001" : "1"} type="number" value={line.qty} /></td><td className="px-3 py-3 text-right tabular-nums">{line.qty ? line.qty : "-"}</td><td className="px-3 py-3"><div className="flex items-center gap-2"><input aria-label={`Catatan barang temuan ${index + 1}`} className="h-11 min-w-40 rounded-[var(--radius-md)] border border-line-500 px-3" maxLength={500} onChange={(event) => setFound((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, notes: event.target.value } : entry))} value={line.notes} /><button aria-label={`Hapus barang temuan ${index + 1}`} className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-red-300 text-red-700 hover:bg-red-50" onClick={() => setFound((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button"><X aria-hidden="true" size={16} /></button></div></td></tr>)}</tbody></table></div>
      {(opname.lines ?? []).length === 0 && found.length === 0 && <p className="border-x border-line-200 p-5 text-sm text-slate-700">Sesi ini belum memiliki saldo snapshot. Gunakan tombol tambah barang temuan untuk mencatat stok awal di lokasi.</p>}
      {opname.status === "IN_PROGRESS" && hasPendingCount && <p className="mt-3 text-right text-sm text-slate-700">Simpan hasil hitung untuk memperbarui laporan dan membuka pengajuan.</p>}
      <div className="sticky bottom-[-1.25rem] mt-5 flex flex-wrap justify-end gap-2 border-t border-line-200 bg-surface-0 py-4">
        {opname.status === "DRAFT" && can("opname:manage") && <button className={buttonClass} onClick={() => onEdit(opname)} type="button"><Edit3 aria-hidden="true" size={16} />Ubah draft</button>}
        {opname.status === "DRAFT" && can("opname:manage") && <button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 font-semibold text-surface-0 hover:bg-teal-700" onClick={() => setConfirmation({ action: "start", title: "Mulai stock opname?", message: `Sesi ${opname.opname_number} akan mengambil snapshot saldo dan membekukan lokasi.` })} type="button">Mulai opname</button>}
        {opname.status === "IN_PROGRESS" && can("opname:count") && <><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 font-semibold text-surface-0 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || !hasPendingCount || !hasSavableCount} onClick={() => void saveCounts()} type="button">{count.isPending ? "Menyimpan..." : "Simpan laporan hitung"}</button><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-ink-950 px-4 font-semibold text-surface-0 hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || uncounted > 0 || hasPendingCount || reportLineCount === 0} onClick={() => setConfirmation({ action: "submit", title: "Ajukan hasil hitung?", message: `Hasil hitung ${opname.opname_number} akan diajukan kepada manajer.` })} type="button">Ajukan persetujuan</button></>}
        {opname.status === "WAITING_APPROVAL" && can("opname:approve") && <><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 font-semibold text-surface-0 hover:bg-teal-700 disabled:opacity-50" disabled={busy} onClick={() => setConfirmation({ action: "approve", title: "Setujui selisih?", message: `Saldo stok ${opname.opname_number} akan disesuaikan dengan hasil hitung.` })} type="button">Setujui selisih</button><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-amber-700/40 px-4 font-semibold text-amber-800 hover:bg-amber-50" disabled={busy} onClick={() => { setRejectionReason(""); setRejectionError(""); setRejectionOpen(true); }} type="button">Tolak hasil hitung</button></>}
        {(opname.status === "DRAFT" || opname.status === "IN_PROGRESS") && can("opname:manage") && <button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-red-600/40 px-4 font-semibold text-red-700 hover:bg-red-50" disabled={busy} onClick={() => setConfirmation({ action: "cancel", title: "Batalkan stock opname?", message: `Sesi ${opname.opname_number} tidak dapat dilanjutkan setelah dibatalkan.` })} type="button">Batalkan</button>}
        <button className={buttonClass} onClick={onClose} type="button">Tutup</button>
      </div>
    </>}
    {confirmation && <ConfirmDialog danger={confirmation.action === "cancel"} confirmLabel={confirmation.action === "start" ? "Mulai opname" : confirmation.action === "submit" ? "Ajukan" : confirmation.action === "approve" ? "Setujui" : "Batalkan"} isPending={({ start, submit, approve, cancel }[confirmation.action]).isPending} message={confirmation.message} onClose={() => setConfirmation(null)} onConfirm={() => { const selected = confirmation.action; setConfirmation(null); void run(selected); }} title={confirmation.title} />}
    {rejectionOpen && <Dialog title="Tolak hasil hitung" onClose={() => !reject.isPending && setRejectionOpen(false)}><form className="space-y-4" onSubmit={(event) => void rejectOpname(event)}><p className="text-sm text-slate-700">Tuliskan alasan agar petugas tahu bagian mana yang perlu dihitung ulang.</p><label className="block text-sm font-semibold text-ink-950">Alasan penolakan<textarea autoFocus className="mt-2 min-h-28 w-full rounded-[var(--radius-md)] border border-line-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" maxLength={500} onChange={(event) => setRejectionReason(event.target.value)} required value={rejectionReason} /></label><p className="text-right text-xs text-slate-600">{rejectionReason.length}/500</p>{rejectionError && <p className="text-sm text-red-800" role="alert">{rejectionError}</p>}<div className="flex justify-end gap-2 border-t border-line-200 pt-4"><button className={buttonClass} disabled={reject.isPending} onClick={() => setRejectionOpen(false)} type="button">Kembali</button><button className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-amber-700 px-4 font-semibold text-surface-0 hover:bg-amber-800 disabled:opacity-50" disabled={reject.isPending} type="submit">{reject.isPending ? "Mengirim..." : "Tolak dan minta hitung ulang"}</button></div></form></Dialog>}
  </Dialog>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-600">{label}</p><p className="mt-1 font-semibold text-ink-950">{value}</p></div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 py-2"><p className="text-xs text-slate-600">{label}</p><p className="mt-1 font-semibold tabular-nums text-ink-950">{value}</p></div>;
}
