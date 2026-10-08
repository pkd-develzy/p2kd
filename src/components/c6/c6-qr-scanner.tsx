"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, AlertCircle, RefreshCw } from "lucide-react";
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
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
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
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            if (mounted) {
              // Hentikan pemindaian setelah berhasil membaca kode
              html5QrCode.stop().catch(() => {}).finally(() => {
                onScanSuccess(decodedText);
              });
            }
          },
          () => {
            // Abaikan frame scan gagal (bukan error)
          }
        );
        if (mounted) setIsScanning(true);
      } catch (err: unknown) {
        console.warn("Camera scan init failed:", err);
        if (mounted) {
          setErrorMsg(
            "Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser atau perangkat Anda."
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

  return (
    <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-5 text-white shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-400 animate-pulse" />
          <h3 className="text-sm font-black text-white">Pemindai QR Code Kamera Live</h3>
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
        <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-2xl text-xs space-y-3">
          <div className="flex items-start gap-2 text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p>{errorMsg}</p>
          </div>
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
            Coba Lagi Izin Kamera
          </Button>
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
        </div>
      )}
    </div>
  );
};
