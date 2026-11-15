import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { mapApiFormError } from "@/lib/errors";
import { formatCurrencyIdr } from "@/lib/utils";
import { useApprovalSettings, useUpdateApprovalSettings } from "../api";
import { AdminState } from "./AdminShared";

/** Settings form for configurable multi-level approval thresholds (po_l2_approval_threshold). */
export function ApprovalSettingsPanel({ enabled = true }: { enabled?: boolean }) {
  const query = useApprovalSettings(enabled);
  const update = useUpdateApprovalSettings();
  const [thresholdDraft, setThresholdDraft] = useState<string | null>(null);
  const [error, setError] = useState("");

  const serverThreshold =
    query.data?.po_l2_approval_threshold !== undefined
      ? String(Number(query.data.po_l2_approval_threshold))
      : "";
  const thresholdInput = thresholdDraft ?? serverThreshold;

  if (query.isLoading) {
    return <AdminState text="Memuat pengaturan ambang batas approval..." />;
  }

  if (query.isError) {
    return (
      <AdminState
        error
        text="Pengaturan approval belum dapat dimuat. Pastikan Anda memiliki izin settings:manage."
      />
    );
  }

  const normalizedNumber = Number(thresholdInput.replace(",", ".").trim());
  const previewAmount = Number.isFinite(normalizedNumber) && normalizedNumber >= 0
    ? formatCurrencyIdr(normalizedNumber)
    : "-";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = thresholdInput.replace(",", ".").trim();
    if (!raw || !/^\d+(\.\d{1,2})?$/.test(raw) || Number(raw) < 0) {
      setError("Ambang batas harus berupa angka valid minimal 0 (maksimal 2 desimal).");
      return;
    }
    setError("");
    try {
      await update.mutateAsync({ po_l2_approval_threshold: raw });
      setThresholdDraft(null);
      toast.success("Ambang batas approval Level 2 PO berhasil diperbarui.");
    } catch (err) {
      const mapped = mapApiFormError(err, "Pengaturan approval belum dapat disimpan.");
      setError(mapped.formMessage);
      toast.error(mapped.formMessage);
    }
  }

  return (
    <section
      aria-labelledby="approval-settings-title"
      className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)] sm:p-6"
    >
      <div className="max-w-2xl space-y-4">
        <div>
          <h2 className="text-base font-bold text-ink-950" id="approval-settings-title">
            Ambang Batas Approval Berjenjang PO
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            Menentukan total nilai estimasi Purchase Order yang memerlukan persetujuan Level 2
            (Procurement Manager) setelah disetujui Level 1. Jika total PO &le; ambang batas, PO
            langsung berstatus <strong>ISSUED</strong> setelah Level 1.
          </p>
        </div>

        <form className="space-y-4" noValidate onSubmit={(event) => void submit(event)}>
          <label className="block text-sm font-semibold text-ink-950">
            Ambang Batas L2 PO (IDR)
            <input
              aria-invalid={Boolean(error)}
              className={`mt-2 h-11 w-full rounded-[var(--radius-md)] border bg-surface-0 px-3 text-sm tabular-nums text-ink-950 focus:outline-none focus:ring-2 ${
                error
                  ? "border-red-600 focus:ring-red-600/20"
                  : "border-line-500 focus:border-teal-600 focus:ring-teal-600/20"
              }`}
              inputMode="decimal"
              onChange={(event) => {
                setThresholdDraft(event.target.value);
                setError("");
              }}
              placeholder="10000000"
              type="text"
              value={thresholdInput}
            />
          </label>

          <div className="rounded-[var(--radius-md)] bg-canvas-50 px-3.5 py-2.5 text-sm text-slate-700">
            Pratinjau nilai:{" "}
            <span className="font-bold text-ink-950 tabular-nums">{previewAmount}</span>
          </div>

          {query.data?.updated_at && (
            <p className="text-xs text-slate-600">
              Terakhir diperbarui:{" "}
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(query.data.updated_at))}
              {query.data.updated_by_name ? ` oleh ${query.data.updated_by_name}` : ""}
            </p>
          )}

          {error && (
            <p className="rounded-[var(--radius-md)] bg-red-50 p-3 text-sm font-medium text-red-800" role="alert">
              {error}
            </p>
          )}

          <div className="pt-2">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-5 text-sm font-semibold text-surface-0 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-50"
              disabled={update.isPending}
              type="submit"
            >
              {update.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
