"use client";

import React, { useState } from "react";
import { Voter, TPSItem } from "../types";
import { Printer, ArrowLeft, Download, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { exportModelA3Excel, exportModelA3Pdf } from "@/lib/print-models-export";

interface PrintModelA3DptProps {
  voters: Voter[];
  tpsList: TPSItem[];
  isAdmin: boolean;
  onBack: () => void;
}

export const PrintModelA3Dpt: React.FC<PrintModelA3DptProps> = ({
  voters,
  tpsList,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"REKAP" | "BUKU_INDUK">("REKAP");

  // DPT Resmi: Seluruh pemilih aktif
  const dptVoters = voters.filter((v) => v.statusAktif === "AKTIF");
  const grandL = dptVoters.filter((v) => v.jenisKelamin === "L").length;
  const grandP = dptVoters.filter((v) => v.jenisKelamin === "P").length;

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack} className="text-xs">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Pusat Cetak
          </Button>
          <Badge variant="success" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-800 border-emerald-300">
            MODEL A.3 • DPT TINGKAT DESA ({dptVoters.length} Pemilih Sah)
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle View */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab("REKAP")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeTab === "REKAP" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              1. Tabel Rekapitulasi 13 Tabung
            </button>
            <button
              onClick={() => setActiveTab("BUKU_INDUK")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeTab === "BUKU_INDUK" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              2. Buku Induk DPT Sah
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportModelA3Excel(voters, tpsList)}
            className="text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Unduh Excel (.xlsx)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportModelA3Pdf(voters, tpsList)}
            className="text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50"
          >
            <Download className="w-4 h-4 mr-1.5 text-rose-600" />
            Unduh PDF
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold bg-blue-700 hover:bg-blue-600"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Dokumen
          </Button>
        </div>
      </div>

      {/* Printable Document */}
      <div className="bg-white text-black p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-lg max-w-5xl mx-auto font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
        {/* Kop */}
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
            MODEL A.3-PILKADES (BUKU INDUK DPT TINGKAT DESA)
          </div>
          <h3 className="text-sm font-bold uppercase">
            REKAPITULASI DAFTAR PEMILIH TETAP (DPT) TINGKAT DESA KALISALAK TAHUN 2026/2027
          </h3>
          <h2 className="text-base font-black uppercase tracking-wide mt-0.5">
            PENETAPAN RAPAT PLENO TERBUKA P2KD DESA KALISALAK
          </h2>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Kecamatan Margasari, Kabupaten Tegal • Mencakup 13 Tabung Pemilihan dan 13 Wilayah RW
          </p>
        </div>

        {/* Ringkasan Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Total DPT Sah: <strong>{dptVoters.length} Pemilih</strong> (Laki-laki: <strong>{grandL}</strong>, Perempuan: <strong>{grandP}</strong>)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Status: TERKUNCI & DISAHKAN PLENO
          </span>
        </div>

        {/* TAB 1: TABEL REKAPITULASI 13 TABUNG */}
        {activeTab === "REKAP" ? (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-800 border-b border-slate-300 pb-1">
              A. Tabel Rekapitulasi Daftar Pemilih Tetap per Tabung
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-black">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-black p-2 w-10">NO</th>
                    <th className="border border-black p-2 text-left">NOMOR & NAMA TABUNG PEMILIHAN</th>
                    <th className="border border-black p-2 text-left">LOKASI / WILAYAH</th>
                    <th className="border border-black p-2 w-24">LAKI-LAKI</th>
                    <th className="border border-black p-2 w-24">PEREMPUAN</th>
                    <th className="border border-black p-2 w-28">TOTAL DPT</th>
                  </tr>
                </thead>
                <tbody>
                  {tpsList.map((t, idx) => {
                    const votersInTps = dptVoters.filter(
                      (v) =>
                        v.tps.toLowerCase().includes(t.nomorTps.toLowerCase()) ||
                        v.tps.toLowerCase().includes(t.namaTps.toLowerCase())
                    );
                    const l = votersInTps.filter((v) => v.jenisKelamin === "L").length;
                    const p = votersInTps.filter((v) => v.jenisKelamin === "P").length;

                    return (
                      <tr key={t.id} className="text-center hover:bg-slate-50">
                        <td className="border border-black p-1.5 font-bold">{idx + 1}</td>
                        <td className="border border-black p-1.5 text-left font-bold">{t.nomorTps} - {t.namaTabung || t.namaTps.replace(/TPS/gi, "Tabung")}</td>
                        <td className="border border-black p-1.5 text-left">{t.lokasi}</td>
                        <td className="border border-black p-1.5 font-mono">{l}</td>
                        <td className="border border-black p-1.5 font-mono">{p}</td>
                        <td className="border border-black p-1.5 font-mono font-bold text-blue-900">{l + p}</td>
                      </tr>
                    );
                  })}
                  {/* Total Row */}
                  <tr className="bg-slate-200 font-black text-center text-slate-900">
                    <td colSpan={3} className="border border-black p-2 text-left">
                      TOTAL DPT SE-DESA KALISALAK (13 TABUNG)
                    </td>
                    <td className="border border-black p-2 font-mono">{grandL}</td>
                    <td className="border border-black p-2 font-mono">{grandP}</td>
                    <td className="border border-black p-2 font-mono text-emerald-900 font-black">{grandL + grandP}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* TAB 2: BUKU INDUK DPT */
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-800 border-b border-slate-300 pb-1">
              B. Buku Induk Daftar Pemilih Tetap (DPT) Desa Kalisalak
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-black">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-black p-1.5 w-8">NO</th>
                    <th className="border border-black p-1.5 w-36">NIK</th>
                    <th className="border border-black p-1.5 w-36">NOMOR KK</th>
                    <th className="border border-black p-1.5 text-left">NAMA LENGKAP</th>
                    <th className="border border-black p-1.5 w-10">JK</th>
                    <th className="border border-black p-1.5 w-24">TTL</th>
                    <th className="border border-black p-1.5 text-left">ALAMAT</th>
                    <th className="border border-black p-1.5 w-10">RT</th>
                    <th className="border border-black p-1.5 w-10">RW</th>
                    <th className="border border-black p-1.5 w-20">TABUNG</th>
                  </tr>
                </thead>
                <tbody>
                  {dptVoters.slice(0, 100).map((v, idx) => (
                    <tr key={v.id} className="hover:bg-slate-50 text-center">
                      <td className="border border-black p-1">{idx + 1}</td>
                      <td className="border border-black p-1 font-mono font-bold text-left">{v.nik}</td>
                      <td className="border border-black p-1 font-mono text-left">{v.kk || "-"}</td>
                      <td className="border border-black p-1 font-bold text-left uppercase">{v.namaLengkap}</td>
                      <td className="border border-black p-1">{v.jenisKelamin}</td>
                      <td className="border border-black p-1 text-left">{v.tanggalLahir}</td>
                      <td className="border border-black p-1 text-left truncate max-w-xs">{v.alamat}</td>
                      <td className="border border-black p-1">{v.rt}</td>
                      <td className="border border-black p-1">{v.rw}</td>
                      <td className="border border-black p-1 font-bold">{v.tps.replace(/TPS/gi, "Tabung")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dptVoters.length > 100 && (
                <div className="p-3 text-center text-xs text-slate-500 italic bg-slate-50 border border-t-0 border-black">
                  Menampilkan 100 pemilih pertama. Untuk dokumen lengkap seluruh desa silakan gunakan tombol &quot;Unduh Excel (.xlsx)&quot; di atas.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lembar Tanda Tangan Pleno */}
        <div className="mt-8 text-xs border-t border-slate-300 pt-4">
          <div className="text-center font-bold uppercase mb-4">
            PANITIA PEMILIHAN KEPALA DESA KALISALAK TAHUN 2026/2027
          </div>

          <div className="grid grid-cols-3 gap-6 text-center text-xs pt-4">
            <div className="space-y-12">
              <div className="font-bold">Ketua P2KD</div>
              <div>
                <strong className="underline block font-bold uppercase">KHASANUDIN, S.Pd.SD</strong>
              </div>
            </div>

            <div className="space-y-12">
              <div className="font-bold">Sekretaris P2KD</div>
              <div>
                <strong className="underline block font-bold uppercase">MASHADY, M.H.</strong>
              </div>
            </div>

            <div className="space-y-12">
              <div className="font-bold">Ketua BPD Kalisalak</div>
              <div>
                <strong className="underline block font-bold uppercase">( ....................................... )</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
