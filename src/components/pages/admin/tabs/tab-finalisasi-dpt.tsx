"use client";

import React from "react";
import {
  Lock,
  Unlock,
  ShieldCheck,
  Printer,
  FileCheck2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  UserCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, Badge } from "@/components/ui";
import { Voter, TPSItem } from "../types";

interface TabFinalisasiDPTProps {
  isDptLocked: boolean;
  lockHashSignature: string;
  nomorBeritaAcara: string;
  setNomorBeritaAcara: (ba: string) => void;
  totalAktif: number;
  voters?: Voter[];
  tpsList?: TPSItem[];
  onLockDpt: () => void;
  onUnlockDpt: () => void;
  onNavigatePrint?: () => void;
}

export const TabFinalisasiDPT: React.FC<TabFinalisasiDPTProps> = ({
  isDptLocked,
  lockHashSignature,
  nomorBeritaAcara,
  setNomorBeritaAcara,
  totalAktif,
  voters = [],
  tpsList = [],
  onLockDpt,
  onUnlockDpt,
  onNavigatePrint,
}) => {
  // 1. Filter Non-TMS (Active Voters)
  const activeVoters = voters.filter((v) => v.statusAktif === "AKTIF");
  
  // 2. Realtime DPS vs DPT breakdown
  const dptVoters = activeVoters.filter((v) => v.tahap === "DPT");
  const dpsVoters = activeVoters.filter((v) => (v.tahap || "DPS") !== "DPT");
  
  const totalDptReal = dptVoters.length;
  const totalDpsReal = dpsVoters.length;
  const totalPercentDpt = activeVoters.length > 0 ? Math.round((totalDptReal / activeVoters.length) * 100) : 0;

  const totalLakiDpt = dptVoters.filter((v) => String(v.jenisKelamin).toUpperCase().startsWith("L")).length;
  const totalPerempuanDpt = dptVoters.filter((v) => !String(v.jenisKelamin).toUpperCase().startsWith("L")).length;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <Card className="p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-900/60 shadow-xl rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={isDptLocked ? "danger" : "primary"}
                className={`text-[10px] uppercase font-bold px-3 py-0.5 rounded-full ${
                  isDptLocked
                    ? "bg-rose-500/20 text-rose-300 border-rose-400/30"
                    : "bg-blue-500/20 text-blue-300 border-blue-400/30"
                }`}
              >
                {isDptLocked ? "DPT FINAL TELAH DIKUNCI (SAH & MENGIKAT)" : "TAHAP PERSIAPAN SIDANG PLENO P2KD"}
              </Badge>
              <span className="text-xs text-slate-400 font-medium">• Segel Digital SHA-256</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
              Penetapan & Penguncian Berita Acara DPT
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-normal">
              Penetapan DPT merupakan tahapan hukum tertinggi dalam daftar pemilih Pilkades Kalisalak. Setelah disahkan dalam Sidang Pleno Terbuka P2KD bersama BPD dan saksi calon kepala desa, data dikunci secara permanen dengan segel kriptografis digital untuk menjamin netralitas dan transparansi mutlak.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onNavigatePrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigatePrint}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak Berita Acara
              </Button>
            )}
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
              <Lock className={`w-8 h-8 ${isDptLocked ? "text-rose-400 animate-pulse" : "text-blue-300"}`} />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Masuk DPT */}
        <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Total Masuk DPT</div>
              <div className="text-xl font-black text-emerald-700">
                {totalDptReal} <span className="text-xs text-slate-400 font-normal">/ {totalAktif} ({totalPercentDpt}%)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Sisa di DPS */}
        <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Masih di DPS (Draft)</div>
              <div className="text-xl font-black text-amber-700">{totalDpsReal} Pemilih</div>
            </div>
          </div>
        </Card>

        {/* Card 3: Laki-laki di DPT */}
        <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Laki-laki (L) di DPT</div>
              <div className="text-xl font-black text-indigo-900">{totalLakiDpt} Jiwa</div>
            </div>
          </div>
        </Card>

        {/* Card 4: Perempuan di DPT */}
        <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-50 text-pink-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Perempuan (P) di DPT</div>
              <div className="text-xl font-black text-pink-900">{totalPerempuanDpt} Jiwa</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detail Pengesahan & Rekapitulasi */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-600" />
              Instrumen Berita Acara Sidang Pleno Terbuka
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rapat Pleno Penetapan Daftar Pemilih Tetap Pilkades Kalisalak Periode 2027 – 2035
            </p>
          </div>
        </div>

        {/* Input Nomor BA & Info Sidang */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
              Nomor Berita Acara Pleno
            </label>
            <input
              type="text"
              disabled={isDptLocked}
              value={nomorBeritaAcara}
              onChange={(e) => setNomorBeritaAcara(e.target.value)}
              placeholder="Contoh: BA/01/P2KD-KLS/XII/2026"
              className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Lokasi Sidang Pleno
            </label>
            <input
              type="text"
              readOnly
              value="Balai Desa Kalisalak, Margasari, Tegal"
              className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Pusat Pemungutan Suara
            </label>
            <input
              type="text"
              readOnly
              value="Desa Kalisalak (13 Wilayah RW)"
              className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold cursor-not-allowed"
            />
          </div>
        </div>

        {/* Tabel Rekapitulasi 13 Wilayah RW */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rekapitulasi Realtime: DPS vs DPT per 13 Wilayah RW
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              Basis 39 RT di Desa Kalisalak
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px]">
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">Wilayah RW</th>
                  <th className="py-2.5 px-3">Lokasi Pemungutan</th>
                  <th className="py-2.5 px-3 text-center w-20 text-amber-800 bg-amber-50/50">Di DPS</th>
                  <th className="py-2.5 px-3 text-center w-16 text-indigo-800">L (DPT)</th>
                  <th className="py-2.5 px-3 text-center w-16 text-pink-800">P (DPT)</th>
                  <th className="py-2.5 px-3 text-center w-24 text-emerald-800 bg-emerald-50/50 font-black">Masuk DPT</th>
                  <th className="py-2.5 px-3 text-center w-36">Progres Masuk DPT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {tpsList.map((t, idx) => {
                  const rwNum = t.nomorTps.replace(/\D/g, "").padStart(2, "0");
                  const votersInRw = activeVoters.filter((v) => {
                    const vRw = (v.rw || "").replace(/\D/g, "").padStart(2, "0");
                    return vRw === rwNum || (v.tps && v.tps.includes(t.nomorTps));
                  });
                  
                  const dpsCountRw = votersInRw.filter((v) => (v.tahap || "DPS") !== "DPT").length;
                  const dptListRw = votersInRw.filter((v) => v.tahap === "DPT");
                  const dptCountRw = dptListRw.length;
                  const totalTargetRw = votersInRw.length;

                  const l = dptListRw.filter((v) => String(v.jenisKelamin).toUpperCase().startsWith("L")).length;
                  const p = dptListRw.filter((v) => !String(v.jenisKelamin).toUpperCase().startsWith("L")).length;
                  
                  const percentRw = totalTargetRw > 0 ? Math.round((dptCountRw / totalTargetRw) * 100) : 0;
                  const isRwFullyVerified = totalTargetRw > 0 && dptCountRw === totalTargetRw;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{t.namaTps}</td>
                      <td className="py-2.5 px-3 text-slate-600">{t.lokasi}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700 bg-amber-50/30">
                        {dpsCountRw}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">{l}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-pink-700">{p}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/30">
                        {dptCountRw} <span className="text-[10px] text-slate-400 font-normal">/ {totalTargetRw}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {dptCountRw === 0 ? (
                          <Badge variant="outline" className="text-[10px] font-bold bg-slate-100 text-slate-600 border-slate-300">
                            Belum Ada (0%)
                          </Badge>
                        ) : !isRwFullyVerified ? (
                          <Badge variant="warning" className="text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-300 animate-pulse">
                            Proses {percentRw}% ({dptCountRw}/{totalTargetRw})
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Selesai 100% ({dptCountRw} Sah)
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {/* Baris Total Akumulasi */}
                <tr className="bg-slate-900 text-white font-black">
                  <td colSpan={3} className="py-3 px-4 text-right uppercase text-xs tracking-wider text-slate-300">
                    TOTAL AKUMULASI DESA KALISALAK
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-amber-400 text-sm font-black bg-slate-950/80">
                    {totalDpsReal}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-indigo-300 font-black">{totalLakiDpt}</td>
                  <td className="py-3 px-3 text-center font-mono text-pink-300 font-black">{totalPerempuanDpt}</td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-400 text-sm font-black bg-slate-950/80">
                    {totalDptReal} <span className="text-[10px] text-slate-400 font-normal">/ {totalAktif}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {totalDptReal === 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold border border-slate-700">
                        Belum Ada Masuk DPT
                      </span>
                    ) : totalDptReal < totalAktif ? (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black shadow-sm animate-pulse">
                        Proses {totalPercentDpt}% ({totalDptReal}/{totalAktif})
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-400 text-slate-950 font-black shadow-sm flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Selesai 100% Lengkap
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Penguncian & Tombol Aksi */}
        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
              Status Hukum DPT:{" "}
              {isDptLocked ? (
                <span className="text-rose-600 font-extrabold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> DPT Resmi Terkunci & Disahkan
                </span>
              ) : (
                <span className="text-amber-600 font-extrabold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Menunggu Pengesahan Sidang Pleno
                </span>
              )}
            </div>
            {lockHashSignature && (
              <div className="text-[11px] font-mono text-slate-500 break-all">
                Segel SHA-256: <span className="text-slate-800 font-semibold">{lockHashSignature}</span>
              </div>
            )}
            {totalDpsReal > 0 && !isDptLocked && (
              <div className="text-[11px] text-amber-700 font-medium">
                ⚠️ Catatan: Masih ada <strong>{totalDpsReal} pemilih</strong> di menu DPS yang belum diverifikasi masuk ke DPT.
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isDptLocked ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onUnlockDpt}
                className="text-rose-700 border-rose-300 hover:bg-rose-50 font-bold text-xs"
              >
                <Unlock className="w-3.5 h-3.5 mr-1.5" />
                Buka Kunci DPT (Khusus Sidang)
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={onLockDpt}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Kunci & Segel DPT Pleno Sekarang
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
