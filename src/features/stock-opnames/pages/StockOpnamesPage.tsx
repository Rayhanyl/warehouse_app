import { type FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePermission } from "@/hooks/usePermission";
import { useWarehouseScope } from "@/hooks/useWarehouseScope";
import { mapOpnameError, useOpname, useOpnameMutation, useOpnameReferences, useOpnames } from "../api";
import { OpnameDetailModal } from "../components/OpnameDetailModal";
import { OpnameFormDialog } from "../components/OpnameFormDialog";
import { OpnamesDataView, OpnamesFilterBar } from "../components/OpnamesDataView";
import { OPNAME_INITIAL_FILTERS, type OpnameFilters } from "../constants";
import type { StockOpname, StockOpnameCreatePayload, StockOpnameUpdatePayload } from "../types";

export function StockOpnamesPage() {
  const { can } = usePermission();
  const {
    canAccessAllWarehouses,
    resolveEffectiveWarehouseFilter,
    filterWarehouseChoices,
  } = useWarehouseScope();
  const [params, setParams] = useState<OpnameFilters>(OPNAME_INITIAL_FILTERS);
  const [draft, setDraft] = useState<OpnameFilters>(OPNAME_INITIAL_FILTERS);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingOpname, setEditingOpname] = useState<StockOpname | null>(null);

  const effectiveWarehouseId = resolveEffectiveWarehouseFilter(params.warehouse_id);
  const effectiveParams = { ...params, warehouse_id: effectiveWarehouseId };
  const query = useOpnames(effectiveParams);
  const detail = useOpname(detailId);
  const refs = useOpnameReferences();
  const scopedWarehouses = filterWarehouseChoices(refs.data?.warehouses ?? []);
  const isMobile = useIsMobile();
  const create = useOpnameMutation("create");
  const update = useOpnameMutation("update");
  const canManage = can("opname:manage");

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const hasFilters = Boolean(
    params.search ||
      params.status !== "all" ||
      params.warehouse_id ||
      params.date_from ||
      params.date_to,
  );
  const activeFilterCount = [
    params.search,
    params.status !== "all",
    params.warehouse_id,
    params.date_from,
    params.date_to,
  ].filter(Boolean).length;

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setParams({ ...draft, offset: 0 });
  }

  function reset() {
    setDraft(OPNAME_INITIAL_FILTERS);
    setParams(OPNAME_INITIAL_FILTERS);
  }

  async function createSession(payload: StockOpnameCreatePayload) {
    try {
      const result = await create.mutateAsync({ payload });
      setParams((prev) => ({ ...prev, offset: 0 }));
      setFormOpen(false);
      setDetailId(result.id);
      toast.success(`Draft ${result.opname_number} berhasil dibuat.`);
    } catch (error) {
      toast.error(mapOpnameError(error, "Sesi opname belum dapat dibuat."));
      throw error;
    }
  }

  async function updateSession(id: number, payload: StockOpnameUpdatePayload) {
    try {
      const result = await update.mutateAsync({ id, payload });
      setFormOpen(false);
      setEditingOpname(null);
      setDetailId(result.id);
      toast.success(`Draft ${result.opname_number} berhasil diperbarui.`);
    } catch (error) {
      toast.error(mapOpnameError(error, "Draft opname belum dapat diperbarui."));
      throw error;
    }
  }

  return (
    <>
      <PageHeader
        action={
          canManage ? (
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
              onClick={() => {
                setEditingOpname(null);
                setFormOpen(true);
              }}
              type="button"
            >
              <Plus aria-hidden="true" size={17} />
              Buat sesi opname
            </button>
          ) : (
            <span className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-xs font-semibold text-slate-600">
              Mode baca saja
            </span>
          )
        }
        description="Bekukan lokasi, catat hasil hitung fisik, lalu ajukan selisih untuk persetujuan."
        title="Stock opname"
      />

      <OpnamesFilterBar
        activeCount={activeFilterCount}
        canAccessAllWarehouses={canAccessAllWarehouses}
        draft={draft}
        effectiveWarehouseId={effectiveWarehouseId}
        isRefsError={refs.isError}
        onApply={apply}
        onDraftChange={setDraft}
        onReset={reset}
        onRetryRefs={() => void refs.refetch()}
        scopedWarehouses={scopedWarehouses}
      />

      <OpnamesDataView
        canManage={canManage}
        hasFilters={hasFilters}
        isError={query.isError}
        isLoading={query.isLoading}
        isMobile={isMobile}
        items={items}
        limit={params.limit}
        offset={params.offset}
        onOpenCreate={() => setFormOpen(true)}
        onPageChange={(nextOffset) => setParams((current) => ({ ...current, offset: nextOffset }))}
        onResetFilters={reset}
        onRetry={() => void query.refetch()}
        onSelectDetail={setDetailId}
        total={total}
      />

      {formOpen && (
        <OpnameFormDialog
          initialOpname={editingOpname}
          isSubmitting={create.isPending || update.isPending}
          onClose={() => {
            setFormOpen(false);
            setEditingOpname(null);
          }}
          onSubmit={createSession}
          onUpdate={updateSession}
          references={refs.data}
        />
      )}

      {detailId !== null && (
        <OpnameDetailModal
          can={can}
          isError={detail.isError}
          isLoading={detail.isLoading}
          onClose={() => setDetailId(null)}
          onEdit={(opname) => {
            setEditingOpname(opname);
            setFormOpen(true);
            setDetailId(null);
          }}
          onRetry={() => void detail.refetch()}
          opname={detail.data}
        />
      )}
    </>
  );
}
