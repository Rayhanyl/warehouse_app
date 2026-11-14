import { type FormEvent, useMemo, useState } from "react";
import Decimal from "decimal.js";
import { Edit3, Plus } from "lucide-react";
import { toast } from "sonner";
import { BarcodeScanBar } from "@/components/ui/BarcodeScannerModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useIsMobile } from "@/hooks/useIsMobile";
import { validateDecimalQtyInput } from "@/lib/validation";
import { mapOpnameError, useOpnameMutation, useOpnameReferences } from "../api";
import {
  formatOpnameDateTime,
  OPNAME_BUTTON_CLASS,
  OPNAME_STATUS_LABELS,
} from "../constants";
import type { StockOpname, StockOpnameCountLinePayload } from "../types";
import {
  OpnameCountLinesView,
  type CountDraft,
  type FoundDraft,
} from "./OpnameCountLinesView";
import { OpnameDialog } from "./OpnameShared";
import { useEscapeClose } from "../useEscapeClose";

type PendingAction = "start" | "submit" | "approve" | "cancel";

function isValidOpnameQty(value: string, allowDecimal: boolean) {
  return validateDecimalQtyInput(value, { allowZero: true, allowDecimal }) === null;
}

/**
 * Detail and counting modal for a stock opname session covering start, count, submit, approve, reject, and cancel flows.
 */
export function OpnameDetailModal({
  opname,
  isLoading,
  isError,
  can,
  onRetry,
  onEdit,
  onClose,
}: {
  opname?: StockOpname;
  isLoading: boolean;
  isError: boolean;
  can: (permission: string) => boolean;
  onRetry: () => void;
  onEdit: (opname: StockOpname) => void;
  onClose: () => void;
}) {
  const start = useOpnameMutation("start");
  const count = useOpnameMutation("count");
  const submit = useOpnameMutation("submit");
  const approve = useOpnameMutation("approve");
  const reject = useOpnameMutation("reject");
  const cancel = useOpnameMutation("cancel");
  const refs = useOpnameReferences();
  const isMobile = useIsMobile();

  const [counts, setCounts] = useState<Record<number, CountDraft>>({});
  const [found, setFound] = useState<FoundDraft[]>([]);
  const [rejectionOpen, setRejectionOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [confirmation, setConfirmation] = useState<{
    action: PendingAction;
    title: string;
    message: string;
  } | null>(null);

  const busy =
    start.isPending ||
    count.isPending ||
    submit.isPending ||
    approve.isPending ||
    reject.isPending ||
    cancel.isPending;
  useEscapeClose(onClose, busy);

  const locations = useMemo(
    () => refs.data?.locations.filter((entry) => entry.warehouse_id === opname?.warehouse_id) ?? [],
    [refs.data?.locations, opname?.warehouse_id],
  );
  const opnameLines = opname?.lines ?? [];
  const reportedLines = opnameLines.filter((line) => {
    const quantity = counts[line.id]?.qty || line.qty_physical || "";
    return isValidOpnameQty(quantity, line.allow_decimal);
  }).length;
  const reportedFound = found.filter((line) => {
    const item = refs.data?.items.find((entry) => entry.id === Number(line.item_id));
    return Boolean(item && line.location_id && isValidOpnameQty(line.qty, item.allow_decimal));
  }).length;
  const reportLineCount = opnameLines.length + found.length;
  const reportedCount = reportedLines + reportedFound;
  const uncounted = reportLineCount - reportedCount;
  const varianceCount =
    opnameLines.filter((line) => {
      const quantity = counts[line.id]?.qty || line.qty_physical;
      return (
        quantity !== null &&
        quantity !== undefined &&
        quantity !== "" &&
        isValidOpnameQty(quantity, line.allow_decimal) &&
        !new Decimal(quantity).minus(line.qty_system).isZero()
      );
    }).length +
    found.filter(
      (line) =>
        isValidOpnameQty(
          line.qty,
          Boolean(refs.data?.items.find((item) => item.id === Number(line.item_id))?.allow_decimal),
        ) && new Decimal(line.qty).greaterThan(0),
    ).length;
  const hasPendingCount = Object.keys(counts).length > 0 || found.length > 0;
  const hasSavableCount =
    opnameLines.some(
      (line) =>
        counts[line.id] &&
        isValidOpnameQty(counts[line.id].qty || line.qty_physical || "", line.allow_decimal),
    ) ||
    found.some((line) => {
      const item = refs.data?.items.find((entry) => entry.id === Number(line.item_id));
      return Boolean(item && line.location_id && isValidOpnameQty(line.qty, item.allow_decimal));
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
      const formatted =
        matchedLine.allow_decimal && !nextQty.isInteger()
          ? nextQty.toFixed(4)
          : nextQty.toFixed(0);
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
        item.barcode?.toLowerCase() === normalized || item.sku.toLowerCase() === normalized,
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
            idx === existingIdx ? { ...entry, qty: String(Number(entry.qty || 0) + 1) } : entry,
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
      if (!isValidOpnameQty(qty, line.allow_decimal)) {
        toast.error(`Jumlah untuk ${line.item_sku} belum valid.`);
        return;
      }
      lines.push({ line_id: line.id, qty_physical: qty, notes: draft?.notes ?? line.notes });
    }

    const countedItems = new Set(
      (opname.lines ?? []).map((line) => `${line.location_id}:${line.item_id}`),
    );
    for (const line of found) {
      const item = refs.data?.items.find((entry) => entry.id === Number(line.item_id));
      if (
        !line.item_id ||
        !line.location_id ||
        !item ||
        !isValidOpnameQty(line.qty, Boolean(item.allow_decimal))
      ) {
        toast.error("Lengkapi lokasi, barang, dan jumlah barang temuan dengan format yang valid.");
        return;
      }
      if (line.notes.length > 500) {
        toast.error("Catatan per baris maksimal 500 karakter.");
        return;
      }
      const itemKey = `${line.location_id}:${line.item_id}`;
      if (countedItems.has(itemKey)) {
        toast.error(`${item.sku} sudah tercatat pada lokasi tersebut.`);
        return;
      }
      countedItems.add(itemKey);
      lines.push({
        location_id: Number(line.location_id),
        item_id: Number(line.item_id),
        qty_physical: line.qty,
        notes: line.notes.trim() || null,
      });
    }

    if (lines.length === 0) {
      toast.error("Isi minimal satu hasil hitung.");
      return;
    }

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
    if (!reason || reason.length > 500) {
      setRejectionError("Alasan wajib diisi dan maksimal 500 karakter.");
      return;
    }
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

  return (
    <OpnameDialog onClose={onClose} title={opname?.opname_number ?? "Detail stock opname"} wide>
      {isLoading ? (
        <p className="p-4 text-sm text-slate-700" role="status">
          Memuat detail stock opname...
        </p>
      ) : isError || !opname ? (
        <div className="p-4">
          <p className="text-sm font-semibold text-red-900" role="alert">
            Detail stock opname belum dapat dimuat.
          </p>
          <button className={`${OPNAME_BUTTON_CLASS} mt-3`} onClick={onRetry} type="button">
            Coba lagi
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 border-b border-line-200 pb-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Gudang" value={`${opname.warehouse_code} · ${opname.warehouse_name}`} />
            <Info
              label="Cakupan"
              value={
                opname.location_name
                  ? `${opname.location_code} · ${opname.location_name}`
                  : "Seluruh lokasi aktif"
              }
            />
            <Info label="Status" value={OPNAME_STATUS_LABELS[opname.status]} />
            <Info label="Dibuat" value={formatOpnameDateTime(opname.created_at)} />
          </div>

          {opname.notes && <p className="mt-4 text-sm text-slate-700">Catatan sesi: {opname.notes}</p>}
          {opname.rejection_reason && (
            <p className="mt-4 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <strong>Alasan penolakan:</strong> {opname.rejection_reason}
            </p>
          )}

          {opname.status === "IN_PROGRESS" && can("opname:count") && (
            <section
              aria-labelledby="opname-count-title"
              className="mt-5 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/60 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-ink-950" id="opname-count-title">
                    Laporan hitung fisik
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700">
                    Masukkan jumlah yang ditemukan pada setiap lokasi. Simpan hasil hitung sebelum
                    mengajukan laporan.
                  </p>
                </div>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  onClick={() =>
                    setFound((current) => [
                      ...current,
                      {
                        location_id: opname.location_id ? String(opname.location_id) : "",
                        item_id: "",
                        qty: "",
                        notes: "",
                      },
                    ])
                  }
                  type="button"
                >
                  <Plus aria-hidden="true" size={16} />
                  Tambah barang temuan
                </button>
              </div>

              <div className="mt-4">
                <BarcodeScanBar
                  label="Scan Barcode / SKU Hitung Fisik (+1)"
                  onScan={handleScanOpnameItem}
                  placeholder="Scan atau ketik Barcode / SKU barang untuk menambah hasil fisik (+1)..."
                />
              </div>

              <div aria-live="polite" className="mt-4 grid gap-3 sm:grid-cols-3">
                <Summary label="Jumlah terisi" value={`${reportedCount} dari ${reportLineCount}`} />
                <Summary label="Baris dengan selisih" value={String(varianceCount)} />
                <Summary
                  label="Perubahan belum disimpan"
                  value={hasPendingCount ? "Ada" : "Tidak ada"}
                />
              </div>

              <div className="mt-4">
                <div
                  aria-label="Progres pengisian laporan"
                  aria-valuemax={Math.max(reportLineCount, 1)}
                  aria-valuemin={0}
                  aria-valuenow={reportedCount}
                  className="h-2 overflow-hidden rounded-full bg-line-200"
                  role="progressbar"
                >
                  <div
                    className="h-full rounded-full bg-teal-600 transition-[width] duration-150"
                    style={{
                      width: `${
                        reportLineCount === 0 ? 0 : (reportedCount / reportLineCount) * 100
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {reportLineCount === 0
                    ? "Snapshot tidak menemukan saldo stok. Tambahkan barang temuan untuk melanjutkan."
                    : uncounted > 0
                      ? `${uncounted} baris masih perlu diisi.`
                      : hasPendingCount
                        ? "Semua jumlah sudah diisi. Simpan perubahan sebelum mengajukan."
                        : "Semua jumlah sudah tersimpan dan siap diajukan."}
                </p>
              </div>
            </section>
          )}

          <OpnameCountLinesView
            canCount={can("opname:count")}
            counts={counts}
            found={found}
            isMobile={isMobile}
            items={refs.data?.items ?? []}
            locations={locations}
            opnameLines={opnameLines}
            opnameStatus={opname.status}
            setCounts={setCounts}
            setFound={setFound}
          />

          {opnameLines.length === 0 && found.length === 0 && (
            <p className="border-x border-line-200 p-5 text-sm text-slate-700">
              Sesi ini belum memiliki saldo snapshot. Gunakan tombol tambah barang temuan untuk
              mencatat stok awal di lokasi.
            </p>
          )}
          {opname.status === "IN_PROGRESS" && hasPendingCount && (
            <p className="mt-3 text-right text-sm text-slate-700">
              Simpan hasil hitung untuk memperbarui laporan dan membuka pengajuan.
            </p>
          )}

          <div className="sticky bottom-[-1rem] z-10 -mx-4 mt-5 flex flex-wrap justify-end gap-2 border-t border-line-200 bg-surface-0 px-4 py-3 sm:-mx-6 sm:px-6">
            {opname.status === "DRAFT" && can("opname:manage") && (
              <button className={OPNAME_BUTTON_CLASS} onClick={() => onEdit(opname)} type="button">
                <Edit3 aria-hidden="true" size={16} />
                Ubah draft
              </button>
            )}
            {opname.status === "DRAFT" && can("opname:manage") && (
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 font-semibold text-surface-0 hover:bg-teal-700"
                onClick={() =>
                  setConfirmation({
                    action: "start",
                    title: "Mulai stock opname?",
                    message: `Sesi ${opname.opname_number} akan mengambil snapshot saldo dan membekukan lokasi.`,
                  })
                }
                type="button"
              >
                Mulai opname
              </button>
            )}
            {opname.status === "IN_PROGRESS" && can("opname:count") && (
              <>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 font-semibold text-surface-0 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={busy || !hasPendingCount || !hasSavableCount}
                  onClick={() => void saveCounts()}
                  type="button"
                >
                  {count.isPending ? "Menyimpan..." : "Simpan laporan hitung"}
                </button>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-ink-950 px-4 font-semibold text-surface-0 hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={busy || uncounted > 0 || hasPendingCount || reportLineCount === 0}
                  onClick={() =>
                    setConfirmation({
                      action: "submit",
                      title: "Ajukan hasil hitung?",
                      message: `Hasil hitung ${opname.opname_number} akan diajukan kepada manajer.`,
                    })
                  }
                  type="button"
                >
                  Ajukan persetujuan
                </button>
              </>
            )}
            {opname.status === "WAITING_APPROVAL" && can("opname:approve") && (
              <>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 font-semibold text-surface-0 hover:bg-teal-700 disabled:opacity-50"
                  disabled={busy}
                  onClick={() =>
                    setConfirmation({
                      action: "approve",
                      title: "Setujui selisih?",
                      message: `Saldo stok ${opname.opname_number} akan disesuaikan dengan hasil hitung.`,
                    })
                  }
                  type="button"
                >
                  Setujui selisih
                </button>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-amber-700/40 px-4 font-semibold text-amber-800 hover:bg-amber-50"
                  disabled={busy}
                  onClick={() => {
                    setRejectionReason("");
                    setRejectionError("");
                    setRejectionOpen(true);
                  }}
                  type="button"
                >
                  Tolak hasil hitung
                </button>
              </>
            )}
            {(opname.status === "DRAFT" || opname.status === "IN_PROGRESS") &&
              can("opname:manage") && (
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-red-600/40 px-4 font-semibold text-red-700 hover:bg-red-50"
                  disabled={busy}
                  onClick={() =>
                    setConfirmation({
                      action: "cancel",
                      title: "Batalkan stock opname?",
                      message: `Sesi ${opname.opname_number} tidak dapat dilanjutkan setelah dibatalkan.`,
                    })
                  }
                  type="button"
                >
                  Batalkan
                </button>
              )}
            <button className={OPNAME_BUTTON_CLASS} onClick={onClose} type="button">
              Tutup
            </button>
          </div>
        </>
      )}

      {confirmation && (
        <ConfirmDialog
          confirmLabel={
            confirmation.action === "start"
              ? "Mulai opname"
              : confirmation.action === "submit"
                ? "Ajukan"
                : confirmation.action === "approve"
                  ? "Setujui"
                  : "Batalkan"
          }
          danger={confirmation.action === "cancel"}
          isPending={{ start, submit, approve, cancel }[confirmation.action].isPending}
          message={confirmation.message}
          onClose={() => setConfirmation(null)}
          onConfirm={() => {
            const selected = confirmation.action;
            setConfirmation(null);
            void run(selected);
          }}
          title={confirmation.title}
        />
      )}

      {rejectionOpen && (
        <OpnameDialog
          onClose={() => !reject.isPending && setRejectionOpen(false)}
          title="Tolak hasil hitung"
        >
          <form className="space-y-4" onSubmit={(event) => void rejectOpname(event)}>
            <p className="text-sm text-slate-700">
              Tuliskan alasan agar petugas tahu bagian mana yang perlu dihitung ulang.
            </p>
            <label className="block text-sm font-semibold text-ink-950">
              Alasan penolakan
              <textarea
                autoFocus
                className="mt-2 min-h-28 w-full rounded-[var(--radius-md)] border border-line-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                maxLength={500}
                onChange={(event) => setRejectionReason(event.target.value)}
                required
                value={rejectionReason}
              />
            </label>
            <p className="text-right text-xs text-slate-600">{rejectionReason.length}/500</p>
            {rejectionError && (
              <p className="text-sm text-red-800" role="alert">
                {rejectionError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-line-200 pt-4">
              <button
                className={OPNAME_BUTTON_CLASS}
                disabled={reject.isPending}
                onClick={() => setRejectionOpen(false)}
                type="button"
              >
                Kembali
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-amber-700 px-4 font-semibold text-surface-0 hover:bg-amber-800 disabled:opacity-50"
                disabled={reject.isPending}
                type="submit"
              >
                {reject.isPending ? "Mengirim..." : "Tolak dan minta hitung ulang"}
              </button>
            </div>
          </form>
        </OpnameDialog>
      )}
    </OpnameDialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-600">{label}</p>
      <p className="mt-1 font-semibold text-ink-950">{value}</p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 py-2">
      <p className="text-xs text-slate-600">{label}</p>
      <p className="mt-1 font-semibold tabular-nums text-ink-950">{value}</p>
    </div>
  );
}
