import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  warehouseLabel?: string;
}

export function PageHeader({ title, description, action, warehouseLabel }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs font-semibold text-[#416a8a]">
        <Link className="inline-flex items-center gap-1 outline-none hover:text-[#2f7a68] focus-visible:ring-2 focus-visible:ring-[#2f7a68]" to="/dashboard">
          <Home aria-hidden="true" size={14} />
          Beranda
        </Link>
        <ChevronRight aria-hidden="true" size={14} />
        <span aria-current="page" className="text-[#667876]">{title}</span>
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-9 tracking-tight text-[#17252a]">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667876]">{description}</p>}
          {warehouseLabel && (
            <span className="mt-4 inline-flex rounded-full bg-[#e3ebe3] px-3 py-1 text-xs font-semibold text-[#2f7a68]">
              Gudang aktif: {warehouseLabel}
            </span>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
