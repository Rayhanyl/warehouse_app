import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { landingContent } from "@/content/landing";

interface LandingHeaderProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}

/**
 * Sticky landing page navigation bar with responsive mobile menu drawer.
 */
export function LandingHeader({
  menuOpen,
  onToggleMenu,
  onCloseMenu,
}: LandingHeaderProps) {
  const { hero, footer } = landingContent;

  return (
    <header className="sticky top-0 z-40 border-b border-line-200 bg-canvas-50/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link
          className="inline-flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] py-1 pr-2"
          to="/"
        >
          <img
            alt=""
            className="size-9 rounded-[var(--radius-sm)] border border-line-200 object-cover shadow-[var(--shadow-1)]"
            src="/assets/image/icon/icon.jpg"
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

        <nav aria-label={hero.navigation.ariaLabel} className="hidden items-center gap-2 md:flex">
          {hero.navigation.links.map((item) => (
            <a
              className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-3.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-surface-0 hover:text-ink-950"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
          <Link
            className="ml-2 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-line-500 bg-surface-0 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-[var(--shadow-1)] transition-all duration-150 hover:border-teal-600 hover:text-teal-600"
            to={hero.navigation.loginLink.href}
          >
            {hero.navigation.loginLink.label}
          </Link>
        </nav>

        <button
          aria-controls="mobile-landing-nav"
          aria-expanded={menuOpen}
          aria-label={
            menuOpen
              ? hero.navigation.closeMenuAriaLabel
              : hero.navigation.openMenuAriaLabel
          }
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-line-500 bg-surface-0 px-3.5 py-2 text-sm font-semibold text-ink-950 shadow-[var(--shadow-1)] transition-colors duration-150 hover:border-teal-600 active:bg-teal-100 md:hidden"
          onClick={onToggleMenu}
          type="button"
        >
          {menuOpen ? (
            <X aria-hidden="true" size={18} />
          ) : (
            <Menu aria-hidden="true" size={18} />
          )}
          <span>
            {menuOpen ? hero.navigation.closeMenuLabel : hero.navigation.openMenuLabel}
          </span>
        </button>
      </div>

      {menuOpen && (
        <nav
          aria-label={hero.navigation.mobileAriaLabel}
          className="border-t border-line-200 bg-surface-0 px-4 py-4 shadow-[var(--shadow-2)] sm:px-6 md:hidden"
          id="mobile-landing-nav"
        >
          <div className="mx-auto flex max-w-[1200px] flex-col gap-2">
            {hero.navigation.links.map((item) => (
              <a
                className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-3 text-sm font-medium text-ink-950 transition-colors duration-150 hover:bg-canvas-50 active:bg-teal-100"
                href={item.href}
                key={item.href}
                onClick={onCloseMenu}
              >
                {item.label}
              </a>
            ))}
            <Link
              className="mt-1 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-teal-600 px-4 py-2.5 text-sm font-semibold text-surface-0 transition-colors duration-150 hover:bg-teal-700"
              onClick={onCloseMenu}
              to={hero.navigation.mobileLoginLink.href}
            >
              {hero.navigation.mobileLoginLink.label}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
