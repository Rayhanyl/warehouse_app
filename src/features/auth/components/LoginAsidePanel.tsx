import { MapPin, ShieldCheck, Waypoints } from "lucide-react";
import { Link } from "react-router-dom";

const operationalBenefits = [
  {
    icon: MapPin,
    title: "Stok hingga tingkat lokasi",
    description: "Saldo dapat ditelusuri sampai gudang dan lokasi penyimpanan.",
  },
  {
    icon: Waypoints,
    title: "Alur transaksi terkendali",
    description:
      "Penerimaan, transfer, dan stock opname berjalan mengikuti status dokumen.",
  },
  {
    icon: ShieldCheck,
    title: "Akses sesuai peran dan gudang",
    description:
      "Menu dan tindakan menyesuaikan permission serta penugasan gudang akun Anda.",
  },
] as const;

export function LoginAsidePanel() {
  return (
    <aside
      aria-label="Informasi ruang kerja Jejakstok"
      className="relative hidden overflow-hidden bg-ink-950 px-10 py-10 text-canvas-50 lg:flex lg:flex-col lg:justify-between xl:px-14"
    >
      <div className="relative flex items-center justify-between gap-4">
        <Link
          className="inline-flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] py-1 pr-2"
          to="/"
        >
          <img
            alt=""
            className="size-9 rounded-[var(--radius-sm)] border border-[#8a9995]/50 object-cover"
            src="/assets/image/icon/icon.jpg"
          />
          <span className="flex flex-col">
            <span className="text-base leading-tight font-bold text-canvas-50">
              Jejakstok
            </span>
            <span className="text-xs leading-tight text-[#c8d0cd]">
              Sistem manajemen gudang
            </span>
          </span>
        </Link>
      </div>

      <div className="relative my-auto py-8">
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[#8a9995]/50 bg-ink-800 shadow-[var(--shadow-2)]">
          <img
            alt="Aktivitas pemeriksaan dan pencatatan stok di ruang kerja gudang"
            className="aspect-[16/7] w-full object-cover object-center"
            src="/assets/image/login.jpg"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#8a9995]/40 bg-ink-950 px-4 py-3">
            <span className="text-xs font-medium text-[#e2e6e4]">
              Siklus terkendali: PO -&gt; GR -&gt; Transfer -&gt; Stock Opname
            </span>
            <span className="inline-flex rounded-[var(--radius-sm)] bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
              RBAC &amp; Audit Aktif
            </span>
          </div>
        </div>

        <p className="mt-7 text-xs font-semibold text-amber-400">
          Ruang kerja operasional gudang
        </p>
        <h2 className="mt-2 max-w-lg text-[clamp(1.75rem,2.5vw+1rem,2.375rem)] leading-[1.2] font-bold tracking-[-0.02em] text-canvas-50">
          Satu kendali untuk setiap pergerakan stok.
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-[1.65] text-[#e2e6e4]">
          Masuk untuk memproses purchase order, penerimaan barang, transfer
          antar-gudang, serta stock opname sesuai peran dan penugasan gudang.
        </p>

        <dl className="mt-6 grid gap-3">
          {operationalBenefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                className="flex items-start gap-3.5 rounded-[var(--radius-md)] border border-[#8a9995]/40 bg-ink-800 p-3.5"
                key={benefit.title}
              >
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-teal-100 text-teal-700">
                  <Icon aria-hidden="true" size={18} />
                </span>
                <div className="min-w-0">
                  <dt className="text-sm font-bold text-canvas-50">{benefit.title}</dt>
                  <dd className="mt-0.5 text-xs leading-relaxed text-[#c8d0cd]">
                    {benefit.description}
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>
      </div>

      <p className="relative text-xs text-[#c8d0cd]">
        Jejakstok: Sistem manajemen gudang
      </p>
    </aside>
  );
}
