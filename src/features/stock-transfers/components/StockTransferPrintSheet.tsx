import { ModularDocumentPrintSheet } from "@/components/print/ModularDocumentPrintSheet";
import { useDocumentTemplate } from "@/features/document-templates/api";
import type { DocumentTemplate } from "@/features/document-templates/types";
import type { StockTransfer, StockTransferStatus } from "../types";

const printStatusLabels: Record<StockTransferStatus, string> = {
  DRAFT: "DRAFT",
  APPROVED: "DISETUJUI (SIAP KIRIM)",
  SHIPPED: "DIKIRIM (IN-TRANSIT)",
  RECEIVED: "DITERIMA (SELESAI)",
  CANCELLED: "DIBATALKAN",
};

function formatPrintDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function StockTransferPrintSheet({
  transfer,
  visibleOnScreen = false,
  templateOverride,
}: {
  transfer: StockTransfer;
  visibleOnScreen?: boolean;
  templateOverride?: DocumentTemplate;
}) {
  const query = useDocumentTemplate("STOCK_TRANSFER", !templateOverride);
  const template = templateOverride ?? query.data;
  const lines = transfer.lines ?? [];

  const rows = lines.map((line, index) => ({
    id: line.id,
    cells: {
      no: index + 1,
      sku_barcode: (
        <>
          <div className="font-semibold">{line.item_sku}</div>
          {line.item_barcode && (
            <div className="text-[11px] font-normal text-slate-700">
              BC: {line.item_barcode}
            </div>
          )}
        </>
      ),
      item_name: <span className="font-medium">{line.item_name}</span>,
      uom: line.uom_code,
      qty_shipped: line.qty,
      qty_received: line.qty_received ?? "________",
      variance:
        line.qty_variance && Number(line.qty_variance) !== 0
          ? `Selisih ${line.qty_variance}${
              line.variance_reason ? ` (${line.variance_reason})` : ""
            }`
          : line.variance_reason || "-",
    },
  }));

  return (
    <ModularDocumentPrintSheet
      ariaLabel={`Dokumen cetak Surat Jalan ${transfer.transfer_number}`}
      documentBarcodeValue={transfer.transfer_number}
      documentNotes={transfer.notes}
      documentNumberLabel={`No. Surat Jalan: ${transfer.transfer_number}`}
      metadata={[
        {
          label: "Gudang & Lokasi Asal",
          value: (
            <span className="font-bold">
              {transfer.source_warehouse_code} · {transfer.source_warehouse_name}
              <span className="block font-medium text-slate-700">
                Lokasi: {transfer.source_location_code}
                {transfer.source_location_name ? ` (${transfer.source_location_name})` : ""}
              </span>
            </span>
          ),
        },
        {
          label: "Gudang & Lokasi Tujuan",
          value: (
            <span className="font-bold">
              {transfer.destination_warehouse_code} · {transfer.destination_warehouse_name}
              <span className="block font-medium text-slate-700">
                Lokasi: {transfer.destination_location_code}
                {transfer.destination_location_name
                  ? ` (${transfer.destination_location_name})`
                  : ""}
              </span>
            </span>
          ),
        },
        {
          label: "Tanggal Dokumen",
          value: (
            <span className="font-semibold tabular-nums">
              {formatPrintDateTime(transfer.created_at)}
            </span>
          ),
        },
        {
          label: "Waktu Pengiriman",
          value: (
            <span className="font-semibold tabular-nums">
              {formatPrintDateTime(transfer.shipped_at ?? transfer.approved_at)}
            </span>
          ),
        },
        {
          label: "Waktu Penerimaan",
          value: (
            <span className="font-semibold tabular-nums">
              {formatPrintDateTime(transfer.received_at)}
            </span>
          ),
        },
        {
          label: "Catatan Pengiriman",
          value: transfer.notes || "-",
        },
      ]}
      rows={rows}
      statusLabel={`Status: ${printStatusLabels[transfer.status]}`}
      tableSummary={
        <>
          Total baris barang transfer: <strong>{lines.length}</strong> baris
        </>
      }
      template={template}
      visibleOnScreen={visibleOnScreen}
    />
  );
}
