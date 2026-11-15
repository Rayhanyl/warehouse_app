import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { badgeVariants } from "@/components/ui/badge-variants";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

interface StatusMeta {
  variant: BadgeVariant;
  label: string;
}

const STATUS_META_MAP: Record<string, StatusMeta> = {
  DRAFT: { variant: "outline", label: "Draft" },
  OPEN: { variant: "warning", label: "Terbuka" },
  PENDING: { variant: "warning", label: "Menunggu" },
  SUBMITTED: { variant: "info", label: "Diajukan" },
  PARTIAL: { variant: "warning", label: "Sebagian" },
  IN_PROGRESS: { variant: "info", label: "Diproses" },
  IN_TRANSIT: { variant: "info", label: "Dalam Pengiriman" },
  APPROVED: { variant: "default", label: "Disetujui" },
  COMPLETED: { variant: "default", label: "Selesai" },
  RECEIVED: { variant: "default", label: "Diterima" },
  POSTED: { variant: "default", label: "Terposting" },
  VERIFIED: { variant: "default", label: "Terverifikasi" },
  ACTIVE: { variant: "secondary", label: "Aktif" },
  SUCCESS: { variant: "default", label: "Berhasil" },
  CANCELLED: { variant: "destructive", label: "Dibatalkan" },
  CANCELED: { variant: "destructive", label: "Dibatalkan" },
  REJECTED: { variant: "destructive", label: "Ditolak" },
  INACTIVE: { variant: "outline", label: "Nonaktif" },
  LOCKED: { variant: "destructive", label: "Terkunci" },
  FAILED: { variant: "destructive", label: "Gagal" },
  ERROR: { variant: "destructive", label: "Galat" },
  EXPIRED: { variant: "destructive", label: "Kedaluwarsa" },
  INBOUND: { variant: "default", label: "Masuk" },
  OUTBOUND: { variant: "warning", label: "Keluar" },
  TRANSFER: { variant: "info", label: "Transfer" },
  ADJUSTMENT: { variant: "secondary", label: "Penyesuaian" },
  OPNAME: { variant: "info", label: "Stok Opname" },
};

export interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

/**
 * Badge status transaksi dan status entitas WMS yang terstandarisasi di atas shadcn Badge.
 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const normalized = status.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const matched = STATUS_META_MAP[normalized];

  return (
    <Badge
      variant={matched?.variant ?? "outline"}
      className={cn("font-medium", className)}
    >
      {label ?? matched?.label ?? status}
    </Badge>
  );
}
