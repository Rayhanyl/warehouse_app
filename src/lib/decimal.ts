import Decimal from "decimal.js";

export function toDecimal(value: string | number): Decimal {
  return new Decimal(value);
}

export function formatDecimal(value: string | number): string {
  return toDecimal(value).toFixed();
}
