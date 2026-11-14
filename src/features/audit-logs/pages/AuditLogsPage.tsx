import { useState } from "react";
import { Eye, Filter, RotateCcw, ShieldAlert } from "lucide-react";
import axios from "axios";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPagination, DataStateBanner, StatusBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/useIsMobile";
import { extractApiErrorInfo } from "@/lib/errors";
import { useAuditLogs } from "../api";
import { AuditLogDetailModal } from "../components/AuditLogDetailModal";
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

const CATEGORY_TABS: { value: "all" | Exclude<AuditLogCategory, "">; label: string }[] = [
  { value: "all", label: "Semua Aktivitas" },
  { value: "business", label: "Aktivitas Bisnis & Data" },
  { value: "security", label: "Autentikasi & Keamanan" },
  { value: "failed", label: "Aktivitas Gagal" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function AuditLogRow({
  log,
  onSelect,
}: {
  log: AuditLog;
  onSelect: (entry: AuditLog) => void;
}) {
  return (
    <TableRow className="align-top">
      <TableCell className="px-4 py-4 text-xs text-muted-foreground tabular-nums">
        {formatDate(log.created_at)}
      </TableCell>
      <TableCell className="px-4 py-4">
        <p className="font-semibold text-foreground">{log.username || "Sistem"}</p>
        {log.user_id !== null && (
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            ID #{log.user_id}
          </p>
        )}
      </TableCell>
      <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground tabular-nums">
        {log.ip_address || "-"}
      </TableCell>
      <TableCell className="px-4 py-4">
        <Badge className="font-mono text-xs" variant="outline">
          {log.action}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-4">
        <StatusBadge status={log.status} />
      </TableCell>
      <TableCell className="px-4 py-4 text-sm">
        <p className="font-semibold text-foreground">{log.entity_type}</p>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          ID: {log.entity_id || "-"}
        </p>
      </TableCell>
      <TableCell className="px-4 py-4 text-right">
        <Button
          className="text-teal-700 hover:bg-teal-50 hover:text-teal-800"
          onClick={() => onSelect(log)}
          size="sm"
          variant="ghost"
        >
          <Eye aria-hidden="true" className="size-4" />
          Detail
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function AuditLogsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const { data, isLoading, isFetching, isError, error, refetch } = useAuditLogs(
    filters,
    offset,
  );
  const pageSize = data?.limit ?? 20;
  const total = data?.total ?? 0;
  const isPermissionError =
    axios.isAxiosError(error) && error.response?.status === 403;
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

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOffset(0);
    setFilters(draftFilters);
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

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          onValueChange={handleCategoryTabChange}
          value={filters.category || "all"}
        >
          <TabsList aria-label="Kategori aktivitas audit log" className="h-auto flex-wrap justify-start">
            {CATEGORY_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {!filters.include_technical && (
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldAlert aria-hidden="true" className="size-3.5 text-teal-700" />
            <span>Noise teknis refresh token disembunyikan otomatis</span>
          </p>
        )}
      </div>

      <CollapsibleFilterPanel
        activeCount={activeFilterCount}
        ariaLabel="Filter audit log"
        className="mb-6 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5"
      >
        <form
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          onSubmit={applyFilters}
        >
          <label className="text-sm font-semibold text-foreground">
            Pencarian
            <Input
              className="mt-2 h-11 bg-card"
              onChange={(event) =>
                setDraftFilters({ ...draftFilters, search: event.target.value })
              }
              placeholder="Username, aksi, IP, atau Request ID"
              value={draftFilters.search}
            />
          </label>
          <label className="text-sm font-semibold text-foreground">
            Status aksi
            <select
              className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3 text-sm font-normal text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onChange={(event) =>
                setDraftFilters({
                  ...draftFilters,
                  status: event.target.value as AuditLogFilters["status"],
                })
              }
              value={draftFilters.status}
            >
              <option value="">Semua status</option>
              <option value="SUCCESS">Berhasil (SUCCESS)</option>
              <option value="FAILED">Gagal (FAILED)</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-foreground">
            Aksi
            <Input
              className="mt-2 h-11 bg-card"
              onChange={(event) =>
                setDraftFilters({ ...draftFilters, action: event.target.value })
              }
              placeholder="Contoh: USER_UPDATED"
              value={draftFilters.action}
            />
          </label>
          <label className="text-sm font-semibold text-foreground">
            Jenis entitas
            <Input
              className="mt-2 h-11 bg-card"
              onChange={(event) =>
                setDraftFilters({
                  ...draftFilters,
                  entity_type: event.target.value,
                })
              }
              placeholder="Contoh: users"
              value={draftFilters.entity_type}
            />
          </label>
          <label className="text-sm font-semibold text-foreground">
            Dari tanggal
            <Input
              className="mt-2 h-11 bg-card"
              onChange={(event) =>
                setDraftFilters({
                  ...draftFilters,
                  date_from: event.target.value,
                })
              }
              type="datetime-local"
              value={draftFilters.date_from}
            />
          </label>
          <label className="text-sm font-semibold text-foreground">
            Sampai tanggal
            <Input
              className="mt-2 h-11 bg-card"
              onChange={(event) =>
                setDraftFilters({
                  ...draftFilters,
                  date_to: event.target.value,
                })
              }
              type="datetime-local"
              value={draftFilters.date_to}
            />
          </label>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
              <input
                checked={draftFilters.include_technical}
                className="size-4 rounded border-input accent-teal-600"
                onChange={(event) =>
                  setDraftFilters({
                    ...draftFilters,
                    include_technical: event.target.checked,
                  })
                }
                type="checkbox"
              />
              <span>Sertakan log teknis historis (AUTH_TOKEN_REFRESHED)</span>
            </label>
          </div>
          <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-3">
            <Button className="flex-1 sm:flex-initial" type="submit">
              <Filter aria-hidden="true" className="size-4" />
              Terapkan filter
            </Button>
            <Button
              className="flex-1 sm:flex-initial"
              onClick={resetFilters}
              type="button"
              variant="outline"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Atur ulang filter
            </Button>
          </div>
        </form>
      </CollapsibleFilterPanel>

      {isLoading ? (
        <DataStateBanner skeletonRows={5} state="loading" title="Memuat audit log..." />
      ) : isError ? (
        <DataStateBanner
          description={errorInfo?.requestId ? `ID Permintaan: ${errorInfo.requestId}` : undefined}
          onRetry={isPermissionError ? undefined : () => void refetch()}
          retryLabel="Muat ulang data"
          state="error"
          title={
            isPermissionError
              ? "Anda tidak memiliki izin melihat audit log."
              : "Data audit log belum dapat dimuat."
          }
        />
      ) : total === 0 ? (
        <DataStateBanner
          description="Belum ada catatan audit log yang sesuai dengan filter."
          state="empty"
          title="Belum ada catatan audit log"
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          {isMobile ? (
            <ul aria-label="Daftar audit log" className="divide-y divide-border">
              {data?.items.map((log) => (
                <li className="space-y-3 p-4" key={log.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Badge className="font-mono text-xs" variant="outline">
                        {log.action}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                    <StatusBadge className="shrink-0" status={log.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Pelaku</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {log.username || "Sistem"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IP Address</p>
                      <p className="mt-0.5 font-mono font-semibold text-foreground tabular-nums">
                        {log.ip_address || "-"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Entitas</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {log.entity_type} · ID: {log.entity_id || "-"}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                    onClick={() => setSelectedLog(log)}
                    size="sm"
                    variant="outline"
                  >
                    <Eye aria-hidden="true" className="size-4" />
                    Detail
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Table className="min-w-[920px]">
              <TableCaption className="sr-only">Daftar audit log</TableCaption>
              <TableHeader className="bg-muted/50 text-xs uppercase tracking-wider">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 py-3 font-bold">Waktu</TableHead>
                  <TableHead className="px-4 py-3 font-bold">Pelaku</TableHead>
                  <TableHead className="px-4 py-3 font-bold">IP Address</TableHead>
                  <TableHead className="px-4 py-3 font-bold">Aksi</TableHead>
                  <TableHead className="px-4 py-3 font-bold">Status</TableHead>
                  <TableHead className="px-4 py-3 font-bold">Entitas</TableHead>
                  <TableHead className="px-4 py-3 text-right font-bold">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((log) => (
                  <AuditLogRow
                    key={log.id}
                    log={log}
                    onSelect={setSelectedLog}
                  />
                ))}
              </TableBody>
            </Table>
          )}
          <DataPagination
            className="px-4 py-3"
            isLoading={isFetching}
            itemLabel="catatan"
            onPageChange={(nextPage) => setOffset((nextPage - 1) * pageSize)}
            page={Math.floor(offset / pageSize) + 1}
            pageSize={pageSize}
            total={total}
          />
        </section>
      )}
      <AuditLogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </>
  );
}
