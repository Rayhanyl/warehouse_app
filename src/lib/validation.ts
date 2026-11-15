import Decimal from "decimal.js";
import type { z } from "zod";

export const CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[0-9+() -]{6,30}$/;
export const USERNAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/;
export const ICON_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const MENU_PATH_REGEX = /^\/[^\s]*$/;

export const MAX_QTY = new Decimal("99999999999999.9999");

export function hasMinimumDigits(value: string, minimum: number): boolean {
  return value.replace(/\D/g, "").length >= minimum;
}

export function validateZodSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
):
  | { ok: true; data: z.infer<TSchema> }
  | { ok: false; fieldErrors: Record<string, string>; firstError: string } {
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }

  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const pathKey = issue.path.map((segment) => String(segment)).join(".") || "_form";
    if (!fieldErrors[pathKey]) {
      fieldErrors[pathKey] = issue.message;
    }
  }
  const firstError =
    parsed.error.issues[0]?.message ?? "Periksa kembali data yang dimasukkan.";
  return { ok: false, fieldErrors, firstError };
}

export interface DecimalQtyValidationOptions {
  label?: string;
  allowZero?: boolean;
  allowDecimal?: boolean;
  maxValue?: Decimal.Value;
}

/**
 * Memvalidasi input kuantitas string desimal sesuai aturan backend NUMERIC(18,4)
 * dan aturan presisi UoM (`allow_decimal`).
 */
export function validateDecimalQtyInput(
  rawValue: string,
  options: DecimalQtyValidationOptions = {},
): string | null {
  const {
    label = "Jumlah",
    allowZero = false,
    allowDecimal = true,
    maxValue,
  } = options;
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return `${label} wajib diisi.`;
  }

  let parsed: Decimal;
  try {
    parsed = new Decimal(trimmed);
  } catch {
    return `${label} harus berupa angka yang valid.`;
  }

  if (!parsed.isFinite()) {
    return `${label} harus berupa angka yang valid.`;
  }

  if (parsed.decimalPlaces() > 4) {
    return `${label} maksimal memiliki 4 angka di belakang koma.`;
  }

  if (parsed.isNegative() || (!allowZero && parsed.isZero())) {
    return allowZero
      ? `${label} tidak boleh bernilai negatif.`
      : `${label} harus lebih besar dari 0.`;
  }

  if (!allowDecimal && !parsed.isInteger()) {
    return `${label} untuk satuan ini harus berupa bilangan bulat.`;
  }

  if (parsed.gt(MAX_QTY)) {
    return `${label} melebihi batas maksimum (${MAX_QTY.toFixed(4)}).`;
  }

  if (maxValue !== undefined) {
    const maxDec = new Decimal(maxValue);
    if (parsed.gt(maxDec)) {
      return `${label} tidak boleh melebihi batas maksimum (${maxDec.toString()}).`;
    }
  }

  return null;
}
