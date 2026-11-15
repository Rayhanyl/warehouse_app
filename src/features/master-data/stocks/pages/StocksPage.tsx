import { FormEvent, useEffect, useMemo, useState } from "react";
import { Download, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { fetchCategories } from "@/features/master-data/categories/api";
import { fetchUoms } from "@/features/master-data/uoms/api";
import { usePermission } from "@/hooks/usePermission";
import { queryClient } from "@/lib/query-client";
import { invalidateMasterDependentCaches } from "@/lib/query-invalidation";
import { MasterNoticeBanner } from "../../components/MasterNoticeBanner";
import type { MasterFormSubmitError } from "../../errors";
import { downloadMasterCsv, type MasterPageNotice } from "../../utils";
import {
  buildStockItemsCsv,
  createStockItem,
  downloadStockItemsImportTemplate,
  fetchStockItems,
  mapStockApiError,
  updateStockItem,
} from "../api";
import { StockDeleteDialog } from "../components/StockDeleteDialog";
import { StockDetailDialog } from "../components/StockDetailDialog";
import { StockFormDialog } from "../components/StockFormDialog";
import { StockImportDialog } from "../components/StockImportDialog";
import { StocksDataView } from "../components/StocksDataView";
import { StocksFilterBar } from "../components/StocksFilterBar";
import type { StockCategoryOption, StockUomOption } from "../schemas";
import type {
  StockFormPayload,
  StockItem,
  StockStatusFilter,
} from "../types";

export function StocksPage() {
  const { can } = usePermission();
  const canManage = can("master:manage");

  const [records, setRecords] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>("all");
  const [draftStatus, setDraftStatus] = useState<StockStatusFilter>("all");
  const [notice, setNotice] = useState<MasterPageNotice | null>(null);

  const [detailTarget, setDetailTarget] = useState<StockItem | null>(null);
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    item: StockItem | null;
  }>({
    isOpen: false,
    mode: "create",
    item: null,
  });
  const [confirmTarget, setConfirmTarget] = useState<StockItem | null>(null);
  const [formError, setFormError] = useState<MasterFormSubmitError | null>(null);
  const [confirmError, setConfirmError] =
    useState<MasterFormSubmitError | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<StockCategoryOption[]>(
    [],
  );
  const [uomOptions, setUomOptions] = useState<StockUomOption[]>([]);

  useEffect(() => {
    let active = true;
    void fetchStockItems({
      limit: 200,
      offset: 0,
      search: "",
      status: "all",
      category_id: null,
      uom_id: null,
      sort_by: "id",
      sort_dir: "asc",
    })
      .then((page) => {
        if (active) {
          setRecords(page.items);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setIsLoading(false);
          setNotice({
            type: "error",
            message:
              "Daftar barang belum dapat dimuat. Periksa koneksi lalu coba lagi.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetchCategories({
        limit: 200,
        offset: 0,
        search: "",
        status: "active",
        sort_by: "name",
        sort_dir: "asc",
      }),
      fetchUoms({
        limit: 200,
        offset: 0,
        search: "",
        status: "active",
        sort_by: "name",
        sort_dir: "asc",
      }),
    ])
      .then(([categories, uoms]) => {
        if (!active) return;
        setCategoryOptions(
          categories.items.map(({ id, name }) => ({ id, name })),
        );
        setUomOptions(
          uoms.items.map(({ id, code, name, allow_decimal }) => ({
            id,
            code,
            name,
            allow_decimal,
          })),
        );
      })
      .catch(() => {
        if (active) {
          setNotice({
            type: "error",
            message: "Referensi kategori dan satuan ukur belum dapat dimuat.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records.filter((item) => {
      if (statusFilter === "active" && !item.is_active) {
        return false;
      }
      if (statusFilter === "inactive" && item.is_active) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        item.sku.toLocaleLowerCase().includes(query) ||
        Boolean(item.barcode && item.barcode.toLocaleLowerCase().includes(query)) ||
        item.name.toLocaleLowerCase().includes(query) ||
        item.category_name.toLocaleLowerCase().includes(query)
      );
    });
  }, [records, search, statusFilter]);

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
    setFormState({ isOpen: true, mode: "create", item: null });
  }

  function openEditDialog(item: StockItem) {
    setFormError(null);
    setFormState({ isOpen: true, mode: "edit", item });
  }

  async function handleSaveItem(payload: StockFormPayload) {
    if (isMutating) return;
    setFormError(null);
    setIsMutating(true);

    try {
      if (formState.mode === "create") {
        const created = await createStockItem({
          sku: payload.sku,
          barcode: payload.barcode ?? null,
          name: payload.name,
          description: payload.description,
          category_id: payload.category_id,
          uom_id: payload.uom_id,
          min_stock: payload.min_stock ?? "0",
          is_active: payload.is_active,
        });
        setRecords((current) => [created, ...current]);
        setSearch("");
        setDraftSearch("");
        setStatusFilter("all");
        setDraftStatus("all");
        setFormState({ isOpen: false, mode: "create", item: null });
        void invalidateMasterDependentCaches(queryClient);
        notifySuccess(`Barang "${created.name} (${created.sku})" berhasil ditambahkan.`);
        return;
      }

      if (!formState.item) {
        return;
      }

      const targetId = formState.item.id;
      const updated = await updateStockItem(targetId, {
        sku: payload.sku,
        barcode: payload.barcode ?? null,
        name: payload.name,
        description: payload.description,
        category_id: payload.category_id,
        uom_id: payload.uom_id,
        min_stock: payload.min_stock ?? "0",
        is_active: payload.is_active,
      });
      setRecords((current) =>
        current.map((item) => (item.id === targetId ? updated : item)),
      );
      setDetailTarget((current) => (current?.id === targetId ? updated : current));
      setFormState({ isOpen: false, mode: "create", item: null });
      void invalidateMasterDependentCaches(queryClient);
      notifySuccess(`Barang "${updated.name} (${updated.sku})" berhasil diperbarui.`);
    } catch (error) {
      const mapped = mapStockApiError(
        error,
        formState.mode === "create"
          ? "Barang baru belum dapat disimpan."
          : "Perubahan barang belum dapat disimpan.",
      );
      setFormError(mapped);
      toast.error(mapped.message);
    } finally {
      setIsMutating(false);
    }
  }

  async function handleConfirmToggle(item: StockItem) {
    if (isMutating) return;
    setConfirmError(null);
    setIsMutating(true);

    const nextActive = !item.is_active;
    try {
      const updated = await updateStockItem(item.id, { is_active: nextActive });
      setRecords((current) =>
        current.map((row) => (row.id === item.id ? updated : row)),
      );
      setDetailTarget((current) => (current?.id === item.id ? updated : current));
      setConfirmTarget(null);
      void invalidateMasterDependentCaches(queryClient);
      notifySuccess(
        updated.is_active
          ? `Barang "${updated.name}" berhasil diaktifkan kembali.`
          : `Barang "${updated.name}" berhasil dinonaktifkan.`,
      );
    } catch (error) {
      const mapped = mapStockApiError(
        error,
        nextActive
          ? "Barang belum dapat diaktifkan kembali."
          : "Barang belum dapat dinonaktifkan.",
      );
      setConfirmError(mapped);
      toast.error(mapped.message);
    } finally {
      setIsMutating(false);
    }
  }

  function handleDownloadCsv() {
    downloadMasterCsv("barang-sku", buildStockItemsCsv(filteredItems));
    notifySuccess(
      `Data barang (${filteredItems.length} baris) berhasil diunduh.`,
    );
  }

  async function handleDownloadImportTemplate() {
    try {
      const blob = await downloadStockItemsImportTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "template_import_barang.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setNotice({
        type: "error",
        message:
          "Template import belum dapat diunduh. Periksa koneksi lalu coba lagi.",
      });
    }
  }

  async function refreshStockItems() {
    try {
      const page = await fetchStockItems({
        limit: 200,
        offset: 0,
        search: "",
        status: "all",
        category_id: null,
        uom_id: null,
        sort_by: "id",
        sort_dir: "asc",
      });
      setRecords(page.items);
      void invalidateMasterDependentCaches(queryClient);
    } catch {
      setNotice({
        type: "error",
        message:
          "Import selesai, tetapi daftar barang belum dapat diperbarui.",
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
                    Tambah barang
                  </Button>
                </>
              )}
            </>
          }
          description="Kelola data master SKU yang mengacu pada satu kategori aktif dan satu satuan ukur dasar."
          title="Barang (SKU)"
        />

        <MasterNoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

        <StocksFilterBar
          activeCount={(search.trim() ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)}
          draftSearch={draftSearch}
          draftStatus={draftStatus}
          onReset={handleResetFilter}
          onSearchChange={setDraftSearch}
          onStatusChange={setDraftStatus}
          onSubmit={handleApplyFilter}
        />

        <StocksDataView
          canManage={canManage}
          isLoading={isLoading}
          items={filteredItems}
          onOpenDetail={setDetailTarget}
          onOpenEdit={openEditDialog}
          onOpenToggleStatus={(item) => {
            setConfirmError(null);
            setConfirmTarget(item);
          }}
          onResetFilters={handleResetFilter}
        />
      </div>

      <StockDetailDialog
        canManage={canManage}
        item={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={openEditDialog}
        onToggleStatus={(item) => {
          setConfirmError(null);
          setConfirmTarget(item);
        }}
      />

      <StockFormDialog
        categoryOptions={categoryOptions}
        existingItems={records}
        initialItem={formState.item}
        isOpen={formState.isOpen}
        isSubmitting={isMutating}
        key={`${formState.mode}-${formState.item?.id ?? "new"}-${formState.isOpen ? "open" : "closed"}`}
        mode={formState.mode}
        onClose={() => {
          setFormError(null);
          setFormState((current) => ({ ...current, isOpen: false }));
        }}
        onSubmit={handleSaveItem}
        submitError={formError}
        uomOptions={uomOptions}
      />

      <StockDeleteDialog
        isSubmitting={isMutating}
        item={confirmTarget}
        onClose={() => {
          setConfirmError(null);
          setConfirmTarget(null);
        }}
        onConfirm={handleConfirmToggle}
        submitError={confirmError}
      />

      {canManage && isImportOpen && (
        <StockImportDialog
          onClose={() => setIsImportOpen(false)}
          onDownloadTemplate={() => void handleDownloadImportTemplate()}
          onImported={refreshStockItems}
        />
      )}
    </>
  );
}
