import { ModularDocumentPrintSheet } from "@/components/print/ModularDocumentPrintSheet";
import { useDocumentTemplate } from "@/features/document-templates/api";
import type { DocumentTemplate } from "@/features/document-templates/types";
import type { GoodsReceipt } from "../types";

function formatPrintDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
    new Date(`${value}T00:00:00`),
  );
}

function formatPrintDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function GoodsReceiptPrintSheet({
  receipt,
  visibleOnScreen = false,
  templateOverride,
}: {
  receipt: GoodsReceipt;
  visibleOnScreen?: boolean;
  templateOverride?: DocumentTemplate;
}) {
  const query = useDocumentTemplate("GOODS_RECEIPT", !templateOverride);
  const template = templateOverride ?? query.data;
  const lines = receipt.lines ?? [];

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
      location: `${line.location_code} · ${line.location_name}`,
      qty_received: line.qty_received,
      uom: line.uom_code,
      notes: line.notes || "-",
    },
  }));

  return (
    <ModularDocumentPrintSheet
      ariaLabel={`Dokumen cetak Bukti Penerimaan Barang ${receipt.gr_number}`}
      documentBarcodeValue={receipt.gr_number}
      documentNotes={receipt.notes}
      documentNumberLabel={`No. GRN: ${receipt.gr_number}`}
      metadata={[
        {
          label: "No. Purchase Order",
          value: <span className="font-bold tabular-nums">{receipt.po_number}</span>,
        },
        {
          label: "Pemasok (Supplier)",
          value: (
            <span className="font-bold">
              {receipt.supplier_code} · {receipt.supplier_name}
            </span>
          ),
        },
        {
          label: "Gudang Penerima",
          value: (
            <span className="font-bold">
              {receipt.warehouse_code} · {receipt.warehouse_name}
            </span>
          ),
        },
        {
          label: "Tanggal Penerimaan",
          value: (
            <span className="font-semibold tabular-nums">
              {formatPrintDate(receipt.received_date)}
            </span>
          ),
        },
        {
          label: "Waktu Posting",
          value: (
            <span className="font-semibold tabular-nums">
              {formatPrintDateTime(receipt.posted_at)}
            </span>
          ),
        },
        {
          label: "Catatan Dokumen",
          value: receipt.notes || "-",
        },
      ]}
      rows={rows}
      statusLabel="Status: DIPOSTING (POSTED)"
      tableSummary={
        <>
          Total baris barang diterima: <strong>{lines.length}</strong> baris
        </>
      }
      template={template}
      visibleOnScreen={visibleOnScreen}
    />
  );
}
