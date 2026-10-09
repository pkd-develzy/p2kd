"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  RefreshCw,
  Zap,
  AlertCircle,
  Upload,
  SwitchCamera,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveQrCameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
  fps?: number;
}

export const LiveQrCameraScanner: React.FC<LiveQrCameraScannerProps> = ({
  onScanSuccess,
  fps = 15,
}) => {
  const [readerElementId] = useState(
    () => `qr-reader-${Math.random().toString(36).substring(2, 9)}`
  );

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const isUnmountedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<"environment" | "user">("environment");
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Stop scanner safely
  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        console.warn("Warn stopping scanner:", err);
      }
      try {
        await scanner.clear();
      } catch (err) {
        console.warn("Warn clearing scanner DOM:", err);
      }
      scannerRef.current = null;
    }
    if (!isUnmountedRef.current) {
      setIsScanning(false);
      setHasTorch(false);
      setIsTorchOn(false);
    }
  }, []);

  // Start scanner with cascade fallbacks
  const startScanner = useCallback(
    async (preferredFacing: "environment" | "user" = currentFacingMode) => {
      if (isStartingRef.current || isUnmountedRef.current) return;
      isStartingRef.current = true;
      setCameraError(null);

      // Verify secure context (HTTPS or localhost)
      if (typeof window !== "undefined" && window.isSecureContext === false) {
        setCameraError(
          "Kamera browser membutuhkan koneksi aman HTTPS. Pastikan alamat website menggunakan awalan 'https://'."
        );
        isStartingRef.current = false;
        return;
      }

      // Verify mediaDevices support
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          "Fitur kamera web tidak didukung oleh browser/perangkat ini. Anda dapat menggunakan opsi 'Ambil Foto / Unggah QR'."
        );
        isStartingRef.current = false;
        return;
      }

      try {
        // Clean up previous instance first
        await stopScanner();

        // Check if element is ready in DOM
        const targetElement = document.getElementById(readerElementId);
        if (!targetElement) {
          console.warn("Reader DOM element not found yet, retrying...");
          isStartingRef.current = false;
          return;
        }

        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
          ],
          verbose: false,
        });

        scannerRef.current = html5QrCode;

        // Dynamic responsive qrbox config: do NOT force 1:1 aspect ratio to avoid OverconstrainedError on Android
        const scanConfig = {
          fps: fps,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(160, Math.floor(minEdge * 0.72));
            return { width: size, height: size };
          },
        };

        const handleSuccess = (decodedText: string) => {
          if (typeof window !== "undefined" && "vibrate" in navigator) {
            try {
              navigator.vibrate([40, 60, 40]);
            } catch {
              // ignore
            }
          }
          if (onScanSuccessRef.current) {
            onScanSuccessRef.current(decodedText);
          }
        };

        const handleFrame = () => {};

        let started = false;

        // 1. Try preferred facing mode (environment = rear camera, user = front)
        try {
          await html5QrCode.start(
            { facingMode: preferredFacing },
            scanConfig,
            handleSuccess,
            handleFrame
          );
          started = true;
          setCurrentFacingMode(preferredFacing);
        } catch (errFacing) {
          console.warn(`Direct facingMode (${preferredFacing}) failed, attempting fallbacks:`, errFacing);
        }

        // 2. If preferred failed, try opposite facing mode
        if (!started && !isUnmountedRef.current) {
          const alternateFacing = preferredFacing === "environment" ? "user" : "environment";
          try {
            // Re-instantiate if needed to reset internal state
            await html5QrCode.stop().catch(() => {});
            await html5QrCode.start(
              { facingMode: alternateFacing },
              scanConfig,
              handleSuccess,
              handleFrame
            );
            started = true;
            setCurrentFacingMode(alternateFacing);
          } catch (errAlt) {
            console.warn(`Alternate facingMode (${alternateFacing}) failed:`, errAlt);
          }
        }

        // 3. Fallback: Enumerate cameras and pick primary camera (index 0)
        if (!started && !isUnmountedRef.current) {
          try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
              // Pick primary camera (or one with back/environment in label)
              const rearCam = cameras.find((c) =>
                /back|rear|environment|belakang/i.test(c.label)
              );
              const chosenCameraId = (rearCam || cameras[0]).id;

              await html5QrCode.start(
                chosenCameraId,
                scanConfig,
                handleSuccess,
                handleFrame
              );
              started = true;
            }
          } catch (errCamList) {
            console.warn("Camera enumeration start failed:", errCamList);
          }
        }

        if (!started) {
          throw new Error("Semua metode inisialisasi kamera gagal.");
        }

        if (!isUnmountedRef.current) {
          setIsScanning(true);

          // Check flashlight / torch capability
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const capabilities = html5QrCode.getRunningTrackCapabilities() as any;
            if (capabilities?.torch) {
              setHasTorch(true);
            }
          } catch {
            setHasTorch(false);
          }
        }
      } catch (err: unknown) {
        console.error("Failed to start camera:", err);
        const errString = String(err).toLowerCase();
        let message = "Kamera belum aktif. Tekan tombol Coba Aktifkan Ulang Kamera di bawah.";

        if (
          errString.includes("permission") ||
          errString.includes("notallowed") ||
          errString.includes("denied")
        ) {
          message =
            "Izin kamera ditolak. Buka pengaturan browser atau izin aplikasi HP Anda, izinkan akses kamera, lalu coba lagi.";
        } else if (
          errString.includes("notreadable") ||
          errString.includes("trackstart") ||
          errString.includes("could not start video source")
        ) {
          message =
            "Kamera sedang dipakai oleh aplikasi lain atau sistem kamera sedang sibuk. Tutup aplikasi kamera lain lalu coba lagi.";
        } else if (
          errString.includes("notfound") ||
          errString.includes("devicesnotfound")
        ) {
          message = "Perangkat kamera tidak terdeteksi pada HP / komputer Anda.";
        } else if (errString.includes("overconstrained")) {
          message = "Resolusi kamera tidak kompatibel. Tekan 'Coba Aktifkan Ulang Kamera'.";
        }

        if (!isUnmountedRef.current) {
          setCameraError(message);
          setIsScanning(false);
        }
      } finally {
        isStartingRef.current = false;
      }
    },
    [currentFacingMode, fps, readerElementId, stopScanner]
  );

  // Switch between back & front camera
  const handleSwitchCamera = async () => {
    const nextFacing = currentFacingMode === "environment" ? "user" : "environment";
    setCurrentFacingMode(nextFacing);
    await startScanner(nextFacing);
  };

  // Toggle torch / flash
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
      console.warn("Torch error:", err);
    }
  };

  // Scan from uploaded photo/file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      // Create a temporary scanner instance or use existing
      let tempScanner = scannerRef.current;
      if (!tempScanner) {
        tempScanner = new Html5Qrcode(readerElementId, { verbose: false });
      }

      const decodedText = await tempScanner.scanFile(file, false);
      if (decodedText && onScanSuccessRef.current) {
        onScanSuccessRef.current(decodedText);
      }
    } catch (err) {
      console.warn("File QR scan failed:", err);
      setCameraError(
        "Gambar tidak memuat QR Code yang terbaca jelas. Pastikan foto tegak, fokus, dan pencahayaan cukup."
      );
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Mount effect
  useEffect(() => {
    isUnmountedRef.current = false;

    // Small timeout ensures modal DOM element is rendered
    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      isUnmountedRef.current = true;
      clearTimeout(timer);
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-2xl flex flex-col items-center">
      {/* Hidden file input for native camera snapshot / gallery upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Live Video Container */}
      <div className="relative w-full max-w-85 aspect-square flex items-center justify-center overflow-hidden rounded-2xl bg-black">
        <div id={readerElementId} className="w-full h-full object-cover [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

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
          <div className="absolute inset-0 p-5 bg-slate-900/95 text-white flex flex-col items-center justify-center text-center space-y-3 z-20">
            <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/30">
              <CameraOff className="w-8 h-8 text-rose-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-rose-300 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Kamera Belum Aktif
              </h4>
              <p className="text-[11px] text-slate-300 max-w-65 leading-relaxed">
                {cameraError}
              </p>
            </div>

            <div className="flex flex-col w-full max-w-65 gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => startScanner()}
                className="text-xs font-bold bg-white/10 text-white border-white/20 hover:bg-white/20 w-full"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Coba Aktifkan Ulang Kamera
              </Button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                {isProcessingFile ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menganalisis Gambar...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Ambil Foto QR / Unggah Gambar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons Footer Bar */}
      <div className="w-full p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
          <span className={`w-2 h-2 rounded-full ${isScanning ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`} />
          <span>
            {isScanning
              ? currentFacingMode === "environment"
                ? "Kamera Belakang Aktif"
                : "Kamera Depan Aktif"
              : "Kamera Siap"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Switch Camera Button */}
          <button
            type="button"
            onClick={handleSwitchCamera}
            title="Ganti Kamera Belakang / Depan"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
          >
            <SwitchCamera className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Ganti Kamera</span>
          </button>

          {/* Torch Button if available */}
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-1.5 rounded-lg border text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
                isTorchOn
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isTorchOn ? "Lampu Nyala" : "Lampu"}</span>
            </button>
          )}

          {/* Quick Snapshot / Upload QR code button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Buka Kamera HP Bawaan / Galeri"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Foto QR</span>
          </button>

          {/* Reload / Refresh Button */}
          <button
            type="button"
            onClick={() => startScanner()}
            title="Muat Ulang Kamera"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
