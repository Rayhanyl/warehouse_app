import { type FormEvent, useState } from "react";
import { Edit3, Search } from "lucide-react";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import { useIsMobile } from "@/hooks/useIsMobile";
import { type UserParams, useAdminUsers } from "../api";
import type { AdminUser } from "../types";
import {
  AdminDataFrame,
  AdminFilterBar,
  AdminPagination,
  AdminSelectFilter,
  AdminState,
  AdminTh,
} from "./AdminShared";
import { formatAdminDate } from "../utils";

export function UsersPanel({
  query,
  params,
  onParamsChange,
  onEdit,
}: {
  query: ReturnType<typeof useAdminUsers>;
  params: UserParams;
  onParamsChange: (params: UserParams) => void;
  onEdit: (user: AdminUser) => void;
}) {
  const isMobile = useIsMobile();
  const [draftSearch, setDraftSearch] = useState(params.search);
  const total = query.data?.total ?? 0;

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    onParamsChange({ ...params, search: draftSearch.trim(), offset: 0 });
  }

  if (query.isLoading) {
    return <AdminState text="Memuat daftar pengguna..." />;
  }
  if (query.isError) {
    return (
      <AdminState
        error
        onRetry={() => void query.refetch()}
        text="Daftar pengguna belum dapat dimuat."
      />
    );
  }

  const items = query.data?.items ?? [];
  const activeCount = [params.search, params.is_active].filter(Boolean).length;

  return (
    <>
      <CollapsibleFilterPanel
        activeCount={activeCount}
        ariaLabel="Filter pengguna"
        className="mb-4 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)]"
      >
        <AdminFilterBar onSubmit={applyFilters}>
          <label className="min-w-0 flex-1 text-sm font-semibold">
            Cari pengguna
            <div className="relative mt-2">
              <Search aria-hidden="true" className="absolute left-3 top-3 text-slate-500" size={16} />
              <input
                className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 pl-9 pr-3 text-sm font-normal"
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Nama, username, atau email"
                value={draftSearch}
              />
            </div>
          </label>
          <AdminSelectFilter
            label="Status"
            onChange={(value) => onParamsChange({ ...params, is_active: value, offset: 0 })}
            options={[
              ["", "Semua status"],
              ["true", "Aktif"],
              ["false", "Nonaktif"],
            ]}
            value={params.is_active}
          />
        </AdminFilterBar>
      </CollapsibleFilterPanel>

      <AdminDataFrame
        empty={items.length === 0}
        text={
          params.search || params.is_active
            ? "Tidak ada pengguna yang cocok dengan filter."
            : "Belum ada pengguna terdaftar."
        }
      >
        {isMobile ? (
          <ul aria-label="Daftar pengguna" className="divide-y divide-line-200">
            {items.map((user) => (
              <li className="space-y-3 p-4" key={user.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-950">{user.full_name}</p>
                    <p className="text-xs text-slate-600">
                      {user.username} · {user.email}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      user.is_active ? "bg-teal-100 text-teal-700" : "bg-canvas-50 text-slate-700"
                    }`}
                  >
                    {user.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-canvas-50/70 p-3 text-xs">
                  <div>
                    <p className="text-slate-600">Peran</p>
                    <p className="mt-0.5 font-semibold text-ink-950">{user.role_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Gudang</p>
                    <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                      {user.warehouse_ids.length} gudang
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-600">Login terakhir</p>
                    <p className="mt-0.5 font-semibold text-ink-950">
                      {user.last_login_at ? formatAdminDate(user.last_login_at) : "Belum pernah"}
                    </p>
                  </div>
                </div>
                <button
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-xs font-semibold hover:bg-canvas-50"
                  onClick={() => onEdit(user)}
                  type="button"
                >
                  <Edit3 size={15} />
                  Ubah
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <caption className="sr-only">Daftar pengguna</caption>
              <thead>
                <tr>
                  <AdminTh>Pengguna</AdminTh>
                  <AdminTh>Peran</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh>Gudang</AdminTh>
                  <AdminTh>Login terakhir</AdminTh>
                  <AdminTh>Aksi</AdminTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-200">
                {items.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{user.full_name}</p>
                      <p className="text-xs text-slate-600">
                        {user.username} · {user.email}
                      </p>
                    </td>
                    <td className="px-4 py-4">{user.role_name}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.is_active ? "bg-teal-100 text-teal-700" : "bg-canvas-50 text-slate-700"
                        }`}
                      >
                        {user.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-4 tabular-nums">{user.warehouse_ids.length}</td>
                    <td className="px-4 py-4 text-xs text-slate-700">
                      {user.last_login_at ? formatAdminDate(user.last_login_at) : "Belum pernah"}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-xs font-semibold hover:bg-canvas-50"
                        onClick={() => onEdit(user)}
                        type="button"
                      >
                        <Edit3 size={15} />
                        Ubah
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminDataFrame>

      <AdminPagination
        isFetching={query.isFetching}
        limit={params.limit}
        offset={params.offset}
        onLimitChange={(limit) => onParamsChange({ ...params, limit, offset: 0 })}
        onPageChange={(offset) => onParamsChange({ ...params, offset })}
        total={total}
      />
    </>
  );
}
