import {
  ArrowRight,
  Boxes,
  Check,
  ChevronRight,
  Menu,
  Route,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { landingContent } from "@/content/landing";

const proofIcons = {
  boxes: Boxes,
  route: Route,
  "shield-check": ShieldCheck,
} as const;

const statusToneClasses = {
  teal: "bg-teal-100 text-teal-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
} as const;

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const { hero, proofPoints, workflow, painPoints, security, cta, footer } =
    landingContent;

  const activeStep = workflow.steps[activeStepIndex] ?? workflow.steps[0];

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-canvas-50 text-ink-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-[var(--radius-sm)] focus:bg-teal-600 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-surface-0"
      >
        {hero.skipLinkLabel}
      </a>

      <header className="sticky top-0 z-40 border-b border-line-200 bg-canvas-50/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] py-1 pr-2"
          >
            <img
              className="size-9 rounded-[var(--radius-sm)] border border-line-200 object-cover shadow-[var(--shadow-1)]"
              src="/assets/image/icon/icon.jpg"
              alt=""
            />
            <span className="flex flex-col">
              <span className="text-base leading-tight font-bold tracking-[-0.01em] text-ink-950">
                {footer.productName}
              </span>
              <span className="text-xs leading-tight text-slate-600">
                {footer.descriptor}
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-2 md:flex"
            aria-label={hero.navigation.ariaLabel}
          >
            {hero.navigation.links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-3.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-surface-0 hover:text-ink-950"
              >
                {item.label}
              </a>
            ))}
            <Link
              to={hero.navigation.loginLink.href}
              className="ml-2 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-line-500 bg-surface-0 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-[var(--shadow-1)] transition-all duration-150 hover:border-teal-600 hover:text-teal-600"
            >
              {hero.navigation.loginLink.label}
            </Link>
          </nav>

          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-line-500 bg-surface-0 px-3.5 py-2 text-sm font-semibold text-ink-950 shadow-[var(--shadow-1)] transition-colors duration-150 hover:border-teal-600 active:bg-teal-100 md:hidden"
            aria-label={
              menuOpen
                ? hero.navigation.closeMenuAriaLabel
                : hero.navigation.openMenuAriaLabel
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-landing-nav"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? (
              <X size={18} aria-hidden="true" />
            ) : (
              <Menu size={18} aria-hidden="true" />
            )}
            <span>
              {menuOpen
                ? hero.navigation.closeMenuLabel
                : hero.navigation.openMenuLabel}
            </span>
          </button>
        </div>

        {menuOpen && (
          <nav
            id="mobile-landing-nav"
            className="border-t border-line-200 bg-surface-0 px-4 py-4 shadow-[var(--shadow-2)] sm:px-6 md:hidden"
            aria-label={hero.navigation.mobileAriaLabel}
          >
            <div className="mx-auto flex max-w-[1200px] flex-col gap-2">
              {hero.navigation.links.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-3 text-sm font-medium text-ink-950 transition-colors duration-150 hover:bg-canvas-50 active:bg-teal-100"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link
                to={hero.navigation.mobileLoginLink.href}
                className="mt-1 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-teal-600 px-4 py-2.5 text-sm font-semibold text-surface-0 transition-colors duration-150 hover:bg-teal-700"
                onClick={() => setMenuOpen(false)}
              >
                {hero.navigation.mobileLoginLink.label}
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main id="main-content">
        <section className="relative bg-ink-950 pb-16 text-canvas-50 sm:pb-24 lg:pb-28">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_28%,rgb(38_104_87_/_0.24),transparent_55%)]"
          />

          <div className="relative mx-auto grid max-w-[1200px] gap-12 px-4 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-14 lg:px-8 lg:pt-20">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[#8a9995]/50 bg-ink-800 px-3 py-1.5">
                <span className="text-xs font-semibold text-amber-400">
                  {hero.eyebrow}
                </span>
                <span aria-hidden="true" className="text-xs text-[#c8d0cd]">
                  ·
                </span>
                <span className="text-xs font-medium text-[#e2e6e4]">
                  PO · GR · Transfer · Opname
                </span>
              </div>

              <h1 className="mt-5 max-w-2xl text-[clamp(2.25rem,4vw+1rem,3.375rem)] leading-[1.12] font-bold tracking-[-0.025em] text-canvas-50">
                {hero.title}
              </h1>

              <p className="mt-6 max-w-xl text-base leading-[1.7] text-[#e2e6e4] sm:text-lg">
                {hero.description}
              </p>

              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <a
                  href={hero.primaryCta.href}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-teal-600 px-6 py-3 text-sm font-semibold text-surface-0 shadow-[0_10px_24px_rgb(0_0_0_/_0.25)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-teal-700 active:translate-y-0"
                >
                  <span>{hero.primaryCta.label}</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </a>
                <Link
                  to={hero.secondaryCta.href}
                  className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-sm)] border border-[#8a9995] bg-ink-800 px-6 py-3 text-sm font-semibold text-canvas-50 transition-colors duration-150 hover:border-canvas-50 hover:bg-ink-800/80"
                >
                  {hero.secondaryCta.label}
                </Link>
              </div>

              <div className="mt-10 border-t border-[#8a9995]/35 pt-6">
                <p className="text-xs font-medium text-[#c8d0cd]">
                  Urutan siklus operasional gudang:
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {workflow.steps.map((step, index) => (
                    <div
                      key={step.number}
                      className="inline-flex items-center gap-2"
                    >
                      <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[#8a9995]/40 bg-ink-800 px-2.5 py-1 text-xs font-semibold text-canvas-50">
                        <span className="tabular-nums text-amber-400">
                          {step.number}
                        </span>
                        <span>{step.label}</span>
                      </span>
                      {index < workflow.steps.length - 1 && (
                        <ChevronRight
                          size={15}
                          className="text-[#c8d0cd]"
                          aria-hidden="true"
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
                  className="aspect-[16/9] w-full object-cover object-center"
                  src={hero.image.src}
                  alt={hero.image.alt}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#8a9995]/40 bg-ink-950 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-teal-400">
                      {hero.visualLabel}
                    </p>
                    <p className="mt-0.5 text-xs text-[#e2e6e4]">
                      {hero.visualSubLabel}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-[var(--radius-sm)] bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {hero.sampleDataBadge}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {hero.traceRecords.map((record) => (
                  <div
                    key={record.documentCode}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[#8a9995]/45 bg-ink-950 px-3.5 py-3 transition-colors duration-150 hover:border-teal-400/70"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-ink-800 px-2 py-0.5 text-xs font-medium text-[#c8d0cd]">
                          {record.module}
                        </span>
                        <span className="tabular-nums text-xs font-bold text-canvas-50">
                          {record.documentCode}
                        </span>
                      </div>
                      <p className="tabular-nums mt-1 text-xs text-[#e2e6e4]">
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

              <div className="mt-4 rounded-[var(--radius-sm)] border border-teal-400/40 bg-ink-950 px-4 py-3">
                <p className="text-xs font-semibold text-teal-400">
                  {hero.traceSummaryTitle}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#e2e6e4]">
                  {hero.visualCaption}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="relative z-10 -mt-8 px-4 sm:-mt-12 sm:px-6 lg:px-8"
          aria-label="Bukti kendali operasional"
        >
          <div className="mx-auto grid max-w-[1200px] gap-0 overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)] sm:grid-cols-3">
            {proofPoints.map((point, index) => {
              const Icon = proofIcons[point.icon];
              return (
                <div
                  key={point.label}
                  className={`flex min-w-0 flex-col justify-between p-5 sm:p-7 ${
                    index > 0
                      ? "border-t border-line-200 sm:border-t-0 sm:border-l"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-teal-100 text-teal-700">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="tabular-nums text-xs font-bold text-slate-600">
                      0{index + 1}
                    </span>
                  </div>
                  <div className="mt-4 min-w-0">
                    <h2 className="text-base font-bold text-ink-950">
                      {point.label}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                      {point.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          id="workflow"
          className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-teal-600">
                {workflow.eyebrow}
              </p>
              <h2 className="mt-2 text-[clamp(1.75rem,2.8vw+1rem,2.5rem)] leading-[1.2] font-bold tracking-[-0.02em] text-ink-950">
                {workflow.title}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-[1.65] text-slate-700">
              {workflow.description}
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)] lg:grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative bg-ink-950">
              <img
                className="aspect-[16/10] h-full w-full object-cover"
                src={activeStep.image.src}
                alt={activeStep.image.alt}
              />
            </div>

            <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                    <span className="tabular-nums">
                      Tahap {activeStep.number}
                    </span>
                    <span>·</span>
                    <span>{activeStep.moduleLabel}</span>
                  </span>
                  <span className="inline-flex items-center rounded-[var(--radius-sm)] bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700">
                    {workflow.sampleBadge}
                  </span>
                </div>

                <h3 className="mt-5 text-2xl leading-[1.3] font-bold text-ink-950 sm:text-3xl">
                  {activeStep.label}
                </h3>
                <p className="mt-3 text-base leading-[1.65] text-slate-700">
                  {activeStep.description}
                </p>
              </div>

              <div className="mt-6 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-200 pb-3">
                  <span className="tabular-nums text-xs font-bold text-ink-950">
                    {activeStep.documentExample}
                  </span>
                  <span className="inline-flex rounded-[var(--radius-sm)] bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                    {activeStep.statusBadge}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed font-medium text-slate-700">
                  Dampak stok: {activeStep.outcome}
                </p>
              </div>
            </div>
          </div>

          <div
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            role="group"
            aria-label="Pilih tahapan alur kerja gudang"
          >
            {workflow.steps.map((step, index) => {
              const isSelected = index === activeStepIndex;
              return (
                <article
                  key={step.number}
                  className={`flex min-w-0 flex-col justify-between rounded-[var(--radius-md)] border transition-all duration-150 ${
                    isSelected
                      ? "border-teal-600 bg-surface-0 shadow-[var(--shadow-2)]"
                      : "border-line-200 bg-surface-0 shadow-[var(--shadow-1)] hover:-translate-y-0.5 hover:border-line-500"
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setActiveStepIndex(index)}
                    className="flex h-full w-full flex-col justify-between p-5 text-left"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`tabular-nums inline-flex rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-bold ${
                            isSelected
                              ? "bg-teal-600 text-surface-0"
                              : "bg-canvas-50 text-amber-600"
                          }`}
                        >
                          {step.number}
                        </span>
                        <span className="text-xs font-medium text-slate-600">
                          {step.moduleLabel}
                        </span>
                      </div>
                      <h4 className="mt-4 text-lg font-bold text-ink-950">
                        {step.label}
                      </h4>
                      <p className="mt-2 text-sm leading-[1.6] text-slate-700">
                        {step.description}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-line-200 pt-3 text-xs font-semibold text-teal-600">
                      <span>
                        {isSelected ? "Tahap sedang ditampilkan" : "Lihat detail tahap"}
                      </span>
                      <ChevronRight size={15} aria-hidden="true" />
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section
          id="pain-points"
          className="border-y border-line-200 bg-teal-100/55 py-16 sm:py-20 lg:py-24"
        >
          <div className="mx-auto grid max-w-[1200px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-12 lg:px-8">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-700">
                {painPoints.eyebrow}
              </p>
              <h2 className="mt-2 text-[clamp(1.75rem,2.8vw+1rem,2.5rem)] leading-[1.2] font-bold tracking-[-0.02em] text-ink-950">
                {painPoints.title}
              </h2>
              <p className="mt-4 text-base leading-[1.65] text-slate-700">
                {painPoints.description}
              </p>

              <div className="mt-8 rounded-[var(--radius-lg)] bg-ink-950 p-6 text-canvas-50 shadow-[var(--shadow-2)]">
                <p className="text-xs font-semibold text-amber-400">
                  Prinsip ketertelusuran stok
                </p>
                <p className="mt-2 text-lg leading-[1.4] font-bold text-canvas-50">
                  Saldo tidak pernah berubah tanpa dokumen referensi yang sah.
                </p>
                <p className="mt-2.5 text-xs leading-relaxed text-[#c8d0cd]">
                  Setiap mutasi masuk, pindah lokasi, maupun koreksi opname
                  wajib melewati validasi status dan mencatat ID pengguna di
                  audit log.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {painPoints.items.map((item) => (
                <article
                  key={item.number}
                  className="overflow-hidden rounded-[var(--radius-md)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)] transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-200 bg-canvas-50 px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="tabular-nums text-xs font-bold text-amber-600">
                        Kasus {item.number}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">
                        ·
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {painPoints.columnProblemLabel}
                      </span>
                    </div>
                    <span className="inline-flex rounded-[var(--radius-sm)] border border-line-200 bg-surface-0 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                      {item.moduleTag}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6">
                    <h3 className="text-base leading-[1.45] font-bold text-ink-950 sm:text-lg">
                      {item.problem}
                    </h3>
                    <div className="mt-3.5 flex items-start gap-3 rounded-[var(--radius-sm)] border border-line-200 bg-canvas-50/70 p-3.5">
                      <Check
                        className="mt-0.5 shrink-0 text-teal-600"
                        size={17}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-xs font-semibold text-teal-700">
                          {painPoints.columnSolutionLabel}
                        </p>
                        <p className="mt-1 text-sm leading-[1.6] text-slate-700">
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
          id="security"
          className="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:px-8 lg:py-24"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold text-teal-600">
              {security.eyebrow}
            </p>
            <h2 className="mt-2 text-[clamp(1.75rem,2.8vw+1rem,2.5rem)] leading-[1.2] font-bold tracking-[-0.02em] text-ink-950">
              {security.title}
            </h2>
            <p className="mt-3 text-base leading-[1.65] text-slate-700">
              {security.description}
            </p>

            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              {security.pillars.map((pillar, index) => (
                <div
                  key={pillar.title}
                  className="flex flex-col justify-between rounded-[var(--radius-md)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-teal-100 text-teal-700">
                      <Check size={16} aria-hidden="true" />
                    </span>
                    <span className="tabular-nums text-xs font-bold text-slate-600">
                      0{index + 1}
                    </span>
                  </div>
                  <div className="mt-4">
                    <dt className="text-sm font-bold text-ink-950">
                      {pillar.title}
                    </dt>
                    <dd className="mt-1.5 text-xs leading-[1.6] text-slate-700">
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
                className="aspect-[16/9] w-full object-cover"
                src={security.image.src}
                alt={security.image.alt}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#8a9995]/40 pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck
                  className="shrink-0 text-teal-400"
                  size={19}
                  aria-hidden="true"
                />
                <span className="text-sm font-bold text-canvas-50">
                  {security.controlPanel.label}
                </span>
              </div>
              <span className="inline-flex items-center rounded-[var(--radius-sm)] bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700">
                {security.controlPanel.sampleBadge}
              </span>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-[#c8d0cd]">
              {security.controlPanel.caption}
            </p>

            <div className="mt-4 space-y-2.5">
              {security.controlPanel.items.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[#8a9995]/40 bg-ink-800 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-canvas-50">
                      {item.label}
                    </p>
                    <p className="tabular-nums mt-0.5 text-xs text-[#c8d0cd]">
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

        <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[var(--radius-lg)] bg-ink-950 px-6 py-10 text-canvas-50 shadow-[var(--shadow-2)] sm:px-10 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_50%,rgb(38_104_87_/_0.28),transparent_55%)]"
            />
            <div className="relative min-w-0">
              <p className="text-xs font-semibold text-amber-400">
                {cta.eyebrow}
              </p>
              <h2 className="mt-2 max-w-2xl text-[clamp(1.75rem,2.8vw+1rem,2.375rem)] leading-[1.2] font-bold tracking-[-0.02em] text-canvas-50">
                {cta.title}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-[1.65] text-[#e2e6e4]">
                {cta.description}
              </p>
            </div>
            <div className="relative mt-7 flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-0 lg:shrink-0">
              <Link
                to={cta.button.href}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-teal-600 px-6 py-3 text-sm font-semibold text-surface-0 shadow-[0_10px_24px_rgb(0_0_0_/_0.25)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-teal-700"
              >
                <span>{cta.button.label}</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <a
                href={cta.secondaryLink.href}
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-sm)] border border-[#8a9995] bg-ink-800 px-6 py-3 text-sm font-semibold text-canvas-50 transition-colors duration-150 hover:border-canvas-50"
              >
                {cta.secondaryLink.label}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line-200 bg-surface-0">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 py-8 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img
              className="h-10 w-auto max-w-[160px] rounded-[var(--radius-sm)] border border-line-200 object-cover object-left"
              src={footer.image.src}
              alt={footer.image.alt}
            />
            <div className="min-w-0">
              <p className="font-bold text-ink-950">{footer.productName}</p>
              <p className="mt-0.5 text-xs text-slate-600">
                {footer.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              className="inline-flex min-h-11 items-center px-2 font-semibold text-teal-600 transition-colors duration-150 hover:text-ink-950"
              to={hero.navigation.loginLink.href}
            >
              {footer.loginLabel}
            </Link>
            <p className="text-xs text-slate-600">
              © 2026 {footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
