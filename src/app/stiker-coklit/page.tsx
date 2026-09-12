"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Home,
  CheckCircle2,
  AlertCircle,
  Users,
  MapPin,
  Building2,
  Calendar,
  Lock,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge, Logo } from "@/components/ui";

interface StikerMember {
  noUrut: number;
  id: string;
  namaLengkap: string;
  nikMasked: string;
  jenisKelamin: string;
  statusHakPilih: string;
  tahap: string;
  statusCoklit: string;
}

interface StikerData {
  id: string;
  kepalaKeluarga: string;
  kkMasked: string;
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  mejaPendaftaran: string;
  tanggalCoklit: string;
  petugasPantarlih: string;
  totalPemilihRumah: number;
  members: StikerMember[];
  verifiedAt: string;
}

function StikerCoklitContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const kk = searchParams.get("kk") || "";
  const nik = searchParams.get("nik") || "";

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<StikerData | null>(null);

  useEffect(() => {
    const fetchStikerData = async () => {
      if (!id && !kk && !nik) {
        setLoading(false);
        setErrorMsg("Parameter QR Code stiker tidak valid.");
        return;
      }

      setLoading(true);
      try {
        const query = id
          ? `id=${encodeURIComponent(id)}`
          : kk
          ? `kk=${encodeURIComponent(kk)}`
          : `nik=${encodeURIComponent(nik)}`;

        const res = await fetch(`/api/voters/stiker-coklit?${query}`);
        const json = await res.json();

        if (json.success && json.data) {
          setData(json.data);
          setErrorMsg("");
        } else {
          setErrorMsg(json.message || "Data stiker Coklit rumah tidak ditemukan.");
        }
      } catch {
        setErrorMsg("Gagal menghubungi server database P2KD. Silakan periksa jaringan internet Anda.");
      } finally {
        setLoading(false);
      }
    };

    fetchStikerData();
  }, [id, kk, nik]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-900 text-white py-8 px-4 flex flex-col justify-between">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Header Institution */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-md">
            <Logo size="md" showText subtitle="P2KD Desa Kalisalak" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-500/20 text-amber-300 px-3.5 py-1 rounded-full border border-amber-400/40 inline-flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" /> MODEL A.A-PILKADES • STIKER COKLIT RUMAH
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-2">
              Bukti Pendaftaran & Coklit Pemilih
            </h1>
            <p className="text-xs text-slate-300">
              Pencocokan & Penelitian Faktual Lapangan Pilkades Desa Kalisalak 2027 – 2035
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="p-8 bg-white/10 border-white/15 text-center text-slate-200 backdrop-blur-md rounded-3xl space-y-3">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold">Memuat Data Pemilih Terdaftar di Rumah Ini...</p>
          </Card>
        )}

        {/* Error State */}
        {!loading && errorMsg && (
          <Card className="p-6 bg-rose-950/80 border-rose-800/80 text-white backdrop-blur-md rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-black text-rose-200">DATA STIKER TIDAK DITEMUKAN</h3>
                <p className="text-xs text-rose-100/90 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-rose-800/60 flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white underline underline-offset-4"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Portal Informasi Publik
              </Link>
            </div>
          </Card>
        )}

        {/* Valid Verified Stiker Content */}
        {!loading && data && (
          <div className="space-y-4">
            {/* Status Banner */}
            <Card className="p-5 bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-950 border-amber-500/50 shadow-2xl rounded-3xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <Badge
                    variant="success"
                    className="text-[10px] uppercase font-black bg-emerald-500/30 text-emerald-200 border-emerald-400/40"
                  >
                    COKLIT SELESAI DILAKSANAKAN
                  </Badge>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                    Rumah Ini Telah Terdaftar Resmi
                  </h2>
                  <p className="text-xs text-amber-200/90 mt-1 font-medium">
                    Data warga di rumah ini telah dicocokkan dan diteliti langsung oleh Petugas Pantarlih Lapangan.
                  </p>
                </div>
              </div>
            </Card>

            {/* Household & Verification Details Card */}
            <Card className="p-6 bg-white text-slate-900 border-slate-200 shadow-xl rounded-3xl space-y-5">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">No. Kartu Keluarga (Sensor)</div>
                  <div className="font-mono font-black text-slate-900">{data.kkMasked}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Kepala Keluarga / Pemilik Rumah</div>
                  <div className="font-black uppercase text-slate-900">{data.kepalaKeluarga}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    Alamat Domisili
                  </div>
                  <div className="font-semibold text-slate-800">{data.alamat}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    Tanggal Pelaksanaan Coklit
                  </div>
                  <div className="font-semibold text-slate-800">{data.tanggalCoklit}</div>
                </div>
              </div>

              {/* Voter Members in this Household */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Users className="w-4 h-4 text-amber-600" />
                    Daftar Pemilih Terdaftar di Rumah Ini ({data.totalPemilihRumah} Orang)
                  </div>
                  <Badge variant="primary" className="text-[10px] font-mono font-bold">
                    WILAYAH RW {data.rw}
                  </Badge>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {data.members.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 flex items-center justify-center font-bold font-mono text-xs shrink-0">
                          #{m.noUrut}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 uppercase">{m.namaLengkap}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span className="font-mono">{m.nikMasked}</span>
                            <span>•</span>
                            <span>{m.jenisKelamin}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <Badge
                          variant="success"
                          className="text-[9.5px] font-bold bg-emerald-100 text-emerald-900 border-emerald-300 inline-flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3 text-emerald-700" />
                          {m.statusHakPilih}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voting Location & Pantarlih Info */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-1.5 text-xs">
                <div className="text-[10.5px] uppercase font-extrabold text-blue-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-700" />
                  Lokasi Pemungutan Suara di Hari-H
                </div>
                <div className="font-black text-blue-950">{data.mejaPendaftaran}</div>
                <div className="text-[11px] text-blue-800 font-semibold">
                  Petugas Pantarlih RW {data.rw}: {data.petugasPantarlih}
                </div>
              </div>

              {/* Security Digital Seal Note */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-1 font-mono">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Segel Digital Resmi P2KD Desa Kalisalak</span>
                </div>
                <div className="font-medium">
                  {new Date(data.verifiedAt).toLocaleTimeString("id-ID")} WIB
                </div>
              </div>
            </Card>

            {/* Back link */}
            <div className="text-center pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Portal Informasi Desa Kalisalak
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <footer className="text-center text-[11px] text-slate-500 mt-8">
        © {new Date().getFullYear()} Panitia Pemilihan Kepala Desa (P2KD) Desa Kalisalak • Kecamatan Margasari
      </footer>
    </div>
  );
}

export default function StikerCoklitPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <StikerCoklitContent />
    </Suspense>
  );
}
