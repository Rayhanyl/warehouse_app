import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { mapApiFormError } from "@/lib/errors";
import { validateZodSchema } from "@/lib/validation";
import {
  useAdminUserWarehouses,
  useCreateAdminUser,
  useUpdateAdminUser,
  useUpdateAdminUserWarehouses,
} from "../api";
import { userCreateSchema, userUpdateSchema } from "../schemas";
import type { AdminUser, AdminWarehouse, Role } from "../types";
import { AdminInput } from "./AdminShared";

export function UserFormDialog({
  user,
  roles,
  warehouses,
  warehousesError,
  warehousesLoading,
  assignedWarehouses,
  onClose,
}: {
  user: AdminUser | null;
  roles: Role[];
  warehouses: AdminWarehouse[];
  warehousesError: boolean;
  warehousesLoading: boolean;
  assignedWarehouses: ReturnType<typeof useAdminUserWarehouses>;
  onClose: () => void;
}) {
  const create = useCreateAdminUser();
  const update = useUpdateAdminUser();
  const updateWarehouses = useUpdateAdminUserWarehouses();
  const [form, setForm] = useState({
    username: user?.username ?? "",
    email: user?.email ?? "",
    password: "",
    full_name: user?.full_name ?? "",
    role_id: String(user?.role_id ?? roles[0]?.id ?? ""),
    is_active: user?.is_active ?? true,
  });
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<number[]>(
    user?.warehouse_ids ?? [],
  );
  const [hasEditedWarehouses, setHasEditedWarehouses] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const assignedWarehouseIds = assignedWarehouses.data?.map((warehouse) => warehouse.warehouse_id);
  const effectiveWarehouseIds =
    assignedWarehouseIds && !hasEditedWarehouses ? assignedWarehouseIds : selectedWarehouseIds;

  function toggleWarehouse(id: number) {
    setHasEditedWarehouses(true);
    setFieldErrors((prev) => ({ ...prev, warehouse_ids: "" }));
    setSelectedWarehouseIds((current) =>
      current.includes(id)
        ? current.filter((warehouseId) => warehouseId !== id)
        : [...current, id],
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    if (user && assignedWarehouses.isError) {
      toast.error("Penugasan gudang belum dapat dimuat. Coba lagi sebelum menyimpan.");
      return;
    }

    const parsedRoleId = Number(form.role_id);
    const schema = user ? userUpdateSchema : userCreateSchema;
    const validationInput = user
      ? {
          full_name: form.full_name,
          email: form.email,
          role_id: Number.isFinite(parsedRoleId) ? parsedRoleId : 0,
          password: form.password,
        }
      : {
          username: form.username,
          full_name: form.full_name,
          email: form.email,
          role_id: Number.isFinite(parsedRoleId) ? parsedRoleId : 0,
          password: form.password,
        };
    const parsed = validateZodSchema(schema, validationInput);
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setSubmitError(parsed.firstError);
      return;
    }
    setFieldErrors({});

    try {
      if (user) {
        await update.mutateAsync({
          id: user.id,
          payload: {
            email: parsed.data.email,
            full_name: parsed.data.full_name,
            role_id: parsed.data.role_id,
            is_active: form.is_active,
            ...(form.password ? { password: form.password } : {}),
          },
        });
        await updateWarehouses.mutateAsync({ id: user.id, warehouse_ids: effectiveWarehouseIds });
      } else {
        await create.mutateAsync({
          username: form.username.trim(),
          email: parsed.data.email,
          full_name: parsed.data.full_name,
          password: form.password,
          role_id: parsed.data.role_id,
          is_active: form.is_active,
          warehouse_ids: effectiveWarehouseIds,
        });
      }
      toast.success(user ? "Pengguna diperbarui." : "Pengguna dibuat.");
      onClose();
    } catch (error) {
      const mapped = mapApiFormError(error, "Perubahan pengguna belum dapat disimpan.");
      setFieldErrors(mapped.fieldErrors);
      setSubmitError(mapped.formMessage);
      toast.error(mapped.formMessage);
    }
  }

  const isSaving = create.isPending || update.isPending || updateWarehouses.isPending;
  const cannotSave =
    isSaving || warehousesLoading || warehousesError || Boolean(user && assignedWarehouses.isError);

  return (
    <div
      aria-labelledby="admin-user-form-title"
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
          <h2 className="text-lg font-bold" id="admin-user-form-title">
            {user ? "Ubah pengguna" : "Tambah pengguna"}
          </h2>
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
              error={fieldErrors.full_name}
              label="Nama lengkap"
              onChange={(value) => {
                setForm({ ...form, full_name: value });
                setFieldErrors((prev) => ({ ...prev, full_name: "" }));
              }}
              value={form.full_name}
            />
            <AdminInput
              error={fieldErrors.email}
              label="Email"
              onChange={(value) => {
                setForm({ ...form, email: value });
                setFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              type="email"
              value={form.email}
            />
            <AdminInput
              disabled={Boolean(user)}
              error={fieldErrors.username}
              label="Username"
              onChange={(value) => {
                setForm({ ...form, username: value });
                setFieldErrors((prev) => ({ ...prev, username: "" }));
              }}
              value={form.username}
            />
            <AdminInput
              error={fieldErrors.password}
              label={user ? "Kata sandi baru (opsional)" : "Kata sandi"}
              onChange={(value) => {
                setForm({ ...form, password: value });
                setFieldErrors((prev) => ({ ...prev, password: "" }));
              }}
              type="password"
              value={form.password}
            />
            <label className="text-sm font-semibold">
              Peran
              <select
                className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-normal"
                onChange={(event) => {
                  setForm({ ...form, role_id: event.target.value });
                  setFieldErrors((prev) => ({ ...prev, role_id: "" }));
                }}
                value={form.role_id}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {fieldErrors.role_id && (
                <span className="mt-1 block text-xs font-medium text-red-700" role="alert">
                  {fieldErrors.role_id}
                </span>
              )}
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
              <input
                checked={form.is_active}
                className="size-4 accent-teal-600"
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                type="checkbox"
              />
              Akun aktif
            </label>
          </div>

          <fieldset className="mt-6 rounded-[var(--radius-md)] border border-line-200 p-4">
            <legend className="px-1 text-sm font-bold">Penugasan gudang</legend>
            {fieldErrors.warehouse_ids && (
              <p className="mb-2 text-xs font-medium text-red-700" role="alert">
                {fieldErrors.warehouse_ids}
              </p>
            )}
            {assignedWarehouses.isLoading || warehousesLoading ? (
              <p className="text-sm text-slate-600">Memuat daftar gudang...</p>
            ) : assignedWarehouses.isError ? (
              <p className="text-sm text-red-700">Penugasan gudang belum dapat dimuat.</p>
            ) : warehousesError ? (
              <p className="text-sm text-red-700">Daftar gudang aktif belum dapat dimuat.</p>
            ) : warehouses.length === 0 ? (
              <p className="text-sm text-slate-600">Belum ada gudang aktif yang tersedia.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {warehouses.map((warehouse) => (
                  <label
                    className="flex min-h-11 items-start gap-3 rounded-[var(--radius-md)] border border-line-200 p-3 text-sm"
                    key={warehouse.id}
                  >
                    <input
                      checked={effectiveWarehouseIds.includes(warehouse.id)}
                      className="mt-1 size-4 accent-teal-600"
                      disabled={isSaving}
                      onChange={() => toggleWarehouse(warehouse.id)}
                      type="checkbox"
                    />
                    <span>
                      <span className="block font-semibold">{warehouse.name}</span>
                      <span className="block text-xs text-slate-600">{warehouse.code}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
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
            disabled={cannotSave}
            type="submit"
          >
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
