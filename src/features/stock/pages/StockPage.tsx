import { type FormEvent, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { RouteTabNav } from "@/components/shared/RouteTabNav";
import { StockLookupModal } from "@/components/ui/StockLookupModal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePermission } from "@/hooks/usePermission";
import { useWarehouseScope } from "@/hooks/useWarehouseScope";
import {
  useStockBalances,
  useStockMovements,
  useStockSummary,
  useWarehouseBalances,
} from "../api";
import {
  BalanceTable,
  LedgerTable,
  SummaryTable,
  WarehouseBalanceTable,
} from "../components/StockDataViews";
import { StockFilterBar } from "../components/StockFilterBar";
import { StockState } from "../components/StockShared";
import type { StockListParams } from "../types";

const initialParams: StockListParams = {
  limit: 25,
  offset: 0,
  search: "",
  warehouse_id: "",
  location_id: "",
  item_id: "",
  category_id: "",
  critical_only: false,
  date_from: "",
  date_to: "",
  movement_type: "",
  reference_type: "",
  reference_id: "",
};

export function StockPage() {
  const [searchParams] = useSearchParams();
  const criticalFromQuery = searchParams.get("critical") === "true";
  return (
    <StockPageContent
      criticalFromQuery={criticalFromQuery}
      key={criticalFromQuery ? "critical" : "normal"}
    />
  );
}

function StockPageContent({
  criticalFromQuery,
}: {
  criticalFromQuery: boolean;
}) {
  const { pathname } = useLocation();
  const { can } = usePermission();
  const { canAccessAllWarehouses, resolveEffectiveWarehouseFilter, warehouseOptions } =
    useWarehouseScope();
  const canReadLedger = can("ledger:read");
  const [params, setParams] = useState<StockListParams>(() => ({
    ...initialParams,
    critical_only: criticalFromQuery,
  }));
  const [draft, setDraft] = useState<StockListParams>(() => ({
    ...initialParams,
    critical_only: criticalFromQuery,
  }));
  const [lookupOpen, setLookupOpen] = useState(false);

  const isWarehouseView =
    pathname === "/stock/by-warehouse" || pathname === "/stock/warehouse";
  const isSummaryView = pathname === "/stock/summary";
  const isTransitView = pathname === "/stock/in-transit";
  const isLedgerView = pathname === "/stock/ledger";
  const isMobile = useIsMobile();

  const effectiveWarehouseId = resolveEffectiveWarehouseFilter(
    params.warehouse_id ? Number(params.warehouse_id) : null,
  );
  const effectiveParams: StockListParams = {
    ...params,
    warehouse_id: effectiveWarehouseId !== null ? String(effectiveWarehouseId) : "",
  };
  const scopedWarehouseSelectOptions: [string, string][] =
    warehouseOptions.length > 1
      ? [
          ["", "Semua gudang saya"],
          ...warehouseOptions.map((wh): [string, string] => [
            String(wh.id),
            `${wh.code} · ${wh.name}`,
          ]),
        ]
      : warehouseOptions.length === 1
        ? [
            [
              String(warehouseOptions[0].id),
              `${warehouseOptions[0].code} · ${warehouseOptions[0].name}`,
            ],
          ]
        : [["", "Tidak ada gudang"]];

  const activeFilterCount = [
    params.search,
    effectiveParams.warehouse_id,
    params.location_id,
    params.item_id,
    params.category_id,
    params.critical_only ? "critical" : "",
    params.date_from,
    params.date_to,
    params.movement_type,
    params.reference_type,
    params.reference_id,
  ].filter(Boolean).length;

  const title = isLedgerView
    ? "Buku besar stok"
    : isWarehouseView
      ? "Saldo stok per gudang"
      : isSummaryView
        ? "Ringkasan stok"
        : isTransitView
          ? "Stok dalam perjalanan"
          : "Saldo stok per lokasi";

  const balances = useStockBalances(
    effectiveParams,
    !isWarehouseView && !isSummaryView && !isLedgerView,
  );
  const warehouseBalances = useWarehouseBalances(effectiveParams, isWarehouseView);
  const summary = useStockSummary(effectiveParams, isSummaryView);
  const movements = useStockMovements(effectiveParams, isLedgerView && canReadLedger);
  const query = isLedgerView
    ? movements
    : isWarehouseView
      ? warehouseBalances
      : isSummaryView
        ? summary
        : balances;

  const navigationLinks: [string, string][] = [
    ["/stock/by-location", "Per lokasi"],
    ["/stock/by-warehouse", "Per gudang"],
    ["/stock/summary", "Ringkasan"],
    ["/stock/in-transit", "Dalam perjalanan"],
    ...(canReadLedger ? [["/stock/ledger", "Buku besar"] as [string, string]] : []),
  ];

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setParams({ ...draft, offset: 0 });
  }

  function reset() {
    setDraft(initialParams);
    setParams(initialParams);
  }

  return (
    <>
      <PageHeader
        description={
          isLedgerView
            ? "Riwayat pergerakan stok yang tercatat dari dokumen transaksi."
            : "Baca posisi stok aktual tanpa mengubah saldo dari halaman ini."
        }
        title={title}
      />

      <RouteTabNav
        ariaLabel="Tampilan stok"
        items={navigationLinks.map(([path, label]) => ({
          to: path,
          label,
          active:
            pathname === path ||
            (pathname === "/stock" && path === "/stock/by-location") ||
            (pathname === "/stock/warehouse" && path === "/stock/by-warehouse"),
        }))}
      />

      <StockFilterBar
        activeCount={activeFilterCount}
        canAccessAllWarehouses={canAccessAllWarehouses}
        draft={draft}
        effectiveWarehouseId={effectiveParams.warehouse_id}
        isLedgerView={isLedgerView}
        isSummaryView={isSummaryView}
        isWarehouseView={isWarehouseView}
        onDraftChange={setDraft}
        onOpenLookup={() => setLookupOpen(true)}
        onReset={reset}
        onSubmit={apply}
        scopedWarehouseOptions={scopedWarehouseSelectOptions}
      />

      {isLedgerView && !canReadLedger ? (
        <StockState
          error={false}
          text="Anda tidak memiliki izin untuk melihat riwayat buku besar pergerakan stok."
        />
      ) : query.isLoading ? (
        <StockState text="Memuat data stok..." />
      ) : query.isError ? (
        <StockState
          error
          onRetry={() => void query.refetch()}
          text="Data stok belum dapat dimuat. Periksa koneksi lalu coba lagi."
        />
      ) : isLedgerView ? (
        <LedgerTable isMobile={isMobile} items={movements.data?.items ?? []} />
      ) : isSummaryView ? (
        <SummaryTable isMobile={isMobile} items={summary.data?.items ?? []} />
      ) : isWarehouseView ? (
        <WarehouseBalanceTable isMobile={isMobile} items={warehouseBalances.data?.items ?? []} />
      ) : (
        <BalanceTable
          isMobile={isMobile}
          items={balances.data?.items ?? []}
          showTransit={isTransitView}
        />
      )}

      {query.data && query.data.items.length > 0 && (
        <p className="mt-4 text-xs text-slate-600">
          Menampilkan {query.data.items.length} baris dari {query.data.total} data.
        </p>
      )}

      <StockLookupModal isOpen={lookupOpen} onClose={() => setLookupOpen(false)} />
    </>
  );
}
