import { type FormEvent, useState } from "react";
import { useWarehouseScope } from "@/hooks/useWarehouseScope";
import { mapApiFormError } from "@/lib/errors";
import { useOpnameReferences } from "../api";
import { OPNAME_BUTTON_CLASS, OPNAME_FIELD_CLASS } from "../constants";
import type {
  StockOpname,
  StockOpnameCreatePayload,
  StockOpnameUpdatePayload,
} from "../types";
import { OpnameDialog } from "./OpnameShared";
import { useEscapeClose } from "../useEscapeClose";

export function OpnameFormDialog({
  initialOpname,
  references,
  isSubmitting,
  onClose,
  onSubmit,
  onUpdate,
}: {
  initialOpname: StockOpname | null;
  references?: Awaited<ReturnType<typeof useOpnameReferences>>["data"];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: StockOpnameCreatePayload) => Promise<void>;
  onUpdate: (id: number, payload: StockOpnameUpdatePayload) => Promise<void>;
}) {
  const { activeWarehouseId, canAccessAllWarehouses, filterWarehouseChoices } = useWarehouseScope();
  const scopedWarehouses = filterWarehouseChoices(references?.warehouses ?? []);
  const [warehouse, setWarehouse] = useState(
    initialOpname
      ? String(initialOpname.warehouse_id)
      : activeWarehouseId
        ? String(activeWarehouseId)
        : "",
  );
  const [location, setLocation] = useState(
    initialOpname?.location_id ? String(initialOpname.location_id) : "",
  );
  const [notes, setNotes] = useState(initialOpname?.notes ?? "");
  const [error, setError] = useState("");
  const locations =
    references?.locations.filter((entry) => entry.warehouse_id === Number(warehouse)) ?? [];
  useEscapeClose(onClose, isSubmitting);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!warehouse) {
      setError("Gudang wajib dipilih.");
      return;
    }
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

  return (
    <OpnameDialog
      onClose={onClose}
      title={initialOpname ? "Ubah draft stock opname" : "Buat sesi stock opname"}
    >
      <form className="space-y-4" noValidate onSubmit={(event) => void submit(event)}>
        <label className="block text-sm font-semibold text-ink-950">
          Gudang
          <select
            className={OPNAME_FIELD_CLASS}
            disabled={
              Boolean(initialOpname) || (!canAccessAllWarehouses && scopedWarehouses.length <= 1)
            }
            onChange={(event) => {
              setWarehouse(event.target.value);
              setLocation("");
            }}
            required
            value={warehouse}
          >
            <option value="">Pilih gudang</option>
            {scopedWarehouses.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.code} · {entry.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-ink-950">
          Lokasi (opsional)
          <select
            className={OPNAME_FIELD_CLASS}
            onChange={(event) => setLocation(event.target.value)}
            value={location}
          >
            <option value="">Seluruh lokasi aktif</option>
            {locations.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.code} · {entry.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-ink-950">
          Catatan
          <input
            className={OPNAME_FIELD_CLASS}
            maxLength={1000}
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </label>

        {references?.warehouses.length === 0 && (
          <p className="text-sm text-amber-800" role="status">
            Tidak ada gudang aktif yang tersedia.
          </p>
        )}
        {error && (
          <p className="rounded-[var(--radius-md)] bg-red-50 p-3 text-sm font-semibold text-red-900" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-line-200 pt-4">
          <button className={OPNAME_BUTTON_CLASS} onClick={onClose} type="button">
            Batal
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 font-semibold text-surface-0 hover:bg-teal-700 disabled:opacity-50"
            disabled={isSubmitting || !references?.warehouses.length}
            type="submit"
          >
            {isSubmitting ? "Menyimpan..." : initialOpname ? "Simpan perubahan" : "Simpan draft"}
          </button>
        </div>
      </form>
    </OpnameDialog>
  );
}
