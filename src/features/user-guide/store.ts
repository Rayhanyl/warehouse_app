import { create } from "zustand";
import type { GuideModuleId, GuideTabKey } from "./types";

interface UserGuideState {
  isOpen: boolean;
  activeModuleId: GuideModuleId;
  activeTab: GuideTabKey;
  walkthroughStep: number;
  completedSteps: number[];
  openGuide: (moduleId?: GuideModuleId, tab?: GuideTabKey) => void;
  closeGuide: () => void;
  setModuleId: (moduleId: GuideModuleId) => void;
  setTab: (tab: GuideTabKey) => void;
  setWalkthroughStep: (stepNumber: number) => void;
  toggleStepCompleted: (stepNumber: number) => void;
  resetProgress: () => void;
}

/**
 * State overlay panduan pengguna global agar tombol Panduan di Header maupun Topbar
 * dapat dibuka kapan saja tanpa mengganggu state form transaksi yang sedang aktif.
 */
export const useUserGuideStore = create<UserGuideState>((set) => ({
  isOpen: false,
  activeModuleId: "dashboard",
  activeTab: "module",
  walkthroughStep: 1,
  completedSteps: [],
  openGuide: (moduleId, tab) =>
    set((state) => ({
      isOpen: true,
      activeModuleId: moduleId ?? state.activeModuleId,
      activeTab: tab ?? state.activeTab,
    })),
  closeGuide: () => set({ isOpen: false }),
  setModuleId: (activeModuleId) => set({ activeModuleId }),
  setTab: (activeTab) => set({ activeTab }),
  setWalkthroughStep: (walkthroughStep) =>
    set({ walkthroughStep: Math.min(5, Math.max(1, walkthroughStep)) }),
  toggleStepCompleted: (stepNumber) =>
    set((state) => ({
      completedSteps: state.completedSteps.includes(stepNumber)
        ? state.completedSteps.filter((step) => step !== stepNumber)
        : [...state.completedSteps, stepNumber].sort((a, b) => a - b),
    })),
  resetProgress: () => set({ walkthroughStep: 1, completedSteps: [] }),
}));
