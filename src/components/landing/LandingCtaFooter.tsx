import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { landingContent } from "@/content/landing";

/**
 * Call-to-action banner and product footer for the public landing page.
 */
export function LandingCtaFooter() {
  const { cta, footer, hero } = landingContent;

  return (
    <>
      <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[var(--radius-lg)] bg-ink-950 px-6 py-10 text-canvas-50 shadow-[var(--shadow-2)] sm:px-10 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_50%,rgb(38_104_87_/_0.28),transparent_55%)]"
          />
          <div className="relative min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-amber-400">
              {cta.eyebrow}
            </p>
            <h2 className="mt-2.5 max-w-2xl text-[clamp(1.75rem,2.6vw+1rem,2.375rem)] leading-[1.2] font-bold tracking-[-0.02em] text-canvas-50">
              {cta.title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-[1.7] text-[#e2e6e4]">
              {cta.description}
            </p>
          </div>
          <div className="relative mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center lg:mt-0 lg:shrink-0">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-teal-600 px-6 py-3 text-sm font-semibold text-surface-0 shadow-[0_10px_24px_rgb(0_0_0_/_0.25)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-teal-700"
              to={cta.button.href}
            >
              <span>{cta.button.label}</span>
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-sm)] border border-[#8a9995] bg-ink-800 px-6 py-3 text-sm font-semibold text-canvas-50 transition-colors duration-150 hover:border-canvas-50"
              href={cta.secondaryLink.href}
            >
              {cta.secondaryLink.label}
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-line-200 bg-surface-0">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-12 lg:px-8">
          <div className="flex items-center gap-4">
            <img
              alt={footer.image.alt}
              className="h-10 w-auto max-w-[160px] rounded-[var(--radius-sm)] border border-line-200 object-cover object-left"
              src={footer.image.src}
            />
            <div className="min-w-0">
              <p className="font-bold text-ink-950">{footer.productName}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600 sm:text-sm">
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
            <p className="text-xs text-slate-600 sm:text-[13px]">
              © 2026 {footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
