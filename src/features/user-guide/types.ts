export type GuideModuleId =
  | "dashboard"
  | "purchase-orders"
  | "purchase-order-create"
  | "goods-receipts"
  | "goods-receipt-create"
  | "stock-monitoring"
  | "stock-transfers"
  | "stock-opnames"
  | "master-items"
  | "master-uoms"
  | "master-locations"
  | "master-categories"
  | "master-suppliers"
  | "master-warehouses"
  | "administration"
  | "document-templates"
  | "audit-logs"
  | "profile";

export type GuideTabKey = "module" | "walkthrough" | "fields" | "barcode-sim";

export interface GuideFieldSpec {
  id: string;
  fieldName: string;
  label: string;
  appliesTo: string[];
  description: string;
  exampleValid: string;
  commonMistake: string;
}

export interface ModuleGuideContent {
  id: GuideModuleId;
  title: string;
  category: "Operasional" | "Monitoring" | "Data Master" | "Administrasi";
  summary: string;
  whenToUse: string;
  prerequisites: string[];
  stepByStep: string[];
  tips: string[];
  fieldIds: string[];
}

export interface WalkthroughStage {
  stepNumber: number;
  moduleId: GuideModuleId;
  shortTitle: string;
  title: string;
  actorRole: string;
  goal: string;
  actions: string[];
  whatHappensNext: string;
  targetRoute: string;
}

export interface BarcodeSimulationPreset {
  id: string;
  label: string;
  sampleCode: string;
  description: string;
}

export interface BarcodeSimulationResult {
  rawInput: string;
  normalizedCode: string;
  status: "VALID" | "INVALID";
  detectedKind: "PRODUCT" | "LOCATION" | "DOCUMENT" | "UNKNOWN";
  detectedLabel: string;
  recommendedScreen: string;
  systemBehavior: string;
  validationMessage: string;
}
