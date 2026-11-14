import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { getMenuIconComponent } from "@/features/navigation/icons";
import type { MenuItem } from "@/features/navigation/types";

export interface ModuleShortcutsGridProps {
  menu: readonly MenuItem[];
}

interface ShortcutEntry {
  item: MenuItem;
  category: string | null;
}

function collectShortcuts(
  items: readonly MenuItem[],
  parentCategory: string | null = null,
): ShortcutEntry[] {
  return items.flatMap((item) => {
    const descendants = collectShortcuts(item.children, item.name);
    if (
      item.path &&
      item.path !== "/dashboard" &&
      item.menu_type !== "group" &&
      item.children.length === 0
    ) {
      return [{ item, category: parentCategory }, ...descendants];
    }
    return descendants;
  });
}

/**
 * Menampilkan grid pintasan menuju modul operasional berdasarkan hak akses menu pengguna.
 */
export function ModuleShortcutsGrid({ menu }: ModuleShortcutsGridProps) {
  const shortcuts = collectShortcuts(menu).slice(0, 9);

  return (
    <section aria-labelledby="shortcut-title" className="mt-6 sm:mt-8">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-ink-950" id="shortcut-title">
          Pintasan modul
        </h2>
        <p className="mt-1 text-sm text-slate-700">
          Buka modul kerja yang tersedia sesuai izin peran akun Anda.
        </p>
      </div>

      {shortcuts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-slate-700">
          Belum ada pintasan modul yang tersedia untuk akun Anda.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map(({ item, category }) => {
            const Icon = getMenuIconComponent(item);
            return (
              <Link
                className="group block focus:outline-none"
                key={item.id}
                to={item.path}
              >
                <Card className="h-full min-h-14 py-4 transition hover:border-teal-600">
                  <CardContent className="flex items-start justify-between gap-3 px-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-md bg-teal-100 text-teal-700">
                        <Icon aria-hidden="true" size={18} />
                      </div>
                      <div className="min-w-0">
                        {category ? (
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                            {category}
                          </p>
                        ) : null}
                        <p className="font-semibold text-ink-950">{item.name}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-700">
                          Buka halaman {item.name.toLocaleLowerCase()}.
                        </p>
                      </div>
                    </div>
                    <ArrowRight
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-slate-600 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-teal-700"
                      size={16}
                    />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
