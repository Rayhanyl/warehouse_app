import { MasterExcelImportDialog } from "../../components/MasterExcelImportDialog";
import { importSuppliers } from "../api";

interface SupplierImportDialogProps {
  onClose: () => void;
  onDownloadTemplate: () => void;
  onImported: () => Promise<void>;
}

export function SupplierImportDialog({
  onClose,
  onDownloadTemplate,
  onImported,
}: SupplierImportDialogProps) {
  return (
    <MasterExcelImportDialog
      closeAriaLabel="Tutup import pemasok"
      description="Unggah beberapa pemasok sekaligus menggunakan template Excel resmi."
      fileConstraintHint="Maksimal 5 MiB dan 1.000 baris data. Kode pemasok wajib unik dan email harus valid jika diisi."
      fileInputId="supplier-import-file"
      onClose={onClose}
      onDownloadTemplate={onDownloadTemplate}
      onImportFile={importSuppliers}
      onImported={onImported}
      templateHint="Gunakan sheet 'Suppliers' dengan kolom code, name, contact_person, phone, email, address, dan is_active."
      title="Import pemasok dari Excel"
      titleId="supplier-import-title"
    />
  );
}
