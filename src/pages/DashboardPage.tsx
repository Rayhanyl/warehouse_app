import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  PackageCheck,
  Repeat2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { getMenuIconComponent } from "@/features/navigation/icons";
import { useAuthStore } from "@/features/auth/store";
import { useMyMenu } from "@/features/navigation/api";
import type { MenuItem } from "@/features/navigation/types";

const workflow = [
  {
    step: "01",
    label: "Purchase order",
    detail: "Buat atau pantau dokumen pesanan ke pemasok.",
    icon: ClipboardCheck,
  },
  {
    step: "02",
    label: "Penerimaan barang",
    detail: "Verifikasi fisik barang masuk melalui goods receipt.",
    icon: PackageCheck,
  },
  {
    step: "03",
    label: "Saldo & lokasi stok",
    detail: "Periksa posisi stok aktual per gudang dan lokasi rak.",
    icon: Boxes,
  },
  {
    step: "04",
    label: "Transfer & stock opname",
    detail: "Catat perpindahan antar-lokasi dan penyesuaian fisik.",
    icon: Repeat2,
  },
];

interface ShortcutEntry {
  item: MenuItem;
  category: string | null;
}

function collectShortcuts(
  items: MenuItem[],
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

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: menu = [] } = useMyMenu();
  const shortcuts = collectShortcuts(menu).slice(0, 9);
  const displayName = user?.full_name || user?.username;

  return (
    <>
      <PageHeader
        description="Pantau alur dokumen operasional gudang dari penerimaan barang hingga penyesuaian stok."
        title={displayName ? `Selamat datang, ${displayName}` : "Selamat datang"}
      />
      <section
        aria-labelledby="workflow-title"
        className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-1)] sm:p-6"
      >
        <div className="mb-5">
          <h2 className="text-lg font-bold text-ink-950" id="workflow-title">
            Alur kerja gudang
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Ikuti setiap pergerakan stok dari dokumen pemesanan hingga pencatatan buku besar.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workflow.map(({ step, label, detail, icon: Icon }) => (
            <div
              className="flex flex-col justify-between rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/55 p-4"
              key={step}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-teal-100 text-teal-700">
                  <Icon aria-hidden="true" size={20} />
                </div>
                <span className="rounded-full bg-surface-0 px-2.5 py-1 text-xs font-bold text-slate-600 tabular-nums">
                  Tahap {step}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-ink-950">{label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-700">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
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
          <div className="rounded-[var(--radius-lg)] border border-dashed border-line-500 bg-surface-0 p-6 text-sm text-slate-700">
            Belum ada pintasan modul yang tersedia untuk akun Anda.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map(({ item, category }) => {
              const Icon = getMenuIconComponent(item);
              return (
                <Link
                  className="group flex min-h-14 items-start justify-between gap-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] transition hover:border-teal-600"
                  key={item.id}
                  to={item.path}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-teal-100 text-teal-700">
                      <Icon aria-hidden="true" size={18} />
                    </div>
                    <div className="min-w-0">
                      {category && (
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          {category}
                        </p>
                      )}
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
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <p className="mt-8 text-sm text-slate-600">
        Ringkasan metrik operasional akan tampil otomatis setelah modul transaksi gudang diaktifkan.
      </p>
    </>
  );
}

export function AdminPlaceholderPage() {
  return (
    <PageHeader
      description="Halaman modul ini sedang disiapkan. Menu dan hak akses Anda sudah berhasil dimuat dari server."
      title="Modul Jejakstok"
    />
  );
}
