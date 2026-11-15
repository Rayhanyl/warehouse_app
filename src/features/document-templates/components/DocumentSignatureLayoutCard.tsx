import { Plus } from "lucide-react";
import { SIGNATURE_PRESETS } from "../schemas";
import type { SignatureBlockConfig } from "../types";

interface DocumentSignatureLayoutCardProps {
  signatures: SignatureBlockConfig[];
  onChange: (nextSignatures: SignatureBlockConfig[]) => void;
}

/** Bagian 5 form template dokumen: preset & editor blok tanda tangan cetak. */
export function DocumentSignatureLayoutCard({
  signatures,
  onChange,
}: DocumentSignatureLayoutCardProps) {
  return (
    <div className="space-y-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">
          5. Blok Tanda Tangan ({signatures.length}/4)
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            className="rounded border border-line-200 bg-surface-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-surface-100"
            onClick={() =>
              onChange(SIGNATURE_PRESETS.TWO.map((item) => ({ ...item })))
            }
            type="button"
          >
            Preset 2 Kolom
          </button>
          <button
            className="rounded border border-line-200 bg-surface-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-surface-100"
            onClick={() =>
              onChange(SIGNATURE_PRESETS.THREE.map((item) => ({ ...item })))
            }
            type="button"
          >
            Preset 3 Kolom
          </button>
          <button
            className="inline-flex items-center gap-1 rounded border border-teal-600 bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-40"
            disabled={signatures.length >= 4}
            onClick={() =>
              onChange([
                ...signatures,
                {
                  title: `Pejabat ${signatures.length + 1}`,
                  subtitle: "Keterangan Jabatan",
                  placeholder: "( Nama Terang & Tanda Tangan )",
                },
              ])
            }
            type="button"
          >
            <Plus size={12} />
            Tambah Blok
          </button>
        </div>
      </div>

      {signatures.length === 0 ? (
        <p className="rounded border border-dashed border-line-200 p-3 text-center text-xs text-slate-500">
          Tidak ada blok tanda tangan aktif. Klik Tambah Blok atau pilih preset di atas jika diperlukan.
        </p>
      ) : (
        <div className="space-y-2.5">
          {signatures.map((sig, index) => (
            <div
              className="space-y-2 rounded-[var(--radius-md)] border border-line-200 bg-surface-50 p-3"
              key={`sig-${index}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Blok Tanda Tangan #{index + 1}
                </span>
                <button
                  aria-label={`Hapus blok tanda tangan ${index + 1}`}
                  className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                  onClick={() =>
                    onChange(signatures.filter((_, idx) => idx !== index))
                  }
                  type="button"
                >
                  Hapus
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  aria-label={`Judul blok tanda tangan ${index + 1}`}
                  className="min-h-8 rounded border border-line-200 bg-surface-0 px-2 text-xs"
                  onChange={(e) =>
                    onChange(
                      signatures.map((item, idx) =>
                        idx === index ? { ...item, title: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="Judul (mis. Dibuat Oleh)"
                  type="text"
                  value={sig.title}
                />
                <input
                  aria-label={`Subjudul blok tanda tangan ${index + 1}`}
                  className="min-h-8 rounded border border-line-200 bg-surface-0 px-2 text-xs"
                  onChange={(e) =>
                    onChange(
                      signatures.map((item, idx) =>
                        idx === index
                          ? { ...item, subtitle: e.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="Subjudul peran"
                  type="text"
                  value={sig.subtitle ?? ""}
                />
              </div>
              <input
                aria-label={`Placeholder blok tanda tangan ${index + 1}`}
                className="min-h-8 w-full rounded border border-line-200 bg-surface-0 px-2 text-xs"
                onChange={(e) =>
                  onChange(
                    signatures.map((item, idx) =>
                      idx === index
                        ? { ...item, placeholder: e.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Teks garis tanda tangan"
                type="text"
                value={sig.placeholder}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
