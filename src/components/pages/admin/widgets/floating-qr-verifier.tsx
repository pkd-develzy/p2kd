"use client";

import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Sparkles,
  Check,
  Camera,
  Keyboard,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, Badge } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { LiveQrCameraScanner } from "@/components/ui/live-qr-camera-scanner";

interface FloatingQrVerifierProps {
  assignedMeja?: string;
  userName?: string;
  isOpenControlled?: boolean;
  onCloseControlled?: () => void;
  showFloatingTrigger?: boolean;
}

interface C6ResultData {
  id: string;
  namaLengkap: string;
  nikMasked: string;
  kkMasked: string;
  jenisKelamin: string;
  alamat: string;
  rt: string;
  rw: string;
  mejaPendaftaran: string;
  tahap: string;
  statusAktif: string;
  waktuPemilihan: string;
}

export const FloatingQrVerifier: React.FC<FloatingQrVerifierProps> = ({
  assignedMeja = "SEMUA",
  userName = "Petugas KPPS",
  isOpenControlled,
  onCloseControlled,
  showFloatingTrigger = true,
}) => {
  const toast = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const isModalOpen = isOpenControlled !== undefined ? isOpenControlled : internalOpen;

  const [activeMode, setActiveMode] = useState<"CAMERA" | "MANUAL">("CAMERA");
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<C6ResultData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMarkedPresent, setIsMarkedPresent] = useState(false);
  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Kunci scroll halaman ketika modal terbuka
  useEffect(() => {
    if (isModalOpen && typeof document !== "undefined") {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  const handleClose = () => {
    if (onCloseControlled) {
      onCloseControlled();
    } else {
      setInternalOpen(false);
    }
    setResult(null);
    setErrorMsg("");
    setInputQuery("");
    setActiveMode("CAMERA");
  };

  const handleVerifyPayload = useCallback(async (queryStr: string) => {
    if (!queryStr.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setResult(null);
    setIsMarkedPresent(false);

    try {
      let idParam = "";
      let nikParam = "";

      // Parse payload jika QR code memuat tautan atau parameter
      if (queryStr.includes("id=")) {
        try {
          const url = new URL(queryStr);
          idParam = url.searchParams.get("id") || "";
          nikParam = url.searchParams.get("nik") || "";
        } catch {
          const match = queryStr.match(/id=([^&]+)/);
          if (match) idParam = match[1];
        }
      } else {
        const clean = queryStr.trim();
        if (/^\d{16}$/.test(clean)) {
          nikParam = clean;
        } else {
          idParam = clean;
        }
      }

      const queryParam = idParam
        ? `id=${encodeURIComponent(idParam)}`
        : `nik=${encodeURIComponent(nikParam)}`;

      const res = await fetch(`/api/voters/c6-verify?${queryParam}`);
      const json = await res.json();

      if (json.success && json.data) {
        setResult(json.data);
      } else {
        setErrorMsg(json.message || "Data pemilih Form C6 / Stiker Coklit tidak ditemukan di database.");
      }
    } catch {
      setErrorMsg("Gagal menghubungi server verifikasi. Periksa koneksi internet.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerifyPayload(inputQuery);
  };

  const handleCameraScan = useCallback(
    (decodedText: string) => {
      handleVerifyPayload(decodedText);
    },
    [handleVerifyPayload]
  );

  const handleMarkAttendance = () => {
    if (!result) return;
    setIsMarkedPresent(true);
    toast.success(
      "Presensi Pemilih Berhasil",
      `${result.namaLengkap} telah ditandai HADIR di ${assignedMeja || result.mejaPendaftaran}.`
    );
  };

  const assignedRwNum = (assignedMeja || "").replace(/\D/g, "");
  const voterRwNum = (result?.rw || "").replace(/\D/g, "");
  const isCorrectMeja = !assignedRwNum || assignedRwNum === voterRwNum || assignedMeja === "SEMUA";

  // Konten Modal Pemindai QR
  const modalContent = isModalOpen ? (
    <div className="fixed inset-0 z-9999 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-slate-900 border-slate-800 text-white shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[calc(100dvh-32px)] border">
        {/* Header Modal Dark Premium */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                Pemindai Kamera QR Form C6 / Stiker
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-[11px] text-slate-400">
                Petugas: {userName} • {assignedMeja}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Kamera Live vs Input Manual NIK */}
        <div className="flex border-b border-slate-800 bg-slate-950 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveMode("CAMERA");
              setErrorMsg("");
            }}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeMode === "CAMERA"
                ? "bg-slate-900 text-emerald-400 border-b-2 border-emerald-500 font-black shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Kamera Belakang (Live)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode("MANUAL");
              setErrorMsg("");
            }}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeMode === "MANUAL"
                ? "bg-slate-900 text-teal-300 border-b-2 border-teal-500 font-black shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Ketik NIK / Nomor Manual</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs text-slate-200 flex-1 overflow-y-auto overscroll-contain">
          {/* 1. Live Camera Scanner View */}
          {activeMode === "CAMERA" && !result && (
            <div className="space-y-2">
              <LiveQrCameraScanner
                onScanSuccess={handleCameraScan}
                onOpenManualInput={() => setActiveMode("MANUAL")}
                officerName={userName}
                assignedRw={assignedMeja}
              />
            </div>
          )}

          {/* 2. Manual Input Form View */}
          {activeMode === "MANUAL" && !result && (
            <form onSubmit={handleManualSubmit} className="space-y-3 p-2">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Ketik NIK (16 Digit) / Nomor Barcode:
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Contoh: 332801... atau ID barcode..."
                    className="w-full h-11 pl-9 pr-3 text-xs rounded-xl border border-slate-700 bg-slate-800/90 font-mono font-bold text-white placeholder-slate-500 focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !inputQuery.trim()}
                  className="h-11 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
                >
                  {loading ? "Mengecek..." : "Cari Data"}
                </Button>
              </div>
            </form>
          )}

          {/* Loading Indicator when query in progress */}
          {loading && (
            <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="text-xs font-bold text-emerald-300">
                Memverifikasi QR Code ke Database P2KD...
              </div>
            </div>
          )}

          {/* Error Box */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-200 flex items-start gap-2.5">
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-rose-300">VERIFIKASI GAGAL</div>
                <div className="text-[11px] text-rose-300">{errorMsg}</div>
                <button
                  type="button"
                  onClick={() => setErrorMsg("")}
                  className="text-[10px] font-bold text-amber-400 underline mt-1 block cursor-pointer"
                >
                  Coba Scan Ulang
                </button>
              </div>
            </div>
          )}

          {/* Result Box (Voter Details Verified) */}
          {result && (
            <div className="space-y-3 pt-1 animate-in fade-in zoom-in-95 duration-150">
              {/* Status Banner */}
              {result.statusAktif === "TMS" ? (
                <div className="p-3 rounded-2xl bg-rose-950/90 border border-rose-800 text-rose-200 flex items-center gap-2 font-bold">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <div>STATUS: TMS (Tidak Memenuhi Syarat)</div>
                    <div className="text-[10px] font-normal text-rose-300">
                      Pemilih tidak berhak menerima surat suara.
                    </div>
                  </div>
                </div>
              ) : !isCorrectMeja ? (
                <div className="p-3 rounded-2xl bg-amber-950/90 border border-amber-800 text-amber-200 flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div>SALAH WILAYAH RW!</div>
                    <div className="text-[10px] font-normal text-amber-300">
                      Pemilih ini terdaftar di {result.mejaPendaftaran} (Bukan {assignedMeja}).
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-800 text-emerald-200 flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div>SAH &amp; TEPAT DI LINGKUNGAN INI</div>
                    <div className="text-[10px] font-normal text-emerald-300">
                      Data pemilih terverifikasi valid.
                    </div>
                  </div>
                </div>
              )}

              {/* Voter Info Details */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Nama Pemilih</span>
                  <Badge variant="primary" className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                    {result.tahap || "CALON_DPS"}
                  </Badge>
                </div>
                <div className="text-base font-black text-white uppercase tracking-tight">
                  {result.namaLengkap}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">NIK Sensor</span>
                    <span className="font-mono font-bold text-slate-200">{result.nikMasked}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Domisili</span>
                    <span className="font-semibold text-slate-200">
                      RT {result.rt} / RW {result.rw}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Wilayah Pemungutan Suara
                  </span>
                  <span className="font-bold text-emerald-400">{result.mejaPendaftaran}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {result.statusAktif === "AKTIF" && (
                  <Button
                    onClick={handleMarkAttendance}
                    disabled={isMarkedPresent}
                    variant="primary"
                    className={`flex-1 h-11 text-xs font-bold ${
                      isMarkedPresent
                        ? "bg-emerald-900/80 text-emerald-300 border border-emerald-700 cursor-default"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-700/30"
                    }`}
                  >
                    {isMarkedPresent ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5" />
                        Sudah Ditandai Hadir
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Tandai Hadir &amp; Beri Surat Suara
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setErrorMsg("");
                    setInputQuery("");
                    setActiveMode("CAMERA");
                  }}
                  className="h-11 px-4 text-xs font-bold border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  <QrCode className="w-4 h-4 mr-1" />
                  Scan Berikutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  ) : null;

  return (
    <>
      {/* Floating Center Button */}
      {showFloatingTrigger && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 print:hidden hidden sm:block">
          <button
            onClick={() => setInternalOpen(true)}
            className="group relative flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black text-xs sm:text-sm shadow-2xl hover:shadow-emerald-500/50 border-2 border-emerald-300/80 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>

            <Camera className="w-5 h-5 text-white" />
            <span>Scan Kamera QR C6</span>

            {assignedMeja && assignedMeja !== "SEMUA" && (
              <Badge
                variant="outline"
                className="bg-emerald-950/80 text-emerald-200 border-emerald-400 text-[10px] uppercase font-mono px-2 py-0.5"
              >
                {assignedMeja}
              </Badge>
            )}
          </button>
        </div>
      )}

      {/* Render modal portal to document.body */}
      {isMounted && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
};
