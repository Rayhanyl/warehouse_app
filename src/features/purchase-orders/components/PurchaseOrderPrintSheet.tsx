import { ModularDocumentPrintSheet } from "@/components/print/ModularDocumentPrintSheet";
import { useDocumentTemplate } from "@/features/document-templates/api";
import type { DocumentTemplate } from "@/features/document-templates/types";
import { formatCurrencyIdr } from "@/lib/utils";
import type { PurchaseOrder, PurchaseOrderStatus } from "../types";

const poStatusPrintLabels: Record<PurchaseOrderStatus, string> = {
  DRAFT: "DRAFT",
  WAITING_L1_APPROVAL: "MENUNGGU APPROVAL L1",
  WAITING_L2_APPROVAL: "MENUNGGU APPROVAL L2",
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

const NON_PRINTABLE_PO_STATUSES = new Set<PurchaseOrderStatus>([
  "DRAFT",
  "WAITING_L1_APPROVAL",
  "WAITING_L2_APPROVAL",
  "CANCELLED",
]);

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
  if (NON_PRINTABLE_PO_STATUSES.has(purchaseOrder.status)) {
    return null;
  }
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
            <div className="space-y-0.5">
              <div className="font-bold">
                {purchaseOrder.supplier_code} · {purchaseOrder.supplier_name}
              </div>
              {(purchaseOrder.supplier_phone || purchaseOrder.supplier_fax) && (
                <div className="text-[11px] font-normal text-slate-700">
                  {purchaseOrder.supplier_phone ? `Telp: ${purchaseOrder.supplier_phone}` : ""}
                  {purchaseOrder.supplier_phone && purchaseOrder.supplier_fax ? " · " : ""}
                  {purchaseOrder.supplier_fax ? `Fax: ${purchaseOrder.supplier_fax}` : ""}
                </div>
              )}
              {(purchaseOrder.supplier_bank_name ||
                purchaseOrder.supplier_bank_account_number) && (
                <div className="text-[11px] font-normal text-slate-700">
                  Rekening: {purchaseOrder.supplier_bank_name ?? "-"}{" "}
                  {purchaseOrder.supplier_bank_account_number ?? ""}
                  {purchaseOrder.supplier_bank_account_holder
                    ? ` (a.n. ${purchaseOrder.supplier_bank_account_holder})`
                    : ""}
                </div>
              )}
              {(purchaseOrder.supplier_npwp || purchaseOrder.supplier_payment_terms) && (
                <div className="text-[11px] font-normal text-slate-700">
                  {purchaseOrder.supplier_npwp ? `NPWP: ${purchaseOrder.supplier_npwp}` : ""}
                  {purchaseOrder.supplier_npwp && purchaseOrder.supplier_payment_terms ? " · " : ""}
                  {purchaseOrder.supplier_payment_terms
                    ? `Termin: ${purchaseOrder.supplier_payment_terms}`
                    : ""}
                </div>
              )}
            </div>
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
          {Number(purchaseOrder.total_amount ?? 0) > 0 && (
            <>
              {" · "}Total Estimasi PO:{" "}
              <strong>{formatCurrencyIdr(purchaseOrder.total_amount)}</strong>
            </>
          )}
        </>
      }
      template={template}
      visibleOnScreen={visibleOnScreen}
    />
  );
}
