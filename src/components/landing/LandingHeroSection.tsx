import { ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { landingContent } from "@/content/landing";
import { proofIcons, statusToneClasses } from "./landingStyles";

/**
 * Landing page hero banner, live trace preview card, and operational proof strip.
 */
export function LandingHeroSection() {
  const { hero, proofPoints, workflow } = landingContent;

  return (
    <>
      <section className="relative bg-ink-950 pb-20 text-canvas-50 sm:pb-24 lg:pb-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_28%,rgb(38_104_87_/_0.24),transparent_55%)]"
        />

        <div className="relative mx-auto grid max-w-[1200px] gap-12 px-4 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-14 lg:px-8 lg:pt-20">
          <div className="min-w-0">
            <div className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[var(--radius-sm)] border border-[#8a9995]/50 bg-ink-800 px-3.5 py-1.5">
              <span className="text-xs font-semibold tracking-[0.02em] text-amber-400">
                {hero.eyebrow}
              </span>
              <span aria-hidden="true" className="text-xs text-[#c8d0cd]">
                ·
              </span>
              <span className="text-xs font-medium text-[#e2e6e4]">
                PO · GR · Transfer · Opname · Barcode
              </span>
            </div>

            <h1 className="mt-5 max-w-2xl text-[clamp(2rem,3.6vw+1rem,3.375rem)] leading-[1.15] font-bold tracking-[-0.025em] text-canvas-50">
              {hero.title}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-[1.75] text-[#e2e6e4] sm:text-lg">
              {hero.description}
            </p>

            <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <a
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-teal-600 px-6 py-3 text-sm font-semibold text-surface-0 shadow-[0_10px_24px_rgb(0_0_0_/_0.25)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-teal-700 active:translate-y-0"
                href={hero.primaryCta.href}
              >
                <span>{hero.primaryCta.label}</span>
                <ArrowRight aria-hidden="true" size={17} />
              </a>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-sm)] border border-[#8a9995] bg-ink-800 px-6 py-3 text-sm font-semibold text-canvas-50 transition-colors duration-150 hover:border-canvas-50 hover:bg-ink-800/80"
                to={hero.secondaryCta.href}
              >
                {hero.secondaryCta.label}
              </Link>
            </div>

            <div className="mt-10 border-t border-[#8a9995]/35 pt-6">
              <p className="text-[13px] font-medium tracking-[0.01em] text-[#d5dcda] sm:text-sm">
                Urutan siklus operasional gudang:
              </p>
              <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                {workflow.steps.map((step, index) => (
                  <div className="inline-flex items-center gap-2" key={step.number}>
                    <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[#8a9995]/40 bg-ink-800 px-3 py-1.5 text-xs font-semibold text-canvas-50 sm:text-[13px]">
                      <span className="tabular-nums text-amber-400">{step.number}</span>
                      <span>{step.label}</span>
                    </span>
                    {index < workflow.steps.length - 1 && (
                      <ChevronRight
                        aria-hidden="true"
                        className="text-[#c8d0cd]"
                        size={15}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-[var(--radius-lg)] border border-[#8a9995]/60 bg-ink-800 p-4 shadow-[0_24px_60px_rgb(0_0_0_/_0.35)] sm:p-6">
            <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[#8a9995]/50 bg-ink-950">
              <img
                alt={hero.image.alt}
                className="aspect-[16/9] w-full object-cover object-center"
                src={hero.image.src}
              />
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#8a9995]/40 bg-ink-950 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.02em] text-teal-400">
                    {hero.visualLabel}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-[#e2e6e4] sm:text-[13px]">
                    {hero.visualSubLabel}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-[var(--radius-sm)] bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  {hero.sampleDataBadge}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {hero.traceRecords.map((record) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-2.5 rounded-[var(--radius-sm)] border border-[#8a9995]/45 bg-ink-950 px-4 py-3 transition-colors duration-150 hover:border-teal-400/70"
                  key={record.documentCode}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-ink-800 px-2 py-0.5 text-xs font-medium text-[#d5dcda]">
                        {record.module}
                      </span>
                      <span className="tabular-nums text-xs font-bold text-canvas-50 sm:text-[13px]">
                        {record.documentCode}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-snug text-[#e2e6e4] tabular-nums sm:text-[13px]">
                      {record.detail}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-semibold ${statusToneClasses[record.tone]}`}
                  >
                    {record.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[var(--radius-sm)] border border-teal-400/40 bg-ink-950 px-4 py-3.5">
              <p className="text-xs font-semibold tracking-[0.02em] text-teal-400 sm:text-[13px]">
                {hero.traceSummaryTitle}
              </p>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-[#e2e6e4] sm:text-sm">
                {hero.visualCaption}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Bukti kendali operasional"
        className="relative z-10 -mt-10 px-4 sm:-mt-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-[1200px] gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-line-200 shadow-[var(--shadow-2)] sm:grid-cols-2 lg:grid-cols-4">
          {proofPoints.map((point, index) => {
            const Icon = proofIcons[point.icon];
            return (
              <div
                className="flex h-full min-w-0 flex-col justify-between bg-surface-0 p-6 sm:p-7"
                key={point.label}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-teal-100 text-teal-700">
                    <Icon aria-hidden="true" size={20} />
                  </span>
                  <span className="tabular-nums text-xs font-bold text-slate-600">
                    0{index + 1}
                  </span>
                </div>
                <div className="mt-5 min-w-0">
                  <h2 className="text-base leading-snug font-bold text-ink-950 sm:text-[17px]">
                    {point.label}
                  </h2>
                  <p className="mt-2 text-sm leading-[1.68] text-slate-700">
                    {point.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
