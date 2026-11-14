import { MasterExcelImportDialog } from "../../components/MasterExcelImportDialog";
import { importStockItems } from "../api";

interface StockImportDialogProps {
  onClose: () => void;
  onDownloadTemplate: () => void;
  onImported: () => Promise<void>;
}

export function StockImportDialog({
  onClose,
  onDownloadTemplate,
  onImported,
}: StockImportDialogProps) {
  return (
    <MasterExcelImportDialog
      closeAriaLabel="Tutup import barang"
      description="Unggah beberapa barang sekaligus menggunakan template yang tersedia."
      fileConstraintHint="Maksimal 5 MiB dan 1.000 baris data. Kategori dan satuan ukur harus aktif."
      fileInputId="stock-import-file"
      onClose={onClose}
      onDownloadTemplate={onDownloadTemplate}
      onImportFile={importStockItems}
      onImported={onImported}
      templateHint="Gunakan nama kolom yang disediakan. SKU dan Barcode (opsional) disimpan sebagai teks agar nol di depan tetap terjaga."
      title="Import barang dari Excel"
      titleId="stock-import-title"
    />
  );
}
