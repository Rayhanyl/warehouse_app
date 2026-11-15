import { useEffect, useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/usePermission";
import { useWarehouseScope } from "@/hooks/useWarehouseScope";
import { queryClient } from "@/lib/query-client";
import { invalidateMasterDependentCaches } from "@/lib/query-invalidation";
import { MasterNoticeBanner } from "../../components/MasterNoticeBanner";
import type { MasterFormSubmitError } from "../../errors";
import { downloadMasterCsv, type MasterPageNotice } from "../../utils";
import {
  buildStorageLocationsCsv,
  createStorageLocation,
  fetchStorageLocationWarehouses,
  fetchStorageLocations,
  mapStorageLocationApiError,
  updateStorageLocation,
} from "../api";
import { StorageLocationDeleteDialog } from "../components/StorageLocationDeleteDialog";
import { StorageLocationDetailDialog } from "../components/StorageLocationDetailDialog";
import { StorageLocationFormDialog } from "../components/StorageLocationFormDialog";
import { StorageLocationsDataView } from "../components/StorageLocationsDataView";
import { StorageLocationsFilterBar } from "../components/StorageLocationsFilterBar";
import type {
  StorageLocationFormPayload,
  StorageLocationRecord,
  StorageLocationStatusFilter,
  StorageLocationWarehouseOption,
} from "../types";

export function StorageLocationsPage() {
  const { can } = usePermission();
  const { activeWarehouseId, filterWarehouseChoices, isWarehouseAllowed } =
    useWarehouseScope();
  const canManage = can("location:manage") || can("master:manage");

  const [locations, setLocations] = useState<StorageLocationRecord[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<
    StorageLocationWarehouseOption[]
  >([]);
  const scopeKey = String(activeWarehouseId ?? "all");
  const [loadedScopeKey, setLoadedScopeKey] = useState<string | null>(null);
  const isLoading = loadedScopeKey !== scopeKey;
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] =
    useState<StorageLocationStatusFilter>("all");
  const [banner, setBanner] = useState<MasterPageNotice | null>(null);

  const [detailTarget, setDetailTarget] =
    useState<StorageLocationRecord | null>(null);
  const [formState, setFormState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    record: StorageLocationRecord | null;
  }>({
    open: false,
    mode: "create",
    record: null,
  });
  const [deleteTarget, setDeleteTarget] =
    useState<StorageLocationRecord | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [formError, setFormError] = useState<MasterFormSubmitError | null>(null);
  const [isConfirmingDeactivate, setIsConfirmingDeactivate] = useState(false);
  const [deleteError, setDeleteError] = useState<MasterFormSubmitError | null>(
    null,
  );
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetchStorageLocations({
        limit: 200,
        offset: 0,
        search: "",
        warehouse_id:
          activeWarehouseId !== null ? String(activeWarehouseId) : null,
        status: "all",
      }),
      fetchStorageLocationWarehouses(),
    ])
      .then(([locationPage, warehouses]) => {
        if (!active) return;
        setLocations(locationPage.items);
        setWarehouseOptions(warehouses);
        setLoadedScopeKey(scopeKey);
      })
      .catch(() => {
        if (active) {
          setLoadedScopeKey(scopeKey);
          setBanner({
            type: "error",
            message:
              "Daftar lokasi penyimpanan belum dapat dimuat. Periksa koneksi lalu coba lagi.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [activeWarehouseId, scopeKey]);

  const scopedWarehouseOptions = useMemo(
    () => filterWarehouseChoices(warehouseOptions),
    [filterWarehouseChoices, warehouseOptions],
  );

  const filteredLocations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return locations.filter((item) => {
      if (!isWarehouseAllowed(item.warehouse_id)) {
        return false;
      }
      if (
        activeWarehouseId !== null &&
        Number(item.warehouse_id) !== activeWarehouseId
      ) {
        return false;
      }
      if (warehouseFilter !== "all" && item.warehouse_id !== warehouseFilter) {
        return false;
      }
      if (statusFilter === "active" && !item.is_active) {
        return false;
      }
      if (statusFilter === "inactive" && item.is_active) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return (
        item.code.toLowerCase().includes(normalizedQuery) ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.warehouse_code.toLowerCase().includes(normalizedQuery) ||
        item.warehouse_name.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [
    activeWarehouseId,
    isWarehouseAllowed,
    locations,
    searchQuery,
    warehouseFilter,
    statusFilter,
  ]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    warehouseFilter !== "all" ||
    statusFilter !== "all";

  const handleOpenCreate = () => {
    setFormError(null);
    setFormState({ open: true, mode: "create", record: null });
  };

  const handleOpenEdit = (location: StorageLocationRecord) => {
    setFormError(null);
    setFormState({ open: true, mode: "edit", record: location });
  };

  const handleFormSubmit = async (payload: StorageLocationFormPayload) => {
    setIsSavingForm(true);
    setFormError(null);
    try {
      if (formState.mode === "create") {
        const created = await createStorageLocation({
          warehouse_id: payload.warehouse_id,
          code: payload.code,
          name: payload.name,
          is_active: payload.is_active,
        });
        setLocations((prev) => [created, ...prev]);
        setSearchQuery("");
        setWarehouseFilter("all");
        setStatusFilter("all");
        setFormState({ open: false, mode: "create", record: null });
        void invalidateMasterDependentCaches(queryClient);
        const message = `Lokasi penyimpanan "${created.name}" (${created.code}) berhasil ditambahkan.`;
        setBanner({ type: "success", message });
        toast.success(message);
        return;
      }

      if (formState.mode === "edit" && formState.record) {
        const updated = await updateStorageLocation(formState.record.id, {
          code: payload.code,
          name: payload.name,
          is_active: payload.is_active,
        });
        setLocations((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        setDetailTarget((prev) =>
          prev && prev.id === updated.id ? updated : prev,
        );
        setFormState({ open: false, mode: "create", record: null });
        void invalidateMasterDependentCaches(queryClient);
        const message = `Lokasi penyimpanan "${updated.name}" (${updated.code}) berhasil diperbarui.`;
        setBanner({ type: "success", message });
        toast.success(message);
      }
    } catch (error) {
      const mapped = mapStorageLocationApiError(
        error,
        "Gagal menyimpan lokasi penyimpanan.",
      );
      setFormError(mapped);
      toast.error(mapped.message);
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleConfirmDeactivate = async (location: StorageLocationRecord) => {
    setIsConfirmingDeactivate(true);
    setDeleteError(null);
    try {
      const updated = await updateStorageLocation(location.id, {
        is_active: false,
      });
      setLocations((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setDetailTarget((prev) =>
        prev && prev.id === updated.id ? updated : prev,
      );
      setDeleteTarget(null);
      void invalidateMasterDependentCaches(queryClient);
      const message = `Lokasi penyimpanan "${updated.name}" berhasil dinonaktifkan.`;
      setBanner({ type: "success", message });
      toast.success(message);
    } catch (error) {
      const mapped = mapStorageLocationApiError(
        error,
        "Gagal menonaktifkan lokasi penyimpanan.",
      );
      setDeleteError(mapped);
      toast.error(mapped.message);
    } finally {
      setIsConfirmingDeactivate(false);
    }
  };

  const handleReactivate = async (location: StorageLocationRecord) => {
    setReactivatingId(location.id);
    try {
      const updated = await updateStorageLocation(location.id, {
        is_active: true,
      });
      setLocations((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setDetailTarget((prev) =>
        prev && prev.id === updated.id ? updated : prev,
      );
      void invalidateMasterDependentCaches(queryClient);
      const message = `Lokasi penyimpanan "${updated.name}" berhasil diaktifkan kembali.`;
      setBanner({ type: "success", message });
      toast.success(message);
    } catch (error) {
      const mapped = mapStorageLocationApiError(
        error,
        "Gagal mengaktifkan kembali lokasi penyimpanan.",
      );
      setBanner({ type: "error", message: mapped.message });
      toast.error(mapped.message);
    } finally {
      setReactivatingId(null);
    }
  };

  const handleDownloadCsv = () => {
    if (filteredLocations.length === 0) {
      setBanner({
        type: "error",
        message:
          "Tidak ada data lokasi penyimpanan untuk diunduh pada filter saat ini.",
      });
      return;
    }

    try {
      downloadMasterCsv(
        "lokasi-penyimpanan",
        `\uFEFF${buildStorageLocationsCsv(filteredLocations)}`,
      );
      setBanner({
        type: "success",
        message: `Berhasil mengunduh ${filteredLocations.length} baris data lokasi penyimpanan (CSV).`,
      });
    } catch {
      setBanner({
        type: "error",
        message: "Gagal membuat file unduhan data lokasi penyimpanan.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="no-print space-y-6">
        <PageHeader
          title="Lokasi Penyimpanan"
          description="Kelola daftar zona karantina, lorong rak, dan bin penyimpanan di setiap gudang."
          action={
            <>
              <Button
                className="min-h-11 gap-2"
                disabled={filteredLocations.length === 0}
                onClick={handleDownloadCsv}
                type="button"
                variant="outline"
              >
                <Download aria-hidden="true" className="h-4 w-4 text-slate-600" />
                <span>Unduh CSV</span>
              </Button>
              {canManage ? (
                <Button
                  className="min-h-11 gap-2 bg-emerald-800 hover:bg-emerald-900"
                  onClick={handleOpenCreate}
                  type="button"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  <span>Tambah lokasi</span>
                </Button>
              ) : null}
            </>
          }
        />

        <MasterNoticeBanner notice={banner} onDismiss={() => setBanner(null)} />

        <section
          aria-label="Filter dan daftar lokasi penyimpanan"
          className="rounded-lg border border-slate-200 bg-white shadow-xs"
        >
          <StorageLocationsFilterBar
            onSearchChange={setSearchQuery}
            onStatusChange={setStatusFilter}
            onWarehouseChange={setWarehouseFilter}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            warehouseFilter={warehouseFilter}
            warehouseOptions={scopedWarehouseOptions}
          />

          <StorageLocationsDataView
            canManage={canManage}
            filteredLocations={filteredLocations}
            hasActiveFilters={hasActiveFilters}
            isLoading={isLoading}
            onOpenDeactivate={(location) => {
              setDeleteError(null);
              setDeleteTarget(location);
            }}
            onOpenDetail={setDetailTarget}
            onOpenEdit={handleOpenEdit}
            onReactivate={(location) => void handleReactivate(location)}
            reactivatingId={reactivatingId}
            totalLocationsCount={locations.length}
          />
        </section>
      </div>

      <StorageLocationDetailDialog
        location={detailTarget}
        canManage={canManage}
        onClose={() => setDetailTarget(null)}
        onEdit={handleOpenEdit}
      />

      <StorageLocationFormDialog
        open={formState.open}
        mode={formState.mode}
        initialData={formState.record}
        warehouseOptions={scopedWarehouseOptions}
        existingLocations={locations}
        isSubmitting={isSavingForm}
        submitError={formError}
        onClose={() => {
          setFormError(null);
          setFormState({ open: false, mode: "create", record: null });
        }}
        onSubmit={handleFormSubmit}
      />

      <StorageLocationDeleteDialog
        location={deleteTarget}
        isSubmitting={isConfirmingDeactivate}
        submitError={deleteError}
        onClose={() => {
          setDeleteError(null);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
}
