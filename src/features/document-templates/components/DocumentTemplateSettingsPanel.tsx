import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { Building2, Columns3, FileSliders, PenTool, RotateCcw, Save } from "lucide-react";
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

type TemplateEditorTab = "identity" | "paper" | "structure" | "signatures";

const TEMPLATE_EDITOR_TABS: Array<{
  key: TemplateEditorTab;
  label: string;
  icon: typeof Building2;
}> = [
  { key: "identity", label: "Kop & Logo", icon: Building2 },
  { key: "paper", label: "Kertas & Info", icon: FileSliders },
  { key: "structure", label: "Urutan & Kolom", icon: Columns3 },
  { key: "signatures", label: "Tanda Tangan", icon: PenTool },
];

function resolveTabForFieldErrors(errors: Record<string, string>): TemplateEditorTab | null {
  const keys = Object.keys(errors);
  if (keys.length === 0) return null;
  if (
    keys.some((k) =>
      ["document_title", "company_name", "company_address", "company_contact", "logo_url"].includes(
        k,
      ),
    )
  ) {
    return "identity";
  }
  if (keys.some((k) => ["margin_mm", "paper_size", "orientation", "header_notes", "footer_notes"].includes(k))) {
    return "paper";
  }
  if (keys.some((k) => ["section_order", "table_columns"].includes(k))) {
    return "structure";
  }
  if (keys.some((k) => k.startsWith("signature"))) {
    return "signatures";
  }
  return "identity";
}

function DocumentTemplateEditorForm({
  initialTemplate,
}: {
  initialTemplate: DocumentTemplate;
}) {
  const updateTemplate = useUpdateDocumentTemplate();
  const uploadLogo = useUploadDocumentLogo();
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [activeEditorTab, setActiveEditorTab] = useState<TemplateEditorTab>("identity");
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
      const targetTab = resolveTabForFieldErrors(validation.fieldErrors);
      if (targetTab) {
        setActiveEditorTab(targetTab);
      }
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
      const targetTab = resolveTabForFieldErrors(mapped.fieldErrors);
      if (targetTab) {
        setActiveEditorTab(targetTab);
      }
    }
  };

  const errorTab = resolveTabForFieldErrors(fieldErrors);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
      <form
        className="space-y-4 xl:col-span-5"
        noValidate
        onSubmit={handleSubmit}
      >
        <div
          aria-label="Bagian pengaturan template"
          className="grid grid-cols-2 gap-1.5 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-1.5 sm:grid-cols-4"
          role="tablist"
        >
          {TEMPLATE_EDITOR_TABS.map(({ key, label, icon: Icon }) => {
            const selected = activeEditorTab === key;
            const hasError = errorTab === key;
            return (
              <button
                aria-selected={selected}
                className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-2 text-xs font-semibold transition ${
                  selected
                    ? "bg-teal-600 text-surface-0 shadow-xs"
                    : hasError
                      ? "bg-red-50 text-red-700 ring-1 ring-red-300"
                      : "text-slate-700 hover:bg-canvas-50 hover:text-ink-950"
                }`}
                key={key}
                onClick={() => setActiveEditorTab(key)}
                role="tab"
                type="button"
              >
                <Icon aria-hidden="true" className="shrink-0" size={14} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        {formError && (
          <div
            className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            role="alert"
          >
            {formError}
          </div>
        )}

        {activeEditorTab === "identity" && (
          <DocumentIdentityLogoSection
            draft={draft}
            fieldErrors={fieldErrors}
            logoInputRef={logoInputRef}
            logoPreviewUrl={logoPreviewUrl}
            onLogoUpload={handleLogoUpload}
            onUpdateField={updateField}
            uploadingLogo={uploadLogo.isPending}
          />
        )}

        {activeEditorTab === "paper" && (
          <DocumentPaperVisibilitySection
            draft={draft}
            fieldErrors={fieldErrors}
            onUpdateField={updateField}
          />
        )}

        {activeEditorTab === "structure" && (
          <div className="space-y-4">
            <DocumentSectionOrderCard
              onChange={(nextOrder) => updateField("section_order", nextOrder)}
              sectionOrder={draft.section_order}
            />
            <DocumentTableColumnsCard
              columns={draft.table_columns}
              onChange={(nextColumns) => updateField("table_columns", nextColumns)}
            />
          </div>
        )}

        {activeEditorTab === "signatures" && (
          <DocumentSignatureLayoutCard
            onChange={(nextSignatures) =>
              updateField("signature_layout", nextSignatures)
            }
            signatures={draft.signature_layout}
          />
        )}

        <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0/95 p-4 shadow-[var(--shadow-2)] backdrop-blur-xs">
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
