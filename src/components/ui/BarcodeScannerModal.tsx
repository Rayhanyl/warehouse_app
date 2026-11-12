import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Camera, ScanLine, X } from "lucide-react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: {
      formats?: string[];
    }) => BarcodeDetectorLike;
  }
}

export interface BarcodeScannerModalProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export function BarcodeScannerModal({
  isOpen,
  title = "Pindai Barcode / QR Barang",
  onClose,
  onDetected,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [cameraStatus, setCameraStatus] = useState<
    "idle" | "starting" | "active" | "unsupported" | "error"
  >("idle");
  const [cameraMessage, setCameraMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setManualCode("");
      setCameraStatus("idle");
      setCameraMessage("");
      return;
    }

    const focusTimer = window.setTimeout(() => {
      manualInputRef.current?.focus();
    }, 30);

    let active = true;
    let mediaStream: MediaStream | null = null;
    let rafId: number | null = null;

    async function startCamera() {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        setCameraStatus("unsupported");
        setCameraMessage(
          "Kamera tidak tersedia pada peramban ini. Gunakan scanner USB/Bluetooth atau ketik kode di bawah.",
        );
        return;
      }

      try {
        setCameraStatus("starting");
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!active) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraStatus("active");

        if (typeof window !== "undefined" && window.BarcodeDetector) {
          const detector = new window.BarcodeDetector({
            formats: [
              "ean_13",
              "ean_8",
              "code_128",
              "code_39",
              "upc_a",
              "upc_e",
              "qr_code",
            ],
          });

          const scanLoop = async () => {
            if (!active || !videoRef.current) return;
            try {
              if (videoRef.current.readyState >= 2) {
                const results = await detector.detect(videoRef.current);
                const raw = results[0]?.rawValue?.trim();
                if (raw) {
                  onDetected(raw);
                  onClose();
                  return;
                }
              }
            } catch {
              // Abaikan frame yang gagal didekode
            }
            if (active) {
              rafId = window.requestAnimationFrame(() => {
                void scanLoop();
              });
            }
          };

          rafId = window.requestAnimationFrame(() => {
            void scanLoop();
          });
        } else {
          setCameraMessage(
            "Pratinjau kamera aktif. Peramban ini menggunakan input scanner USB/Bluetooth atau ketik manual di bawah.",
          );
        }
      } catch {
        if (!active) return;
        setCameraStatus("error");
        setCameraMessage(
          "Izin kamera ditolak atau perangkat kamera tidak ditemukan. Gunakan scanner USB/Bluetooth atau input manual di bawah.",
        );
      }
    }

    void startCamera();

    return () => {
      active = false;
      window.clearTimeout(focusTimer);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, onClose, onDetected]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = manualCode.trim();
    if (!clean) return;
    onDetected(clean);
    setManualCode("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/60 p-4"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="barcode-scanner-modal-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-200 pb-3">
          <div>
            <h3
              className="text-base font-bold text-ink-950"
              id="barcode-scanner-modal-title"
            >
              {title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              Arahkan kamera ke barcode/QR atau tembak dengan scanner USB/Bluetooth.
            </p>
          </div>
          <button
            aria-label="Tutup pemindai barcode"
            className="grid min-h-10 min-w-10 place-items-center rounded-[var(--radius-md)] text-slate-700 hover:bg-canvas-50"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-line-200 bg-ink-950 text-surface-0">
          {cameraStatus === "active" || cameraStatus === "starting" ? (
            <div className="relative aspect-video w-full">
              <video
                className="h-full w-full object-cover"
                muted
                playsInline
                ref={videoRef}
              />
              <div className="pointer-events-none absolute inset-6 rounded-[var(--radius-md)] border-2 border-dashed border-teal-400/80" />
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-2 p-4 text-center text-xs text-surface-0/90">
              <Camera aria-hidden="true" size={28} />
              <p>{cameraMessage || "Menyiapkan kamera pemindai..."}</p>
            </div>
          )}
        </div>

        {cameraMessage && cameraStatus === "active" && (
          <p className="mt-2 text-xs text-slate-600">{cameraMessage}</p>
        )}

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-xs font-semibold text-ink-950">
            Input Scanner USB / Bluetooth atau Ketik Kode
            <input
              aria-label="Kode hasil scan barcode atau SKU"
              className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-semibold text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="Contoh: 8991234567890 atau SKU..."
              ref={manualInputRef}
              type="text"
              value={manualCode}
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-md)] border border-line-500 px-3.5 text-xs font-semibold text-ink-950 hover:bg-canvas-50"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-md)] bg-teal-600 px-4 text-xs font-semibold text-surface-0 hover:bg-teal-700 disabled:opacity-50"
              disabled={!manualCode.trim()}
              type="submit"
            >
              <ScanLine aria-hidden="true" size={15} />
              Gunakan kode
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface BarcodeScanBarProps {
  onScan: (code: string) => void;
  label?: string;
  placeholder?: string;
  enableGlobalGunListener?: boolean;
}

export function BarcodeScanBar({
  onScan,
  label = "Scan Cepat Barcode / SKU",
  placeholder = "Scan dengan alat USB/Bluetooth atau ketik Barcode / SKU lalu tekan Enter...",
  enableGlobalGunListener = true,
}: BarcodeScanBarProps) {
  const [value, setValue] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);

  useBarcodeScanner({
    enabled: enableGlobalGunListener && !cameraOpen,
    onScan: (code) => {
      onScan(code);
    },
  });

  function submitCurrentCode() {
    const clean = value.trim();
    if (!clean) return;
    onScan(clean);
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      submitCurrentCode();
    }
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-teal-600/30 bg-teal-100/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          className="text-xs font-bold text-teal-800"
          htmlFor="quick-barcode-scan-input"
        >
          {label}
        </label>
        <span className="text-[11px] font-medium text-slate-600">
          Mendukung Barcode Gun USB/Bluetooth &amp; Kamera
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <div className="relative min-w-[180px] flex-1">
          <ScanLine
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-teal-700"
            size={16}
          />
          <input
            aria-label={label}
            className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 pr-3 pl-9 text-sm text-ink-950 tabular-nums placeholder:text-slate-600 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            id="quick-barcode-scan-input"
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            type="text"
            value={value}
          />
        </div>
        <button
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] bg-teal-600 px-3.5 text-xs font-semibold text-surface-0 hover:bg-teal-700"
          onClick={submitCurrentCode}
          type="button"
        >
          <ScanLine aria-hidden="true" size={15} />
          Proses kode
        </button>
        <button
          aria-label="Buka kamera pemindai barcode"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-xs font-semibold text-ink-950 hover:bg-canvas-50"
          onClick={() => setCameraOpen(true)}
          type="button"
        >
          <Camera aria-hidden="true" size={15} />
          Kamera
        </button>
      </div>
      <BarcodeScannerModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onDetected={(code) => onScan(code)}
      />
    </div>
  );
}
