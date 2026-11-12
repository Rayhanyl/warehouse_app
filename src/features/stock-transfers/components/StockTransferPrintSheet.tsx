import { BarcodeVisual } from "@/components/ui/BarcodeVisual";
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
}: {
  transfer: StockTransfer;
  visibleOnScreen?: boolean;
}) {
  const lines = transfer.lines ?? [];

  return (
    <section
      aria-label={`Dokumen cetak Surat Jalan ${transfer.transfer_number}`}
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
            SURAT JALAN TRANSFER STOK
          </h3>
        </div>
        <div className="flex max-w-full flex-col items-start gap-1.5 text-left text-sm sm:items-end sm:text-right print:items-end print:text-right">
          <p className="font-bold text-ink-950 tabular-nums">
            No. Surat Jalan: {transfer.transfer_number}
          </p>
          <p className="text-xs font-semibold text-slate-700">
            Status: {printStatusLabels[transfer.status]}
          </p>
          <div className="max-w-full overflow-x-auto">
            <BarcodeVisual
              className="border border-ink-950/30 px-1.5 py-1"
              height={28}
              showValue={false}
              value={transfer.transfer_number}
            />
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5 border-b border-line-500 pb-4 text-xs sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3">
        <div>
          <dt className="font-semibold text-slate-600">Gudang &amp; Lokasi Asal</dt>
          <dd className="mt-0.5 font-bold text-ink-950">
            {transfer.source_warehouse_code} · {transfer.source_warehouse_name}
            <span className="block font-medium text-slate-700">
              Lokasi: {transfer.source_location_code}
              {transfer.source_location_name ? ` (${transfer.source_location_name})` : ""}
            </span>
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-600">Gudang &amp; Lokasi Tujuan</dt>
          <dd className="mt-0.5 font-bold text-ink-950">
            {transfer.destination_warehouse_code} · {transfer.destination_warehouse_name}
            <span className="block font-medium text-slate-700">
              Lokasi: {transfer.destination_location_code}
              {transfer.destination_location_name
                ? ` (${transfer.destination_location_name})`
                : ""}
            </span>
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-600">Tanggal Dokumen</dt>
          <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
            {formatPrintDateTime(transfer.created_at)}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-600">Waktu Pengiriman</dt>
          <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
            {formatPrintDateTime(transfer.shipped_at ?? transfer.approved_at)}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-600">Waktu Penerimaan</dt>
          <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
            {formatPrintDateTime(transfer.received_at)}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-600">Catatan Pengiriman</dt>
          <dd className="mt-0.5 text-ink-950">{transfer.notes || "-"}</dd>
        </div>
      </dl>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse border border-ink-950 text-left text-xs print:min-w-0">
          <thead>
            <tr className="border-b border-ink-950 bg-canvas-50 font-bold text-ink-950">
              <th className="border-r border-ink-950 px-2.5 py-2 text-center">No</th>
              <th className="border-r border-ink-950 px-2.5 py-2">SKU / Barcode</th>
              <th className="border-r border-ink-950 px-2.5 py-2">Nama Barang</th>
              <th className="border-r border-ink-950 px-2.5 py-2">Satuan</th>
              <th className="border-r border-ink-950 px-2.5 py-2 text-right">
                Qty Kirim
              </th>
              <th className="border-r border-ink-950 px-2.5 py-2 text-right">
                Qty Diterima
              </th>
              <th className="px-2.5 py-2">Selisih / Keterangan Cek Fisik</th>
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
                  {line.uom_code}
                </td>
                <td className="border-r border-ink-950 px-2.5 py-2 text-right font-bold tabular-nums">
                  {line.qty}
                </td>
                <td className="border-r border-ink-950 px-2.5 py-2 text-right font-semibold tabular-nums">
                  {line.qty_received ?? "________"}
                </td>
                <td className="px-2.5 py-2">
                  {line.qty_variance && Number(line.qty_variance) !== 0
                    ? `Selisih ${line.qty_variance}${
                        line.variance_reason ? ` (${line.variance_reason})` : ""
                      }`
                    : line.variance_reason || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-slate-700 tabular-nums">
        Total baris barang transfer: <strong>{lines.length}</strong> baris
      </p>

      <div className="print-signature-grid mt-8 grid grid-cols-1 gap-4 pt-2 text-center text-xs sm:grid-cols-3 sm:gap-6 print:grid-cols-3">
        <div className="rounded border border-ink-950/50 p-3">
          <p className="font-bold text-ink-950">Diserahkan Oleh</p>
          <p className="text-[11px] text-slate-600">Petugas Gudang Asal</p>
          <div className="h-16" />
          <p className="border-t border-ink-950 pt-1 font-medium text-ink-950">
            ( Nama Terang &amp; Tanda Tangan )
          </p>
        </div>
        <div className="rounded border border-ink-950/50 p-3">
          <p className="font-bold text-ink-950">Dibawa Oleh</p>
          <p className="text-[11px] text-slate-600">
            Pengemudi / Kurir / Ekspedisi
          </p>
          <div className="h-16" />
          <p className="border-t border-ink-950 pt-1 font-medium text-ink-950">
            ( Nama Terang &amp; No. Polisi )
          </p>
        </div>
        <div className="rounded border border-ink-950/50 p-3">
          <p className="font-bold text-ink-950">Diterima Oleh</p>
          <p className="text-[11px] text-slate-600">
            Petugas Gudang / Toko Tujuan
          </p>
          <div className="h-16" />
          <p className="border-t border-ink-950 pt-1 font-medium text-ink-950">
            ( Nama Terang &amp; Stempel Cabang )
          </p>
        </div>
      </div>
    </section>
  );
}
