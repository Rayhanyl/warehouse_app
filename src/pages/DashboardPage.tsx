import { RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useDashboardSummary } from "@/features/dashboard/api";
import { DashboardKpiGrid } from "@/features/dashboard/components/DashboardKpiGrid";
import { ModuleShortcutsGrid } from "@/features/dashboard/components/ModuleShortcutsGrid";
import { PendingTasksCard } from "@/features/dashboard/components/PendingTasksCard";
import { RecentMovementsCard } from "@/features/dashboard/components/RecentMovementsCard";
import { WarehouseScopeBar } from "@/features/dashboard/components/WarehouseScopeBar";
import { WorkflowGuideCard } from "@/features/dashboard/components/WorkflowGuideCard";
import { useMyMenu } from "@/features/navigation/api";
import { useWarehouseScope } from "@/hooks/useWarehouseScope";

export function DashboardPage() {
  const { user, activeWarehouseId, activeWarehouseLabel } = useWarehouseScope();
  const { data: menu = [] } = useMyMenu();
  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useDashboardSummary(activeWarehouseId);

  const displayName = user?.full_name || user?.username;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          description="Pantau indikator kinerja utama, antrean dokumen operasional, dan mutasi stok secara real-time."
          title={displayName ? `Selamat datang, ${displayName}` : "Selamat datang"}
        />
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
          <Button
            aria-label="Segarkan data ringkasan"
            disabled={isFetching}
            onClick={() => void refetch()}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              aria-hidden="true"
              className={`size-3.5 ${isFetching ? "animate-spin text-teal-600" : "text-slate-500"}`}
            />
            <span>{isFetching ? "Memperbarui..." : "Segarkan"}</span>
          </Button>
        </div>
      </div>

      <WarehouseScopeBar
        activeWarehouseId={activeWarehouseId}
        activeWarehouseLabel={activeWarehouseLabel}
        assignedWarehouses={dashboardData?.assigned_warehouses ?? []}
      />

      <DashboardKpiGrid
        activeWarehouseId={activeWarehouseId}
        isError={isError}
        isLoading={isLoading}
        onRetry={() => void refetch()}
        stockSummary={dashboardData?.stock_summary}
      />

      <div className="mt-6 grid gap-6 sm:mt-8 lg:grid-cols-3">
        <PendingTasksCard pendingActions={dashboardData?.pending_actions} />
        <RecentMovementsCard
          recentActivities={dashboardData?.recent_activities ?? []}
        />
      </div>

      <WorkflowGuideCard />
      <ModuleShortcutsGrid menu={menu} />
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
