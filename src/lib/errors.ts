import axios from "axios";

export interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      requestId?: string;
      details?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
  }
}

export function extractRequestId(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }
  const headers = error.response?.headers;
  if (!headers) {
    return undefined;
  }
  const value = headers["x-request-id"] ?? headers["X-Request-ID"];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function extractApiErrorInfo(error: unknown): {
  status?: number;
  code?: string;
  message?: string;
  requestId?: string;
  details?: Record<string, unknown>;
  isTimeout: boolean;
  isNetworkError: boolean;
} {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      requestId: error.requestId,
      details: error.details,
      isTimeout: error.status === 408,
      isNetworkError: error.status === 0,
    };
  }

  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    const status = error.response?.status;
    const envelope = error.response?.data?.error;
    const isTimeout =
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      status === 408 ||
      (typeof error.message === "string" && error.message.toLowerCase().includes("timeout"));
    const isNetworkError = !error.response && !isTimeout;

    return {
      status,
      code: envelope?.code,
      message: envelope?.message,
      requestId: extractRequestId(error),
      details: envelope?.details,
      isTimeout,
      isNetworkError,
    };
  }

  if (error instanceof Error) {
    const isTimeout = error.name === "SessionRestoreTimeoutError";
    return {
      message: error.message,
      isTimeout,
      isNetworkError: false,
    };
  }

  return {
    isTimeout: false,
    isNetworkError: false,
  };
}

export interface MappedFormError {
  formMessage: string;
  fieldErrors: Record<string, string>;
  status?: number;
  code?: string;
}

function normalizeErrorFieldKey(rawField: string): string {
  const parts = rawField
    .split(".")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length > 0 && ["body", "query", "path", "header", "cookie"].includes(parts[0])) {
    parts.shift();
  }
  return parts.join(".");
}

export function extractApiFieldErrors(
  details: Record<string, unknown> | undefined,
  fallbackMessage?: string,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!details) {
    return fieldErrors;
  }

  const rawFieldMap = details.field_errors;
  if (rawFieldMap && typeof rawFieldMap === "object" && !Array.isArray(rawFieldMap)) {
    for (const [key, value] of Object.entries(rawFieldMap as Record<string, unknown>)) {
      if (typeof value === "string" && value.trim()) {
        const cleanKey = normalizeErrorFieldKey(key);
        if (cleanKey) {
          fieldErrors[cleanKey] = value.trim();
        }
      }
    }
  }

  const rawErrors = details.errors;
  if (Array.isArray(rawErrors)) {
    for (const item of rawErrors) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const record = item as Record<string, unknown>;
      const msg = typeof record.msg === "string" ? record.msg.trim() : "";
      if (!msg) {
        continue;
      }

      let key = "";
      if (typeof record.field === "string" && record.field.trim()) {
        key = normalizeErrorFieldKey(record.field);
      } else if (Array.isArray(record.loc)) {
        key = normalizeErrorFieldKey(record.loc.map((part) => String(part)).join("."));
      }

      if (key && !fieldErrors[key]) {
        fieldErrors[key] = msg;
      }
    }
  }

  if (typeof details.field === "string" && details.field.trim()) {
    const cleanKey = normalizeErrorFieldKey(details.field);
    if (cleanKey && !fieldErrors[cleanKey] && fallbackMessage?.trim()) {
      fieldErrors[cleanKey] = fallbackMessage.trim();
    }
  }

  return fieldErrors;
}

/**
 * Memetakan error API (khususnya HTTP 422 validasi, 409 konflik/duplikat, dan 403 akses)
 * menjadi pesan ringkas form dan peta error per-field siap tampil di komponen form.
 */
export function mapApiFormError(
  error: unknown,
  defaultMessage: string,
  fieldAliases?: Record<string, string>,
): MappedFormError {
  const info = extractApiErrorInfo(error);

  if (info.isTimeout) {
    return {
      formMessage: "Permintaan melebihi batas waktu. Periksa koneksi lalu coba lagi.",
      fieldErrors: {},
      status: info.status,
      code: info.code,
    };
  }
  if (info.isNetworkError) {
    return {
      formMessage: "Tidak dapat terhubung ke server. Periksa koneksi jaringan Anda.",
      fieldErrors: {},
      status: info.status,
      code: info.code,
    };
  }

  let formMessage = info.message?.trim() || defaultMessage;
  if (info.status === 403 && !info.message?.trim()) {
    formMessage = "Anda tidak memiliki izin atau penugasan gudang untuk melakukan aksi ini.";
  }

  const rawFieldErrors = extractApiFieldErrors(info.details, formMessage);
  const fieldErrors: Record<string, string> = {};
  for (const [key, msg] of Object.entries(rawFieldErrors)) {
    const mappedKey = fieldAliases?.[key] ?? key;
    if (!fieldErrors[mappedKey]) {
      fieldErrors[mappedKey] = msg;
    }
  }

  return {
    formMessage,
    fieldErrors,
    status: info.status,
    code: info.code,
  };
}
