import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Layers,
  PackageCheck,
  RefreshCw,
  Repeat2,
  Truck,
  Warehouse,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/features/auth/store";
import { useDashboardSummary } from "@/features/dashboard/api";
import { getMenuIconComponent } from "@/features/navigation/icons";
import { useMyMenu } from "@/features/navigation/api";
import type { MenuItem } from "@/features/navigation/types";
import { formatDecimal } from "@/lib/decimal";

const workflow = [
  {
    step: "01",
    label: "Purchase order",
    detail: "Buat atau pantau dokumen pesanan ke pemasok.",
    icon: ClipboardCheck,
  },
  {
    step: "02",
    label: "Penerimaan barang",
    detail: "Verifikasi fisik barang masuk melalui goods receipt.",
    icon: PackageCheck,
  },
  {
    step: "03",
    label: "Saldo & lokasi stok",
    detail: "Periksa posisi stok aktual per gudang dan lokasi rak.",
    icon: Boxes,
  },
  {
    step: "04",
    label: "Transfer & stock opname",
    detail: "Catat perpindahan antar-lokasi dan penyesuaian fisik.",
    icon: Repeat2,
  },
];

interface ShortcutEntry {
  item: MenuItem;
  category: string | null;
}

function collectShortcuts(
  items: MenuItem[],
  parentCategory: string | null = null,
): ShortcutEntry[] {
  return items.flatMap((item) => {
    const descendants = collectShortcuts(item.children, item.name);
    if (
      item.path &&
      item.path !== "/dashboard" &&
      item.menu_type !== "group" &&
      item.children.length === 0
    ) {
      return [{ item, category: parentCategory }, ...descendants];
    }
    return descendants;
  });
}

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(val: string) {
  const parsed = new Date(val);
  return Number.isNaN(parsed.getTime()) ? val : dateTimeFormatter.format(parsed);
}

function getMovementBadge(type: string) {
  switch (type) {
    case "IN_PURCHASE":
      return {
        label: "Penerimaan PO",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "TRF_OUT":
      return {
        label: "Transfer Keluar",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "TRF_IN":
      return {
        label: "Transfer Masuk",
        className: "bg-sky-50 text-sky-700 border-sky-200",
      };
    case "ADJ_IN":
      return {
        label: "Penyesuaian Masuk",
        className: "bg-teal-50 text-teal-700 border-teal-200",
      };
    case "ADJ_OUT":
      return {
        label: "Penyesuaian Kurang",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      };
    default:
      return {
        label: type,
        className: "bg-slate-50 text-slate-700 border-slate-200",
      };
  }
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: menu = [] } = useMyMenu();
  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useDashboardSummary();

  const shortcuts = collectShortcuts(menu).slice(0, 9);
  const displayName = user?.full_name || user?.username;

  const stockSummary = dashboardData?.stock_summary;
  const pendingActions = dashboardData?.pending_actions;
  const recentActivities = dashboardData?.recent_activities ?? [];
  const assignedWarehouses = dashboardData?.assigned_warehouses ?? [];

  const totalPendingTasks =
    (pendingActions?.pending_po_receipt_count ?? 0) +
    (pendingActions?.draft_gr_count ?? 0) +
    (pendingActions?.pending_transfer_ship_count ?? 0) +
    (pendingActions?.pending_transfer_receive_count ?? 0) +
    (pendingActions?.active_opname_count ?? 0);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          description="Pantau indikator kinerja utama, antrean dokumen operasional, dan mutasi stok secara real-time."
          title={displayName ? `Selamat datang, ${displayName}` : "Selamat datang"}
        />
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
          <button
            aria-label="Segarkan data ringkasan"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-canvas-50 active:scale-95 disabled:opacity-50"
            disabled={isFetching}
            onClick={() => void refetch()}
            type="button"
          >
            <RefreshCw
              aria-hidden="true"
              className={`size-3.5 ${isFetching ? "animate-spin text-teal-600" : "text-slate-500"}`}
            />
            {isFetching ? "Memperbarui..." : "Segarkan"}
          </button>
        </div>
      </div>

      {/* Baris Informasi Cakupan Gudang */}
      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/70 px-4 py-2.5 text-xs text-slate-700">
        <Warehouse aria-hidden="true" className="size-4 text-teal-600" />
        <span className="font-semibold text-ink-950">Cakupan Gudang:</span>
        {assignedWarehouses.length === 0 ? (
          <span className="text-slate-500">
            Tidak ada gudang yang ditugaskan atau akun berstatus non-operasional.
          </span>
        ) : assignedWarehouses.length === 1 ? (
          <span className="rounded-full bg-teal-50 px-2 py-0.5 font-medium text-teal-700 border border-teal-200">
            {assignedWarehouses[0].code} ({assignedWarehouses[0].name})
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {assignedWarehouses.map((wh) => (
              <span
                className="rounded-full bg-surface-0 px-2 py-0.5 font-medium text-slate-700 border border-line-200"
                key={wh.id}
              >
                {wh.code}
              </span>
            ))}
            <span className="text-slate-500">({assignedWarehouses.length} gudang)</span>
          </div>
        )}
      </div>

      {/* Kartu Metrik Utama (KPI Cards) */}
      <section aria-labelledby="kpi-title" className="mt-6">
        <h2 className="sr-only" id="kpi-title">
          Indikator Kinerja Stok Utama
        </h2>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                className="h-28 animate-pulse rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)]"
                key={i}
              />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-[var(--radius-lg)] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Gagal memuat metrik ringkasan dashboard. Silakan periksa koneksi atau klik tombol Segarkan.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total SKU Aktif */}
            <Link
              className="group flex flex-col justify-between rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)] transition hover:border-teal-500"
              to="/master/items"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Total Katalog SKU</span>
                <div className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-teal-50 text-teal-700 group-hover:bg-teal-100 transition">
                  <Boxes aria-hidden="true" size={18} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">
                  {stockSummary?.total_active_items.toLocaleString("id-ID") ?? "0"}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <span>Barang aktif tercatat</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </p>
              </div>
            </Link>

            {/* Card 2: Saldo On-Hand */}
            <Link
              className="group flex flex-col justify-between rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)] transition hover:border-emerald-500"
              to="/stock/balances"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Total Stok Fisik</span>
                <div className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 transition">
                  <Layers aria-hidden="true" size={18} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">
                  {stockSummary ? formatDecimal(stockSummary.total_qty_on_hand) : "0"}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <span>Unit saldo on-hand</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </p>
              </div>
            </Link>

            {/* Card 3: In-Transit */}
            <Link
              className="group flex flex-col justify-between rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)] transition hover:border-sky-500"
              to="/stock-transfers"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Dalam Pengiriman</span>
                <div className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-sky-50 text-sky-700 group-hover:bg-sky-100 transition">
                  <Truck aria-hidden="true" size={18} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">
                  {stockSummary ? formatDecimal(stockSummary.total_qty_in_transit) : "0"}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <span>Unit transfer in-transit</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </p>
              </div>
            </Link>

            {/* Card 4: Stok Kritis */}
            <Link
              className="group flex flex-col justify-between rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)] transition hover:border-rose-500"
              to="/stock/balances"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Perhatian Stok Kritis</span>
                <div
                  className={`grid size-9 place-items-center rounded-[var(--radius-md)] transition ${
                    (stockSummary?.low_stock_items_count ?? 0) > 0
                      ? "bg-rose-50 text-rose-700 group-hover:bg-rose-100"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <AlertTriangle aria-hidden="true" size={18} />
                </div>
              </div>
              <div className="mt-3">
                <p
                  className={`text-2xl font-bold tracking-tight tabular-nums ${
                    (stockSummary?.low_stock_items_count ?? 0) > 0
                      ? "text-rose-700"
                      : "text-ink-950"
                  }`}
                >
                  {stockSummary?.low_stock_items_count.toLocaleString("id-ID") ?? "0"}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <span>Barang dengan saldo nol atau kritis</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </p>
              </div>
            </Link>
          </div>
        )}
      </section>

      {/* Bagian Grid: Action Items & Riwayat Aktivitas */}
      <div className="mt-6 sm:mt-8 grid gap-6 lg:grid-cols-3">
        {/* Kolom 1: Tugas Tertunda (Action Items) */}
        <section
          aria-labelledby="pending-actions-title"
          className="flex flex-col rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)] lg:col-span-1"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink-950" id="pending-actions-title">
                Tugas Tertunda
              </h2>
              <p className="text-xs text-slate-600">Dokumen menunggu tindak lanjut operator.</p>
            </div>
            {totalPendingTasks === 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <CheckCircle2 aria-hidden="true" size={13} />
                Lengkap
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200 tabular-nums">
                {totalPendingTasks} antrean
              </span>
            )}
          </div>

          <div className="mt-4 flex-1 divide-y divide-line-100">
            {/* PO Menunggu Penerimaan */}
            <Link
              className="flex items-center justify-between py-3 transition hover:bg-canvas-50 px-2 -mx-2 rounded-[var(--radius-sm)]"
              to="/goods-receipts/new"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid size-7 shrink-0 place-items-center rounded bg-amber-100 text-amber-800">
                  <ClipboardCheck aria-hidden="true" size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-950">PO Siap Diterima</p>
                  <p className="text-[11px] text-slate-500">Status pesanan berstatus Issued</p>
                </div>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-ink-950 tabular-nums">
                {pendingActions?.pending_po_receipt_count ?? 0}
              </span>
            </Link>

            {/* GR Draft */}
            <Link
              className="flex items-center justify-between py-3 transition hover:bg-canvas-50 px-2 -mx-2 rounded-[var(--radius-sm)]"
              to="/goods-receipts"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid size-7 shrink-0 place-items-center rounded bg-teal-100 text-teal-800">
                  <PackageCheck aria-hidden="true" size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-950">Draft Penerimaan (GR)</p>
                  <p className="text-[11px] text-slate-500">Dokumen belum diposting ke stok</p>
                </div>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-ink-950 tabular-nums">
                {pendingActions?.draft_gr_count ?? 0}
              </span>
            </Link>

            {/* Transfer Siap Dikirim */}
            <Link
              className="flex items-center justify-between py-3 transition hover:bg-canvas-50 px-2 -mx-2 rounded-[var(--radius-sm)]"
              to="/stock-transfers"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid size-7 shrink-0 place-items-center rounded bg-blue-100 text-blue-800">
                  <ArrowUpRight aria-hidden="true" size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-950">Transfer Siap Dikirim</p>
                  <p className="text-[11px] text-slate-500">Dokumen approved belum dikirim</p>
                </div>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-ink-950 tabular-nums">
                {pendingActions?.pending_transfer_ship_count ?? 0}
              </span>
            </Link>

            {/* Transfer Siap Diterima */}
            <Link
              className="flex items-center justify-between py-3 transition hover:bg-canvas-50 px-2 -mx-2 rounded-[var(--radius-sm)]"
              to="/stock-transfers"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid size-7 shrink-0 place-items-center rounded bg-sky-100 text-sky-800">
                  <ArrowDownRight aria-hidden="true" size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-950">Transfer Siap Diterima</p>
                  <p className="text-[11px] text-slate-500">Pengiriman berstatus Shipped</p>
                </div>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-ink-950 tabular-nums">
                {pendingActions?.pending_transfer_receive_count ?? 0}
              </span>
            </Link>

            {/* Opname Aktif */}
            <Link
              className="flex items-center justify-between py-3 transition hover:bg-canvas-50 px-2 -mx-2 rounded-[var(--radius-sm)]"
              to="/stock-opnames"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid size-7 shrink-0 place-items-center rounded bg-purple-100 text-purple-800">
                  <Clock aria-hidden="true" size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-950">Stock Opname Berjalan</p>
                  <p className="text-[11px] text-slate-500">Sesi penghitungan belum selesai</p>
                </div>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-ink-950 tabular-nums">
                {pendingActions?.active_opname_count ?? 0}
              </span>
            </Link>
          </div>
        </section>

        {/* Kolom 2: Riwayat Mutasi Terkini (Recent Activities) */}
        <section
          aria-labelledby="recent-activity-title"
          className="flex flex-col rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)] lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink-950" id="recent-activity-title">
                Aktivitas Mutasi Terkini
              </h2>
              <p className="text-xs text-slate-600">Catatan pergerakan stok mutasi terakhir di gudang Anda.</p>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
              to="/stock/ledger"
            >
              Buku besar
              <ArrowRight aria-hidden="true" size={13} />
            </Link>
          </div>

          <div className="mt-4 flex-1">
            {recentActivities.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-line-300 p-6 text-center text-xs text-slate-500">
                <Boxes aria-hidden="true" className="size-8 text-slate-400 mb-2" />
                <p className="font-semibold text-ink-950">Belum ada mutasi stok tercatat</p>
                <p className="mt-1">Aktivitas penerimaan atau transfer barang akan muncul di sini secara otomatis.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full min-w-[540px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-line-200 text-slate-600 font-semibold">
                      <th className="pb-2">Waktu</th>
                      <th className="pb-2">Jenis</th>
                      <th className="pb-2">Barang</th>
                      <th className="pb-2">Gudang</th>
                      <th className="pb-2 text-right">Perubahan</th>
                      <th className="pb-2 text-right">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-100">
                    {recentActivities.map((act) => {
                      const badge = getMovementBadge(act.movement_type);
                      const isPositive = Boolean(
                        act.qty_change &&
                          !act.qty_change.startsWith("-") &&
                          act.qty_change !== "0",
                      );
                      const finalSaldo = act.qty_after ?? act.saldo_after ?? "0";
                      return (
                        <tr className="hover:bg-canvas-50/70 transition-colors" key={act.id}>
                          <td className="py-2.5 whitespace-nowrap text-slate-600">
                            {formatDateTime(act.created_at)}
                          </td>
                          <td className="py-2.5 whitespace-nowrap">
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold border ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            {act.reference_number && (
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {act.reference_number}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 max-w-[180px] truncate">
                            <p className="font-semibold text-ink-950 truncate">{act.item_name}</p>
                            <p className="text-[11px] text-slate-500">{act.item_sku}</p>
                          </td>
                          <td className="py-2.5 whitespace-nowrap text-slate-700">
                            {act.warehouse_code ?? "-"}
                          </td>
                          <td
                            className={`py-2.5 text-right font-bold tabular-nums whitespace-nowrap ${
                              isPositive ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {isPositive
                              ? `+${formatDecimal(act.qty_change)}`
                              : formatDecimal(act.qty_change)}
                          </td>
                          <td className="py-2.5 text-right font-semibold text-ink-950 tabular-nums whitespace-nowrap">
                            {formatDecimal(finalSaldo)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bagian Alur Kerja Gudang */}
      <section
        aria-labelledby="workflow-title"
        className="mt-6 sm:mt-8 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)] sm:p-6"
      >
        <div className="mb-5">
          <h2 className="text-lg font-bold text-ink-950" id="workflow-title">
            Alur kerja gudang
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Ikuti setiap pergerakan stok dari dokumen pemesanan hingga pencatatan buku besar.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workflow.map(({ step, label, detail, icon: Icon }) => (
            <div
              className="flex flex-col justify-between rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/55 p-4"
              key={step}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-teal-100 text-teal-700">
                  <Icon aria-hidden="true" size={20} />
                </div>
                <span className="rounded-full bg-surface-0 px-2.5 py-1 text-xs font-bold text-slate-600 tabular-nums">
                  Tahap {step}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-ink-950">{label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-700">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bagian Pintasan Modul */}
      <section aria-labelledby="shortcut-title" className="mt-6 sm:mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-ink-950" id="shortcut-title">
            Pintasan modul
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Buka modul kerja yang tersedia sesuai izin peran akun Anda.
          </p>
        </div>
        {shortcuts.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-line-500 bg-surface-0 p-6 text-sm text-slate-700">
            Belum ada pintasan modul yang tersedia untuk akun Anda.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map(({ item, category }) => {
              const Icon = getMenuIconComponent(item);
              return (
                <Link
                  className="group flex min-h-14 items-start justify-between gap-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] transition hover:border-teal-600"
                  key={item.id}
                  to={item.path}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-teal-100 text-teal-700">
                      <Icon aria-hidden="true" size={18} />
                    </div>
                    <div className="min-w-0">
                      {category && (
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          {category}
                        </p>
                      )}
                      <p className="font-semibold text-ink-950">{item.name}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-700">
                        Buka halaman {item.name.toLocaleLowerCase()}.
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-slate-600 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-teal-700"
                    size={16}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

export function AdminPlaceholderPage() {
  return (
    <PageHeader
      description="Halaman modul ini sedang disiapkan. Menu dan hak akses Anda sudah berhasil dimuat dari server."
      title="Modul Jejakstok"
    />
  );
}
