import { type FormEvent, useState } from "react";
import { Edit3, Search } from "lucide-react";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import { useIsMobile } from "@/hooks/useIsMobile";
import { type MenuParams, useAdminMenus } from "../api";
import type { AdminMenu } from "../types";
import {
  AdminDataFrame,
  AdminFilterBar,
  AdminPagination,
  AdminSelectFilter,
  AdminState,
  AdminTh,
} from "./AdminShared";

export function MenusPanel({
  query,
  params,
  onParamsChange,
  onEdit,
}: {
  query: ReturnType<typeof useAdminMenus>;
  params: MenuParams;
  onParamsChange: (params: MenuParams) => void;
  onEdit: (menu: AdminMenu) => void;
}) {
  const isMobile = useIsMobile();
  const [draftSearch, setDraftSearch] = useState(params.search);
  const total = query.data?.total ?? 0;

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    onParamsChange({ ...params, search: draftSearch.trim(), offset: 0 });
  }

  function resetFilters() {
    setDraftSearch("");
    onParamsChange({ ...params, search: "", is_active: "", offset: 0 });
  }

  if (query.isLoading) {
    return <AdminState text="Memuat katalog menu..." />;
  }
  if (query.isError) {
    return (
      <AdminState
        error
        onRetry={() => void query.refetch()}
        text="Katalog menu belum dapat dimuat."
      />
    );
  }

  const items = query.data?.items ?? [];
  const activeCount = [params.search, params.is_active].filter(Boolean).length;

  return (
    <>
      <CollapsibleFilterPanel
        activeCount={activeCount}
        ariaLabel="Filter menu"
        className="mb-4 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)]"
      >
        <AdminFilterBar onReset={resetFilters} onSubmit={applyFilters}>
          <label className="min-w-0 flex-1 text-sm font-semibold">
            Cari menu
            <div className="relative mt-2">
              <Search aria-hidden="true" className="absolute left-3 top-3 text-slate-500" size={16} />
              <input
                className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 pl-9 pr-3 text-sm font-normal"
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Kode, nama, atau path"
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
            ? "Tidak ada menu yang cocok dengan filter."
            : "Belum ada menu yang tersedia."
        }
      >
        {isMobile ? (
          <ul aria-label="Katalog menu" className="divide-y divide-line-200">
            {items.map((menu) => (
              <li className="space-y-3 p-4" key={menu.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-950">{menu.name}</p>
                    <p className="font-mono text-xs text-slate-600">
                      {menu.code} · {menu.path}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-canvas-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {menu.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-canvas-50/70 p-3 text-xs">
                  <div>
                    <p className="text-slate-600">Induk</p>
                    <p className="mt-0.5 font-semibold text-ink-950">{menu.parent_name ?? "Root"}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Permission</p>
                    <p className="mt-0.5 font-semibold text-ink-950">
                      {menu.permission_code ?? "Autentikasi"}
                    </p>
                  </div>
                </div>
                <button
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-xs font-semibold hover:bg-canvas-50"
                  onClick={() => onEdit(menu)}
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
            <table className="min-w-[1000px] w-full text-left text-sm">
              <caption className="sr-only">Katalog menu</caption>
              <thead>
                <tr>
                  <AdminTh>Menu</AdminTh>
                  <AdminTh>Path</AdminTh>
                  <AdminTh>Induk</AdminTh>
                  <AdminTh>Permission</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh>Aksi</AdminTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-200">
                {items.map((menu) => (
                  <tr key={menu.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{menu.name}</p>
                      <p className="text-xs text-slate-600">{menu.code}</p>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">{menu.path}</td>
                    <td className="px-4 py-4">{menu.parent_name ?? "Root"}</td>
                    <td className="px-4 py-4">{menu.permission_code ?? "Autentikasi"}</td>
                    <td className="px-4 py-4">{menu.is_active ? "Aktif" : "Nonaktif"}</td>
                    <td className="px-4 py-4">
                      <button
                        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-xs font-semibold hover:bg-canvas-50"
                        onClick={() => onEdit(menu)}
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
