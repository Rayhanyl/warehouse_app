import { Check, ShieldCheck } from "lucide-react";
import { landingContent } from "@/content/landing";
import { statusToneClasses } from "./landingStyles";

/**
 * Problem-solution matrix and RBAC security control showcase sections for the landing page.
 */
export function LandingPainAndSecuritySections() {
  const { painPoints, security } = landingContent;

  return (
    <>
      <section
        className="border-y border-line-200 bg-teal-100/55 py-16 sm:py-20 lg:py-24"
        id="pain-points"
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch lg:gap-10">
            <div className="flex min-w-0 flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-amber-700">
                {painPoints.eyebrow}
              </p>
              <h2 className="mt-2.5 max-w-2xl text-[clamp(1.75rem,2.6vw+1rem,2.5rem)] leading-[1.2] font-bold tracking-[-0.02em] text-ink-950">
                {painPoints.title}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-[1.7] text-slate-700">
                {painPoints.description}
              </p>
            </div>

            <div className="flex flex-col justify-center rounded-[var(--radius-lg)] border border-[#8a9995]/30 bg-ink-950 p-6 text-canvas-50 shadow-[var(--shadow-2)] sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-amber-400">
                Prinsip ketertelusuran stok
              </p>
              <p className="mt-2.5 text-lg leading-[1.45] font-bold text-canvas-50 sm:text-xl">
                Saldo tidak pernah berubah tanpa dokumen referensi yang sah.
              </p>
              <p className="mt-3 text-sm leading-[1.68] text-[#d5dcda]">
                Setiap mutasi masuk, pindah lokasi, maupun koreksi opname wajib melewati
                validasi status dan mencatat ID pengguna di audit log.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-2 lg:gap-6">
            {painPoints.items.map((item) => (
              <article
                className="flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)] transition-transform duration-150 hover:-translate-y-0.5"
                key={item.number}
              >
                <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line-200 bg-canvas-50 px-5 py-3.5 sm:px-6">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center rounded-[var(--radius-sm)] bg-amber-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-amber-700">
                      Kasus {item.number}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {painPoints.columnProblemLabel}
                    </span>
                  </div>
                  <span className="inline-flex rounded-[var(--radius-sm)] border border-line-200 bg-surface-0 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                    {item.moduleTag}
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-6">
                  <h3 className="text-lg leading-[1.45] font-bold text-ink-950">
                    {item.problem}
                  </h3>
                  <div className="mt-auto flex items-start gap-3.5 rounded-[var(--radius-sm)] border border-line-200 bg-canvas-50/85 p-4">
                    <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                      <Check aria-hidden="true" size={14} strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold tracking-[0.02em] text-teal-700">
                        {painPoints.columnSolutionLabel}
                      </p>
                      <p className="mt-1.5 text-sm leading-[1.68] text-slate-700">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:px-8 lg:py-24"
        id="security"
      >
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-teal-700">
            {security.eyebrow}
          </p>
          <h2 className="mt-2.5 text-[clamp(1.75rem,2.6vw+1rem,2.5rem)] leading-[1.2] font-bold tracking-[-0.02em] text-ink-950">
            {security.title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-[1.7] text-slate-700">
            {security.description}
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:gap-5">
            {security.pillars.map((pillar, index) => (
              <div
                className="flex h-full flex-col justify-between rounded-[var(--radius-md)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)] sm:p-6"
                key={pillar.title}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-teal-100 text-teal-700">
                    <Check aria-hidden="true" size={16} />
                  </span>
                  <span className="tabular-nums text-xs font-bold text-slate-600">
                    0{index + 1}
                  </span>
                </div>
                <div className="mt-4">
                  <dt className="text-base leading-snug font-bold text-ink-950">
                    {pillar.title}
                  </dt>
                  <dd className="mt-2 text-sm leading-[1.65] text-slate-700">
                    {pillar.description}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="min-w-0 rounded-[var(--radius-lg)] border border-[#8a9995]/50 bg-ink-950 p-5 text-canvas-50 shadow-[var(--shadow-2)] sm:p-7">
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[#8a9995]/40 bg-ink-800">
            <img
              alt={security.image.alt}
              className="aspect-[16/9] w-full object-cover"
              src={security.image.src}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 border-b border-[#8a9995]/40 pb-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck aria-hidden="true" className="shrink-0 text-teal-400" size={19} />
              <span className="text-sm font-bold text-canvas-50">
                {security.controlPanel.label}
              </span>
            </div>
            <span className="inline-flex items-center rounded-[var(--radius-sm)] bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700">
              {security.controlPanel.sampleBadge}
            </span>
          </div>

          <p className="mt-3.5 text-sm leading-[1.65] text-[#d5dcda]">
            {security.controlPanel.caption}
          </p>

          <div className="mt-4 space-y-2.5">
            {security.controlPanel.items.map((item) => (
              <div
                className="flex flex-wrap items-center justify-between gap-2.5 rounded-[var(--radius-sm)] border border-[#8a9995]/40 bg-ink-800 px-4 py-3"
                key={item.label}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-canvas-50">{item.label}</p>
                  <p className="mt-1 text-xs leading-snug text-[#d5dcda] tabular-nums sm:text-[13px]">
                    {item.detail}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-semibold ${statusToneClasses[item.tone]}`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
