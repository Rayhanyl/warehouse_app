import { FormEvent, useEffect, useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/usePermission";
import { useWarehouseScope } from "@/hooks/useWarehouseScope";
import { MasterNoticeBanner } from "../../components/MasterNoticeBanner";
import type { MasterFormSubmitError } from "../../errors";
import { downloadMasterCsv, type MasterPageNotice } from "../../utils";
import {
  buildWarehousesCsv,
  createWarehouse,
  fetchWarehouses,
  mapWarehouseApiError,
  updateWarehouse,
} from "../api";
import { WarehouseDeleteDialog } from "../components/WarehouseDeleteDialog";
import { WarehouseDetailDialog } from "../components/WarehouseDetailDialog";
import { WarehouseFormDialog } from "../components/WarehouseFormDialog";
import { WarehousesDataView } from "../components/WarehousesDataView";
import { WarehousesFilterBar } from "../components/WarehousesFilterBar";
import type {
  WarehouseFormPayload,
  WarehouseRecord,
  WarehouseStatusFilter,
} from "../types";

export function WarehousesPage() {
  const { can } = usePermission();
  const { activeWarehouseId, isWarehouseAllowed } = useWarehouseScope();
  const canManage = can("warehouse:manage") || can("master:manage");

  const [records, setRecords] = useState<WarehouseRecord[]>([]);
  const scopeKey = String(activeWarehouseId ?? "all");
  const [loadedScopeKey, setLoadedScopeKey] = useState<string | null>(null);
  const isLoading = loadedScopeKey !== scopeKey;
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<WarehouseStatusFilter>("all");
  const [draftStatus, setDraftStatus] = useState<WarehouseStatusFilter>("all");
  const [notice, setNotice] = useState<MasterPageNotice | null>(null);

  const [detailTarget, setDetailTarget] = useState<WarehouseRecord | null>(null);
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    warehouse: WarehouseRecord | null;
  }>({
    isOpen: false,
    mode: "create",
    warehouse: null,
  });
  const [confirmTarget, setConfirmTarget] = useState<WarehouseRecord | null>(
    null,
  );
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [formError, setFormError] = useState<MasterFormSubmitError | null>(null);
  const [isConfirmingStatus, setIsConfirmingStatus] = useState(false);
  const [confirmError, setConfirmError] =
    useState<MasterFormSubmitError | null>(null);

  useEffect(() => {
    let active = true;
    void fetchWarehouses({
      limit: 200,
      offset: 0,
      search: "",
      ...(activeWarehouseId !== null ? { warehouse_id: activeWarehouseId } : {}),
      status: "all",
      sort_by: "id",
      sort_dir: "asc",
    })
      .then((page) => {
        if (active) {
          setRecords(page.items);
          setLoadedScopeKey(scopeKey);
        }
      })
      .catch(() => {
        if (active) {
          setLoadedScopeKey(scopeKey);
          setNotice({
            type: "error",
            message:
              "Daftar gudang belum dapat dimuat. Periksa koneksi lalu coba lagi.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [activeWarehouseId, scopeKey]);

  const filteredWarehouses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records.filter((wh) => {
      if (!isWarehouseAllowed(wh.id)) {
        return false;
      }
      if (activeWarehouseId !== null && Number(wh.id) !== activeWarehouseId) {
        return false;
      }
      if (statusFilter === "active" && !wh.is_active) {
        return false;
      }
      if (statusFilter === "inactive" && wh.is_active) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        wh.code.toLocaleLowerCase().includes(query) ||
        wh.name.toLocaleLowerCase().includes(query) ||
        (wh.address ?? "").toLocaleLowerCase().includes(query)
      );
    });
  }, [activeWarehouseId, isWarehouseAllowed, records, search, statusFilter]);

  function notifySuccess(message: string) {
    setNotice({ type: "success", message });
    toast.success(message);
  }

  function handleApplyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(draftSearch);
    setStatusFilter(draftStatus);
  }

  function handleResetFilter() {
    setDraftSearch("");
    setDraftStatus("all");
    setSearch("");
    setStatusFilter("all");
  }

  function openCreateDialog() {
    setFormError(null);
    setFormState({ isOpen: true, mode: "create", warehouse: null });
  }

  function openEditDialog(warehouse: WarehouseRecord) {
    setFormError(null);
    setFormState({ isOpen: true, mode: "edit", warehouse });
  }

  async function handleSaveWarehouse(payload: WarehouseFormPayload) {
    setIsSavingForm(true);
    setFormError(null);
    try {
      if (formState.mode === "create") {
        const created = await createWarehouse(payload);
        setRecords((current) => [created, ...current]);
        setFormState({ isOpen: false, mode: "create", warehouse: null });
        notifySuccess(`Gudang "${created.name} (${created.code})" berhasil ditambahkan.`);
        return;
      }

      if (!formState.warehouse) {
        return;
      }

      const updated = await updateWarehouse(formState.warehouse.id, payload);
      setRecords((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setDetailTarget((current) =>
        current && current.id === updated.id ? updated : current,
      );
      setFormState({ isOpen: false, mode: "create", warehouse: null });
      notifySuccess(`Gudang "${updated.name} (${updated.code})" berhasil diperbarui.`);
    } catch (error) {
      const mapped = mapWarehouseApiError(error, "Gagal menyimpan gudang.");
      setFormError(mapped);
      toast.error(mapped.message);
    } finally {
      setIsSavingForm(false);
    }
  }

  async function handleConfirmToggle(warehouse: WarehouseRecord) {
    const nextActive = !warehouse.is_active;
    setIsConfirmingStatus(true);
    setConfirmError(null);
    try {
      const updated = await updateWarehouse(warehouse.id, {
        is_active: nextActive,
      });
      setRecords((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setDetailTarget((current) =>
        current && current.id === updated.id ? updated : current,
      );
      setConfirmTarget(null);
      notifySuccess(
        nextActive
          ? `Gudang "${updated.name}" berhasil diaktifkan kembali.`
          : `Gudang "${updated.name}" berhasil dinonaktifkan.`,
      );
    } catch (error) {
      const mapped = mapWarehouseApiError(error, "Gagal memperbarui status gudang.");
      setConfirmError(mapped);
      toast.error(mapped.message);
    } finally {
      setIsConfirmingStatus(false);
    }
  }

  function handleDownloadCsv() {
    downloadMasterCsv("gudang", buildWarehousesCsv(filteredWarehouses));
    notifySuccess(
      `Data gudang (${filteredWarehouses.length} baris) berhasil diunduh.`,
    );
  }

  return (
    <>
      <div className="no-print">
        <PageHeader
          action={
            <>
              <Button
                className="min-h-11 gap-2"
                onClick={handleDownloadCsv}
                type="button"
                variant="outline"
              >
                <Download aria-hidden="true" size={17} />
                Unduh CSV
              </Button>
              {canManage && (
                <Button
                  className="min-h-11 gap-2 bg-teal-600 hover:bg-teal-700"
                  onClick={openCreateDialog}
                  type="button"
                >
                  <Plus aria-hidden="true" size={17} />
                  Tambah gudang
                </Button>
              )}
            </>
          }
          description="Kelola fasilitas gudang beserta alamat dan kebijakan saldo stok negatif per gudang."
          title="Gudang"
        />

        <MasterNoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

        <WarehousesFilterBar
          activeCount={(search.trim() ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)}
          draftSearch={draftSearch}
          draftStatus={draftStatus}
          onReset={handleResetFilter}
          onSearchChange={setDraftSearch}
          onStatusChange={setDraftStatus}
          onSubmit={handleApplyFilter}
        />

        <WarehousesDataView
          canManage={canManage}
          isLoading={isLoading}
          onOpenDetail={setDetailTarget}
          onOpenEdit={openEditDialog}
          onOpenToggleStatus={(wh) => {
            setConfirmError(null);
            setConfirmTarget(wh);
          }}
          onResetFilters={handleResetFilter}
          warehouses={filteredWarehouses}
        />
      </div>

      <WarehouseDetailDialog
        canManage={canManage}
        onClose={() => setDetailTarget(null)}
        onEdit={openEditDialog}
        onToggleStatus={(warehouse) => {
          setConfirmError(null);
          setConfirmTarget(warehouse);
        }}
        warehouse={detailTarget}
      />

      <WarehouseFormDialog
        existingWarehouses={records}
        initialWarehouse={formState.warehouse}
        isOpen={formState.isOpen}
        isSubmitting={isSavingForm}
        key={`${formState.mode}-${formState.warehouse?.id ?? "new"}-${formState.isOpen ? "open" : "closed"}`}
        mode={formState.mode}
        onClose={() => {
          setFormError(null);
          setFormState((current) => ({ ...current, isOpen: false }));
        }}
        onSubmit={handleSaveWarehouse}
        submitError={formError}
      />

      <WarehouseDeleteDialog
        isSubmitting={isConfirmingStatus}
        onClose={() => {
          setConfirmError(null);
          setConfirmTarget(null);
        }}
        onConfirm={handleConfirmToggle}
        submitError={confirmError}
        warehouse={confirmTarget}
      />
    </>
  );
}
