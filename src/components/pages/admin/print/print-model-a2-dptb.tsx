"use client";

import React, { useState } from "react";
import { Voter, TPSItem } from "../types";
import { Printer, ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { exportModelA2Excel, exportModelA2Pdf } from "@/lib/print-models-export";

interface PrintModelA2DptbProps {
  voters: Voter[];
  tpsList: TPSItem[];
  defaultTps?: string;
  isAdmin: boolean;
  onBack: () => void;
}

export const PrintModelA2Dptb: React.FC<PrintModelA2DptbProps> = ({
  voters,
  tpsList,
  defaultTps,
  isAdmin,
  onBack,
}) => {
  const [selectedTps, setSelectedTps] = useState(defaultTps || "SEMUA");

  // DPTb: Pemilih yang terdaftar sebagai pemilih tambahan (baru, mutasi masuk, atau DPTB)
  const dptbList = voters.filter((v) => {
    const isTpsMatch =
      selectedTps === "SEMUA" ||
      v.tps.toLowerCase().includes(selectedTps.toLowerCase()) ||
      v.rw.toLowerCase().includes(selectedTps.toLowerCase());
    return isTpsMatch && (v.coklitStatus === "BARU" || v.disabilitas === "DPTB" || v.tahap === "DPS");
  });

  const lCount = dptbList.filter((v) => v.jenisKelamin === "L").length;
  const pCount = dptbList.filter((v) => v.jenisKelamin === "P").length;

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack} className="text-xs">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Pusat Cetak
          </Button>
          <Badge variant="primary" className="text-[10px] font-bold bg-blue-500/10 text-blue-800 border-blue-300">
            MODEL A.2 • DPTb ({dptbList.length} Pemilih)
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Tabung:</span>
            <select
              value={selectedTps}
              disabled={!isAdmin}
              onChange={(e) => setSelectedTps(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-lg border border-slate-300 bg-white font-bold text-blue-700"
            >
              <option value="SEMUA">Semua Tabung (Desa Kalisalak)</option>
              {tpsList.map((t) => (
                <option key={t.id} value={t.namaTps}>
                  {t.namaTabung || t.namaTps.replace(/TPS/gi, "Tabung")} ({t.lokasi})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportModelA2Excel(voters, selectedTps)}
            className="text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Unduh Excel (.xlsx)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportModelA2Pdf(voters, selectedTps)}
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

      {/* Printable Sheet */}
      <div className="bg-white text-black p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-lg max-w-5xl mx-auto font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
        {/* Kop */}
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
            MODEL A.2-PILKADES (DAFTAR PEMILIH TAMBAHAN)
          </div>
          <h3 className="text-sm font-bold uppercase">
            DAFTAR PEMILIH TAMBAHAN (DPTb) PEMILIHAN KEPALA DESA KALISALAK 2026/2027
          </h3>
          <h2 className="text-base font-black uppercase tracking-wide mt-0.5">
            WILAYAH: {selectedTps.replace(/TPS/gi, "TABUNG")}
          </h2>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Daftar Pemilih yang Menggunakan Hak Pilih Tambahan dengan KTP-el / Surat Pindah Domisili
          </p>
        </div>

        {/* Info Box */}
        <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-slate-200">
          <div>
            Total Pemilih Tambahan: <strong>{dptbList.length} Jiwa</strong> (L: <strong>{lCount}</strong>, P: <strong>{pCount}</strong>)
          </div>
          <div className="text-[11px] text-slate-500">
            Dokumen Resmi Berita Acara DPTb P2KD Kalisalak
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse border border-black">
            <thead>
              <tr className="bg-slate-100 font-bold text-center">
                <th className="border border-black p-1.5 w-8">NO</th>
                <th className="border border-black p-1.5 w-36">NOMOR NIK</th>
                <th className="border border-black p-1.5 w-36">NOMOR KK</th>
                <th className="border border-black p-1.5 text-left">NAMA LENGKAP</th>
                <th className="border border-black p-1.5 w-10">JK</th>
                <th className="border border-black p-1.5 w-32">TEMPAT / TGL LAHIR</th>
                <th className="border border-black p-1.5 text-left">ALAMAT DOMISILI</th>
                <th className="border border-black p-1.5 w-10">RT</th>
                <th className="border border-black p-1.5 w-10">RW</th>
                <th className="border border-black p-1.5 w-24">TABUNG TUJUAN</th>
                <th className="border border-black p-1.5 text-left">DOKUMEN DASAR</th>
              </tr>
            </thead>
            <tbody>
              {dptbList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="border border-black p-6 text-center text-slate-400">
                    Belum ada data pemilih tambahan (DPTb) yang terdaftar pada wilayah ini.
                  </td>
                </tr>
              ) : (
                dptbList.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-slate-50 text-center">
                    <td className="border border-black p-1 font-bold">{idx + 1}</td>
                    <td className="border border-black p-1 font-mono font-semibold text-left">{v.nik}</td>
                    <td className="border border-black p-1 font-mono text-left">{v.kk || "-"}</td>
                    <td className="border border-black p-1 font-bold text-left uppercase">{v.namaLengkap}</td>
                    <td className="border border-black p-1">{v.jenisKelamin}</td>
                    <td className="border border-black p-1 text-left">
                      {v.tempatLahir}, {v.tanggalLahir}
                    </td>
                    <td className="border border-black p-1 text-left truncate max-w-xs">{v.alamat}</td>
                    <td className="border border-black p-1">{v.rt}</td>
                    <td className="border border-black p-1">{v.rw}</td>
                    <td className="border border-black p-1 font-bold text-blue-900">{v.tps.replace(/TPS/gi, "Tabung")}</td>
                    <td className="border border-black p-1 text-left text-[10px]">
                      KTP-el Kalisalak / Surat Pindah Masuk
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan */}
        <div className="mt-8 text-xs flex justify-between items-end">
          <div className="text-[10px] text-slate-500 max-w-xs">
            * Ditetapkan secara sah dalam rapat pleno penyelenggara pemilihan kepala desa.
          </div>

          <div className="text-center space-y-12">
            <div>
              Kalisalak, 14 September 2026
              <div className="font-bold uppercase">Ketua P2KD Desa Kalisalak</div>
            </div>
            <div>
              <strong className="underline block font-bold uppercase">
                KHASANUDIN, S.Pd.SD
              </strong>
              <span className="text-[10px] text-slate-600">NIP / Identitas Panitia</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
