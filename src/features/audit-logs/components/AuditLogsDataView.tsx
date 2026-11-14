import { Eye } from "lucide-react";
import { DataPagination, DataStateBanner, StatusBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditLog } from "../types";

function formatAuditDate(value: string) {
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
        {formatAuditDate(log.created_at)}
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

interface AuditLogsDataViewProps {
  items: AuditLog[];
  total: number;
  offset: number;
  pageSize: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isPermissionError: boolean;
  requestId?: string;
  isMobile: boolean;
  onRetry: () => void;
  onSelect: (log: AuditLog) => void;
  onPageChange: (nextOffset: number) => void;
}

export function AuditLogsDataView({
  items,
  total,
  offset,
  pageSize,
  isLoading,
  isFetching,
  isError,
  isPermissionError,
  requestId,
  isMobile,
  onRetry,
  onSelect,
  onPageChange,
}: AuditLogsDataViewProps) {
  if (isLoading) {
    return <DataStateBanner skeletonRows={5} state="loading" title="Memuat audit log..." />;
  }

  if (isError) {
    return (
      <DataStateBanner
        description={requestId ? `ID Permintaan: ${requestId}` : undefined}
        onRetry={isPermissionError ? undefined : onRetry}
        retryLabel="Muat ulang data"
        state="error"
        title={
          isPermissionError
            ? "Anda tidak memiliki izin melihat audit log."
            : "Data audit log belum dapat dimuat."
        }
      />
    );
  }

  if (total === 0) {
    return (
      <DataStateBanner
        description="Belum ada catatan audit log yang sesuai dengan filter."
        state="empty"
        title="Belum ada catatan audit log"
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      {isMobile ? (
        <ul aria-label="Daftar audit log" className="divide-y divide-border">
          {items.map((log) => (
            <li className="space-y-3 p-4" key={log.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Badge className="font-mono text-xs" variant="outline">
                    {log.action}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    {formatAuditDate(log.created_at)}
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
                onClick={() => onSelect(log)}
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
            {items.map((log) => (
              <AuditLogRow key={log.id} log={log} onSelect={onSelect} />
            ))}
          </TableBody>
        </Table>
      )}

      <DataPagination
        className="px-4 py-3"
        isLoading={isFetching}
        itemLabel="catatan"
        onPageChange={(nextPage) => onPageChange((nextPage - 1) * pageSize)}
        page={Math.floor(offset / pageSize) + 1}
        pageSize={pageSize}
        total={total}
      />
    </section>
  );
}
