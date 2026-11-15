import { type FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
import { useWarehouseScope } from "@/hooks/useWarehouseScope";
import { mapApiFormError } from "@/lib/errors";
import { validateDecimalQtyInput } from "@/lib/validation";
import type {
  PurchaseOrder,
  PurchaseOrderCreatePayload,
  PurchaseOrderLinePayload,
  ReferenceOption,
} from "../types";

export function PurchaseOrderCreateForm({
  references,
  initialPurchaseOrder,
  submitLabel,
  isSubmitting,
  isReferencesLoading,
  isReferencesError,
  onRetryReferences,
  onClose,
  onSubmit,
}: {
  references?: {
    suppliers: ReferenceOption[];
    warehouses: ReferenceOption[];
    items: ReferenceOption[];
  };
  initialPurchaseOrder?: PurchaseOrder;
  submitLabel?: string;
  isSubmitting: boolean;
  isReferencesLoading: boolean;
  isReferencesError: boolean;
  onRetryReferences: () => void;
  onClose: () => void;
  onSubmit: (payload: PurchaseOrderCreatePayload) => Promise<void>;
}) {
  const { activeWarehouseId, filterWarehouseChoices } = useWarehouseScope();
  const scopedWarehouses = filterWarehouseChoices(references?.warehouses ?? []).filter(
    (item) => item.is_active,
  );
  const [supplierId, setSupplierId] = useState(
    initialPurchaseOrder ? String(initialPurchaseOrder.supplier_id) : "",
  );
  const [warehouseId, setWarehouseId] = useState(
    initialPurchaseOrder ? String(initialPurchaseOrder.warehouse_id) : "",
  );
  const [orderDate, setOrderDate] = useState(
    initialPurchaseOrder?.order_date ?? new Date().toISOString().slice(0, 10),
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    initialPurchaseOrder?.expected_delivery_date ?? "",
  );
  const [notes, setNotes] = useState(initialPurchaseOrder?.notes ?? "");
  const [lines, setLines] = useState<PurchaseOrderLinePayload[]>(
    initialPurchaseOrder?.lines?.map((line) => ({
      item_id: line.item_id,
      qty_ordered: line.qty_ordered,
      notes: line.notes ?? null,
    })) ?? [],
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const activeItems = references?.items.filter((item) => item.is_active) ?? [];
  const selectedItems = new Set(lines.map((line) => line.item_id));
  const availableItems = activeItems.filter((item) => !selectedItems.has(item.id));
  const effectiveWarehouseId =
    warehouseId ||
    (activeWarehouseId && scopedWarehouses.some((item) => item.id === activeWarehouseId)
      ? String(activeWarehouseId)
      : scopedWarehouses.length === 1
        ? String(scopedWarehouses[0].id)
        : "");

  function addLine() {
    const firstItem = availableItems[0];
    if (firstItem) {
      setLines((current) => [...current, { item_id: firstItem.id, qty_ordered: "", notes: null }]);
    }
  }

  function updateLine(index: number, patch: Partial<PurchaseOrderLinePayload>) {
    setFieldErrors((prev) => ({
      ...prev,
      [`lines.${index}.qty_ordered`]: "",
      [`lines.${index}.item_id`]: "",
    }));
    setLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFieldErrors: Record<string, string> = {};
    if (!supplierId) nextFieldErrors.supplier_id = "Pilih pemasok aktif.";
    if (!effectiveWarehouseId) nextFieldErrors.warehouse_id = "Pilih gudang tujuan aktif.";
    if (!orderDate) nextFieldErrors.order_date = "Tanggal pesanan wajib diisi.";
    if (expectedDeliveryDate && orderDate && expectedDeliveryDate < orderDate) {
      nextFieldErrors.expected_delivery_date =
        "Estimasi tanggal pengiriman tidak boleh lebih awal dari tanggal pesanan.";
    }

    const seenItems = new Set<number>();
    lines.forEach((line, index) => {
      const item = activeItems.find((option) => option.id === line.item_id);
      if (!item) {
        nextFieldErrors[`lines.${index}.item_id`] = "Pilih barang aktif.";
      } else if (seenItems.has(line.item_id)) {
        nextFieldErrors[`lines.${index}.item_id`] =
          "Barang tidak boleh dipilih lebih dari satu kali.";
      } else {
        seenItems.add(line.item_id);
      }

      const qtyError = validateDecimalQtyInput(line.qty_ordered, {
        label: `Kuantitas baris ${index + 1}`,
        allowZero: false,
        allowDecimal: item?.allow_decimal !== false,
      });
      if (qtyError) {
        nextFieldErrors[`lines.${index}.qty_ordered`] = qtyError;
      }
    });

    const firstError = Object.values(nextFieldErrors)[0];
    if (firstError) {
      setFieldErrors(nextFieldErrors);
      setError(firstError);
      return;
    }

    setFieldErrors({});
    setError("");
    try {
      await onSubmit({
        supplier_id: Number(supplierId),
        warehouse_id: Number(effectiveWarehouseId),
        order_date: orderDate,
        expected_delivery_date: expectedDeliveryDate.trim() || null,
        notes: notes.trim() || null,
        lines: lines.map((line) => ({
          ...line,
          qty_ordered: line.qty_ordered.trim(),
          notes: line.notes?.trim() || null,
        })),
      });
    } catch (submitErr) {
      const mapped = mapApiFormError(submitErr, "Draft purchase order belum dapat dibuat.");
      setFieldErrors(mapped.fieldErrors);
      setError(mapped.formMessage);
    }
  }

  return (
    <section
      aria-label="Formulir purchase order"
      className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)]"
    >
      {isReferencesLoading && (
        <p className="mt-4 rounded-[var(--radius-md)] bg-canvas-50 p-3 text-sm text-slate-700" role="status">
          Memuat daftar pemasok, gudang, dan barang...
        </p>
      )}
      {isReferencesError && (
        <p
          className="mt-4 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-900"
          role="alert"
        >
          Daftar pemasok, gudang, dan barang belum dapat dimuat.{" "}
          <button className="ml-1 font-semibold underline" onClick={onRetryReferences} type="button">
            Coba lagi
          </button>
        </p>
      )}
      {error && (
        <p
          className="mt-4 rounded-[var(--radius-md)] border border-red-600/30 bg-red-100 p-3 text-sm text-red-900"
          role="alert"
        >
          {error}
        </p>
      )}

      <form className="mt-5 space-y-5" noValidate onSubmit={(event) => void submit(event)}>
        <section
          aria-label="Informasi pesanan"
          className="grid gap-4 rounded-[var(--radius-md)] bg-canvas-50 p-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <SelectField
            error={fieldErrors.supplier_id}
            label="Pemasok"
            onChange={(val) => {
              setSupplierId(val);
              setFieldErrors((prev) => ({ ...prev, supplier_id: "" }));
            }}
            options={references?.suppliers ?? []}
            required
            value={supplierId}
          />
          <SelectField
            error={fieldErrors.warehouse_id}
            label="Gudang tujuan"
            onChange={(val) => {
              setWarehouseId(val);
              setFieldErrors((prev) => ({ ...prev, warehouse_id: "" }));
            }}
            options={scopedWarehouses}
            required
            value={effectiveWarehouseId}
          />
          <label className="text-sm font-semibold text-ink-950">
            Tanggal pesanan
            <input
              aria-invalid={Boolean(fieldErrors.order_date)}
              className={`mt-2 h-11 w-full rounded-[var(--radius-md)] border bg-surface-0 px-3 text-sm text-ink-950 focus:outline-none focus:ring-2 ${
                fieldErrors.order_date
                  ? "border-red-600 focus:ring-red-600/20"
                  : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
              }`}
              onChange={(event) => {
                setOrderDate(event.target.value);
                setFieldErrors((prev) => ({ ...prev, order_date: "" }));
              }}
              required
              type="date"
              value={orderDate}
            />
            {fieldErrors.order_date && (
              <span className="mt-1 block text-xs font-medium text-red-700" role="alert">
                {fieldErrors.order_date}
              </span>
            )}
          </label>
          <label className="text-sm font-semibold text-ink-950">
            Estimasi tanggal kirim <span className="font-normal text-slate-600">(opsional)</span>
            <input
              aria-invalid={Boolean(fieldErrors.expected_delivery_date)}
              className={`mt-2 h-11 w-full rounded-[var(--radius-md)] border bg-surface-0 px-3 text-sm text-ink-950 focus:outline-none focus:ring-2 ${
                fieldErrors.expected_delivery_date
                  ? "border-red-600 focus:ring-red-600/20"
                  : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
              }`}
              onChange={(event) => {
                setExpectedDeliveryDate(event.target.value);
                setFieldErrors((prev) => ({ ...prev, expected_delivery_date: "" }));
              }}
              type="date"
              value={expectedDeliveryDate}
            />
            {fieldErrors.expected_delivery_date && (
              <span className="mt-1 block text-xs font-medium text-red-700" role="alert">
                {fieldErrors.expected_delivery_date}
              </span>
            )}
          </label>
        </section>

        <section aria-labelledby="po-lines-title" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-ink-950" id="po-lines-title">
              Barang pesanan
            </h2>
            <span className="text-sm text-slate-600">{lines.length} baris</span>
          </div>

          {lines.length === 0 ? (
            <p className="rounded-[var(--radius-md)] border border-dashed border-line-500 p-5 text-sm text-slate-700">
              {activeItems.length > 0
                ? "Belum ada barang. Tambahkan baris untuk mengisi SKU dan kuantitas. Draft kosong tetap dapat disimpan dan dilengkapi sebelum diterbitkan."
                : "Belum ada barang aktif yang bisa ditambahkan. Draft kosong tetap dapat disimpan, tetapi perlu barang aktif sebelum diterbitkan."}
            </p>
          ) : (
            <div className="space-y-3">
              {lines.map((line, index) => {
                const selectedItem = activeItems.find((item) => item.id === line.item_id);
                const itemOptions = activeItems.filter(
                  (item) =>
                    item.id === line.item_id ||
                    !lines.some((other, otherIndex) => otherIndex !== index && other.item_id === item.id),
                );
                const lineItemError = fieldErrors[`lines.${index}.item_id`];
                const lineQtyError = fieldErrors[`lines.${index}.qty_ordered`];
                return (
                  <div
                    aria-label={`Barang pesanan ${index + 1}`}
                    className="rounded-[var(--radius-md)] border border-line-200 p-4"
                    key={`${line.item_id}-${index}`}
                    role="group"
                  >
                    <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.45fr)_auto]">
                      <label className="text-sm font-semibold text-ink-950">
                        Barang {index + 1}
                        <select
                          aria-invalid={Boolean(lineItemError)}
                          className={`mt-2 h-11 w-full rounded-[var(--radius-md)] border bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:outline-none focus:ring-2 ${
                            lineItemError
                              ? "border-red-600 focus:ring-red-600/20"
                              : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
                          }`}
                          onChange={(event) => updateLine(index, { item_id: Number(event.target.value) })}
                          value={line.item_id}
                        >
                          {itemOptions.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.sku ?? item.code} · {item.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm font-semibold text-ink-950">
                        Kuantitas
                        {selectedItem?.uom_code && (
                          <span className="font-normal text-slate-600"> ({selectedItem.uom_code})</span>
                        )}
                        <input
                          aria-invalid={Boolean(lineQtyError)}
                          aria-label={`Kuantitas baris ${index + 1}${
                            selectedItem?.uom_code ? ` dalam ${selectedItem.uom_code}` : ""
                          }`}
                          className={`mt-2 h-11 w-full rounded-[var(--radius-md)] border bg-surface-0 px-3 text-sm tabular-nums text-ink-950 focus:outline-none focus:ring-2 ${
                            lineQtyError
                              ? "border-red-600 focus:ring-red-600/20"
                              : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
                          }`}
                          inputMode="decimal"
                          maxLength={20}
                          onChange={(event) =>
                            updateLine(index, { qty_ordered: event.target.value.replace(",", ".") })
                          }
                          placeholder={selectedItem?.allow_decimal === false ? "Bilangan bulat" : "0.0000"}
                          type="text"
                          value={line.qty_ordered}
                        />
                      </label>

                      <button
                        aria-label={`Hapus barang pesanan ${index + 1}`}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-red-300 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-700 sm:w-11 sm:px-0"
                        onClick={() =>
                          setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))
                        }
                        type="button"
                      >
                        <X aria-hidden="true" size={17} />
                        <span className="sm:hidden">Hapus baris</span>
                      </button>
                    </div>
                    {(lineItemError || lineQtyError) && (
                      <p className="mt-2 text-xs font-medium text-red-700" role="alert">
                        {lineItemError || lineQtyError}
                      </p>
                    )}
                    {selectedItem && (
                      <p className="mt-2 text-xs text-slate-600">
                        {selectedItem.allow_decimal === false
                          ? "Gunakan bilangan bulat."
                          : "Kuantitas dapat memakai hingga empat angka desimal."}
                      </p>
                    )}
                    <label className="mt-3 block text-sm font-semibold text-ink-950">
                      Catatan barang <span className="font-normal text-slate-600">(opsional)</span>
                      <input
                        className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                        maxLength={500}
                        onChange={(event) => updateLine(index, { notes: event.target.value })}
                        placeholder="Instruksi khusus untuk barang ini"
                        value={line.notes ?? ""}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          )}

          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={availableItems.length === 0 || isReferencesLoading || isReferencesError}
            onClick={addLine}
            type="button"
          >
            <Plus aria-hidden="true" size={16} />
            Tambah barang
          </button>
          {lines.length > 0 && availableItems.length === 0 && (
            <p className="text-sm text-slate-700">Semua barang aktif sudah ditambahkan ke pesanan.</p>
          )}
        </section>

        <label className="block text-sm font-semibold text-ink-950">
          Catatan umum <span className="font-normal text-slate-600">(opsional)</span>
          <textarea
            className="mt-2 min-h-20 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 p-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            maxLength={1000}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Contoh: jadwal pengiriman atau instruksi untuk pemasok"
            value={notes}
          />
        </label>

        <div className="flex flex-col-reverse gap-2 border-t border-line-200 pt-4 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            Kembali ke daftar
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting || isReferencesLoading || isReferencesError}
            type="submit"
          >
            {isSubmitting
              ? "Menyimpan..."
              : (submitLabel ?? "Simpan draft PO")}
          </button>
        </div>
      </form>
    </section>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  required,
  error,
}: {
  label: string;
  value: string;
  options: ReferenceOption[];
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="text-sm font-semibold text-ink-950">
      {label}
      <select
        aria-invalid={Boolean(error)}
        className={`mt-2 h-11 w-full rounded-[var(--radius-md)] border px-3 text-sm font-normal text-ink-950 focus:outline-none focus:ring-2 ${
          error
            ? "border-red-600 focus:ring-red-600/20"
            : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
        }`}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      >
        <option value="">Pilih {label.toLocaleLowerCase()}</option>
        {options
          .filter((option) => option.is_active)
          .map((option) => (
            <option key={option.id} value={option.id}>
              {option.code} · {option.name}
            </option>
          ))}
      </select>
      {error && (
        <span className="mt-1 block text-xs font-medium text-red-700" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
