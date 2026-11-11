import { useEffect, useRef } from "react";

export interface UseBarcodeScannerOptions {
  onScan: (code: string) => void;
  enabled?: boolean;
  maxIntervalMs?: number;
  minLength?: number;
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.dataset.barcodeListener === "true") {
    return false;
  }
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

export function useBarcodeScanner({
  onScan,
  enabled = true,
  maxIntervalMs = 60,
  minLength = 3,
}: UseBarcodeScannerOptions) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let buffer = "";
    let lastKeyTime = 0;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }
      if (isEditableElement(event.target)) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > maxIntervalMs) {
        buffer = "";
      }
      lastKeyTime = now;

      if (event.key === "Enter") {
        const cleanCode = buffer.trim();
        buffer = "";
        if (cleanCode.length >= minLength) {
          event.preventDefault();
          onScanRef.current(cleanCode);
        }
        return;
      }

      if (event.key.length === 1) {
        buffer += event.key;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, maxIntervalMs, minLength]);
}
