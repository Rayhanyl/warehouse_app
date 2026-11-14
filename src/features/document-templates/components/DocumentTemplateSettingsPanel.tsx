import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { mapApiFormError } from "@/lib/errors";
import {
  resolveLogoAssetUrl,
  useDocumentTemplates,
  useUpdateDocumentTemplate,
  useUploadDocumentLogo,
} from "../api";
import { buildSamplePreviewData } from "../previewData";
import {
  cloneDocumentTemplate,
  DOCUMENT_TYPES,
  validateAndBuildTemplatePayload,
  validateLogoFile,
} from "../schemas";
import {
  DEFAULT_DOCUMENT_TEMPLATES,
  DOCUMENT_TYPE_LABELS,
  type DocumentTemplate,
  type DocumentType,
} from "../types";
import { DocumentIdentityLogoSection } from "./DocumentIdentityLogoSection";
import { DocumentLivePreviewCard } from "./DocumentLivePreviewCard";
import { DocumentPaperVisibilitySection } from "./DocumentPaperVisibilitySection";
import { DocumentSectionOrderCard } from "./DocumentSectionOrderCard";
import { DocumentSignatureLayoutCard } from "./DocumentSignatureLayoutCard";
import { DocumentTableColumnsCard } from "./DocumentTableColumnsCard";

/** Panel administrasi untuk menyusun template dokumen cetak modular per jenis dokumen. */
export function DocumentTemplateSettingsPanel() {
  const [activeType, setActiveType] = useState<DocumentType>("GOODS_RECEIPT");
  const templatesQuery = useDocumentTemplates(true);

  const serverTemplate = useMemo(() => {
    const found = templatesQuery.data?.find(
      (item) => item.document_type === activeType,
    );
    return found ?? DEFAULT_DOCUMENT_TEMPLATES[activeType];
  }, [activeType, templatesQuery.data]);

  const editorKey = `${activeType}-${serverTemplate.updated_at ?? "default"}`;

  return (
    <section className="space-y-6">
      <div className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Pilih jenis dokumen cetak
            </h2>
            <p className="text-xs text-slate-500">
              Setiap jenis dokumen memiliki kop surat, kolom tabel, ukuran kertas, dan blok tanda tangan tersendiri.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Jenis dokumen cetak">
            {DOCUMENT_TYPES.map((docType) => {
              const selected = activeType === docType;
              return (
                <button
                  aria-selected={selected}
                  className={`min-h-10 rounded-[var(--radius-md)] border px-3.5 py-2 text-xs font-semibold transition ${
                    selected
                      ? "border-teal-600 bg-teal-50 text-teal-800"
                      : "border-line-200 bg-surface-0 text-slate-700 hover:bg-surface-50"
                  }`}
                  key={docType}
                  onClick={() => setActiveType(docType)}
                  role="tab"
                  type="button"
                >
                  {DOCUMENT_TYPE_LABELS[docType]}
                </button>
              );
            })}
          </div>
        </div>
        {templatesQuery.isError && (
          <p className="mt-3 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Menampilkan konfigurasi bawaan sementara karena daftar template server gagal dimuat.
          </p>
        )}
      </div>

      <DocumentTemplateEditorForm
        initialTemplate={serverTemplate}
        key={editorKey}
      />
    </section>
  );
}

function DocumentTemplateEditorForm({
  initialTemplate,
}: {
  initialTemplate: DocumentTemplate;
}) {
  const updateTemplate = useUpdateDocumentTemplate();
  const uploadLogo = useUploadDocumentLogo();
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [draft, setDraft] = useState<DocumentTemplate>(() =>
    cloneDocumentTemplate(initialTemplate),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const samplePreview = useMemo(
    () => buildSamplePreviewData(draft.document_type),
    [draft.document_type],
  );
  const logoPreviewUrl = resolveLogoAssetUrl(draft.logo_url);

  const updateField = <K extends keyof DocumentTemplate>(
    key: K,
    value: DocumentTemplate[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const validationError = validateLogoFile(file);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    try {
      const uploaded = await uploadLogo.mutateAsync(file);
      updateField("logo_url", uploaded.logo_url);
      toast.success("Logo berhasil diunggah. Klik Simpan template untuk menerapkan.");
    } catch (err) {
      const mapped = mapApiFormError(err, "Gagal mengunggah logo perusahaan.");
      setFormError(mapped.formMessage);
    }
  };

  const handleResetDefault = () => {
    setDraft(cloneDocumentTemplate(DEFAULT_DOCUMENT_TEMPLATES[draft.document_type]));
    setFieldErrors({});
    setFormError(null);
    toast.info("Pengaturan form dikembalikan ke standar bawaan. Klik Simpan untuk menyimpan ke database.");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const validation = validateAndBuildTemplatePayload(draft);
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setFormError(validation.formError);
      return;
    }

    try {
      const saved = await updateTemplate.mutateAsync({
        documentType: draft.document_type,
        payload: validation.payload,
      });
      setDraft(saved);
      toast.success(
        `Template ${DOCUMENT_TYPE_LABELS[draft.document_type]} berhasil disimpan.`,
      );
    } catch (err) {
      const mapped = mapApiFormError(
        err,
        "Gagal menyimpan pengaturan template dokumen.",
      );
      setFieldErrors(mapped.fieldErrors);
      setFormError(mapped.formMessage);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <form
        className="space-y-5 xl:col-span-5"
        noValidate
        onSubmit={handleSubmit}
      >
        {formError && (
          <div
            className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            role="alert"
          >
            {formError}
          </div>
        )}

        <DocumentIdentityLogoSection
          draft={draft}
          fieldErrors={fieldErrors}
          logoInputRef={logoInputRef}
          logoPreviewUrl={logoPreviewUrl}
          onLogoUpload={handleLogoUpload}
          onUpdateField={updateField}
          uploadingLogo={uploadLogo.isPending}
        />

        <DocumentPaperVisibilitySection
          draft={draft}
          fieldErrors={fieldErrors}
          onUpdateField={updateField}
        />

        <DocumentSectionOrderCard
          onChange={(nextOrder) => updateField("section_order", nextOrder)}
          sectionOrder={draft.section_order}
        />

        <DocumentTableColumnsCard
          columns={draft.table_columns}
          onChange={(nextColumns) => updateField("table_columns", nextColumns)}
        />

        <DocumentSignatureLayoutCard
          onChange={(nextSignatures) =>
            updateField("signature_layout", nextSignatures)
          }
          signatures={draft.signature_layout}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4">
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-md)] border border-line-200 px-3 text-xs font-semibold text-slate-700 hover:bg-surface-50"
            onClick={handleResetDefault}
            type="button"
          >
            <RotateCcw size={14} />
            Reset Bawaan
          </button>
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-md)] bg-teal-600 px-4 text-xs font-semibold text-surface-0 hover:bg-teal-700 disabled:opacity-50"
            disabled={updateTemplate.isPending}
            type="submit"
          >
            <Save size={14} />
            {updateTemplate.isPending ? "Menyimpan..." : "Simpan Template"}
          </button>
        </div>
      </form>

      <DocumentLivePreviewCard draft={draft} samplePreview={samplePreview} />
    </div>
  );
}
