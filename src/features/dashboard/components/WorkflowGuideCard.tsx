import {
  Boxes,
  ClipboardCheck,
  PackageCheck,
  Repeat2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const workflowSteps = [
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

/**
 * Menampilkan panduan ringkas tahapan alur kerja operasional gudang di dashboard.
 */
export function WorkflowGuideCard() {
  return (
    <section aria-labelledby="workflow-title" className="mt-6 sm:mt-8">
      <Card className="gap-5 py-5 sm:py-6">
        <CardHeader className="px-5 sm:px-6">
          <CardTitle className="text-lg font-bold text-ink-950" id="workflow-title">
            Alur kerja gudang
          </CardTitle>
          <CardDescription className="text-sm text-slate-700">
            Ikuti setiap pergerakan stok dari dokumen pemesanan hingga pencatatan buku besar.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map(({ step, label, detail, icon: Icon }) => (
              <div
                className="flex flex-col justify-between rounded-lg border border-border bg-muted/45 p-4"
                key={step}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="grid size-11 shrink-0 place-items-center rounded-md bg-teal-100 text-teal-700">
                    <Icon aria-hidden="true" size={20} />
                  </div>
                  <Badge
                    className="border-border bg-card font-bold text-slate-600 tabular-nums"
                    variant="outline"
                  >
                    Tahap {step}
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-ink-950">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-700">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
