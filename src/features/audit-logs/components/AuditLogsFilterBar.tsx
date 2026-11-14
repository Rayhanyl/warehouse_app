import type { FormEvent } from "react";
import { Filter, RotateCcw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AuditLogCategory, AuditLogFilters } from "../types";

const CATEGORY_TABS: { value: "all" | Exclude<AuditLogCategory, "">; label: string }[] = [
  { value: "all", label: "Semua Aktivitas" },
  { value: "business", label: "Aktivitas Bisnis & Data" },
  { value: "security", label: "Autentikasi & Keamanan" },
  { value: "failed", label: "Aktivitas Gagal" },
];

interface AuditLogsFilterBarProps {
  activeCategory: AuditLogCategory;
  includeTechnicalActive: boolean;
  activeFilterCount: number;
  draftFilters: AuditLogFilters;
  onCategoryChange: (nextValue: string) => void;
  onDraftChange: (next: AuditLogFilters) => void;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

export function AuditLogsFilterBar({
  activeCategory,
  includeTechnicalActive,
  activeFilterCount,
  draftFilters,
  onCategoryChange,
  onDraftChange,
  onApply,
  onReset,
}: AuditLogsFilterBarProps) {
  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Tabs onValueChange={onCategoryChange} value={activeCategory || "all"}>
          <TabsList aria-label="Kategori aktivitas audit log" className="h-auto flex-wrap justify-start">
            {CATEGORY_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {!includeTechnicalActive && (
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldAlert aria-hidden="true" className="size-3.5 text-teal-700" />
            <span>Noise teknis refresh token disembunyikan otomatis</span>
          </p>
        )}
      </div>

      <CollapsibleFilterPanel
        activeCount={activeFilterCount}
        ariaLabel="Filter audit log"
        className="mb-6 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5"
      >
        <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" onSubmit={onApply}>
          <label className="text-sm font-semibold text-foreground">
            Pencarian
            <Input
              className="mt-2 h-11 bg-card"
              onChange={(event) =>
                onDraftChange({ ...draftFilters, search: event.target.value })
              }
              placeholder="Username, aksi, IP, atau Request ID"
              value={draftFilters.search}
            />
          </label>
          <label className="text-sm font-semibold text-foreground">
            Status aksi
            <select
              className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3 text-sm font-normal text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onChange={(event) =>
                onDraftChange({
                  ...draftFilters,
                  status: event.target.value as AuditLogFilters["status"],
                })
              }
              value={draftFilters.status}
            >
              <option value="">Semua status</option>
              <option value="SUCCESS">Berhasil (SUCCESS)</option>
              <option value="FAILED">Gagal (FAILED)</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-foreground">
            Aksi
            <Input
              className="mt-2 h-11 bg-card"
              onChange={(event) =>
                onDraftChange({ ...draftFilters, action: event.target.value })
              }
              placeholder="Contoh: USER_UPDATED"
              value={draftFilters.action}
            />
          </label>
          <label className="text-sm font-semibold text-foreground">
            Jenis entitas
            <Input
              className="mt-2 h-11 bg-card"
              onChange={(event) =>
                onDraftChange({ ...draftFilters, entity_type: event.target.value })
              }
              placeholder="Contoh: users"
              value={draftFilters.entity_type}
            />
          </label>
          <label className="text-sm font-semibold text-foreground">
            Dari tanggal
            <Input
              className="mt-2 h-11 bg-card"
              onChange={(event) =>
                onDraftChange({ ...draftFilters, date_from: event.target.value })
              }
              type="datetime-local"
              value={draftFilters.date_from}
            />
          </label>
          <label className="text-sm font-semibold text-foreground">
            Sampai tanggal
            <Input
              className="mt-2 h-11 bg-card"
              onChange={(event) =>
                onDraftChange({ ...draftFilters, date_to: event.target.value })
              }
              type="datetime-local"
              value={draftFilters.date_to}
            />
          </label>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
              <input
                checked={draftFilters.include_technical}
                className="size-4 rounded border-input accent-teal-600"
                onChange={(event) =>
                  onDraftChange({
                    ...draftFilters,
                    include_technical: event.target.checked,
                  })
                }
                type="checkbox"
              />
              <span>Sertakan log teknis historis (AUTH_TOKEN_REFRESHED)</span>
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-3">
            <Button className="flex-1 sm:flex-initial" type="submit">
              <Filter aria-hidden="true" className="size-4" />
              Terapkan filter
            </Button>
            <Button
              className="flex-1 sm:flex-initial"
              onClick={onReset}
              type="button"
              variant="outline"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Atur ulang filter
            </Button>
          </div>
        </form>
      </CollapsibleFilterPanel>
    </>
  );
}
