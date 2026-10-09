"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  RefreshCw,
  Zap,
  AlertCircle,
  CheckCircle2,
  ScanLine,
  Keyboard,
  ShieldCheck,
} from "lucide-react";

// Deklarasi global untuk Native BarcodeDetector API (Chromium / Android WebView Hardware Accelerated)
declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): {
        detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string; format: string }>>;
      };
      getSupportedFormats: () => Promise<string[]>;
    };
  }
}

export type ScannerStatus =
  | "INIT"
  | "REQUESTING_PERMISSION"
  | "STARTING_STREAM"
  | "READY"
  | "DETECTED"
  | "PROCESSING"
  | "ERROR"
  | "STOPPED";

interface LiveQrCameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
  onOpenManualInput?: () => void;
  officerName?: string;
  assignedRw?: string;
  fps?: number;
}

export const LiveQrCameraScanner: React.FC<LiveQrCameraScannerProps> = ({
  onScanSuccess,
  onOpenManualInput,
  officerName = "Petugas P2KD",
  assignedRw = "Kalisalak",
  fps = 15,
}) => {
  const [containerId] = useState(
    () => `qr-reader-container-${Math.random().toString(36).substring(2, 9)}`
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const html5ScannerRef = useRef<Html5Qrcode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isStartingRef = useRef(false);
  const isUnmountedRef = useRef(false);
  const hasDetectedRef = useRef(false);
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  // Status Lifecycle State
  const [status, setStatus] = useState<ScannerStatus>("INIT");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraLabel, setCameraLabel] = useState<string>("Kamera Belakang");
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [activeEngine, setActiveEngine] = useState<"HARDWARE_BARCODE_DETECTOR" | "HTML5_QRCODE">("HTML5_QRCODE");

  // Hentikan seluruh resource kamera & scanner secara bersih (cegah memory leak & thread tertinggal)
  const stopScanner = useCallback(async () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (html5ScannerRef.current) {
      try {
        if (html5ScannerRef.current.isScanning) {
          await html5ScannerRef.current.stop();
        }
      } catch (err) {
        console.warn("Warn stopping html5QrCode:", err);
      }
      try {
        await html5ScannerRef.current.clear();
      } catch {}
      html5ScannerRef.current = null;
    }

    if (!isUnmountedRef.current) {
      setIsTorchOn(false);
      setHasTorch(false);
    }
  }, []);

  // Handler Sukses Pemindaian Terpadu dengan Debounce & Haptic Feedback
  const handleScanSuccess = useCallback((rawText: string) => {
    if (hasDetectedRef.current || isUnmountedRef.current) return;
    hasDetectedRef.current = true;

    setStatus("DETECTED");

    // Haptic vibration feedback
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([45, 60, 45]);
      } catch {}
    }

    setTimeout(() => {
      if (!isUnmountedRef.current) {
        setStatus("PROCESSING");
        if (onScanSuccessRef.current) {
          onScanSuccessRef.current(rawText);
        }
      }
    }, 200);
  }, []);

  // Inisialisasi Alur Kamera Native Belakang
  const startScanner = useCallback(async () => {
    if (isStartingRef.current || isUnmountedRef.current) return;
    isStartingRef.current = true;
    hasDetectedRef.current = false;
    setErrorMessage(null);
    setStatus("REQUESTING_PERMISSION");

    try {
      await stopScanner();

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Perangkat atau WebView tidak mendukung akses media getUserMedia. Pastikan izin kamera aktif."
        );
      }

      // 1. Minta akses kamera belakang secara presisi dengan ideal environment
      setStatus("STARTING_STREAM");
      const baseConstraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(baseConstraints);
      } catch (permErr: unknown) {
        console.warn("getUserMedia with ideal facingMode failed, retrying with basic constraint:", permErr);
        // Fallback constraint tanpa constraint resolusi jika perangkat terbatas
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: "environment" },
        });
      }

      streamRef.current = stream;

      // 2. Evaluasi Video Track Belakang & Cek Kapabilitas Lampu Senter (Torch)
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack || videoTrack.readyState !== "live") {
        throw new Error("Track video kamera tidak aktif atau gagal menghasilkan frame.");
      }

      // Deteksi nama kamera aktual
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        const backDevice = videoDevices.find((d) =>
          /back|rear|environment|belakang|main|0/i.test(d.label)
        );
        const resolvedLabel = backDevice?.label || videoTrack.label || "Kamera Belakang (Environment)";
        setCameraLabel(resolvedLabel);
      } catch {
        setCameraLabel("Kamera Belakang Aktif");
      }

      // Cek kapabilitas lampu senter
      try {
        const capabilities = videoTrack.getCapabilities?.() as { torch?: boolean } | undefined;
        if (capabilities?.torch) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }

      // 3. Cek dukungan Native BarcodeDetector API (Hardware Accelerated)
      const supportsNativeDetector =
        typeof window !== "undefined" &&
        Boolean(window.BarcodeDetector);

      if (supportsNativeDetector && videoRef.current) {
        // --- JALUR A: NATIVE HARDWARE ACCELERATED DECODER ---
        setActiveEngine("HARDWARE_BARCODE_DETECTOR");
        const videoElement = videoRef.current;
        videoElement.srcObject = stream;
        videoElement.setAttribute("playsinline", "true");
        videoElement.setAttribute("webkit-playsinline", "true");
        videoElement.muted = true;

        await videoElement.play();

        const barcodeDetector = new window.BarcodeDetector!({
          formats: ["qr_code", "code_128", "ean_13"],
        });

        // Loop analisis frame throttled ke FPS target agar hemat daya baterai
        let lastScanTime = 0;
        const scanIntervalMs = Math.round(1000 / fps);

        const detectFrame = async (timestamp: number) => {
          if (isUnmountedRef.current || hasDetectedRef.current) return;

          if (timestamp - lastScanTime >= scanIntervalMs) {
            lastScanTime = timestamp;
            if (
              videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
              videoElement.videoWidth > 0
            ) {
              try {
                const barcodes = await barcodeDetector.detect(videoElement);
                if (barcodes && barcodes.length > 0) {
                  const firstCode = barcodes[0].rawValue;
                  if (firstCode && firstCode.trim().length > 0) {
                    handleScanSuccess(firstCode.trim());
                    return;
                  }
                }
              } catch {
                // Ignore transient frame decode drops
              }
            }
          }

          animFrameIdRef.current = requestAnimationFrame(detectFrame);
        };

        animFrameIdRef.current = requestAnimationFrame(detectFrame);
        setStatus("READY");
      } else {
        // --- JALUR B: HTML5-QRCODE ENGINE DENGAN DEVICE ID TERVERIFIKASI ---
        setActiveEngine("HTML5_QRCODE");

        // Tunggu elemen container DOM terpasang
        const container = document.getElementById(containerId);
        if (!container) {
          throw new Error("Container DOM pemindai belum siap.");
        }

        const html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
          ],
          verbose: false,
        });

        html5ScannerRef.current = html5QrCode;

        const scanConfig = {
          fps: fps,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(180, Math.floor(minEdge * 0.72));
            return { width: size, height: size };
          },
        };

        await html5QrCode.start(
          { facingMode: { ideal: "environment" } },
          scanConfig,
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // Abaikan frame kosong saat pemindaian berlangsung
          }
        );

        setStatus("READY");
      }
    } catch (err: unknown) {
      console.error("[LiveQrCameraScanner] Gagal menginisialisasi kamera belakang:", err);
      const errStr = String(err).toLowerCase();
      let userFriendlyMsg = "Kamera belakang belum aktif. Tekan tombol Coba Aktifkan Ulang di bawah.";

      if (
        errStr.includes("notallowed") ||
        errStr.includes("permission") ||
        errStr.includes("denied")
      ) {
        userFriendlyMsg =
          "Izin kamera belum diberikan. Izinkan akses kamera pada info aplikasi Android agar kamera dapat dibuka langsung.";
      } else if (
        errStr.includes("notreadable") ||
        errStr.includes("trackstart") ||
        errStr.includes("could not start video source")
      ) {
        userFriendlyMsg =
          "Sensor kamera sedang digunakan oleh sistem atau aplikasi lain. Tutup aplikasi kamera HP lalu coba aktifkan kembali.";
      } else if (errStr.includes("notfound") || errStr.includes("devicesnotfound")) {
        userFriendlyMsg = "Perangkat kamera belakang tidak terdeteksi pada ponsel ini.";
      } else if (errStr.includes("overconstrained")) {
        userFriendlyMsg = "Resolusi kamera tidak didukung sensor perangkat. Coba aktifkan ulang.";
      }

      if (!isUnmountedRef.current) {
        setErrorMessage(userFriendlyMsg);
        setStatus("ERROR");
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [containerId, fps, handleScanSuccess, stopScanner]);

  // Toggle Torch / Flashlight
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !isTorchOn;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn("Gagal mengubah status lampu senter:", err);
    }
  }, [hasTorch, isTorchOn]);

  // Efek Lifecycle: Jalankan kamera saat mounted, bersihkan saat unmounted
  useEffect(() => {
    isUnmountedRef.current = false;
    const timer = setTimeout(() => {
      void startScanner();
    }, 150);

    return () => {
      isUnmountedRef.current = true;
      clearTimeout(timer);
      void stopScanner();
    };
  }, [startScanner, stopScanner]);

  // Badge Status Deskriptif
  const getStatusBadge = () => {
    switch (status) {
      case "INIT":
      case "REQUESTING_PERMISSION":
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-amber-400 text-[11px] font-bold backdrop-blur-md shadow-md animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Meminta Izin Kamera...</span>
          </div>
        );
      case "STARTING_STREAM":
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-teal-300 text-[11px] font-bold backdrop-blur-md shadow-md animate-pulse">
            <Camera className="w-3.5 h-3.5 text-teal-400" />
            <span>Menghubungkan Sensor Belakang...</span>
          </div>
        );
      case "READY":
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-[11px] font-black backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Kamera Belakang Siap • Memindai</span>
          </div>
        );
      case "DETECTED":
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-black backdrop-blur-md shadow-xl animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>QR Terdeteksi! Membaca Data...</span>
          </div>
        );
      case "PROCESSING":
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 text-white text-[11px] font-black backdrop-blur-md shadow-xl">
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
            <span>Memproses Verifikasi...</span>
          </div>
        );
      case "ERROR":
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 text-[11px] font-bold backdrop-blur-md shadow-md">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Kamera Belum Aktif</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
      {/* 1. Header Identitas Pemindai Native */}
      <div className="p-3.5 sm:p-4 bg-linear-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800/80 flex items-center justify-between text-white shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-600/30 border border-emerald-400/30">
            <ScanLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black tracking-wider uppercase text-emerald-400">
                P2KD KALISALAK
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                NATIVE v2.25.01
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1">
              Pemindai QR C6 & Stiker Coklit
            </h4>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-[10px] text-slate-400 font-medium">Petugas Aktif</div>
          <div className="text-xs font-bold text-slate-200">
            {officerName} • {assignedRw}
          </div>
        </div>
      </div>

      {/* 2. Area Live Camera Viewport */}
      <div className="relative w-full aspect-4/3 sm:aspect-16/10 bg-black flex items-center justify-center overflow-hidden">
        {/* Video stream container untuk Hardware BarcodeDetector */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover z-0 ${
            activeEngine === "HARDWARE_BARCODE_DETECTOR" && status === "READY"
              ? "opacity-100"
              : "opacity-0"
          }`}
          playsInline
          muted
          autoPlay
        />

        {/* Container DOM untuk Html5Qrcode fallback */}
        <div
          id={containerId}
          className={`absolute inset-0 w-full h-full object-cover z-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_canvas]:hidden ${
            activeEngine === "HTML5_QRCODE" && status === "READY"
              ? "opacity-100"
              : "opacity-0"
          }`}
        />

        {/* Status Overlay Badge (Top Center) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          {getStatusBadge()}
        </div>

        {/* 3. Reticle Pemindaian Dark Premium dengan Sudut Emerald & Laser Line */}
        {status === "READY" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 p-6">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_24px_rgba(16,185,129,0.15)] flex items-center justify-center">
              {/* Sudut Frame Reticle Emerald Tebal */}
              <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

              {/* Titik Pusat Fokus */}
              <div className="w-2 h-2 rounded-full bg-emerald-400/80 shadow-[0_0_8px_#34d399]" />

              {/* Animated Laser Scanning Beam */}
              <div className="w-full h-1 bg-linear-to-r from-transparent via-emerald-400 to-transparent absolute top-0 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_16px_#10b981]" />
            </div>

            <div className="mt-4 px-3.5 py-1.2 rounded-full bg-black/80 backdrop-blur-md text-[10.5px] text-emerald-300 font-bold tracking-wide uppercase border border-emerald-500/30 flex items-center gap-1.5 shadow-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Arahkan Kamera ke QR Code C6 / Stiker</span>
            </div>
          </div>
        )}

        {/* 4. State Tampilan Error / Permission Denied */}
        {status === "ERROR" && (
          <div className="absolute inset-0 p-5 bg-slate-950/95 text-white flex flex-col items-center justify-center text-center space-y-4 z-20">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shadow-lg">
              <CameraOff className="w-8 h-8 text-rose-400" />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h4 className="text-sm font-black text-rose-300 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Akses Kamera Belum Siap
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {errorMessage || "Sensor kamera belum merespons. Tekan tombol Coba Aktifkan Ulang."}
              </p>
            </div>

            <div className="flex flex-col w-full max-w-xs gap-2 pt-1">
              <button
                type="button"
                onClick={() => startScanner()}
                className="w-full py-3 px-4 rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4 text-white" />
                <span>Coba Aktifkan Ulang Kamera</span>
              </button>

              {onOpenManualInput && (
                <button
                  type="button"
                  onClick={onOpenManualInput}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Keyboard className="w-3.5 h-3.5 text-blue-400" />
                  <span>Input NIK / Nomor Manual</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading Spinner saat menginisialisasi */}
        {(status === "INIT" || status === "REQUESTING_PERMISSION" || status === "STARTING_STREAM") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 z-10">
            <div className="w-12 h-12 rounded-2xl border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
            <span className="text-xs font-bold text-slate-300 animate-pulse">
              Menghubungkan Sensor Kamera Belakang...
            </span>
          </div>
        )}
      </div>

      {/* 5. Kontrol Footer Bar Terintegrasi */}
      <div className="w-full p-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300 z-20">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 truncate max-w-[55%]">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              status === "READY" ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-slate-600"
            }`}
          />
          <span className="truncate">{cameraLabel}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Tombol Flashlight / Senter jika sensor mendukung */}
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              title={isTorchOn ? "Matikan Lampu Senter" : "Nyalakan Lampu Senter"}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isTorchOn
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isTorchOn ? "Flash On" : "Flash"}</span>
            </button>
          )}

          {/* Tombol Muat Ulang Kamera */}
          <button
            type="button"
            onClick={() => startScanner()}
            title="Muat Ulang Kamera Belakang"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">Reload</span>
          </button>

          {/* Tombol Input NIK Manual jika QR rusak */}
          {onOpenManualInput && (
            <button
              type="button"
              onClick={onOpenManualInput}
              title="Input NIK atau Nomor C6 Manual"
              className="p-2 px-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 shadow-md shadow-emerald-700/20 cursor-pointer transition-all active:scale-95"
            >
              <Keyboard className="w-3.5 h-3.5 text-white" />
              <span>Input Manual</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
