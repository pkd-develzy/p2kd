"use client";

import React, { useState } from "react";
import { Voter, TPSItem } from "../types";
import { Printer, ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { exportModelA4Excel, exportModelA4Pdf } from "@/lib/print-models-export";

interface PrintModelA4SalinanProps {
  voters: Voter[];
  tpsList: TPSItem[];
  defaultTps?: string;
  isAdmin: boolean;
  onBack: () => void;
}

export const PrintModelA4Salinan: React.FC<PrintModelA4SalinanProps> = ({
  voters,
  tpsList,
  defaultTps,
  isAdmin,
  onBack,
}) => {
  const [selectedTps, setSelectedTps] = useState(defaultTps || tpsList[0]?.namaTps || "TPS 01");
  const [maskNikOption, setMaskNikOption] = useState<"PLAIN" | "MASKED">("PLAIN");

  const tpsObj = tpsList.find((t) => t.namaTps === selectedTps) || tpsList[0];

  const tpsVoters = voters.filter(
    (v) =>
      v.statusAktif === "AKTIF" &&
      (tpsObj?.nomorTps ? v.tps.toLowerCase().includes(tpsObj.nomorTps.toLowerCase()) : true)
  );

  const lCount = tpsVoters.filter((v) => v.jenisKelamin === "L").length;
  const pCount = tpsVoters.filter((v) => v.jenisKelamin === "P").length;

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack} className="text-xs">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Pusat Cetak
          </Button>
          <Badge variant="primary" className="text-[10px] font-bold bg-cyan-500/10 text-cyan-800 border-cyan-300">
            MODEL A.4 • SALINAN DPT PER TABUNG ({tpsVoters.length} Pemilih)
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tabung Selector */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Pilih Tabung:</span>
            <select
              value={selectedTps}
              disabled={!isAdmin}
              onChange={(e) => setSelectedTps(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-lg border border-slate-300 bg-white font-bold text-blue-700"
            >
              {tpsList.map((t) => (
                <option key={t.id} value={t.namaTps}>
                  {t.namaTps.replace(/TPS/gi, "Tabung")} ({t.lokasi})
                </option>
              ))}
            </select>
          </div>

          {/* Masking NIK */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Format:</span>
            <select
              value={maskNikOption}
              onChange={(e) => setMaskNikOption(e.target.value as "PLAIN" | "MASKED")}
              className="h-8 px-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="PLAIN">NIK Lengkap (Arsip Petugas Tabung)</option>
              <option value="MASKED">Sensor NIK (Saksi & Pengumuman)</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportModelA4Excel(voters, selectedTps, maskNikOption === "MASKED")}
            className="text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Unduh Excel (.xlsx)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportModelA4Pdf(voters, selectedTps, maskNikOption === "MASKED")}
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
            Cetak Salinan
          </Button>
        </div>
      </div>

      {/* Printable Document */}
      <div className="bg-white text-black p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-lg max-w-5xl mx-auto font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
        {/* Kop */}
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
            MODEL A.4-PILKADES (SALINAN DPT PER TABUNG)
          </div>
          <h3 className="text-sm font-bold uppercase">
            SALINAN DAFTAR PEMILIH TETAP (DPT) PEMILIHAN KEPALA DESA KALISALAK 2026/2027
          </h3>
          <h2 className="text-base font-black uppercase tracking-wide mt-0.5">
            UNTUK PETUGAS TABUNG, PENGAWAS TABUNG, DAN SAKSI CALON KEPALA DESA
          </h2>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {(tpsObj?.namaTps || selectedTps).replace(/TPS/gi, "Tabung")} • Lokasi: {tpsObj?.lokasi || "Balai Pertemuan"} • Cakupan Wilayah: RT {tpsObj?.rt || "01"} / RW {tpsObj?.rw || "01"}
          </p>
        </div>

        {/* Ringkasan */}
        <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-slate-200">
          <div>
            Total Salinan Pemilih: <strong>{tpsVoters.length} Orang</strong> (L: <strong>{lCount}</strong>, P: <strong>{pCount}</strong>)
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {maskNikOption === "MASKED" ? "Dokumen Terproteksi: NIK Disensor" : "Dokumen Resmi: NIK Terbuka"}
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
                <th className="border border-black p-1.5 w-24">USIA / LAHIR</th>
                <th className="border border-black p-1.5 text-left">ALAMAT DOMISILI</th>
                <th className="border border-black p-1.5 w-10">RT</th>
                <th className="border border-black p-1.5 w-10">RW</th>
                <th className="border border-black p-1.5 w-24">TANDA TERIMA</th>
              </tr>
            </thead>
            <tbody>
              {tpsVoters.length === 0 ? (
                <tr>
                  <td colSpan={10} className="border border-black p-6 text-center text-slate-400">
                    Tidak ada pemilih DPT aktif pada {(tpsObj?.namaTps || selectedTps).replace(/TPS/gi, "Tabung")}.
                  </td>
                </tr>
              ) : (
                tpsVoters.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-slate-50 text-center">
                    <td className="border border-black p-1 font-bold">{idx + 1}</td>
                    <td className="border border-black p-1 font-mono font-bold text-left">
                      {maskNikOption === "PLAIN" ? v.nik : v.nikMasked}
                    </td>
                    <td className="border border-black p-1 font-mono text-left">
                      {maskNikOption === "PLAIN" ? v.kk || "-" : `${v.kk?.slice(0, 6)}******`}
                    </td>
                    <td className="border border-black p-1 font-bold text-left uppercase">{v.namaLengkap}</td>
                    <td className="border border-black p-1">{v.jenisKelamin}</td>
                    <td className="border border-black p-1 text-left">{v.tanggalLahir}</td>
                    <td className="border border-black p-1 text-left truncate max-w-xs">{v.alamat}</td>
                    <td className="border border-black p-1">{v.rt}</td>
                    <td className="border border-black p-1">{v.rw}</td>
                    <td className="border border-black p-1 text-center">
                      <div className="h-4 w-12 border border-dashed border-slate-400 mx-auto rounded"></div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Lembar Tanda Terima Saksi & Petugas */}
        <div className="mt-8 border-t border-black pt-4 text-xs">
          <div className="font-bold uppercase text-center mb-4">
            BERITA ACARA PENYERAHAN SALINAN DPT KEPADA SAKSI CALON KEPALA DESA
          </div>

          <p className="text-[11px] text-slate-700 leading-relaxed mb-4 text-center max-w-2xl mx-auto">
            Pada hari ini telah diserahkan Salinan Daftar Pemilih Tetap (Model A.4) untuk {(tpsObj?.namaTps || selectedTps).replace(/TPS/gi, "Tabung")} oleh Ketua Petugas Tabung kepada masing-masing Saksi Calon Kepala Desa Kalisalak yang sah:
          </p>

          <div className="grid grid-cols-3 gap-6 text-center text-xs pt-2">
            <div className="space-y-12">
              <div className="font-bold">Saksi Calon No. Urut 1</div>
              <div>
                <strong className="underline block font-bold uppercase">( ....................................... )</strong>
                <span className="text-[10px] text-slate-600">Nama Terang</span>
              </div>
            </div>

            <div className="space-y-12">
              <div className="font-bold">Saksi Calon No. Urut 2</div>
              <div>
                <strong className="underline block font-bold uppercase">( ....................................... )</strong>
                <span className="text-[10px] text-slate-600">Nama Terang</span>
              </div>
            </div>

            <div className="space-y-12">
              <div className="font-bold">Ketua Petugas {(tpsObj?.namaTps || selectedTps).replace(/TPS/gi, "Tabung")}</div>
              <div>
                <strong className="underline block font-bold uppercase">( ....................................... )</strong>
                <span className="text-[10px] text-slate-600">Nama Terang</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
