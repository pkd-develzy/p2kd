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
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveQrCameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
  fps?: number;
}

/**
 * Optimalkan foto beresolusi tinggi (khas kamera HP Android 12MP-48MP)
 * menjadi ukuran proporsional (max 1280px) pada memory canvas agar cepat dipindai
 * dan tidak membuat WebView APK mengalami out-of-memory.
 */
async function preprocessImageForQr(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 1280;
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim) {
        return resolve(file);
      }
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], "scanned-qr.jpg", { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.88
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
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

  // Deteksi lingkungan APK / Android WebView via useSyncExternalStore (hindari render cascading)
  const isApkEnvironment = React.useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof navigator === "undefined") return false;
      const ua = navigator.userAgent || "";
      return (
        /wv|WebView|Android.*Version\/[0-9.]+\s+Chrome/i.test(ua) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Boolean((window as any)?.Android || (window as any)?.AndroidBridge)
      );
    },
    () => false
  );

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

      // Polyfill mediaDevices untuk Android WebView lama jika belum terpasang
      if (typeof navigator !== "undefined") {
        if (!navigator.mediaDevices) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigator as any).mediaDevices = {};
        }
        if (!navigator.mediaDevices.getUserMedia) {
          const legacyGetUserMedia =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigator as any).webkitGetUserMedia ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigator as any).mozGetUserMedia ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigator as any).msGetUserMedia;
          if (legacyGetUserMedia) {
            navigator.mediaDevices.getUserMedia = (constraints: MediaStreamConstraints) => {
              return new Promise((resolve, reject) => {
                legacyGetUserMedia.call(navigator, constraints, resolve, reject);
              });
            };
          }
        }
      }

      // Jangan memblokir secara agresif hanya karena isSecureContext false (sering terjadi di WebView APK)
      if (typeof window !== "undefined" && window.isSecureContext === false) {
        console.warn("Camera running in non-secure context (typical in APK WebViews / IP dev). Proceeding...");
      }

      // Cek ketersediaan getUserMedia
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          "Streaming video langsung tidak didukung pada sistem browser/WebView ini. Gunakan tombol 'Buka Kamera HP Langsung' di bawah untuk memindai."
        );
        isStartingRef.current = false;
        return;
      }

      try {
        // Bersihkan instance sebelumnya
        await stopScanner();

        // Pastikan container DOM sudah siap
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

        // Dynamic responsive qrbox config: toleran terhadap rasio layar smartphone
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

        // 1. Percobaan 1: Preferred facing mode (environment = kamera belakang HP)
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
          console.warn(`Direct facingMode (${preferredFacing}) failed:`, errFacing);
        }

        // 2. Percobaan 2: Coba facing mode sebaliknya jika percobaan 1 gagal
        if (!started && !isUnmountedRef.current) {
          const alternateFacing = preferredFacing === "environment" ? "user" : "environment";
          try {
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

        // 3. Percobaan 3: Enumerate perangkat kamera secara langsung
        if (!started && !isUnmountedRef.current) {
          try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
              const rearCam = cameras.find((c) =>
                /back|rear|environment|belakang|main/i.test(c.label)
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
          throw new Error("Gagal menginisialisasi streaming kamera video.");
        }

        if (!isUnmountedRef.current) {
          setIsScanning(true);

          // Cek kapabilitas lampu senter (torch)
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
        let message = "Kamera live belum aktif. Tekan 'Coba Aktifkan Ulang' atau gunakan 'Buka Kamera HP Langsung'.";

        if (
          errString.includes("permission") ||
          errString.includes("notallowed") ||
          errString.includes("denied")
        ) {
          message = isApkEnvironment
            ? "Sistem WebView APK membatasi streaming video langsung di dalam browser internal. Namun kamera HP Anda siap digunakan melalui tombol Kamera Bawaan di bawah!"
            : "Izin kamera ditolak oleh browser. Buka pengaturan izin aplikasi HP Anda, atau gunakan tombol 'Buka Kamera HP Langsung' di bawah.";
        } else if (
          errString.includes("notreadable") ||
          errString.includes("trackstart") ||
          errString.includes("could not start video source")
        ) {
          message =
            "Kamera sedang dipakai oleh aplikasi lain atau sistem kamera sedang sibuk. Tutup aplikasi kamera lain lalu coba lagi, atau gunakan tombol di bawah.";
        } else if (
          errString.includes("notfound") ||
          errString.includes("devicesnotfound")
        ) {
          message = "Perangkat kamera tidak terdeteksi. Silakan gunakan tombol 'Buka Kamera HP Langsung'.";
        } else if (errString.includes("overconstrained")) {
          message = "Resolusi kamera tidak kompatibel. Gunakan tombol 'Buka Kamera HP Langsung'.";
        }

        if (!isUnmountedRef.current) {
          setCameraError(message);
          setIsScanning(false);
        }
      } finally {
        isStartingRef.current = false;
      }
    },
    [currentFacingMode, fps, isApkEnvironment, readerElementId, stopScanner]
  );

  // Ganti kamera depan / belakang
  const handleSwitchCamera = async () => {
    const nextFacing = currentFacingMode === "environment" ? "user" : "environment";
    setCurrentFacingMode(nextFacing);
    await startScanner(nextFacing);
  };

  // Toggle lampu senter
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

  // Pindai dari foto kamera bawaan HP / native Android camera capture
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setIsProcessingFile(true);
    setCameraError(null);

    // Buat helper container terisolasi agar tidak bertabrakan dengan reader live video
    const helperId = `qr-file-helper-${Date.now()}`;
    const helperDiv = document.createElement("div");
    helperDiv.id = helperId;
    helperDiv.style.position = "fixed";
    helperDiv.style.top = "-9999px";
    helperDiv.style.left = "-9999px";
    helperDiv.style.width = "100px";
    helperDiv.style.height = "100px";
    document.body.appendChild(helperDiv);

    try {
      // Optimalkan ukuran gambar HP agar cepat diproses & tidak crash
      const fileToScan = await preprocessImageForQr(rawFile);
      const fileScanner = new Html5Qrcode(helperId, { verbose: false });

      let decodedText: string | null = null;
      try {
        decodedText = await fileScanner.scanFile(fileToScan, false);
      } catch {
        // Fallback: coba berkas asli jika versi resize tidak membaca
        if (fileToScan !== rawFile) {
          try {
            decodedText = await fileScanner.scanFile(rawFile, false);
          } catch {
            // ignore
          }
        }
      }

      try {
        await fileScanner.clear();
      } catch {}

      if (decodedText && onScanSuccessRef.current) {
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate([40, 60, 40]);
          } catch {}
        }
        onScanSuccessRef.current(decodedText);
      } else {
        setCameraError(
          "QR Code tidak terdeteksi pada foto. Pastikan posisi stiker/QR tegak, tidak blur, dan pencahayaan cukup, lalu coba jepret ulang."
        );
      }
    } catch (err) {
      console.warn("File QR scan failed:", err);
      setCameraError(
        "Gagal membaca QR Code dari foto. Pastikan foto tegak, cukup cahaya, lalu coba foto kembali."
      );
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

  // Mount effect
  useEffect(() => {
    isUnmountedRef.current = false;

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
      {/* Hidden file input untuk kamera bawaan Android (Native Camera Intent via capture="environment") */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Indikator Mode APK Android jika terdeteksi */}
      {isApkEnvironment && (
        <div className="w-full bg-slate-900/90 border-b border-slate-800 px-3 py-1 flex items-center justify-between text-[10px] text-slate-300">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mode Aplikasi APK Android</span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono">Camera Native Ready</span>
        </div>
      )}

      {/* Live Video Viewport Container */}
      <div className="relative w-full max-w-85 aspect-square flex items-center justify-center overflow-hidden rounded-2xl bg-black">
        <div
          id={readerElementId}
          className="w-full h-full object-cover [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
        />

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

        {/* Camera Fallback / Error View */}
        {cameraError && (
          <div className="absolute inset-0 p-4 bg-slate-900/95 text-white flex flex-col items-center justify-center text-center space-y-3 z-20 overflow-y-auto">
            <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <CameraOff className="w-7 h-7 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Gunakan Kamera Bawaan HP
              </h4>
              <p className="text-[11px] text-slate-300 max-w-70 leading-relaxed font-normal">
                {cameraError}
              </p>
            </div>

            {/* Tombol Aksi Utama: Langsung Buka Kamera Android */}
            <div className="flex flex-col w-full max-w-72 gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-black bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                {isProcessingFile ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menganalisis QR Code...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-white" />
                    <span>Buka Kamera HP Langsung (Jepret)</span>
                  </>
                )}
              </button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => startScanner()}
                className="text-xs font-bold bg-white/10 text-white border-white/20 hover:bg-white/20 w-full"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Coba Aktifkan Ulang Live Video
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons Footer Bar */}
      <div className="w-full p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
          <span
            className={`w-2 h-2 rounded-full ${
              isScanning ? "bg-emerald-400 animate-ping" : "bg-emerald-500"
            }`}
          />
          <span>
            {isScanning
              ? currentFacingMode === "environment"
                ? "Kamera Belakang Aktif"
                : "Kamera Depan Aktif"
              : "Kamera HP Siap"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tombol Kamera Bawaan HP Langsung */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Buka Kamera HP Bawaan / Jepret Foto QR"
            className="p-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 text-[11px] font-black shadow-md cursor-pointer active:scale-95 transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-white" />
            <span>Kamera HP</span>
          </button>

          {/* Switch Camera Button (hanya relevan jika live stream aktif) */}
          {isScanning && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              title="Ganti Kamera Belakang / Depan"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              <SwitchCamera className="w-3.5 h-3.5 text-blue-400" />
            </button>
          )}

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
            </button>
          )}

          {/* Galeri / Upload Berkas QR */}
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute("capture");
                fileInputRef.current.click();
                setTimeout(() => {
                  fileInputRef.current?.setAttribute("capture", "environment");
                }, 1000);
              }
            }}
            title="Pilih Foto dari Galeri HP"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Reload / Refresh Button */}
          <button
            type="button"
            onClick={() => startScanner()}
            title="Muat Ulang Kamera Live"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
