export interface MasterPageNotice {
  type: "success" | "error";
  message: string;
  requestId?: string;
}

/** Format timestamp ISO menjadi tanggal dan waktu singkat lokal Indonesia. */
export function formatMasterDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Picu unduhan berkas CSV UTF-8 dengan nama bertanggal otomatis. */
export function downloadMasterCsv(filenamePrefix: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}-${dateStamp}.csv`;

  if (typeof URL.createObjectURL !== "function") {
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  if (typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
}
