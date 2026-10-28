import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { extractApiErrorInfo } from "@/lib/errors";
import type {
  Category,
  CategoryCreatePayload,
  CategoryListParams,
  CategoryPage,
  CategoryUpdatePayload,
} from "./types";

export const categoryKeys = {
  all: ["master-data", "categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (params: CategoryListParams) => [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
};

export function toCategoryQueryParams(params: CategoryListParams): URLSearchParams {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  });

  const trimmedSearch = params.search.trim();
  if (trimmedSearch) {
    query.set("search", trimmedSearch);
  }

  if (params.status === "active") {
    query.set("is_active", "true");
  } else if (params.status === "inactive") {
    query.set("is_active", "false");
  }

  return query;
}

export async function fetchCategories(params: CategoryListParams): Promise<CategoryPage> {
  const { data } = await apiClient.get<CategoryPage>("/categories", {
    params: toCategoryQueryParams(params),
  });
  return data;
}

export async function fetchCategoryById(categoryId: number): Promise<Category> {
  const { data } = await apiClient.get<Category>(`/categories/${categoryId}`);
  return data;
}

export async function createCategory(payload: CategoryCreatePayload): Promise<Category> {
  const { data } = await apiClient.post<Category>("/categories", {
    name: payload.name.trim(),
    description: payload.description?.trim() ? payload.description.trim() : null,
    is_active: payload.is_active ?? true,
  });
  return data;
}

export async function updateCategory(
  categoryId: number,
  payload: CategoryUpdatePayload,
): Promise<Category> {
  const body: CategoryUpdatePayload = {};
  if (payload.name !== undefined) {
    body.name = payload.name.trim();
  }
  if (payload.description !== undefined) {
    body.description = payload.description?.trim() ? payload.description.trim() : null;
  }
  if (payload.is_active !== undefined) {
    body.is_active = payload.is_active;
  }

  const { data } = await apiClient.patch<Category>(`/categories/${categoryId}`, body);
  return data;
}

export function useCategories(params: CategoryListParams) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => fetchCategories(params),
    placeholderData: keepPreviousData,
  });
}

export function useCategoryDetail(categoryId: number | null, initialData?: Category) {
  return useQuery({
    queryKey: categoryKeys.detail(categoryId ?? 0),
    queryFn: () => fetchCategoryById(categoryId!),
    enabled: categoryId !== null && categoryId > 0,
    initialData,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CategoryCreatePayload) => createCategory(payload),
    onSuccess: (created) => {
      queryClient.setQueryData(categoryKeys.detail(created.id), created);
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: number;
      payload: CategoryUpdatePayload;
    }) => updateCategory(categoryId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(categoryKeys.detail(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

export function mapCategoryApiError(
  error: unknown,
  fallbackMessage: string,
): { message: string; requestId?: string; fieldErrors?: { name?: string; description?: string } } {
  const info = extractApiErrorInfo(error);

  if (info.code === "DUPLICATE" || info.status === 409) {
    if (info.code === "ENTITY_IN_USE") {
      return {
        message:
          info.message ||
          "Kategori tidak dapat dinonaktifkan karena masih digunakan oleh barang (SKU) yang aktif.",
        requestId: info.requestId,
      };
    }
    return {
      message:
        info.message ||
        "Nama kategori sudah terdaftar. Gunakan nama kategori yang berbeda.",
      requestId: info.requestId,
      fieldErrors: {
        name: "Nama kategori ini sudah digunakan.",
      },
    };
  }

  if (info.status === 403 || info.code === "PERMISSION_DENIED") {
    return {
      message:
        "Anda tidak memiliki izin (master:manage) untuk mengubah data kategori barang.",
      requestId: info.requestId,
    };
  }

  if (info.status === 404 || info.code === "NOT_FOUND") {
    return {
      message: "Data kategori tidak ditemukan atau telah dihapus dari server.",
      requestId: info.requestId,
    };
  }

  if (info.status === 422 || info.code === "VALIDATION_ERROR") {
    return {
      message:
        info.message ||
        "Data yang dikirim belum valid. Periksa kembali nama dan deskripsi kategori.",
      requestId: info.requestId,
    };
  }

  return {
    message: info.message || fallbackMessage,
    requestId: info.requestId,
  };
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildCategoriesCsv(categories: Category[]): string {
  const headers = [
    "ID",
    "Nama Kategori",
    "Deskripsi",
    "Status",
    "ID Pembuat",
    "Dibuat Pada",
    "Diperbarui Pada",
  ];
  const rows = categories.map((category) => [
    escapeCsvCell(category.id),
    escapeCsvCell(category.name),
    escapeCsvCell(category.description ?? ""),
    escapeCsvCell(category.is_active ? "Aktif" : "Nonaktif"),
    escapeCsvCell(category.created_by ?? ""),
    escapeCsvCell(category.created_at),
    escapeCsvCell(category.updated_at),
  ]);

  return "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}

