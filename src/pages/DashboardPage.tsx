import { ArrowRight, ClipboardCheck, PackageCheck, Repeat2, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { useMyMenu } from "@/features/navigation/api";

const workflow = [
  { label: "Purchase order", icon: ClipboardCheck },
  { label: "Goods receipt", icon: PackageCheck },
  { label: "Saldo stok", icon: Truck },
  { label: "Transfer / stock opname", icon: Repeat2 },
];

export function DashboardPage() {
  const { data: menu = [] } = useMyMenu();
  const shortcuts = menu.flatMap((item) => [item, ...item.children]).filter((item) => item.path !== "/dashboard").slice(0, 6);

  return (
    <>
      <PageHeader
        description="Jejakstok membantu Anda mencatat penerimaan, transfer, dan stock opname dengan jejak yang dapat ditelusuri."
        title="Selamat datang"
      />
      <section aria-labelledby="workflow-title" className="rounded-2xl border border-[#d9dfd8] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold" id="workflow-title">Alur kerja gudang</h2>
          <p className="mt-1 text-sm text-[#667876]">Ikuti setiap pergerakan stok dari dokumen sampai pencatatan.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {workflow.map(({ label, icon: Icon }, index) => (
            <div className="flex items-center gap-3" key={label}>
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e3ebe3] text-[#2f7a68]">
                <Icon aria-hidden="true" size={21} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{label}</span>
                {index < workflow.length - 1 && <ArrowRight aria-hidden="true" className="hidden text-[#9aacab] md:block" size={17} />}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="shortcut-title" className="mt-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold" id="shortcut-title">Pintasan modul</h2>
          <p className="mt-1 text-sm text-[#667876]">Buka modul yang tersedia untuk akun Anda.</p>
        </div>
        {shortcuts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#b8c5c1] bg-white p-6 text-sm text-[#667876]">Belum ada pintasan modul yang tersedia.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map((item) => (
              <Link className="rounded-xl border border-[#d9dfd8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#2f7a68] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-[#2f7a68]" key={item.id} to={item.path}>
                <p className="font-semibold">{item.name}</p>
                <p className="mt-1 text-xs leading-5 text-[#667876]">Buka halaman {item.name.toLocaleLowerCase()}.</p>
              </Link>
            ))}
          </div>
        )}
      </section>
      <p className="mt-8 text-sm text-[#667876]">Data operasional tersedia di halaman masing-masing modul.</p>
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
