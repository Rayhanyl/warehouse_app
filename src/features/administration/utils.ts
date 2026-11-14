/**
 * Formats an ISO timestamp string for administration tables and user cards.
 */
export function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
