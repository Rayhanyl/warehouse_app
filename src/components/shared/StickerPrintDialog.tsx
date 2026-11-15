import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface StickerPrintDialogProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: ReactNode;
  description: string;
  headerMeta?: ReactNode;
  closeAriaLabel: string;
  metadataSection: ReactNode;
  stickerSection: ReactNode;
  footer: ReactNode;
}

/**
 * Dialog detail master berbasis shadcn/ui Dialog dengan isolasi cetak stiker terdedikasi
 * sehingga konten halaman latar belakang, overlay, dan metadata modal tersembunyi sempurna saat print.
 */
export function StickerPrintDialog({
  open,
  onClose,
  titleId,
  title,
  description,
  headerMeta,
  closeAriaLabel,
  metadataSection,
  stickerSection,
  footer,
}: StickerPrintDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    document.body.classList.add("wms-sticker-print-mode");
    return () => {
      document.body.classList.remove("wms-sticker-print-mode");
    };
  }, [open]);

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={open}
    >
      <DialogContent
        aria-labelledby={titleId}
        className="print-sticker-dialog flex max-h-[94dvh] w-full max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-xl sm:max-h-[92vh] sm:max-w-4xl print:block print:max-h-none print:max-w-none print:overflow-visible print:border-0 print:bg-transparent print:p-0 print:shadow-none"
        data-sticker-print-dialog="true"
        showCloseButton={false}
      >
        <DialogHeader className="no-print flex shrink-0 flex-row items-start justify-between gap-3 border-b border-border px-4 py-4 text-left sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1 space-y-1.5">
            {headerMeta}
            <DialogTitle className="text-lg font-bold text-ink-950" id={titleId}>
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              {description}
            </DialogDescription>
          </div>
          <Button
            aria-label={closeAriaLabel}
            className="no-print size-11 shrink-0 text-slate-700"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </DialogHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 print:overflow-visible print:p-0"
          data-slot="sticker-dialog-body"
        >
          <div className="no-print" data-slot="sticker-dialog-metadata">
            {metadataSection}
          </div>
          {stickerSection}
        </div>

        <DialogFooter className="no-print flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-muted/35 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:px-6 sm:py-4">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
