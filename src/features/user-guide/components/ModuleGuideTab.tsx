import { useMemo } from "react";
import { CheckCircle2, HelpCircle } from "lucide-react";
import { GUIDE_FIELDS, MODULE_GUIDES } from "../guideContent";
import type { GuideModuleId } from "../types";

const MODULE_LIST = Object.values(MODULE_GUIDES);

export function ModuleGuideTab({
  activeModuleId,
  onSelectModule,
  onOpenFieldsTab,
}: {
  activeModuleId: GuideModuleId;
  onSelectModule: (id: GuideModuleId) => void;
  onOpenFieldsTab: () => void;
}) {
  const guide = MODULE_GUIDES[activeModuleId] ?? MODULE_GUIDES.dashboard;
  const relatedFields = useMemo(
    () => GUIDE_FIELDS.filter((field) => guide.fieldIds.includes(field.id)),
    [guide.fieldIds],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800">
            Modul: {guide.category}
          </span>
          <h3 className="mt-1 text-base font-bold text-ink-950">{guide.title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-slate-700">{guide.summary}</p>
        </div>
        <div className="shrink-0 sm:w-64">
          <label
            className="mb-1 block text-[11px] font-semibold text-slate-600"
            htmlFor="guide-module-select"
          >
            Lihat SOP Modul Lain
          </label>
          <select
            className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-2.5 text-xs font-medium text-ink-950"
            id="guide-module-select"
            onChange={(event) => onSelectModule(event.target.value as GuideModuleId)}
            value={guide.id}
          >
            {MODULE_LIST.map((item) => (
              <option key={item.id} value={item.id}>
                {item.category}: {item.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-line-200 bg-surface-0 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
            Kapan Digunakan &amp; Prasyarat
          </h4>
          <p className="mt-2 text-xs leading-5 text-slate-700">{guide.whenToUse}</p>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
            {guide.prerequisites.map((req) => (
              <li className="flex items-start gap-2" key={req}>
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-teal-600"
                  size={14}
                />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--radius-md)] border border-line-200 bg-surface-0 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
            Langkah Penggunaan
          </h4>
          <ol className="mt-2 space-y-2 text-xs leading-5 text-slate-700">
            {guide.stepByStep.map((step, index) => (
              <li className="flex items-start gap-2.5" key={step}>
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-teal-600 text-[11px] font-bold text-surface-0 tabular-nums">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4">
        <h4 className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
          <HelpCircle aria-hidden="true" size={15} />
          Tips Menghindari Kesalahan Input
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-950">
          {guide.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      {relatedFields.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
              Field Penting pada Modul Ini
            </h4>
            <button
              className="text-xs font-semibold text-teal-700 hover:underline"
              onClick={onOpenFieldsTab}
              type="button"
            >
              Buka Semua Kamus Field
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {relatedFields.map((field) => (
              <div
                className="rounded-[var(--radius-md)] border border-line-200 bg-surface-0 p-3 text-xs"
                key={field.id}
              >
                <p className="font-bold text-ink-950">{field.label}</p>
                <p className="mt-1 leading-5 text-slate-700">{field.description}</p>
                <p className="mt-2 rounded bg-teal-50 px-2 py-1 font-medium text-teal-900">
                  Contoh: {field.exampleValid}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
