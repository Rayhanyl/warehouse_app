import { formatDecimal } from "@/lib/decimal";

const stockDateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Formats decimal stock quantities consistently across stock tables and mobile cards.
 */
export function formatStockQuantity(value: string) {
  return formatDecimal(value);
}

/**
 * Formats ledger movement timestamps for Indonesian locale display.
 */
export function formatStockDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : stockDateFormatter.format(parsed);
}
