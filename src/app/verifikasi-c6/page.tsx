"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  Building2,
  Calendar,
  ArrowLeft,
  Lock,
  Camera,
  ScanLine,
  Search,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button, Badge, Logo } from "@/components/ui";
import { C6QrScanner } from "@/components/c6/c6-qr-scanner";

interface C6VerificationData {
  id: string;
  namaLengkap: string;
  nikMasked: string;
  kkMasked: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  statusPerkawinan: string;
  alamat: string;
  rt: string;
  rw: string;
  mejaPendaftaran: string;
  tahap: string;
  statusAktif: string;
  waktuPemilihan: string;
  verifiedAt: string;
}

function VerifikasiC6Content() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";
  const initialNik = searchParams.get("nik") || "";

  const [loading, setLoading] = useState(() => Boolean(initialId || initialNik));
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<C6VerificationData | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const verifyVoter = useCallback(async (targetId: string, targetNik: string) => {
    if (!targetId && !targetNik) {
      setLoading(false);
      setErrorMsg("Parameter QR Code tidak valid atau ID pemilih kosong.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const queryParam = targetId
        ? `id=${encodeURIComponent(targetId)}`
        : `nik=${encodeURIComponent(targetNik)}`;
      const res = await fetch(`/api/voters/c6-verify?${queryParam}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setErrorMsg("");
        setShowScanner(false);
      } else {
        setData(null);
        setErrorMsg(json.message || "Data formulir C6 tidak ditemukan dalam database resmi.");
      }
    } catch {
      setData(null);
      setErrorMsg("Gagal menghubungi server verifikasi. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (!initialId && !initialNik) return;

    const queryParam = initialId
      ? `id=${encodeURIComponent(initialId)}`
      : `nik=${encodeURIComponent(initialNik)}`;

    fetch(`/api/voters/c6-verify?${queryParam}`)
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json.success && json.data) {
          setData(json.data);
          setErrorMsg("");
        } else {
          setData(null);
          setErrorMsg(json.message || "Data formulir C6 tidak ditemukan dalam database resmi.");
        }
      })
      .catch(() => {
        if (!active) return;
        setData(null);
        setErrorMsg("Gagal menghubungi server verifikasi. Periksa koneksi internet Anda.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialId, initialNik]);

  const handleQrDecoded = (decodedText: string) => {
    try {
      if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
        const url = new URL(decodedText);
        const scannedId = url.searchParams.get("id");
        const scannedNik = url.searchParams.get("nik");
        if (scannedId) {
          verifyVoter(scannedId, "");
          return;
        }
        if (scannedNik) {
          verifyVoter("", scannedNik);
          return;
        }
      }
    } catch {
      // bukan url
    }
    verifyVoter(decodedText, "");
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualInput.trim();
    if (!clean) return;
    if (clean.length === 16 && /^\d+$/.test(clean)) {
      verifyVoter("", clean);
    } else {
      verifyVoter(clean, "");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-blue-950 to-slate-900 text-white py-8 px-4 flex flex-col justify-between">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Header Institution */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-md">
            <Logo size="md" showText title="PANITIA PILKADES" subtitle="DESA KALISALAK" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-400/30">
              SISTEM OTENTIKASI FORM C6 DIGITAL
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-2">
              Verifikasi Surat Undangan Memilih
            </h1>
            <p className="text-xs text-slate-300">
              P2KD Kalisalak • Rapat Pleno Terbuka Pilkades Kalisalak 2027 – 2035
            </p>
          </div>
        </div>

        {/* Action Bar (Camera QR Scanner & Manual Input) */}
        {!data && !loading && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowScanner(!showScanner)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>{showScanner ? "Tutup Pemindai Kamera" : "Pindai QR Code Kamera Live"}</span>
              </Button>
            </div>

            {showScanner && (
              <C6QrScanner
                onScanSuccess={handleQrDecoded}
                onClose={() => setShowScanner(false)}
              />
            )}

            {!showScanner && (
              <Card className="p-4 bg-white/10 border-white/15 backdrop-blur-md rounded-2xl space-y-3">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ScanLine className="w-4 h-4 text-blue-400" />
                  <span>Input Manual ID / NIK Pemilih:</span>
                </div>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Masukkan ID Pemilih atau 16 digit NIK..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-900/90 text-white border border-white/20 rounded-xl focus:outline-hidden focus:border-blue-400"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="text-xs px-4 bg-blue-600 hover:bg-blue-500 rounded-xl"
                  >
                    <Search className="w-3.5 h-3.5 mr-1" />
                    Cek
                  </Button>
                </form>
              </Card>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="p-8 bg-white/10 border-white/15 text-center text-slate-200 backdrop-blur-md rounded-3xl space-y-3">
            <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold">Memverifikasi keaslian QR Code Form C6 ke Database Server P2KD...</p>
          </Card>
        )}

        {/* Error State */}
        {!loading && errorMsg && (
          <Card className="p-6 bg-rose-950/80 border-rose-800/80 text-white backdrop-blur-md rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-black text-rose-200">VERIFIKASI TIDAK VALID</h3>
                <p className="text-xs text-rose-100/90 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-rose-800/60 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setErrorMsg("");
                  setShowScanner(true);
                }}
                className="text-xs bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Pindai Ulang
              </Button>
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-white">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Ke Beranda
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Valid Verified State */}
        {!loading && data && (
          <div className="space-y-4">
            {/* Status Banner */}
            <Card className="p-5 bg-linear-to-r from-emerald-950 via-teal-950 to-slate-950 border-emerald-500/50 shadow-2xl rounded-3xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="success" className="text-[10px] uppercase font-black bg-emerald-500/30 text-emerald-200 border-emerald-400/40">
                    DOKUMEN ASLI & TERVERIFIKASI
                  </Badge>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                    Sah Terdaftar di Daftar Pemilih Tetap (DPT)
                  </h2>
                </div>
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-relaxed border-t border-emerald-800/60 pt-2 font-medium">
                Surat undangan memilih (Model C6-KWK) ini resmi diterbitkan oleh Panitia Pemilihan Kepala Desa Kalisalak untuk Pemilihan Kepala Desa Masa Bakti 2027 – 2035.
              </p>
            </Card>

            {/* Voter Details Card */}
            <Card className="p-6 bg-white text-slate-900 rounded-3xl shadow-2xl border-0 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Nama Warga Pemilih
                  </span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {data.namaLengkap}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Status Hak Pilih
                  </span>
                  <div>
                    <span className="inline-block text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {data.statusAktif} • {data.tahap}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 2 Kolom Identitas */}
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-600" />
                    NIK (Masked)
                  </div>
                  <div className="font-mono font-bold text-slate-800 text-[11px] sm:text-xs">
                    {data.nikMasked}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400">
                    No. KK (Masked)
                  </div>
                  <div className="font-mono font-bold text-slate-800 text-[11px] sm:text-xs">
                    {data.kkMasked}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400">
                    Jenis Kelamin
                  </div>
                  <div className="font-bold text-slate-800">
                    {data.jenisKelamin === "L" ? "Laki-Laki (L)" : "Perempuan (P)"}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400">
                    TTL / Usia
                  </div>
                  <div className="font-bold text-slate-800 truncate" title={`${data.tempatLahir}, ${data.tanggalLahir}`}>
                    {data.tempatLahir}, {data.tanggalLahir}
                  </div>
                </div>

                <div className="col-span-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    Alamat Domisili KTP
                  </div>
                  <div className="font-bold text-slate-800">
                    {data.alamat} • RT {data.rt} / RW {data.rw}
                  </div>
                </div>

                {/* Lokasi Pemungutan & Waktu */}
                <div className="col-span-2 p-4 rounded-2xl bg-blue-50 border border-blue-200/80 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-700" />
                    Lokasi Wilayah & Pemungutan Suara
                  </div>
                  <div className="text-xs font-black text-blue-950">
                    {data.mejaPendaftaran}
                  </div>
                  <div className="text-[11px] text-blue-800 font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    {data.waktuPemilihan}
                  </div>
                </div>
              </div>

              {/* Digital Seal & Instructions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-1 font-mono">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Segel Kriptografis P2KD Valid</span>
                </div>
                <div className="font-medium">
                  {new Date(data.verifiedAt).toLocaleTimeString("id-ID")} WIB
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="text-center pt-2 flex items-center justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setData(null);
                  setShowScanner(true);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 rounded-xl"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                Pindai Pemilih Berikutnya
              </Button>
              <Link href="/">
                <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs rounded-xl">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  Ke Portal
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <footer className="text-center text-[11px] text-slate-500 mt-8">
        © {new Date().getFullYear()} Panitia Pemilihan Kepala Desa (P2KD) Desa Kalisalak • Kabupaten Tegal
      </footer>
    </div>
  );
}

export default function VerifikasiC6Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <VerifikasiC6Content />
    </Suspense>
  );
}
