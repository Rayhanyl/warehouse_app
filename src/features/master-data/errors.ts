import { extractApiErrorInfo, mapApiFormError } from "@/lib/errors";

export interface MasterFormSubmitError {
  message: string;
  requestId?: string;
  fieldErrors?: Record<string, string>;
}

interface MapMasterErrorOptions {
  entityLabel: string;
  duplicateField?: string;
  fieldAliases?: Record<string, string>;
  inUseMessage?: string;
}

export function mapMasterDomainError(
  error: unknown,
  fallbackMessage: string,
  options: MapMasterErrorOptions,
): MasterFormSubmitError {
  const info = extractApiErrorInfo(error);
  const mapped = mapApiFormError(error, fallbackMessage, options.fieldAliases);

  if (info.code === "ENTITY_IN_USE") {
    return {
      message:
        info.message?.trim() ||
        options.inUseMessage ||
        `${options.entityLabel} tidak dapat dinonaktifkan karena masih digunakan.`,
      requestId: info.requestId,
      fieldErrors: mapped.fieldErrors,
    };
  }

  if (info.code === "WAREHOUSE_NOT_ASSIGNED") {
    return {
      message:
        info.message?.trim() ||
        "Anda tidak memiliki penugasan akses untuk gudang yang dipilih.",
      requestId: info.requestId,
      fieldErrors: mapped.fieldErrors,
    };
  }

  if (info.code === "DUPLICATE" || info.status === 409) {
    const fieldErrors = { ...mapped.fieldErrors };
    if (
      options.duplicateField &&
      !fieldErrors[options.duplicateField] &&
      Object.keys(fieldErrors).length === 0
    ) {
      fieldErrors[options.duplicateField] =
        info.message?.trim() || `${options.entityLabel} sudah terdaftar.`;
    }
    return {
      message:
        info.message?.trim() || `${options.entityLabel} sudah terdaftar di sistem.`,
      requestId: info.requestId,
      fieldErrors,
    };
  }

  return {
    message: mapped.formMessage,
    requestId: info.requestId,
    fieldErrors: mapped.fieldErrors,
  };
}
