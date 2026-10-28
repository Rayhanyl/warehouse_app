import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  warehouseLabel?: string;
}

export function PageHeader({
  title,
  description,
  action,
  warehouseLabel,
}: PageHeaderProps) {
  return (
    <header className="mb-6 sm:mb-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-3 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-600"
      >
        <Link
          className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-sm)] px-1.5 py-1 text-teal-700 transition hover:bg-teal-100/60 hover:text-teal-600"
          to="/dashboard"
        >
          <Home aria-hidden="true" size={14} />
          <span>Beranda</span>
        </Link>
        <ChevronRight aria-hidden="true" className="text-slate-600" size={14} />
        <span aria-current="page" className="px-1 text-slate-700">
          {title}
        </span>
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[clamp(1.5rem,2vw+1rem,1.75rem)] font-bold leading-[1.2] tracking-[-0.02em] text-ink-950">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-[65ch] text-sm leading-6 text-slate-700">
              {description}
            </p>
          )}
          {warehouseLabel && (
            <span className="mt-3 inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
              Gudang aktif: {warehouseLabel}
            </span>
          )}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
    </header>
  );
}
