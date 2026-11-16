import { type FormEvent, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useIsMobile } from "@/hooks/useIsMobile";
import { extractApiErrorInfo } from "@/lib/errors";
import { useAuditLogs } from "../api";
import { AuditLogDetailModal } from "../components/AuditLogDetailModal";
import { AuditLogsDataView } from "../components/AuditLogsDataView";
import { AuditLogsFilterBar } from "../components/AuditLogsFilterBar";
import type { AuditLog, AuditLogCategory, AuditLogFilters } from "../types";

const initialFilters: AuditLogFilters = {
  search: "",
  status: "",
  category: "",
  include_technical: false,
  action: "",
  entity_type: "",
  date_from: "",
  date_to: "",
};

export function AuditLogsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const { data, isLoading, isFetching, isError, error, refetch } = useAuditLogs(filters, offset);
  const pageSize = data?.limit ?? 20;
  const total = data?.total ?? 0;
  const isPermissionError = axios.isAxiosError(error) && error.response?.status === 403;
  const errorInfo = isError ? extractApiErrorInfo(error) : null;
  const isMobile = useIsMobile();

  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.category,
    filters.include_technical ? "1" : "",
    filters.action,
    filters.entity_type,
    filters.date_from,
    filters.date_to,
  ].filter(Boolean).length;

  function handleCategoryTabChange(nextValue: string) {
    const nextCategory = (nextValue === "all" ? "" : nextValue) as AuditLogCategory;
    setOffset(0);
    setDraftFilters((current) => ({ ...current, category: nextCategory }));
    setFilters((current) => ({ ...current, category: nextCategory }));
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      draftFilters.date_from &&
      draftFilters.date_to &&
      draftFilters.date_from > draftFilters.date_to
    ) {
      toast.error("Tanggal mulai tidak boleh lebih akhir dari tanggal akhir.");
      return;
    }
    setOffset(0);
    setFilters({ ...draftFilters, search: draftFilters.search.trim() });
  }

  function resetFilters() {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setOffset(0);
  }

  return (
    <>
      <PageHeader
        description="Telusuri aktivitas pengguna, status eksekusi, IP address, dan perubahan data sistem secara baca-saja."
        title="Audit log"
      />

      <AuditLogsFilterBar
        activeCategory={filters.category}
        activeFilterCount={activeFilterCount}
        draftFilters={draftFilters}
        includeTechnicalActive={filters.include_technical}
        onApply={applyFilters}
        onCategoryChange={handleCategoryTabChange}
        onDraftChange={setDraftFilters}
        onReset={resetFilters}
      />

      <AuditLogsDataView
        isError={isError}
        isFetching={isFetching}
        isLoading={isLoading}
        isMobile={isMobile}
        isPermissionError={isPermissionError}
        items={data?.items ?? []}
        offset={offset}
        onPageChange={setOffset}
        onRetry={() => void refetch()}
        onSelect={setSelectedLog}
        pageSize={pageSize}
        requestId={errorInfo?.requestId ?? undefined}
        total={total}
      />

      <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  );
}
