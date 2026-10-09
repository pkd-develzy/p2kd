"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, AlertCircle, RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui";

interface C6QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
}

interface Html5QrcodeInstance {
  start: (cameraConfig: unknown, config: unknown, onDecoded: (text: string) => void, onError: (err: unknown) => void) => Promise<unknown>;
  stop: () => Promise<void>;
  clear: () => void;
}

export const C6QrScanner: React.FC<C6QrScannerProps> = ({ onScanSuccess, onClose }) => {
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerId = "c6-interactive-reader";

  useEffect(() => {
    let mounted = true;

    async function initScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted) return;

        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode as unknown as Html5QrcodeInstance;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.max(160, Math.floor(minEdge * 0.72));
              return { width: size, height: size };
            },
          },
          (decodedText: string) => {
            if (mounted) {
              html5QrCode.stop().catch(() => {}).finally(() => {
                onScanSuccess(decodedText);
              });
            }
          },
          () => {
            // Abaikan frame scan gagal
          }
        );
        if (mounted) setIsScanning(true);
      } catch (err: unknown) {
        console.warn("Camera scan init failed:", err);
        if (mounted) {
          setErrorMsg(
            "Tidak dapat mengaktifkan video stream kamera langsung. Gunakan opsi 'Buka Kamera HP (Mode APK)' di bawah."
          );
        }
      }
    }

    initScanner();

    return () => {
      mounted = false;
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          scanner.stop().catch(() => {}).finally(() => {
            try {
              scanner.clear();
            } catch {}
          });
        } catch {}
      }
    };
  }, [onScanSuccess]);

  const handleNativeCameraPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setErrorMsg("");

    const helperId = `c6-temp-scan-${Date.now()}`;
    const helperDiv = document.createElement("div");
    helperDiv.id = helperId;
    helperDiv.style.position = "fixed";
    helperDiv.style.top = "-9999px";
    helperDiv.style.left = "-9999px";
    document.body.appendChild(helperDiv);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const fileScanner = new Html5Qrcode(helperId);
      const decodedText = await fileScanner.scanFile(file, false);
      fileScanner.clear();

      if (decodedText) {
        onScanSuccess(decodedText);
      } else {
        setErrorMsg("QR Code tidak terdeteksi pada foto. Silakan coba jepret ulang.");
      }
    } catch {
      setErrorMsg("Gagal membaca QR Code dari foto. Pastikan foto tegak dan cukup cahaya.");
    } finally {
      if (document.body.contains(helperDiv)) {
        document.body.removeChild(helperDiv);
      }
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-5 text-white shadow-2xl space-y-4">
      {/* Hidden input untuk native camera intent Android */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeCameraPhoto}
      />

      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-400 animate-pulse" />
          <h3 className="text-sm font-black text-white">Pemindai QR Code Formulir C6</h3>
        </div>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white"
          >
            Tutup
          </Button>
        )}
      </div>

      {errorMsg ? (
        <div className="p-4 bg-slate-950/90 border border-amber-600/40 rounded-2xl text-xs space-y-3">
          <div className="flex items-start gap-2 text-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p>{errorMsg}</p>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {isProcessingFile ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menganalisis QR Code...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>Buka Kamera HP (Mode APK Android)</span>
                </>
              )}
            </button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setErrorMsg("");
                window.location.reload();
              }}
              className="w-full text-xs bg-white/10 text-white border-white/20"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Coba Ulangi Kamera Live
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-black aspect-square max-w-xs mx-auto border-2 border-blue-400/40 shadow-inner flex items-center justify-center">
            <div id={containerId} className="w-full h-full" />
            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-slate-300 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-xs font-semibold">Mengaktifkan Lensa Kamera...</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-center text-slate-400">
            Arahkan kamera ke QR Code pada lembar <strong>Surat Undangan C6</strong> pemilih.
          </p>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
            >
              Buka Kamera HP Bawaan (Khusus APK)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
