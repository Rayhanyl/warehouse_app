import { Boxes, Printer, Route, ScanBarcode, ShieldCheck } from "lucide-react";

export const proofIcons = {
  boxes: Boxes,
  route: Route,
  "shield-check": ShieldCheck,
  "scan-barcode": ScanBarcode,
  printer: Printer,
} as const;

export const statusToneClasses = {
  teal: "bg-teal-100 text-teal-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
} as const;
