import { useEffect, useState } from "react";
import { landingContent } from "@/content/landing";
import { LandingCtaFooter } from "@/components/landing/LandingCtaFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHeroSection } from "@/components/landing/LandingHeroSection";
import { LandingPainAndSecuritySections } from "@/components/landing/LandingPainAndSecuritySections";
import { LandingWorkflowSection } from "@/components/landing/LandingWorkflowSection";

/**
 * Public landing page showcasing WMS operational lifecycle, traceability guarantees, and security controls.
 */
export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const { hero } = landingContent;

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
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-[var(--radius-sm)] focus:bg-teal-600 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-surface-0"
        href="#main-content"
      >
        {hero.skipLinkLabel}
      </a>

      <LandingHeader
        menuOpen={menuOpen}
        onCloseMenu={() => setMenuOpen(false)}
        onToggleMenu={() => setMenuOpen((prev) => !prev)}
      />

      <main id="main-content">
        <LandingHeroSection />
        <LandingWorkflowSection
          activeStepIndex={activeStepIndex}
          onSelectStep={setActiveStepIndex}
        />
        <LandingPainAndSecuritySections />
      </main>

      <LandingCtaFooter />
    </div>
  );
}
