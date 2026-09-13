"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button, Badge, Logo } from "@/components/ui";

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
  const id = searchParams.get("id") || "";
  const nik = searchParams.get("nik") || "";

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<C6VerificationData | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!id && !nik) {
        setLoading(false);
        setErrorMsg("Parameter QR Code tidak valid atau ID pemilih kosong.");
        return;
      }

      setLoading(true);
      try {
        const queryParam = id ? `id=${encodeURIComponent(id)}` : `nik=${encodeURIComponent(nik)}`;
        const res = await fetch(`/api/voters/c6-verify?${queryParam}`);
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          setErrorMsg("");
        } else {
          setErrorMsg(json.message || "Data formulir C6 tidak ditemukan dalam database resmi.");
        }
      } catch {
        setErrorMsg("Gagal menghubungi server verifikasi. Periksa koneksi internet Anda.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [id, nik]);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-blue-950 to-slate-900 text-white py-8 px-4 flex flex-col justify-between">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Header Institution */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-md">
            <Logo size="md" showText subtitle="Pilkades Desa Kalisalak" />
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
              <Link href="/">
                <Button variant="outline" size="sm" className="text-xs bg-white/10 text-white border-white/20 hover:bg-white/20">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Kembali ke Portal Publik
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
                QR Code ini terkonfirmasi sah diterbitkan resmi oleh Panitia Pemilihan Kepala Desa (P2KD) Desa Kalisalak untuk Pemungutan Suara Pilkades.
              </p>
            </Card>

            {/* Voter Credentials Card */}
            <Card className="p-6 bg-white text-slate-900 border-slate-200 shadow-xl rounded-3xl space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <User className="w-4 h-4 text-blue-600" />
                  Identitas Pemilih Terdaftar
                </div>
                <Badge variant="primary" className="text-[10px] font-mono font-bold">
                  {data.tahap === "DPT" ? "DPT RESMI" : "DPS"}
                </Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Nama Lengkap Pemilih</div>
                  <div className="text-base font-black text-slate-900 uppercase tracking-tight">{data.namaLengkap}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">NIK (Sensor Proteksi)</div>
                    <div className="font-mono font-bold text-slate-900">{data.nikMasked}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">No. Kartu Keluarga</div>
                    <div className="font-mono font-bold text-slate-900">{data.kkMasked}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Jenis Kelamin & Status</div>
                    <div className="font-semibold text-slate-800">{data.jenisKelamin} • {data.statusPerkawinan}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Tempat & Tanggal Lahir</div>
                    <div className="font-semibold text-slate-800">{data.tempatLahir}, {data.tanggalLahir}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    Alamat Domisili
                  </div>
                  <div className="font-semibold text-slate-800">{data.alamat}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-1.5">
                  <div className="text-[10.5px] uppercase font-extrabold text-blue-900 flex items-center gap-1.5">
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

            {/* Back action */}
            <div className="text-center pt-2">
              <Link href="/">
                <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  Kembali ke Portal Publik
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
