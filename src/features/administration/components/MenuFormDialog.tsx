import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { mapApiFormError } from "@/lib/errors";
import { validateZodSchema } from "@/lib/validation";
import { useCreateAdminMenu, useUpdateAdminMenu } from "../api";
import { menuFormSchema } from "../schemas";
import type { AdminMenu, Permission } from "../types";
import { AdminInput } from "./AdminShared";

export function MenuFormDialog({
  menu,
  menus,
  permissions,
  isLoading,
  onClose,
}: {
  menu: AdminMenu | null;
  menus: AdminMenu[];
  permissions: Permission[];
  isLoading: boolean;
  onClose: () => void;
}) {
  const create = useCreateAdminMenu();
  const update = useUpdateAdminMenu();
  const [form, setForm] = useState({
    code: menu?.code ?? "",
    name: menu?.name ?? "",
    path: menu?.path ?? "/",
    icon: menu?.icon ?? "",
    parent_id: menu?.parent_id ? String(menu.parent_id) : "",
    sort_order: String(menu?.sort_order ?? 0),
    permission_id: menu?.permission_id ? String(menu.permission_id) : "",
    is_active: menu?.is_active ?? true,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const parentOptions = menus.filter((item) => item.id !== menu?.id && item.is_active);
  const isSaving = create.isPending || update.isPending;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    const parsedSort = form.sort_order.trim() === "" ? Number.NaN : Number(form.sort_order);
    const parsed = validateZodSchema(menuFormSchema, {
      code: form.code,
      name: form.name,
      path: form.path,
      icon: form.icon,
      sort_order: parsedSort,
    });
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setSubmitError(parsed.firstError);
      return;
    }

    setFieldErrors({});
    const payload = {
      code: parsed.data.code,
      name: parsed.data.name,
      path: parsed.data.path,
      icon: parsed.data.icon || null,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      sort_order: parsed.data.sort_order,
      permission_id: form.permission_id ? Number(form.permission_id) : null,
      is_active: form.is_active,
    };

    try {
      if (menu) {
        await update.mutateAsync({
          id: menu.id,
          payload: {
            ...payload,
            ...(payload.parent_id === null ? { clear_parent: true } : {}),
            ...(payload.permission_id === null ? { clear_permission: true } : {}),
          },
        });
      } else {
        await create.mutateAsync(payload);
      }
      toast.success(menu ? "Menu diperbarui." : "Menu dibuat.");
      onClose();
    } catch (error) {
      const mapped = mapApiFormError(error, "Perubahan menu belum dapat disimpan.");
      setFieldErrors(mapped.fieldErrors);
      setSubmitError(mapped.formMessage);
      toast.error(mapped.formMessage);
    }
  }

  return (
    <div
      aria-labelledby="admin-menu-form-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/60 p-2 sm:p-4"
      role="dialog"
    >
      <form
        className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-lg)] bg-surface-0 shadow-[var(--shadow-2)] sm:max-h-[90vh]"
        noValidate
        onSubmit={(event) => void submit(event)}
      >
        <div className="shrink-0 border-b border-line-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-bold" id="admin-menu-form-title">
            {menu ? "Ubah menu" : "Tambah menu"}
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Atur identitas, hierarki, permission, dan status menu navigasi.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {submitError && (
            <div
              className="mb-4 rounded-[var(--radius-md)] border border-red-600/30 bg-red-100 p-3 text-sm font-medium text-red-700"
              role="alert"
            >
              {submitError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminInput
              disabled={Boolean(menu)}
              error={fieldErrors.code}
              label="Kode menu"
              onChange={(value) => {
                setForm({ ...form, code: value });
                setFieldErrors((prev) => ({ ...prev, code: "" }));
              }}
              value={form.code}
            />
            <AdminInput
              error={fieldErrors.name}
              label="Nama menu"
              onChange={(value) => {
                setForm({ ...form, name: value });
                setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              value={form.name}
            />
            <AdminInput
              error={fieldErrors.path}
              label="Path"
              onChange={(value) => {
                setForm({ ...form, path: value });
                setFieldErrors((prev) => ({ ...prev, path: "" }));
              }}
              value={form.path}
            />
            <AdminInput
              error={fieldErrors.icon}
              label="Ikon (opsional)"
              onChange={(value) => {
                setForm({ ...form, icon: value });
                setFieldErrors((prev) => ({ ...prev, icon: "" }));
              }}
              value={form.icon}
            />
            <label className="text-sm font-semibold">
              Menu induk
              <select
                className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal"
                onChange={(event) => setForm({ ...form, parent_id: event.target.value })}
                value={form.parent_id}
              >
                <option value="">Root</option>
                {parentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {fieldErrors.parent_id && (
                <span className="mt-1 block text-xs font-medium text-red-700" role="alert">
                  {fieldErrors.parent_id}
                </span>
              )}
            </label>
            <label className="text-sm font-semibold">
              Permission
              <select
                className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal"
                disabled={isLoading}
                onChange={(event) => setForm({ ...form, permission_id: event.target.value })}
                value={form.permission_id}
              >
                <option value="">Tanpa permission khusus</option>
                {permissions.map((permission) => (
                  <option key={permission.id} value={permission.id}>
                    {permission.code}
                  </option>
                ))}
              </select>
              {fieldErrors.permission_id && (
                <span className="mt-1 block text-xs font-medium text-red-700" role="alert">
                  {fieldErrors.permission_id}
                </span>
              )}
            </label>
            <AdminInput
              error={fieldErrors.sort_order}
              label="Urutan"
              onChange={(value) => {
                setForm({ ...form, sort_order: value });
                setFieldErrors((prev) => ({ ...prev, sort_order: "" }));
              }}
              type="number"
              value={form.sort_order}
            />
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
              <input
                checked={form.is_active}
                className="size-4 accent-teal-600"
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                type="checkbox"
              />
              Menu aktif
            </label>
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line-200 bg-canvas-50/50 px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold hover:bg-canvas-50"
            onClick={onClose}
            type="button"
          >
            Batal
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700 disabled:opacity-50"
            disabled={isSaving || isLoading}
            type="submit"
          >
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
