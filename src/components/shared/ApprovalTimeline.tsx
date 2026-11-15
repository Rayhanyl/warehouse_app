import type { ApprovalLog } from "@/types/api";

const ACTION_BADGE_MAP: Record<ApprovalLog["action"], { label: string; className: string }> = {
  SUBMITTED: {
    label: "Diajukan",
    className: "bg-blue-100 text-blue-800",
  },
  APPROVED: {
    label: "Disetujui",
    className: "bg-teal-100 text-teal-800",
  },
  REJECTED: {
    label: "Ditolak",
    className: "bg-red-100 text-red-800",
  },
};

function formatLogLevel(level: number, action: ApprovalLog["action"]) {
  if (action === "SUBMITTED" || level === 0) return "Pengajuan";
  if (level === 1) return "Approval Level 1";
  if (level === 2) return "Approval Level 2";
  return `Level ${level}`;
}

function formatLogDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Chronological approval history list shared across Purchase Order and Stock Opname modals. */
export function ApprovalTimeline({
  logs,
  title = "Riwayat Persetujuan",
}: {
  logs?: ApprovalLog[];
  title?: string;
}) {
  if (!logs || logs.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={title}
      className="mt-4 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/50 p-4"
    >
      <h3 className="text-sm font-bold text-ink-950">{title}</h3>
      <ol className="mt-3 space-y-2.5">
        {logs.map((entry) => {
          const badge = ACTION_BADGE_MAP[entry.action] ?? {
            label: entry.action,
            className: "bg-slate-100 text-slate-700",
          };
          return (
            <li
              className="rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 py-2.5 text-sm"
              key={entry.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <span className="text-xs font-semibold text-ink-950">
                    {formatLogLevel(entry.approval_level, entry.action)}
                  </span>
                  <span className="text-xs text-slate-600">
                    oleh {entry.actor_name || `User #${entry.actor_id ?? "-"}`}
                    {entry.actor_role ? ` (${entry.actor_role})` : ""}
                  </span>
                </div>
                <span className="text-xs tabular-nums text-slate-600">
                  {formatLogDateTime(entry.created_at)}
                </span>
              </div>
              {entry.notes && (
                <p className="mt-1.5 text-xs leading-5 text-slate-700">
                  Catatan: {entry.notes}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
