import { useEffect } from "react";

/**
 * Registers an Escape key listener to close an opname dialog unless a mutation is in flight.
 */
export function useEscapeClose(onClose: () => void, isBusy: boolean) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) {
        onClose();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [isBusy, onClose]);
}
