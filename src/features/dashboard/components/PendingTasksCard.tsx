import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  PackageCheck,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardPendingActions } from "../types";

export interface PendingTasksCardProps {
  pendingActions?: DashboardPendingActions;
}

interface PendingTaskDescriptor {
  id: string;
  to: string;
  label: string;
  description: string;
  count: number;
  icon: LucideIcon;
  iconClassName: string;
}

/**
 * Menampilkan daftar tugas operasional yang menunggu tindak lanjut operator dengan target sentuh nyaman di mobile.
 */
export function PendingTasksCard({ pendingActions }: PendingTasksCardProps) {
  const totalPendingTasks =
    (pendingActions?.pending_po_receipt_count ?? 0) +
    (pendingActions?.draft_gr_count ?? 0) +
    (pendingActions?.pending_transfer_ship_count ?? 0) +
    (pendingActions?.pending_transfer_receive_count ?? 0) +
    (pendingActions?.active_opname_count ?? 0);

  const tasks: PendingTaskDescriptor[] = [
    {
      id: "po-ready",
      to: "/goods-receipts/new",
      label: "PO Siap Diterima",
      description: "Status pesanan berstatus Issued",
      count: pendingActions?.pending_po_receipt_count ?? 0,
      icon: ClipboardCheck,
      iconClassName: "bg-amber-100 text-amber-800",
    },
    {
      id: "gr-draft",
      to: "/goods-receipts",
      label: "Draft Penerimaan (GR)",
      description: "Dokumen belum diposting ke stok",
      count: pendingActions?.draft_gr_count ?? 0,
      icon: PackageCheck,
      iconClassName: "bg-teal-100 text-teal-800",
    },
    {
      id: "transfer-ship",
      to: "/stock-transfers",
      label: "Transfer Siap Dikirim",
      description: "Dokumen approved belum dikirim",
      count: pendingActions?.pending_transfer_ship_count ?? 0,
      icon: ArrowUpRight,
      iconClassName: "bg-blue-100 text-blue-800",
    },
    {
      id: "transfer-receive",
      to: "/stock-transfers",
      label: "Transfer Siap Diterima",
      description: "Pengiriman berstatus Shipped",
      count: pendingActions?.pending_transfer_receive_count ?? 0,
      icon: ArrowDownRight,
      iconClassName: "bg-sky-100 text-sky-800",
    },
    {
      id: "active-opname",
      to: "/stock-opnames",
      label: "Stock Opname Berjalan",
      description: "Sesi penghitungan belum selesai",
      count: pendingActions?.active_opname_count ?? 0,
      icon: Clock,
      iconClassName: "bg-purple-100 text-purple-800",
    },
  ];

  return (
    <section aria-labelledby="pending-actions-title" className="lg:col-span-1">
      <Card className="h-full gap-4 py-5">
        <CardHeader className="flex flex-row items-start justify-between gap-3 px-5">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base font-bold text-ink-950" id="pending-actions-title">
              Tugas Tertunda
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed text-slate-600">
              Dokumen menunggu tindak lanjut operator.
            </CardDescription>
          </div>
          {totalPendingTasks === 0 ? (
            <Badge
              className="shrink-0 whitespace-nowrap border-emerald-200 bg-emerald-50 text-emerald-700"
              variant="outline"
            >
              <CheckCircle2 aria-hidden="true" className="size-3.5" />
              <span>Lengkap</span>
            </Badge>
          ) : (
            <Badge
              className="shrink-0 whitespace-nowrap border-amber-200 bg-amber-50 font-bold text-amber-800 tabular-nums"
              variant="outline"
            >
              {totalPendingTasks} antrean
            </Badge>
          )}
        </CardHeader>

        <CardContent className="flex-1 px-3 sm:px-4">
          <div className="divide-y divide-border/70">
            {tasks.map((task) => {
              const Icon = task.icon;
              return (
                <Link
                  className="group flex min-h-12 items-center justify-between gap-3 rounded-lg px-2 py-3 transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  key={task.id}
                  to={task.to}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className={`grid size-8 shrink-0 place-items-center rounded-md ${task.iconClassName}`}
                    >
                      <Icon aria-hidden="true" size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-snug text-ink-950 sm:text-sm">
                        {task.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-600">
                        {task.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-ink-950 tabular-nums">
                      {task.count}
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
