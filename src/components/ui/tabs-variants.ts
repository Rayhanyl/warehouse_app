import { cva } from "class-variance-authority";

export const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit max-w-full flex-wrap items-center justify-start gap-1 rounded-lg p-1 text-muted-foreground group-data-[orientation=horizontal]/tabs:min-h-11 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "border border-border bg-muted/80",
        line: "gap-1.5 border-b border-border bg-transparent px-0 py-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
