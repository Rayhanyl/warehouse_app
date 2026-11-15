import { CalendarClock, Hash, Mail, ShieldCheck, UserCheck } from "lucide-react";

import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AuthUser } from "@/features/auth/store";

export interface ProfileIdentityCardProps {
  user: AuthUser | null;
}

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatOptionalDateTime(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateTimeFormatter.format(parsed);
}

/**
 * Kartu identitas utama pengguna yang menampilkan profil akun, status aktif, dan jejak waktu akun.
 */
export function ProfileIdentityCard({ user }: ProfileIdentityCardProps) {
  const initial = (user?.full_name || user?.username || "P")
    .charAt(0)
    .toUpperCase();
  const statusCode = user?.is_active === false ? "INACTIVE" : "ACTIVE";

  return (
    <Card aria-labelledby="profile-info-title" className="gap-5 py-5 sm:py-6">
      <CardHeader className="flex flex-row items-center gap-4 border-b border-border px-5 pb-5 sm:px-6">
        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-amber-600 text-xl font-bold text-surface-0">
          {initial}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle
              className="truncate text-lg font-bold text-ink-950"
              id="profile-info-title"
            >
              {user?.full_name || "Pengguna"}
            </CardTitle>
            <StatusBadge status={statusCode} />
          </div>
          <CardDescription className="truncate text-sm text-slate-600">
            @{user?.username ?? "-"}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-5 sm:px-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Hash aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={18} />
            <div className="min-w-0">
              <dt className="text-xs font-medium text-slate-600">ID Akun</dt>
              <dd className="mt-1 font-semibold text-ink-950 tabular-nums">
                {user?.id !== undefined ? `#${user.id}` : "-"}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={18} />
            <div className="min-w-0">
              <dt className="text-xs font-medium text-slate-600">Peran</dt>
              <dd className="mt-1 font-semibold text-ink-950">
                {user?.role_name || "Belum ditetapkan"}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:col-span-2">
            <Mail aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={18} />
            <div className="min-w-0">
              <dt className="text-xs font-medium text-slate-600">Email</dt>
              <dd className="mt-1 font-semibold break-all text-ink-950">
                {user?.email || "Belum tersedia"}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:col-span-2">
            <UserCheck aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={18} />
            <div className="min-w-0">
              <dt className="text-xs font-medium text-slate-600">Login Terakhir</dt>
              <dd className="mt-1 font-semibold text-ink-950">
                {formatOptionalDateTime(user?.last_login_at, "Belum pernah login")}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CalendarClock aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={18} />
            <div className="min-w-0">
              <dt className="text-xs font-medium text-slate-600">Dibuat Pada</dt>
              <dd className="mt-1 text-xs font-semibold text-ink-950">
                {formatOptionalDateTime(user?.created_at, "Belum tersedia")}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CalendarClock aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={18} />
            <div className="min-w-0">
              <dt className="text-xs font-medium text-slate-600">Terakhir Diperbarui</dt>
              <dd className="mt-1 text-xs font-semibold text-ink-950">
                {formatOptionalDateTime(user?.updated_at, "Belum tersedia")}
              </dd>
            </div>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
