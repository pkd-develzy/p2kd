"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveQrCameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
  fps?: number;
  qrboxSize?: number;
}

export const LiveQrCameraScanner: React.FC<LiveQrCameraScannerProps> = ({
  onScanSuccess,
  fps = 15,
  qrboxSize = 250,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const readerElementId = "interactive-qr-reader-container";

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping QR scanner:", err);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    try {
      await stopScanner();

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: fps,
        qrbox: { width: qrboxSize, height: qrboxSize },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" }, // Paksa Kamera Belakang Smartphone
        config,
        (decodedText: string) => {
          // Haptic feedback if supported
          if (typeof window !== "undefined" && "vibrate" in navigator) {
            try {
              navigator.vibrate([40, 60, 40]);
            } catch {
              // ignore
            }
          }
          onScanSuccess(decodedText);
        },
        () => {
          // Frame error (silently ignore non-scanned frames)
        }
      );

      setIsScanning(true);

      // Check flashlight/torch capability
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const capabilities = html5QrCode.getRunningTrackCapabilities() as any;
        if (capabilities?.torch) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: unknown) {
      console.error("Failed to start camera:", err);
      const errMsg =
        err instanceof Error
          ? err.message
          : "Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan pada browser Anda.";
      if (
        errMsg.toLowerCase().includes("permission") ||
        errMsg.toLowerCase().includes("notallowed")
      ) {
        setCameraError(
          "Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser/HP Anda untuk melakukan scan."
        );
      } else {
        setCameraError(
          "Kamera belakang tidak ditemukan atau sedang digunakan oleh aplikasi lain."
        );
      }
      setIsScanning(false);
    }
  }, [fps, qrboxSize, onScanSuccess, stopScanner]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (isMounted) {
        await startScanner();
      }
    };

    init();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const track = (scannerRef.current as any).getRunningTrackCameraCapabilities();
      if (track) {
        await scannerRef.current.applyVideoConstraints({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          advanced: [{ torch: !isTorchOn } as any],
        });
        setIsTorchOn(!isTorchOn);
      }
    } catch (err) {
      console.error("Torch error:", err);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-2xl flex flex-col items-center">
      {/* Live Video Container */}
      <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center overflow-hidden rounded-2xl bg-black">
        <div id={readerElementId} className="w-full h-full object-cover" />

        {/* Laser Scanning Overlay Animation */}
        {isScanning && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Viewfinder Target Box */}
            <div className="w-56 h-56 border-2 border-emerald-400/90 rounded-2xl relative shadow-[0_0_25px_rgba(52,211,153,0.3)]">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

              {/* Animated Laser Line */}
              <div className="w-full h-1 bg-linear-to-r from-transparent via-emerald-400 to-transparent absolute top-0 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_12px_#34d399]" />
            </div>

            <div className="mt-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] text-emerald-300 font-bold tracking-wider uppercase border border-emerald-400/30 flex items-center gap-1.5 animate-pulse">
              <Camera className="w-3 h-3 text-emerald-400" />
              <span>Arahkan Kamera ke QR Code C6 / Stiker</span>
            </div>
          </div>
        )}

        {/* Camera Error Fallback View */}
        {cameraError && (
          <div className="absolute inset-0 p-5 bg-slate-900/95 text-white flex flex-col items-center justify-center text-center space-y-3">
            <CameraOff className="w-10 h-10 text-rose-400" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-rose-300 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Kamera Belum Aktif
              </h4>
              <p className="text-[11px] text-slate-300 max-w-[260px] leading-relaxed">
                {cameraError}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={startScanner}
              className="text-xs font-bold bg-white/10 text-white border-white/20 hover:bg-white/20 mt-1"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Coba Aktifkan Ulang Kamera
            </Button>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      {isScanning && (
        <div className="w-full p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Kamera Belakang Aktif</span>
          </div>

          <div className="flex items-center gap-2">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                  isTorchOn
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isTorchOn ? "Lampu Nyala" : "Lampu"}</span>
              </button>
            )}
            <button
              onClick={startScanner}
              title="Refresh Kamera"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
