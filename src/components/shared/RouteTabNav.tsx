import { Link } from "react-router-dom";
import { type VariantProps } from "class-variance-authority";

import { tabsListVariants } from "@/components/ui/tabs-variants";
import { cn } from "@/lib/utils";

export interface RouteTabItem {
  to: string;
  label: string;
  active: boolean;
}

export interface RouteTabNavProps extends VariantProps<typeof tabsListVariants> {
  ariaLabel: string;
  items: readonly RouteTabItem[];
  className?: string;
}

/**
 * Navigasi tab berbasis React Router `<Link>` yang mengikuti desain primitif `shadcn/ui` Tabs
 * dengan target sentuh minimal 44px serta layout wrapping responsif untuk mobile dan tablet.
 */
export function RouteTabNav({
  ariaLabel,
  items,
  variant = "default",
  className,
}: RouteTabNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn("mb-6", className)}
      data-slot="route-tab-nav"
    >
      <div
        className={cn(
          tabsListVariants({ variant }),
          "flex h-auto w-full max-w-full flex-wrap items-center justify-start gap-1 sm:w-fit",
        )}
        data-variant={variant ?? "default"}
      >
        {items.map((item) => (
          <Link
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-md border border-transparent px-3.5 py-2 text-sm font-semibold transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              variant === "line"
                ? cn(
                    "rounded-none border-x-0 border-t-0 border-b-2 px-3",
                    item.active
                      ? "border-teal-600 text-teal-700"
                      : "border-transparent text-slate-700 hover:border-line-500 hover:text-ink-950",
                  )
                : item.active
                  ? "border-border/70 bg-card text-teal-700 shadow-xs"
                  : "text-slate-700 hover:bg-card/60 hover:text-ink-950",
            )}
            data-slot="route-tab-trigger"
            data-state={item.active ? "active" : "inactive"}
            key={item.to}
            to={item.to}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
