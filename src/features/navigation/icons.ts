import {
  Archive,
  ArrowLeftRight,
  Boxes,
  CircleHelp,
  ClipboardCheck,
  Database,
  FileText,
  LayoutDashboard,
  ListTree,
  MapPin,
  Package,
  PackageCheck,
  Ruler,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { MenuItem } from "./types";

const iconMap: Record<string, LucideIcon> = {
  archive: Archive,
  arrowleftright: ArrowLeftRight,
  boxes: Boxes,
  clipboard: ClipboardCheck,
  clipboardcheck: ClipboardCheck,
  dashboard: LayoutDashboard,
  database: Database,
  filetext: FileText,
  help: CircleHelp,
  layoutdashboard: LayoutDashboard,
  list: ListTree,
  map: MapPin,
  package: Package,
  packagecheck: PackageCheck,
  ruler: Ruler,
  settings: Settings,
  shield: ShieldCheck,
  shieldcheck: ShieldCheck,
  truck: Truck,
  users: Users,
  warehouse: Warehouse,
};

export function getMenuIconComponent(item: MenuItem): LucideIcon {
  const normalizedIcon = item.icon?.toLowerCase().replace(/[\s_-]/g, "");
  const normalizedCode = item.code.toLowerCase().replace(/[\s_-]/g, "");
  return (normalizedIcon && iconMap[normalizedIcon]) || iconMap[normalizedCode] || Package;
}

