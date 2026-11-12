import Decimal from "decimal.js";

export function toDecimal(value?: string | number | null): Decimal {
  if (value === undefined || value === null || value === "") {
    return new Decimal(0);
  }
  return new Decimal(value);
}

export function formatDecimal(value?: string | number | null): string {
  if (value === undefined || value === null || value === "") {
    return "0";
  }
  try {
    return toDecimal(value).toFixed();
  } catch {
    return "0";
  }
}
