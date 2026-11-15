import { createContext, useContext } from "react";

/**
 * Menandai apakah komponen berada di dalam AppShell yang sudah me-render UserGuideModal global.
 * Jika false (misal saat pengujian komponen terisolasi), PageHeader akan me-render modal secara lokal.
 */
export const AppShellGuideHostContext = createContext(false);

export function useIsInsideAppShellGuideHost(): boolean {
  return useContext(AppShellGuideHostContext);
}
