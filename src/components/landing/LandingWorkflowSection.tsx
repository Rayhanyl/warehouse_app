import { ChevronRight } from "lucide-react";
import { landingContent } from "@/content/landing";

interface LandingWorkflowSectionProps {
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
}

/**
 * Interactive warehouse workflow stepper illustrating how each module impacts stock balances.
 */
export function LandingWorkflowSection({
  activeStepIndex,
  onSelectStep,
}: LandingWorkflowSectionProps) {
  const { workflow } = landingContent;
  const activeStep = workflow.steps[activeStepIndex] ?? workflow.steps[0];

  return (
    <section
      className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      id="workflow"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-teal-700">
            {workflow.eyebrow}
          </p>
          <h2 className="mt-2.5 text-[clamp(1.75rem,2.6vw+1rem,2.5rem)] leading-[1.2] font-bold tracking-[-0.02em] text-ink-950">
            {workflow.title}
          </h2>
        </div>
        <p className="max-w-lg text-base leading-[1.7] text-slate-700">
          {workflow.description}
        </p>
      </div>

      <div className="mt-10 overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)] sm:mt-12 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative bg-ink-950">
          <img
            alt={activeStep.image.alt}
            className="aspect-[16/10] h-full w-full object-cover"
            src={activeStep.image.src}
          />
        </div>

        <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                <span className="tabular-nums">Tahap {activeStep.number}</span>
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
            <p className="mt-3.5 text-base leading-[1.7] text-slate-700">
              {activeStep.description}
            </p>
          </div>

          <div className="mt-6 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-200 pb-3">
              <span className="tabular-nums text-xs font-bold text-ink-950 sm:text-[13px]">
                {activeStep.documentExample}
              </span>
              <span className="inline-flex rounded-[var(--radius-sm)] bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                {activeStep.statusBadge}
              </span>
            </div>
            <p className="mt-3.5 text-sm leading-[1.65] text-slate-700">
              <span className="font-semibold text-ink-950">Dampak stok:</span>{" "}
              {activeStep.outcome}
            </p>
          </div>
        </div>
      </div>

      <div
        aria-label="Pilih tahapan alur kerja gudang"
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
        role="group"
      >
        {workflow.steps.map((step, index) => {
          const isSelected = index === activeStepIndex;
          return (
            <article
              className={`flex h-full min-w-0 flex-col justify-between rounded-[var(--radius-md)] border transition-all duration-150 ${
                isSelected
                  ? "border-teal-600 bg-surface-0 shadow-[var(--shadow-2)]"
                  : "border-line-200 bg-surface-0 shadow-[var(--shadow-1)] hover:-translate-y-0.5 hover:border-line-500"
              }`}
              key={step.number}
            >
              <button
                aria-pressed={isSelected}
                className="flex h-full w-full flex-col justify-between p-5 text-left sm:p-6"
                onClick={() => onSelectStep(index)}
                type="button"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-bold tabular-nums ${
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
                  <h4 className="mt-4 text-lg leading-snug font-bold text-ink-950">
                    {step.label}
                  </h4>
                  <p className="mt-2.5 text-sm leading-[1.68] text-slate-700">
                    {step.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-line-200 pt-3.5 text-xs font-semibold text-teal-600">
                  <span>
                    {isSelected ? "Tahap sedang ditampilkan" : "Lihat detail tahap"}
                  </span>
                  <ChevronRight aria-hidden="true" size={15} />
                </div>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
