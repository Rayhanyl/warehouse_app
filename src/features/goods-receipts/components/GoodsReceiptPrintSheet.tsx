import { BarcodeVisual } from "@/components/ui/BarcodeVisual";
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
}: {
  receipt: GoodsReceipt;
  visibleOnScreen?: boolean;
}) {
  const lines = receipt.lines ?? [];

  return (
    <section
      aria-label={`Dokumen cetak Bukti Penerimaan Barang ${receipt.gr_number}`}
      className={`printable-document-sheet ${
        visibleOnScreen ? "mt-5 block" : "hidden"
      } rounded-[var(--radius-md)] border border-ink-950/30 bg-surface-0 p-4 text-ink-950 sm:p-6 print:mt-0 print:block print:border-0 print:p-0`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink-950 pb-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-700 uppercase">
            JEJAKSTOK WAREHOUSE MANAGEMENT SYSTEM
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-ink-950 uppercase sm:text-xl">
            BUKTI PENERIMAAN BARANG (GOODS RECEIPT NOTE)
          </h3>
        </div>
        <div className="flex max-w-full flex-col items-start gap-1.5 text-left text-sm sm:items-end sm:text-right print:items-end print:text-right">
          <p className="font-bold text-ink-950 tabular-nums">
            No. GRN: {receipt.gr_number}
          </p>
          <p className="text-xs font-semibold text-slate-700">
            Status: DIPOSTING (POSTED)
          </p>
          <div className="max-w-full overflow-x-auto">
            <BarcodeVisual
              className="border border-ink-950/30 px-1.5 py-1"
              height={28}
              showValue={false}
              value={receipt.gr_number}
            />
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5 border-b border-line-500 pb-4 text-xs sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3">
        <div>
          <dt className="font-semibold text-slate-600">No. Purchase Order</dt>
          <dd className="mt-0.5 font-bold text-ink-950 tabular-nums">
            {receipt.po_number}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-600">Pemasok (Supplier)</dt>
          <dd className="mt-0.5 font-bold text-ink-950">
            {receipt.supplier_code} · {receipt.supplier_name}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-600">Gudang Penerima</dt>
          <dd className="mt-0.5 font-bold text-ink-950">
            {receipt.warehouse_code} · {receipt.warehouse_name}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-600">Tanggal Penerimaan</dt>
          <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
            {formatPrintDate(receipt.received_date)}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-600">Waktu Posting</dt>
          <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
            {formatPrintDateTime(receipt.posted_at)}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-600">Catatan Dokumen</dt>
          <dd className="mt-0.5 text-ink-950">{receipt.notes || "-"}</dd>
        </div>
      </dl>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse border border-ink-950 text-left text-xs print:min-w-0">
          <thead>
            <tr className="border-b border-ink-950 bg-canvas-50 font-bold text-ink-950">
              <th className="border-r border-ink-950 px-2.5 py-2 text-center">No</th>
              <th className="border-r border-ink-950 px-2.5 py-2">SKU / Barcode</th>
              <th className="border-r border-ink-950 px-2.5 py-2">Nama Barang</th>
              <th className="border-r border-ink-950 px-2.5 py-2">Lokasi Simpan</th>
              <th className="border-r border-ink-950 px-2.5 py-2 text-right">
                Qty Diterima
              </th>
              <th className="border-r border-ink-950 px-2.5 py-2">Satuan</th>
              <th className="px-2.5 py-2">Catatan Baris</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr className="border-b border-ink-950/60" key={line.id}>
                <td className="border-r border-ink-950 px-2.5 py-2 text-center tabular-nums">
                  {index + 1}
                </td>
                <td className="border-r border-ink-950 px-2.5 py-2 font-semibold tabular-nums">
                  <div>{line.item_sku}</div>
                  {line.item_barcode && (
                    <div className="text-[11px] font-normal text-slate-700">
                      BC: {line.item_barcode}
                    </div>
                  )}
                </td>
                <td className="border-r border-ink-950 px-2.5 py-2 font-medium">
                  {line.item_name}
                </td>
                <td className="border-r border-ink-950 px-2.5 py-2">
                  {line.location_code} · {line.location_name}
                </td>
                <td className="border-r border-ink-950 px-2.5 py-2 text-right font-bold tabular-nums">
                  {line.qty_received}
                </td>
                <td className="border-r border-ink-950 px-2.5 py-2">
                  {line.uom_code}
                </td>
                <td className="px-2.5 py-2">{line.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-slate-700 tabular-nums">
        Total baris barang diterima: <strong>{lines.length}</strong> baris
      </p>

      <div className="print-signature-grid mt-8 grid grid-cols-1 gap-4 pt-2 text-center text-xs sm:grid-cols-3 sm:gap-6 print:grid-cols-3">
        <div className="rounded border border-ink-950/50 p-3">
          <p className="font-bold text-ink-950">Diserahkan Oleh</p>
          <p className="text-[11px] text-slate-600">
            Pengirim / Ekspedisi Pemasok
          </p>
          <div className="h-16" />
          <p className="border-t border-ink-950 pt-1 font-medium text-ink-950">
            ( Nama Terang &amp; Tanda Tangan )
          </p>
        </div>
        <div className="rounded border border-ink-950/50 p-3">
          <p className="font-bold text-ink-950">Diterima &amp; Diperiksa Oleh</p>
          <p className="text-[11px] text-slate-600">Staf / Admin Gudang</p>
          <div className="h-16" />
          <p className="border-t border-ink-950 pt-1 font-medium text-ink-950">
            ( Nama Terang &amp; Tanda Tangan )
          </p>
        </div>
        <div className="rounded border border-ink-950/50 p-3">
          <p className="font-bold text-ink-950">Diketahui Oleh</p>
          <p className="text-[11px] text-slate-600">
            Kepala Gudang / Supervisor
          </p>
          <div className="h-16" />
          <p className="border-t border-ink-950 pt-1 font-medium text-ink-950">
            ( Nama Terang &amp; Stempel Gudang )
          </p>
        </div>
      </div>
    </section>
  );
}
