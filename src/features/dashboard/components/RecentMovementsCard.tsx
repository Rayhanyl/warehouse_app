import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveDataView,
  type ResponsiveColumn,
} from "@/components/shared/ResponsiveDataView";
import { formatDecimal } from "@/lib/decimal";
import type { DashboardRecentActivity } from "../types";

export interface RecentMovementsCardProps {
  recentActivities: readonly DashboardRecentActivity[];
}

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateTimeFormatter.format(parsed);
}

function getMovementBadge(type: string) {
  switch (type) {
    case "IN_PURCHASE":
      return {
        label: "Penerimaan PO",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "TRF_OUT":
      return {
        label: "Transfer Keluar",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "TRF_IN":
      return {
        label: "Transfer Masuk",
        className: "border-sky-200 bg-sky-50 text-sky-700",
      };
    case "ADJ_IN":
      return {
        label: "Penyesuaian Masuk",
        className: "border-teal-200 bg-teal-50 text-teal-700",
      };
    case "ADJ_OUT":
      return {
        label: "Penyesuaian Kurang",
        className: "border-rose-200 bg-rose-50 text-rose-700",
      };
    default:
      return {
        label: type,
        className: "border-slate-200 bg-slate-50 text-slate-700",
      };
  }
}

function isPositiveDelta(qtyChange?: string | null): boolean {
  return Boolean(qtyChange && !qtyChange.startsWith("-") && qtyChange !== "0");
}

function formatQtyDelta(qtyChange?: string | null): string {
  const formatted = formatDecimal(qtyChange);
  return isPositiveDelta(qtyChange) ? `+${formatted}` : formatted;
}

const movementColumns: ResponsiveColumn<DashboardRecentActivity>[] = [
  {
    id: "created_at",
    header: "Waktu",
    cellClassName: "whitespace-nowrap text-xs text-slate-600",
    cell: (act) => formatDateTime(act.created_at),
  },
  {
    id: "movement_type",
    header: "Jenis",
    cellClassName: "whitespace-nowrap",
    cell: (act) => {
      const badge = getMovementBadge(act.movement_type);
      return (
        <div>
          <Badge className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`} variant="outline">
            {badge.label}
          </Badge>
          {act.reference_number ? (
            <p className="mt-0.5 font-mono text-[10px] text-slate-500">
              {act.reference_number}
            </p>
          ) : null}
        </div>
      );
    },
  },
  {
    id: "item",
    header: "Barang",
    cellClassName: "max-w-[180px]",
    cell: (act) => (
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-ink-950">{act.item_name}</p>
        <p className="truncate text-[11px] text-slate-500">{act.item_sku}</p>
      </div>
    ),
  },
  {
    id: "warehouse",
    header: "Gudang",
    cellClassName: "whitespace-nowrap text-xs text-slate-700",
    cell: (act) => act.warehouse_code ?? "-",
  },
  {
    id: "qty_change",
    header: "Perubahan",
    headerClassName: "text-right",
    cellClassName: "text-right whitespace-nowrap tabular-nums text-xs font-bold",
    cell: (act) => (
      <span className={isPositiveDelta(act.qty_change) ? "text-emerald-700" : "text-rose-700"}>
        {formatQtyDelta(act.qty_change)}
      </span>
    ),
  },
  {
    id: "saldo_after",
    header: "Saldo Akhir",
    headerClassName: "text-right",
    cellClassName: "text-right whitespace-nowrap tabular-nums text-xs font-semibold text-ink-950",
    cell: (act) => formatDecimal(act.qty_after ?? act.saldo_after ?? "0"),
  },
];

/**
 * Menampilkan riwayat mutasi stok terkini dengan tampilan kartu ringkas di mobile dan tabel di desktop/tablet.
 */
export function RecentMovementsCard({
  recentActivities,
}: RecentMovementsCardProps) {
  return (
    <section aria-labelledby="recent-activity-title" className="lg:col-span-2">
      <Card className="h-full gap-4 py-5">
        <CardHeader className="flex flex-row items-start justify-between gap-3 px-5">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base font-bold text-ink-950" id="recent-activity-title">
              Aktivitas Mutasi Terkini
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed text-slate-600">
              Catatan pergerakan stok mutasi terakhir di gudang Anda.
            </CardDescription>
          </div>
          <Link
            className="inline-flex min-h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 hover:text-teal-800"
            to="/stock/ledger"
          >
            <span>Buku besar</span>
            <ArrowRight aria-hidden="true" size={13} />
          </Link>
        </CardHeader>

        <CardContent className="flex-1 px-5">
          <ResponsiveDataView
            columns={movementColumns}
            data={recentActivities}
            emptyDescription="Aktivitas penerimaan atau transfer barang akan muncul di sini secara otomatis."
            emptyTitle="Belum ada mutasi stok tercatat"
            keyExtractor={(act) => act.id}
            mobileListClassName="space-y-2.5"
            renderMobileCard={(act) => {
              const badge = getMovementBadge(act.movement_type);
              const positive = isPositiveDelta(act.qty_change);
              const finalSaldo = act.qty_after ?? act.saldo_after ?? "0";
              return (
                <article
                  aria-label={`${badge.label} ${act.item_name}`}
                  className="space-y-2.5 rounded-lg border border-border bg-card p-3.5 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                        variant="outline"
                      >
                        {badge.label}
                      </Badge>
                      {act.reference_number ? (
                        <span className="font-mono text-[11px] font-medium text-slate-600">
                          {act.reference_number}
                        </span>
                      ) : null}
                    </div>
                    <Badge className="text-[11px] font-medium text-slate-700" variant="outline">
                      {act.warehouse_code ?? "-"}
                    </Badge>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-950">
                      {act.item_name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {act.item_sku} · {formatDateTime(act.created_at)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs">
                    <div>
                      <p className="text-[11px] text-slate-600">Perubahan</p>
                      <p
                        className={`mt-0.5 font-bold tabular-nums ${
                          positive ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {formatQtyDelta(act.qty_change)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-600">Saldo Akhir</p>
                      <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                        {formatDecimal(finalSaldo)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            }}
            tableContainerClassName="rounded-lg"
          />
        </CardContent>
      </Card>
    </section>
  );
}
