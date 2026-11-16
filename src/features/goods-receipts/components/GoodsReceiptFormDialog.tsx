import { type FormEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { BarcodeScanBar } from "@/components/ui/BarcodeScannerModal";
import { usePurchaseOrder } from "@/features/purchase-orders/api";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useWarehouseScope } from "@/hooks/useWarehouseScope";
import { mapApiFormError } from "@/lib/errors";
import { validateDecimalQtyInput } from "@/lib/validation";
import { useGoodsReceiptReferences } from "../api";
import type { GoodsReceipt, GoodsReceiptCreatePayload } from "../types";

export interface GoodsReceiptFormProps {
  references?: Awaited<ReturnType<typeof useGoodsReceiptReferences>>["data"];
  initialReceipt?: GoodsReceipt | null;
  isSubmitting: boolean;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (payload: GoodsReceiptCreatePayload) => Promise<void>;
}

export function GoodsReceiptForm({
  references,
  initialReceipt = null,
  isSubmitting,
  submitLabel,
  onClose,
  onSubmit,
}: GoodsReceiptFormProps) {
  const [searchParams] = useSearchParams();
  const { activeWarehouseId, isWarehouseAllowed } = useWarehouseScope();
  const [poId, setPoId] = useState(
    () =>
      (initialReceipt ? String(initialReceipt.po_id) : searchParams.get("po_id")) ??
      "",
  );
  const [receivedDate, setReceivedDate] = useState(
    () => initialReceipt?.received_date ?? new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(() => initialReceipt?.notes ?? "");
  const [quantities, setQuantities] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      (initialReceipt?.lines ?? []).map((ln) => [
        ln.po_line_id,
        String(Number(ln.qty_received)),
      ]),
    ),
  );
  const [locations, setLocations] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      (initialReceipt?.lines ?? []).map((ln) => [
        ln.po_line_id,
        String(ln.location_id),
      ]),
    ),
  );
  const [lineNotes, setLineNotes] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      (initialReceipt?.lines ?? []).map((ln) => [ln.po_line_id, ln.notes ?? ""]),
    ),
  );
  const [lineErrors, setLineErrors] = useState<Record<number, string>>({});
  const [error, setError] = useState("");

  const scopedPurchaseOrders = (references?.purchaseOrders ?? []).filter(
    (po) =>
      isWarehouseAllowed(po.warehouse_id) &&
      (activeWarehouseId === null || po.warehouse_id === activeWarehouseId),
  );
  const poDetail = usePurchaseOrder(poId ? Number(poId) : null);
  const purchaseOrderSummary =
    scopedPurchaseOrders.find((po) => po.id === Number(poId)) ?? poDetail.data;
  const purchaseOrder = purchaseOrderSummary
    ? {
        ...purchaseOrderSummary,
        lines: poDetail.data?.lines ?? purchaseOrderSummary.lines,
      }
    : undefined;
  const isMobile = useIsMobile();
  const availableLocations =
    references?.locations.filter(
      (location) =>
        location.warehouse_id === purchaseOrder?.warehouse_id && location.is_active,
    ) ?? [];

  function handleScanPoLine(scannedCode: string) {
    if (!purchaseOrder) return;
    const normalized = scannedCode.trim().toLowerCase();
    const matchedLine = (purchaseOrder.lines ?? []).find(
      (line) =>
        line.item_barcode?.toLowerCase() === normalized ||
        line.item_sku.toLowerCase() === normalized,
    );
    if (!matchedLine) {
      toast.error(
        `Barang dengan barcode / SKU "${scannedCode}" tidak ditemukan pada PO ${purchaseOrder.po_number}.`,
      );
      return;
    }

    const remaining = Math.max(
      0,
      Number(matchedLine.qty_ordered) -
        Number(matchedLine.qty_received) -
        Number(matchedLine.qty_closed ?? 0),
    );
    if (matchedLine.line_status === "CLOSED" || remaining <= 0) {
      toast.error(
        `Baris ${matchedLine.item_sku} sudah ditutup / selesai diterima pada PO ${purchaseOrder.po_number}.`,
      );
      return;
    }
    const currentQty = Number(quantities[matchedLine.id] || 0);
    if (currentQty >= remaining) {
      toast.error(
        `Kuantitas ${matchedLine.item_sku} sudah mencapai sisa PO (${remaining}).`,
      );
      return;
    }
    const nextQty = Math.min(remaining, currentQty + 1);
    setQuantities((current) => ({ ...current, [matchedLine.id]: String(nextQty) }));
    setLineErrors((current) => ({ ...current, [matchedLine.id]: "" }));
    if (!locations[matchedLine.id] && availableLocations.length > 0) {
      setLocations((current) => ({
        ...current,
        [matchedLine.id]: String(availableLocations[0].id),
      }));
    }
    toast.success(`${matchedLine.item_sku} · ${matchedLine.item_name} (+1 -> ${nextQty})`);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!purchaseOrder || !receivedDate) {
      setError("Purchase order dan tanggal penerimaan wajib diisi.");
      return;
    }
    if (receivedDate < purchaseOrder.order_date) {
      setError("Tanggal penerimaan tidak boleh lebih awal dari tanggal pesanan.");
      return;
    }

    const nextLineErrors: Record<number, string> = {};
    const lines: GoodsReceiptCreatePayload["lines"] = [];

    for (const line of purchaseOrder.lines ?? []) {
      const rawQty = (quantities[line.id] ?? "").replace(",", ".").trim();
      const rawLoc = locations[line.id] ?? "";
      const rawNote = (lineNotes[line.id] ?? "").trim();
      const locationId = Number(rawLoc);
      if (!rawQty && !rawLoc) continue;
      if (!rawQty) {
        nextLineErrors[line.id] = "Isi kuantitas terima atau kosongkan pilihan lokasi.";
        continue;
      }
      const remaining = Math.max(
        0,
        Number(line.qty_ordered) -
          Number(line.qty_received) -
          Number(line.qty_closed ?? 0),
      );
      if (line.line_status === "CLOSED" || remaining <= 0) {
        nextLineErrors[line.id] = `Baris ${line.item_sku} sudah ditutup / tidak memiliki sisa PO.`;
        continue;
      }
      const qtyErr = validateDecimalQtyInput(rawQty, {
        label: `Kuantitas ${line.item_sku}`,
        allowZero: false,
        allowDecimal: line.allow_decimal !== false,
        maxValue: remaining,
      });
      if (qtyErr) {
        nextLineErrors[line.id] = qtyErr;
        continue;
      }
      if (!(locationId > 0)) {
        nextLineErrors[line.id] = `Pilih lokasi penyimpanan untuk ${line.item_sku}.`;
        continue;
      }
      lines.push({
        po_line_id: line.id,
        location_id: locationId,
        qty_received: rawQty,
        notes: rawNote || null,
      });
    }

    const firstLineError = Object.values(nextLineErrors)[0];
    if (firstLineError) {
      setLineErrors(nextLineErrors);
      setError(firstLineError);
      return;
    }
    if (lines.length === 0) {
      setLineErrors({});
      setError("Isi kuantitas dan lokasi pada minimal satu baris barang.");
      return;
    }

    setLineErrors({});
    setError("");
    try {
      await onSubmit({
        po_id: purchaseOrder.id,
        received_date: receivedDate,
        notes: notes.trim() || null,
        lines,
      });
    } catch (submitErr) {
      const mapped = mapApiFormError(
        submitErr,
        initialReceipt
          ? "Perubahan draft penerimaan belum dapat disimpan."
          : "Draft penerimaan belum dapat dibuat.",
      );
      setError(mapped.formMessage);
    }
  }

  return (
    <section
      aria-label={initialReceipt ? "Form ubah draft penerimaan barang" : "Form buat penerimaan barang"}
      className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]"
    >
      {!references ? (
        <p className="p-8 text-sm text-slate-700" role="status">
          Memuat purchase order dan lokasi...
        </p>
      ) : (
        <form
          className="flex flex-col"
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          <div className="space-y-5 p-4 sm:p-6">
            <label className="block text-sm font-semibold text-ink-950">
              Purchase order
              <select
                className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-canvas-100 disabled:text-slate-600"
                disabled={Boolean(initialReceipt)}
                onChange={(event) => {
                  setPoId(event.target.value);
                  setQuantities({});
                  setLocations({});
                  setLineNotes({});
                  setLineErrors({});
                  setError("");
                }}
                value={poId}
              >
                <option value="">Pilih purchase order</option>
                {scopedPurchaseOrders.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.po_number} · {po.supplier_name} · {po.warehouse_name}
                    {po.status === "PARTIALLY_RECEIVED"
                      ? " (Diterima sebagian)"
                      : ""}
                  </option>
                ))}
                {initialReceipt &&
                  !scopedPurchaseOrders.some((po) => po.id === initialReceipt.po_id) && (
                    <option value={initialReceipt.po_id}>
                      {initialReceipt.po_number} · {initialReceipt.supplier_name} ·{" "}
                      {initialReceipt.warehouse_name}
                    </option>
                  )}
              </select>
            </label>

            {purchaseOrder && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-ink-950">
                    Tanggal penerimaan
                    <input
                      className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                      onChange={(event) => setReceivedDate(event.target.value)}
                      type="date"
                      value={receivedDate}
                    />
                  </label>
                  <label className="text-sm font-semibold text-ink-950">
                    Catatan
                    <input
                      className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                      maxLength={1000}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Opsional"
                      value={notes}
                    />
                  </label>
                </div>

                <BarcodeScanBar
                  label="Scan Barcode / SKU Barang PO (+1 Kuantitas Terima)"
                  onScan={handleScanPoLine}
                  placeholder="Scan atau ketik Barcode / SKU barang pada PO ini lalu Enter..."
                />

                {isMobile ? (
                  <div className="space-y-3">
                    {(purchaseOrder.lines ?? []).map((line) => {
                      const remaining = Math.max(
                        0,
                        Number(line.qty_ordered) -
                          Number(line.qty_received) -
                          Number(line.qty_closed ?? 0),
                      );
                      const isSettled =
                        line.line_status === "CLOSED" || remaining <= 0;
                      const rowError = lineErrors[line.id];
                      return (
                        <div
                          className="space-y-3 rounded-[var(--radius-md)] border border-line-200 p-4"
                          key={line.id}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-ink-950">
                                {line.item_sku} · {line.item_name}
                              </p>
                              <p className="text-xs text-slate-600">
                                {line.uom_code}
                                {line.item_barcode
                                  ? ` · BC: ${line.item_barcode}`
                                  : ""}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
                                isSettled
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-canvas-100 text-slate-700"
                              }`}
                            >
                              {line.line_status === "CLOSED"
                                ? "Ditutup"
                                : `Sisa: ${remaining}`}
                            </span>
                          </div>
                          {rowError && (
                            <p
                              className="text-xs font-medium text-red-700"
                              role="alert"
                            >
                              {rowError}
                            </p>
                          )}
                          <div className="grid gap-3">
                            <label className="block text-xs font-semibold text-slate-700">
                              Kuantitas terima
                              <input
                                aria-invalid={Boolean(rowError)}
                                aria-label={`Kuantitas terima ${line.item_sku}`}
                                className={`mt-1.5 h-11 w-full rounded-[var(--radius-md)] border px-3 text-sm tabular-nums focus:outline-none focus:ring-2 disabled:bg-canvas-100 disabled:text-slate-500 ${
                                  rowError
                                    ? "border-red-600 focus:ring-red-600/20"
                                    : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
                                }`}
                                disabled={isSettled}
                                min="0"
                                onChange={(event) => {
                                  setQuantities((current) => ({
                                    ...current,
                                    [line.id]: event.target.value,
                                  }));
                                  setLineErrors((current) => ({
                                    ...current,
                                    [line.id]: "",
                                  }));
                                }}
                                step={line.allow_decimal ? "0.0001" : "1"}
                                type="number"
                                value={quantities[line.id] ?? ""}
                              />
                            </label>
                            <label className="block text-xs font-semibold text-slate-700">
                              Lokasi penyimpanan
                              <select
                                aria-label={`Lokasi terima ${line.item_sku}`}
                                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-canvas-100 disabled:text-slate-500"
                                disabled={isSettled}
                                onChange={(event) => {
                                  setLocations((current) => ({
                                    ...current,
                                    [line.id]: event.target.value,
                                  }));
                                  setLineErrors((current) => ({
                                    ...current,
                                    [line.id]: "",
                                  }));
                                }}
                                value={locations[line.id] ?? ""}
                              >
                                <option value="">Pilih lokasi</option>
                                {availableLocations.map((location) => (
                                  <option key={location.id} value={location.id}>
                                    {location.code} · {location.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-200">
                    <table className="min-w-[720px] w-full text-left text-sm">
                      <caption className="sr-only">
                        Baris barang purchase order {purchaseOrder.po_number}
                      </caption>
                      <thead className="bg-canvas-50 text-xs text-slate-700">
                        <tr>
                          <th className="px-3 py-3">Barang</th>
                          <th className="px-3 py-3">Sisa PO</th>
                          <th className="px-3 py-3">Kuantitas terima</th>
                          <th className="px-3 py-3">Lokasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-200">
                        {(purchaseOrder.lines ?? []).map((line) => {
                          const remaining = Math.max(
                            0,
                            Number(line.qty_ordered) -
                              Number(line.qty_received) -
                              Number(line.qty_closed ?? 0),
                          );
                          const isSettled =
                            line.line_status === "CLOSED" || remaining <= 0;
                          const rowError = lineErrors[line.id];
                          return (
                            <tr
                              className={
                                isSettled ? "bg-canvas-50/70 opacity-75" : ""
                              }
                              key={line.id}
                            >
                              <td className="px-3 py-3">
                                <p className="font-semibold text-ink-950">
                                  {line.item_sku} · {line.item_name}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {line.uom_code}
                                  {line.item_barcode
                                    ? ` · BC: ${line.item_barcode}`
                                    : ""}
                                </p>
                                {rowError && (
                                  <p
                                    className="mt-1 text-xs font-medium text-red-700"
                                    role="alert"
                                  >
                                    {rowError}
                                  </p>
                                )}
                              </td>
                              <td className="px-3 py-3 tabular-nums">
                                {line.line_status === "CLOSED" ? (
                                  <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                    Ditutup (0)
                                  </span>
                                ) : (
                                  remaining
                                )}
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  aria-invalid={Boolean(rowError)}
                                  aria-label={`Kuantitas terima ${line.item_sku}`}
                                  className={`h-11 w-36 rounded-[var(--radius-md)] border px-3 text-sm tabular-nums focus:outline-none focus:ring-2 disabled:bg-canvas-100 disabled:text-slate-500 ${
                                    rowError
                                      ? "border-red-600 focus:ring-red-600/20"
                                      : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
                                  }`}
                                  disabled={isSettled}
                                  min="0"
                                  onChange={(event) => {
                                    setQuantities((current) => ({
                                      ...current,
                                      [line.id]: event.target.value,
                                    }));
                                    setLineErrors((current) => ({
                                      ...current,
                                      [line.id]: "",
                                    }));
                                  }}
                                  step={line.allow_decimal ? "0.0001" : "1"}
                                  type="number"
                                  value={quantities[line.id] ?? ""}
                                />
                              </td>
                              <td className="px-3 py-3">
                                <select
                                  aria-label={`Lokasi terima ${line.item_sku}`}
                                  className="h-11 min-w-52 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-canvas-100 disabled:text-slate-500"
                                  disabled={isSettled}
                                  onChange={(event) => {
                                    setLocations((current) => ({
                                      ...current,
                                      [line.id]: event.target.value,
                                    }));
                                    setLineErrors((current) => ({
                                      ...current,
                                      [line.id]: "",
                                    }));
                                  }}
                                  value={locations[line.id] ?? ""}
                                >
                                  <option value="">Pilih lokasi</option>
                                  {availableLocations.map((location) => (
                                    <option key={location.id} value={location.id}>
                                      {location.code} · {location.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {error && (
              <p
                className="rounded-[var(--radius-md)] bg-red-50 p-3 text-sm font-semibold text-red-900"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line-200 bg-canvas-50/50 px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700 disabled:opacity-50"
              disabled={isSubmitting || !purchaseOrder}
              type="submit"
            >
              {isSubmitting
                ? "Menyimpan..."
                : submitLabel ?? (initialReceipt ? "Simpan perubahan" : "Simpan draft")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export const GoodsReceiptFormDialog = GoodsReceiptForm;
