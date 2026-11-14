import { useState } from "react";
import { toast } from "sonner";
import { mapApiFormError } from "@/lib/errors";
import { useUpdateRolePermissions } from "../api";
import type { Role } from "../types";
import { AdminState } from "./AdminShared";

export function RolesPanel({
  roles,
  permissions,
  isLoading,
}: {
  roles: Role[];
  permissions: { id: number; code: string; description: string }[];
  isLoading: boolean;
}) {
  const update = useUpdateRolePermissions();
  const [selectedId, setSelectedId] = useState<number | null>(roles[0]?.id ?? null);
  const selected = roles.find((role) => role.id === selectedId) ?? roles[0];

  if (isLoading) {
    return <AdminState text="Memuat peran dan permission..." />;
  }
  if (!selected) {
    return <AdminState text="Belum ada peran yang tersedia." />;
  }

  const toggle = (code: string) => {
    const next = selected.permissions.includes(code)
      ? selected.permissions.filter((item) => item !== code)
      : [...selected.permissions, code];
    void update
      .mutateAsync({ id: selected.id, permissions: next })
      .then(() => toast.success(`Permission untuk ${selected.name} diperbarui.`))
      .catch((error) => {
        toast.error(mapApiFormError(error, "Permission belum dapat diperbarui.").formMessage);
      });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <section className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-3 shadow-[var(--shadow-1)]">
        <h2 className="px-3 py-2 text-sm font-bold">Peran</h2>
        {roles.map((role) => (
          <button
            className={`flex min-h-11 w-full items-center justify-between rounded-[var(--radius-md)] px-3 text-left text-sm font-semibold ${
              role.id === selected.id ? "bg-teal-100 text-teal-700" : "hover:bg-canvas-50"
            }`}
            key={role.id}
            onClick={() => setSelectedId(role.id)}
            type="button"
          >
            {role.name}
            <span className="text-xs">{role.permissions.length}</span>
          </button>
        ))}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)]">
        <h2 className="font-bold">{selected.name}</h2>
        <p className="mt-1 text-sm text-slate-700">{selected.description}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {permissions.map((permission) => (
            <label
              className="flex min-h-11 items-start gap-3 rounded-[var(--radius-md)] border border-line-200 p-3 text-sm"
              key={permission.code}
            >
              <input
                checked={selected.permissions.includes(permission.code)}
                className="mt-1 size-4 accent-teal-600"
                disabled={update.isPending}
                onChange={() => toggle(permission.code)}
                type="checkbox"
              />
              <span>
                <span className="block font-semibold">{permission.code}</span>
                <span className="text-xs text-slate-600">{permission.description}</span>
              </span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
