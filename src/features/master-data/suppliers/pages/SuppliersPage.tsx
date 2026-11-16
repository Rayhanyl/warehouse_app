import { FormEvent, useEffect, useMemo, useState } from "react";
import { Download, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/usePermission";
import { queryClient } from "@/lib/query-client";
import { invalidateMasterDependentCaches } from "@/lib/query-invalidation";
import { MasterNoticeBanner } from "../../components/MasterNoticeBanner";
import type { MasterFormSubmitError } from "../../errors";
import { downloadMasterCsv, type MasterPageNotice } from "../../utils";
import {
  buildSuppliersCsv,
  createSupplier,
  downloadSupplierImportTemplate,
  fetchSuppliers,
  mapSupplierApiError,
  updateSupplier,
} from "../api";
import { SupplierDeleteDialog } from "../components/SupplierDeleteDialog";
import { SupplierDetailDialog } from "../components/SupplierDetailDialog";
import { SupplierFormDialog } from "../components/SupplierFormDialog";
import { SupplierImportDialog } from "../components/SupplierImportDialog";
import { SuppliersDataView } from "../components/SuppliersDataView";
import { SuppliersFilterBar } from "../components/SuppliersFilterBar";
import type {
  Supplier,
  SupplierFormPayload,
  SupplierStatusFilter,
} from "../types";

export function SuppliersPage() {
  const { can } = usePermission();
  const canManage = can("master:manage");

  const [records, setRecords] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupplierStatusFilter>("all");
  const [draftStatus, setDraftStatus] = useState<SupplierStatusFilter>("all");
  const [notice, setNotice] = useState<MasterPageNotice | null>(null);

  const [detailTarget, setDetailTarget] = useState<Supplier | null>(null);
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    supplier: Supplier | null;
  }>({
    isOpen: false,
    mode: "create",
    supplier: null,
  });
  const [confirmTarget, setConfirmTarget] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState<MasterFormSubmitError | null>(null);
  const [confirmError, setConfirmError] =
    useState<MasterFormSubmitError | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchSuppliers({
      limit,
      offset,
      search,
      status: statusFilter,
      sort_by: "id",
      sort_dir: "asc",
    })
      .then((page) => {
        if (active) {
          setRecords(page.items);
          setTotal(page.total ?? page.items.length);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setIsLoading(false);
          setNotice({
            type: "error",
            message:
              "Daftar pemasok belum dapat dimuat. Periksa koneksi lalu coba lagi.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [limit, offset, search, statusFilter]);

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records.filter((supplier) => {
      if (statusFilter === "active" && !supplier.is_active) {
        return false;
      }
      if (statusFilter === "inactive" && supplier.is_active) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        supplier.code.toLocaleLowerCase().includes(query) ||
        supplier.name.toLocaleLowerCase().includes(query) ||
        (supplier.contact_person ?? "").toLocaleLowerCase().includes(query)
      );
    });
  }, [records, search, statusFilter]);

  const effectiveTotal =
    filteredSuppliers.length < records.length
      ? filteredSuppliers.length
      : Math.max(total, filteredSuppliers.length);

  function notifySuccess(message: string) {
    setNotice({ type: "success", message });
    toast.success(message);
  }

  function handleApplyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOffset(0);
    setSearch(draftSearch.trim());
    setStatusFilter(draftStatus);
  }

  function handleResetFilter() {
    setDraftSearch("");
    setDraftStatus("all");
    setOffset(0);
    setSearch("");
    setStatusFilter("all");
  }

  function openCreateDialog() {
    setFormError(null);
    setFormState({ isOpen: true, mode: "create", supplier: null });
  }

  function openEditDialog(supplier: Supplier) {
    setFormError(null);
    setFormState({ isOpen: true, mode: "edit", supplier });
  }

  async function handleSaveSupplier(payload: SupplierFormPayload) {
    if (isMutating) return;
    setFormError(null);
    setIsMutating(true);

    try {
      if (formState.mode === "create") {
        const created = await createSupplier(payload);
        setRecords((current) => [created, ...current]);
        setSearch("");
        setDraftSearch("");
        setStatusFilter("all");
        setDraftStatus("all");
        setFormState({ isOpen: false, mode: "create", supplier: null });
        void invalidateMasterDependentCaches(queryClient);
        notifySuccess(`Pemasok "${created.name}" berhasil ditambahkan.`);
        return;
      }

      if (!formState.supplier) {
        return;
      }

      const targetId = formState.supplier.id;
      const updated = await updateSupplier(targetId, payload);
      setRecords((current) =>
        current.map((item) => (item.id === targetId ? updated : item)),
      );
      setDetailTarget((current) => (current?.id === targetId ? updated : current));
      setFormState({ isOpen: false, mode: "create", supplier: null });
      void invalidateMasterDependentCaches(queryClient);
      notifySuccess(`Pemasok "${updated.name}" berhasil diperbarui.`);
    } catch (error) {
      const mapped = mapSupplierApiError(
        error,
        formState.mode === "create"
          ? "Pemasok baru belum dapat disimpan."
          : "Perubahan data pemasok belum dapat disimpan.",
      );
      setFormError(mapped);
      toast.error(mapped.message);
    } finally {
      setIsMutating(false);
    }
  }

  async function handleConfirmToggle(supplier: Supplier) {
    if (isMutating) return;
    setConfirmError(null);
    setIsMutating(true);

    const nextActive = !supplier.is_active;
    try {
      const updated = await updateSupplier(supplier.id, { is_active: nextActive });
      setRecords((current) =>
        current.map((item) => (item.id === supplier.id ? updated : item)),
      );
      setDetailTarget((current) =>
        current?.id === supplier.id ? updated : current,
      );
      setConfirmTarget(null);
      void invalidateMasterDependentCaches(queryClient);
      notifySuccess(
        updated.is_active
          ? `Pemasok "${updated.name}" berhasil diaktifkan kembali.`
          : `Pemasok "${updated.name}" berhasil dinonaktifkan.`,
      );
    } catch (error) {
      const mapped = mapSupplierApiError(
        error,
        nextActive
          ? "Pemasok belum dapat diaktifkan kembali."
          : "Pemasok belum dapat dinonaktifkan.",
      );
      setConfirmError(mapped);
      toast.error(mapped.message);
    } finally {
      setIsMutating(false);
    }
  }

  function handleDownloadCsv() {
    downloadMasterCsv("pemasok", buildSuppliersCsv(filteredSuppliers));
    notifySuccess(
      `Data pemasok (${filteredSuppliers.length} baris) berhasil diunduh.`,
    );
  }

  async function handleDownloadImportTemplate() {
    try {
      const blob = await downloadSupplierImportTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "template_import_supplier.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      const message =
        "Template import pemasok belum dapat diunduh. Periksa koneksi lalu coba lagi.";
      setNotice({ type: "error", message });
      toast.error(message);
    }
  }

  async function refreshSuppliers() {
    try {
      const page = await fetchSuppliers({
        limit,
        offset,
        search,
        status: statusFilter,
        sort_by: "id",
        sort_dir: "asc",
      });
      setRecords(page.items);
      setTotal(page.total ?? page.items.length);
      void invalidateMasterDependentCaches(queryClient);
    } catch {
      setNotice({
        type: "error",
        message: "Import selesai, tetapi daftar pemasok belum dapat diperbarui.",
      });
    }
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
              <Button
                className="min-h-11 gap-2"
                onClick={() => void handleDownloadImportTemplate()}
                type="button"
                variant="outline"
              >
                <Download aria-hidden="true" size={17} />
                Unduh template
              </Button>
              {canManage && (
                <>
                  <Button
                    className="min-h-11 gap-2 border-teal-600 text-teal-700 hover:bg-teal-100"
                    onClick={() => setIsImportOpen(true)}
                    type="button"
                    variant="outline"
                  >
                    <Upload aria-hidden="true" size={17} />
                    Import Excel
                  </Button>
                  <Button
                    className="min-h-11 gap-2 bg-teal-600 hover:bg-teal-700"
                    onClick={openCreateDialog}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={17} />
                    Tambah pemasok
                  </Button>
                </>
              )}
            </>
          }
          description="Kelola data rekanan pemasok untuk penerbitan purchase order dan penerimaan barang."
          title="Pemasok (supplier)"
        />

        <MasterNoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

        <SuppliersFilterBar
          activeCount={(search.trim() ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)}
          draftSearch={draftSearch}
          draftStatus={draftStatus}
          onReset={handleResetFilter}
          onSearchChange={setDraftSearch}
          onStatusChange={setDraftStatus}
          onSubmit={handleApplyFilter}
        />

        <SuppliersDataView
          canManage={canManage}
          isLoading={isLoading}
          limit={limit}
          offset={offset}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setOffset(0);
          }}
          onOffsetChange={setOffset}
          onOpenDetail={setDetailTarget}
          onOpenEdit={openEditDialog}
          onOpenToggleStatus={(supplier) => {
            setConfirmError(null);
            setConfirmTarget(supplier);
          }}
          onResetFilters={handleResetFilter}
          suppliers={filteredSuppliers}
          total={effectiveTotal}
        />
      </div>

      <SupplierDetailDialog
        canManage={canManage}
        onClose={() => setDetailTarget(null)}
        onEdit={openEditDialog}
        onToggleStatus={(supplier) => {
          setConfirmError(null);
          setConfirmTarget(supplier);
        }}
        supplier={detailTarget}
      />

      <SupplierFormDialog
        existingSuppliers={records}
        initialSupplier={formState.supplier}
        isOpen={formState.isOpen}
        isSubmitting={isMutating}
        key={`${formState.mode}-${formState.supplier?.id ?? "new"}-${formState.isOpen ? "open" : "closed"}`}
        mode={formState.mode}
        onClose={() => {
          setFormError(null);
          setFormState((current) => ({ ...current, isOpen: false }));
        }}
        onSubmit={handleSaveSupplier}
        submitError={formError}
      />

      <SupplierDeleteDialog
        isSubmitting={isMutating}
        onClose={() => {
          setConfirmError(null);
          setConfirmTarget(null);
        }}
        onConfirm={handleConfirmToggle}
        submitError={confirmError}
        supplier={confirmTarget}
      />

      {canManage && isImportOpen && (
        <SupplierImportDialog
          onClose={() => setIsImportOpen(false)}
          onDownloadTemplate={() => void handleDownloadImportTemplate()}
          onImported={refreshSuppliers}
        />
      )}
    </>
  );
}
