import { ModularDocumentPrintSheet } from "@/components/print/ModularDocumentPrintSheet";
import { useDocumentTemplate } from "@/features/document-templates/api";
import type { DocumentTemplate } from "@/features/document-templates/types";
import type { PurchaseOrder, PurchaseOrderStatus } from "../types";

const poStatusPrintLabels: Record<PurchaseOrderStatus, string> = {
  DRAFT: "DRAFT",
  ISSUED: "DITERBITKAN (ISSUED)",
  PARTIALLY_RECEIVED: "DITERIMA SEBAGIAN",
  RECEIVED: "SELESAI DITERIMA",
  CLOSED: "DITUTUP (CLOSED)",
  CANCELLED: "DIBATALKAN",
};

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

export function PurchaseOrderPrintSheet({
  purchaseOrder,
  visibleOnScreen = false,
  templateOverride,
}: {
  purchaseOrder: PurchaseOrder;
  visibleOnScreen?: boolean;
  templateOverride?: DocumentTemplate;
}) {
  const query = useDocumentTemplate("PURCHASE_ORDER", !templateOverride);
  const template = templateOverride ?? query.data;
  const lines = purchaseOrder.lines ?? [];

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
      qty_ordered: line.qty_ordered,
      qty_received: line.qty_received,
      notes: line.notes || "-",
    },
  }));

  return (
    <ModularDocumentPrintSheet
      ariaLabel={`Dokumen cetak Purchase Order ${purchaseOrder.po_number}`}
      documentBarcodeValue={purchaseOrder.po_number}
      documentNotes={purchaseOrder.notes}
      documentNumberLabel={`No. PO: ${purchaseOrder.po_number}`}
      metadata={[
        {
          label: "Pemasok (Supplier)",
          value: (
            <span className="font-bold">
              {purchaseOrder.supplier_code} · {purchaseOrder.supplier_name}
            </span>
          ),
        },
        {
          label: "Gudang Tujuan Pengiriman",
          value: (
            <span className="font-bold">
              {purchaseOrder.warehouse_code} · {purchaseOrder.warehouse_name}
            </span>
          ),
        },
        {
          label: "Tanggal Pesanan",
          value: (
            <span className="font-semibold tabular-nums">
              {formatPrintDate(purchaseOrder.order_date)}
            </span>
          ),
        },
        {
          label: "Waktu Terbit",
          value: (
            <span className="font-semibold tabular-nums">
              {formatPrintDateTime(purchaseOrder.issued_at)}
            </span>
          ),
        },
        {
          label: "Waktu Dibuat",
          value: (
            <span className="font-semibold tabular-nums">
              {formatPrintDateTime(purchaseOrder.created_at)}
            </span>
          ),
        },
        {
          label: "Catatan Pesanan",
          value: purchaseOrder.notes || "-",
        },
      ]}
      rows={rows}
      statusLabel={`Status: ${poStatusPrintLabels[purchaseOrder.status]}`}
      tableSummary={
        <>
          Total baris item pesanan: <strong>{lines.length}</strong> baris
        </>
      }
      template={template}
      visibleOnScreen={visibleOnScreen}
    />
  );
}
