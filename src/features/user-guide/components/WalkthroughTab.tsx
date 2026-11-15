import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { WALKTHROUGH_STAGES } from "../guideContent";

export function WalkthroughTab({
  walkthroughStep,
  completedSteps,
  onSelectStep,
  onToggleComplete,
  onNavigateToRoute,
}: {
  walkthroughStep: number;
  completedSteps: number[];
  onSelectStep: (stepNumber: number) => void;
  onToggleComplete: (stepNumber: number) => void;
  onNavigateToRoute: (route: string) => void;
}) {
  const stage =
    WALKTHROUGH_STAGES.find((item) => item.stepNumber === walkthroughStep) ??
    WALKTHROUGH_STAGES[0];
  const isCompleted = completedSteps.includes(stage.stepNumber);

  return (
    <div className="space-y-5">
      <div className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-50 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-700">
            Alur Inti WMS: Pengadaan PO -&gt; Penerimaan GR -&gt; Penyimpanan Rak -&gt; Transfer
            Gudang -&gt; Stock Opname
          </p>
          <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800 tabular-nums">
            Selesai: {completedSteps.length}/{WALKTHROUGH_STAGES.length} tahap
          </span>
        </div>

        <div aria-label="Langkah alur kerja WMS" className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {WALKTHROUGH_STAGES.map((item) => {
            const active = item.stepNumber === stage.stepNumber;
            const done = completedSteps.includes(item.stepNumber);
            return (
              <button
                aria-current={active ? "step" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-left text-xs font-semibold transition ${
                  active
                    ? "border-teal-600 bg-teal-600 text-surface-0"
                    : done
                      ? "border-teal-200 bg-teal-50 text-teal-900"
                      : "border-line-200 bg-surface-0 text-slate-700 hover:bg-surface-50"
                }`}
                key={item.stepNumber}
                onClick={() => onSelectStep(item.stepNumber)}
                type="button"
              >
                <span className="tabular-nums">{item.stepNumber}.</span>
                <span>{item.shortTitle}</span>
                {done && !active && (
                  <CheckCircle2 aria-hidden="true" className="text-teal-700" size={13} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <article className="space-y-4 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-teal-700">
              Aktor: {stage.actorRole}
            </span>
            <h3 className="mt-0.5 text-lg font-bold text-ink-950">{stage.title}</h3>
            <p className="mt-1 text-sm text-slate-700">{stage.goal}</p>
          </div>
          <button
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-xs font-semibold transition ${
              isCompleted
                ? "border-teal-600 bg-teal-50 text-teal-800"
                : "border-line-200 bg-surface-0 text-slate-700 hover:bg-surface-50"
            }`}
            onClick={() => onToggleComplete(stage.stepNumber)}
            type="button"
          >
            <CheckCircle2 aria-hidden="true" size={15} />
            {isCompleted ? "Tahap Dipahami" : "Tandai Selesai"}
          </button>
        </div>

        <ol className="space-y-2 rounded-[var(--radius-md)] bg-surface-50 p-3.5 text-xs leading-5 text-slate-800 sm:text-sm">
          {stage.actions.map((action, idx) => (
            <li className="flex items-start gap-2.5" key={action}>
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ink-950 text-[11px] font-bold text-surface-0 tabular-nums">
                {idx + 1}
              </span>
              <span>{action}</span>
            </li>
          ))}
        </ol>

        <div className="rounded-[var(--radius-md)] border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-950">
          <strong>Dampak Sistem Selanjutnya:</strong> {stage.whatHappensNext}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-200 pt-3">
          <div className="flex items-center gap-2">
            <button
              className="inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-md)] border border-line-200 px-3 text-xs font-semibold text-slate-700 hover:bg-surface-50 disabled:opacity-40"
              disabled={stage.stepNumber <= 1}
              onClick={() => onSelectStep(stage.stepNumber - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={15} />
              Sebelumnya
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-md)] border border-line-200 px-3 text-xs font-semibold text-slate-700 hover:bg-surface-50 disabled:opacity-40"
              disabled={stage.stepNumber >= WALKTHROUGH_STAGES.length}
              onClick={() => onSelectStep(stage.stepNumber + 1)}
              type="button"
            >
              Langkah Berikutnya
              <ChevronRight aria-hidden="true" size={15} />
            </button>
          </div>
          <button
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-md)] border border-teal-600 bg-surface-0 px-3.5 text-xs font-semibold text-teal-800 hover:bg-teal-50"
            onClick={() => onNavigateToRoute(stage.targetRoute)}
            type="button"
          >
            <span>Buka Modul Ini</span>
            <ArrowRight aria-hidden="true" size={14} />
          </button>
        </div>
      </article>
    </div>
  );
}
