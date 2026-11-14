import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  DEFAULT_DOCUMENT_TEMPLATES,
  type DocumentTemplate,
  type DocumentTemplateUpdatePayload,
  type DocumentType,
  type LogoUploadResult,
} from "./types";

export const documentTemplateKeys = {
  all: ["document-templates"] as const,
  detail: (docType: DocumentType) => ["document-templates", docType] as const,
};

export function resolveLogoAssetUrl(logoUrl?: string | null): string | null {
  const clean = logoUrl?.trim();
  if (!clean) {
    return null;
  }
  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    try {
      const origin = new URL(envUrl).origin;
      return clean.startsWith("/") ? `${origin}${clean}` : `${origin}/${clean}`;
    } catch {
      return clean;
    }
  }
  return clean;
}

export function useDocumentTemplates(enabled = true) {
  return useQuery({
    queryKey: documentTemplateKeys.all,
    queryFn: async () =>
      (await apiClient.get<DocumentTemplate[]>("/document-templates")).data,
    enabled,
  });
}

export function useDocumentTemplate(docType: DocumentType, enabled = true) {
  return useQuery({
    queryKey: documentTemplateKeys.detail(docType),
    queryFn: async (): Promise<DocumentTemplate> => {
      try {
        const { data } = await apiClient.get<DocumentTemplate>(
          `/document-templates/${docType}`,
        );
        if (
          data &&
          data.document_type === docType &&
          Array.isArray(data.table_columns)
        ) {
          return data;
        }
      } catch {
        // Fallback aman ke template bawaan jika endpoint belum termock atau offline
      }
      return DEFAULT_DOCUMENT_TEMPLATES[docType];
    },
    initialData: DEFAULT_DOCUMENT_TEMPLATES[docType],
    initialDataUpdatedAt: 0,
    staleTime: 60_000,
    enabled,
  });
}

export function useUpdateDocumentTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      documentType,
      payload,
    }: {
      documentType: DocumentType;
      payload: DocumentTemplateUpdatePayload;
    }) =>
      (
        await apiClient.put<DocumentTemplate>(
          `/document-templates/${documentType}`,
          payload,
        )
      ).data,
    onSuccess: (updated) => {
      client.setQueryData(
        documentTemplateKeys.detail(updated.document_type),
        updated,
      );
      void client.invalidateQueries({ queryKey: documentTemplateKeys.all });
    },
  });
}

export function useUploadDocumentLogo() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await apiClient.post<LogoUploadResult>(
        "/document-templates/upload-logo",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return data;
    },
  });
}
