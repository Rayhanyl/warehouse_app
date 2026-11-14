import { type FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { BarcodeScanBar } from "@/components/ui/BarcodeScannerModal";
import { usePurchaseOrder } from "@/features/purchase-orders/api";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useWarehouseScope } from "@/hooks/useWarehouseScope";
import { mapApiFormError } from "@/lib/errors";
import { validateDecimalQtyInput } from "@/lib/validation";
import { useGoodsReceiptReferences } from "../api";
import type { GoodsReceiptCreatePayload } from "../types";

export function GoodsReceiptFormDialog({
  references,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  references?: Awaited<ReturnType<typeof useGoodsReceiptReferences>>["data"];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: GoodsReceiptCreatePayload) => Promise<void>;
}) {
  const { activeWarehouseId, isWarehouseAllowed } = useWarehouseScope();
  const [poId, setPoId] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [locations, setLocations] = useState<Record<number, string>>({});
  const [lineErrors, setLineErrors] = useState<Record<number, string>>({});
  const [error, setError] = useState("");

  const scopedPurchaseOrders = (references?.purchaseOrders ?? []).filter(
    (po) =>
      isWarehouseAllowed(po.warehouse_id) &&
      (activeWarehouseId === null || po.warehouse_id === activeWarehouseId),
  );
  const poDetail = usePurchaseOrder(poId ? Number(poId) : null);
  const purchaseOrderSummary = scopedPurchaseOrders.find((po) => po.id === Number(poId));
  const purchaseOrder = purchaseOrderSummary
    ? { ...purchaseOrderSummary, lines: poDetail.data?.lines ?? purchaseOrderSummary.lines }
    : undefined;
  const isMobile = useIsMobile();
  const availableLocations =
    references?.locations.filter(
      (location) => location.warehouse_id === purchaseOrder?.warehouse_id && location.is_active,
    ) ?? [];

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
      toast.error(
        `Barang dengan barcode / SKU "${scannedCode}" tidak ditemukan pada PO ${purchaseOrder.po_number}.`,
      );
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
      const locationId = Number(rawLoc);
      if (!rawQty && !rawLoc) continue;
      if (!rawQty) {
        nextLineErrors[line.id] = "Isi kuantitas terima atau kosongkan pilihan lokasi.";
        continue;
      }
      const remaining = Math.max(0, Number(line.qty_ordered) - Number(line.qty_received));
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
        notes: null,
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
      const mapped = mapApiFormError(submitErr, "Draft penerimaan belum dapat dibuat.");
      setError(mapped.formMessage);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-2 sm:p-4"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="gr-form-title"
        aria-modal="true"
        className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)] sm:max-h-[92vh]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line-200 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-ink-950" id="gr-form-title">
              Buat penerimaan barang
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              Simpan sebagai draft sebelum saldo stok berubah.
            </p>
          </div>
          <button
            aria-label="Tutup form penerimaan"
            className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] text-slate-700 hover:bg-canvas-50"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {!references ? (
          <p className="p-8 text-sm text-slate-700" role="status">
            Memuat purchase order dan lokasi...
          </p>
        ) : (
          <form
            className="flex min-h-0 flex-1 flex-col"
            noValidate
            onSubmit={(event) => void submit(event)}
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
              <label className="block text-sm font-semibold text-ink-950">
                Purchase order
                <select
                  className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  onChange={(event) => {
                    setPoId(event.target.value);
                    setQuantities({});
                    setLocations({});
                    setLineErrors({});
                    setError("");
                  }}
                  value={poId}
                >
                  <option value="">Pilih purchase order</option>
                  {scopedPurchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} · {po.supplier_name} · {po.warehouse_name}
                      {po.status === "PARTIALLY_RECEIVED" ? " (Diterima sebagian)" : ""}
                    </option>
                  ))}
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
                        const remaining = Number(line.qty_ordered) - Number(line.qty_received);
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
                                  {line.item_barcode ? ` · BC: ${line.item_barcode}` : ""}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-canvas-100 px-2.5 py-1 text-xs font-semibold text-slate-700 tabular-nums">
                                Sisa: {remaining}
                              </span>
                            </div>
                            {rowError && (
                              <p className="text-xs font-medium text-red-700" role="alert">
                                {rowError}
                              </p>
                            )}
                            <div className="grid gap-3">
                              <label className="block text-xs font-semibold text-slate-700">
                                Kuantitas terima
                                <input
                                  aria-invalid={Boolean(rowError)}
                                  aria-label={`Kuantitas terima ${line.item_sku}`}
                                  className={`mt-1.5 h-11 w-full rounded-[var(--radius-md)] border px-3 text-sm tabular-nums focus:outline-none focus:ring-2 ${
                                    rowError
                                      ? "border-red-600 focus:ring-red-600/20"
                                      : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
                                  }`}
                                  min="0"
                                  onChange={(event) => {
                                    setQuantities((current) => ({
                                      ...current,
                                      [line.id]: event.target.value,
                                    }));
                                    setLineErrors((current) => ({ ...current, [line.id]: "" }));
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
                                  className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                  onChange={(event) => {
                                    setLocations((current) => ({
                                      ...current,
                                      [line.id]: event.target.value,
                                    }));
                                    setLineErrors((current) => ({ ...current, [line.id]: "" }));
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
                            const remaining =
                              Number(line.qty_ordered) - Number(line.qty_received);
                            const rowError = lineErrors[line.id];
                            return (
                              <tr key={line.id}>
                                <td className="px-3 py-3">
                                  <p className="font-semibold text-ink-950">
                                    {line.item_sku} · {line.item_name}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {line.uom_code}
                                    {line.item_barcode ? ` · BC: ${line.item_barcode}` : ""}
                                  </p>
                                  {rowError && (
                                    <p className="mt-1 text-xs font-medium text-red-700" role="alert">
                                      {rowError}
                                    </p>
                                  )}
                                </td>
                                <td className="px-3 py-3 tabular-nums">{remaining}</td>
                                <td className="px-3 py-3">
                                  <input
                                    aria-invalid={Boolean(rowError)}
                                    aria-label={`Kuantitas terima ${line.item_sku}`}
                                    className={`h-11 w-36 rounded-[var(--radius-md)] border px-3 text-sm tabular-nums focus:outline-none focus:ring-2 ${
                                      rowError
                                        ? "border-red-600 focus:ring-red-600/20"
                                        : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
                                    }`}
                                    min="0"
                                    onChange={(event) => {
                                      setQuantities((current) => ({
                                        ...current,
                                        [line.id]: event.target.value,
                                      }));
                                      setLineErrors((current) => ({ ...current, [line.id]: "" }));
                                    }}
                                    step={line.allow_decimal ? "0.0001" : "1"}
                                    type="number"
                                    value={quantities[line.id] ?? ""}
                                  />
                                </td>
                                <td className="px-3 py-3">
                                  <select
                                    aria-label={`Lokasi terima ${line.item_sku}`}
                                    className="h-11 min-w-52 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                    onChange={(event) => {
                                      setLocations((current) => ({
                                        ...current,
                                        [line.id]: event.target.value,
                                      }));
                                      setLineErrors((current) => ({ ...current, [line.id]: "" }));
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
                {isSubmitting ? "Menyimpan..." : "Simpan draft"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
