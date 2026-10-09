"use client";

import React from "react";
import { Camera, X } from "lucide-react";
import { LiveQrCameraScanner } from "@/components/ui/live-qr-camera-scanner";

interface C6QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
}

export const C6QrScanner: React.FC<C6QrScannerProps> = ({ onScanSuccess, onClose }) => {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-5 text-white shadow-2xl space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Pemindai QR Surat C6</h3>
            <p className="text-[11px] text-slate-400">P2KD Kalisalak • Kamera Belakang Langsung</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tutup Pemindai"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <LiveQrCameraScanner onScanSuccess={onScanSuccess} onClose={onClose} />
    </div>
  );
};
