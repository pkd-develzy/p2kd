"use client";

import React, { useState } from "react";
import { Voter, TPSItem } from "../types";
import { Printer, ArrowLeft, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button, Badge, Card } from "@/components/ui";

interface PrintDptTpsProps {
  voters: Voter[];
  tpsList: TPSItem[];
  defaultTps?: string;
  isAdmin: boolean;
  onBack: () => void;
}

export const PrintDptTps: React.FC<PrintDptTpsProps> = ({
  voters,
  tpsList,
  defaultTps,
  isAdmin,
  onBack,
}) => {
  const [selectedTps, setSelectedTps] = useState(defaultTps || tpsList[0]?.namaTps || "SEMUA");
  const [maskNikOption, setMaskNikOption] = useState<"PLAIN" | "MASKED">("PLAIN");

  const handlePrint = () => {
    window.print();
  };

  const tpsObj = tpsList.find((t) => t.namaTps === selectedTps) || tpsList[0];

  // STRICT FILTER: Lembar DPT Model A HANYA untuk pemilih berstatus DPT & AKTIF!
  const dptVotersAll = voters.filter(
    (v) => v.statusAktif === "AKTIF" && v.tahap === "DPT"
  );
  const dpsVotersCount = voters.filter(
    (v) => v.statusAktif === "AKTIF" && v.tahap !== "DPT"
  ).length;

  const tpsVoters = dptVotersAll.filter(
    (v) =>
      (tpsObj?.nomorTps ? v.tps.toLowerCase().includes(tpsObj.nomorTps.toLowerCase()) : true)
  );

  const lCount = tpsVoters.filter((v) => v.jenisKelamin === "L").length;
  const pCount = tpsVoters.filter((v) => v.jenisKelamin === "P").length;

  return (
    <div className="space-y-4">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="text-xs w-fit">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Pusat Cetak
          </Button>

          <Badge
            variant={dptVotersAll.length > 0 ? "success" : "warning"}
            className="text-[10px] font-bold"
          >
            {dptVotersAll.length > 0
              ? `KHUSUS DPT (${dptVotersAll.length} Pemilih)`
              : "KHUSUS DPT (0 Pemilih DPT)"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tabung Selector (disabled for pantarlih) */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Pilih Tabung:</span>
            <select
              value={selectedTps}
              disabled={!isAdmin}
              onChange={(e) => setSelectedTps(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-lg border border-slate-300 bg-white font-bold text-blue-700 disabled:bg-slate-100"
            >
              {tpsList.map((t) => (
                <option key={t.id} value={t.namaTps}>
                  {t.namaTps.replace(/TPS/gi, "Tabung")} ({t.lokasi})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Tampilan NIK:</span>
            <select
              value={maskNikOption}
              onChange={(e) => setMaskNikOption(e.target.value as "PLAIN" | "MASKED")}
              className="h-8 px-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold"
            >
              <option value="PLAIN">NIK Lengkap (Buku Resmi)</option>
              <option value="MASKED">Sensor NIK (Papan Pengumuman)</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            disabled={tpsVoters.length === 0}
            className="text-xs font-bold bg-blue-700 hover:bg-blue-600 shadow-md disabled:opacity-50"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Lembar DPT ({tpsVoters.length})
          </Button>
        </div>
      </div>

      {/* Notice DPS Excluded (Hidden on Print) */}
      {dpsVotersCount > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Validasi DPT Resmi:</strong> Lembar Model A hanya memuat pemilih yang telah berstatus <strong>DPT ({dptVotersAll.length} pemilih)</strong>. Sebanyak <strong>{dpsVotersCount} pemilih berstatus DPS tidak dimasukkan</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Empty State if NO DPT Voters */}
      {dptVotersAll.length === 0 ? (
        <Card className="p-8 bg-amber-50/80 border border-amber-200 rounded-3xl text-center space-y-4 max-w-2xl mx-auto shadow-sm print:hidden">
          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-amber-950">
              Lembar DPT Model A Belum Tersedia (Masih Tahap DPS)
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed max-w-lg mx-auto">
              Buku lembar DPT per Tabung secara resmi hanya memuat warga yang telah ditetapkan menjadi <strong>Daftar Pemilih Tetap (DPT)</strong>.
            </p>
            <p className="text-xs text-amber-800 leading-relaxed max-w-lg mx-auto">
              Saat ini seluruh <strong>{dpsVotersCount} pemilih aktif</strong> masih berada pada tahap <strong>Daftar Pemilih Sementara (DPS)</strong>.
            </p>
          </div>
          <div className="pt-2 border-t border-amber-200">
            <p className="text-[11px] text-amber-700 font-medium">
              💡 <em>Silakan sahkan/pindahkan pemilih ke DPT melalui menu Master Pemilih atau Penetapan DPT Final terlebih dahulu.</em>
            </p>
          </div>
        </Card>
      ) : tpsVoters.length === 0 ? (
        <Card className="p-8 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-2 max-w-2xl mx-auto print:hidden">
          <p className="text-xs text-slate-500 font-medium">
            Tidak ada pemilih DPT aktif pada {(tpsObj?.namaTps || selectedTps).replace(/TPS/gi, "Tabung")}.
          </p>
        </Card>
      ) : (
        /* Official Document Sheet */
        <div className="bg-white text-black p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-lg max-w-5xl mx-auto font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
        {/* Kop Surat Resmi */}
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
            MODEL A-PILKADES (DPT RESMI)
          </div>
          <h3 className="text-sm font-bold uppercase">
            DAFTAR PEMILIH TETAP (DPT) PEMILIHAN KEPALA DESA KALISALAK TAHUN 2026
          </h3>
          <h2 className="text-base font-black uppercase tracking-wide mt-0.5">
            {(tpsObj?.namaTps || selectedTps).replace(/TPS/gi, "Tabung")} — {tpsObj?.lokasi || "LOKASI TABUNG"}
          </h2>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Desa Kalisalak, Kecamatan Margasari, Kabupaten Tegal • Cakupan Wilayah: RT {tpsObj?.rt || "01"} / RW {tpsObj?.rw || "01"}
          </p>
        </div>

        {/* Info Ringkasan Tabung */}
        <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-slate-200">
          <div>
            Total Pemilih: <strong>{tpsVoters.length} Orang</strong> (Laki-laki: <strong>{lCount}</strong>, Perempuan: <strong>{pCount}</strong>)
          </div>
          <div className="text-[11px] text-slate-500">
            Format: Siap Pasang di Papan Informasi Tabung
          </div>
        </div>

        {/* Tabel Pemilih */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse border border-black">
            <thead>
              <tr className="bg-slate-100 font-bold text-center">
                <th className="border border-black p-1.5 w-8">NO</th>
                <th className="border border-black p-1.5 w-36">NIK</th>
                <th className="border border-black p-1.5 w-36">NO KK</th>
                <th className="border border-black p-1.5 text-left">NAMA LENGKAP</th>
                <th className="border border-black p-1.5 w-10">JK</th>
                <th className="border border-black p-1.5 w-24">TEMPAT / TGL LAHIR</th>
                <th className="border border-black p-1.5 w-12">ST. KAWIN</th>
                <th className="border border-black p-1.5 text-left">ALAMAT DOMISILI</th>
                <th className="border border-black p-1.5 w-10">RT</th>
                <th className="border border-black p-1.5 w-10">RW</th>
              </tr>
            </thead>
            <tbody>
              {tpsVoters.length === 0 ? (
                <tr>
                  <td colSpan={10} className="border border-black p-4 text-center text-slate-400">
                    Belum ada data pemilih aktif di {selectedTps.replace(/TPS/gi, "Tabung")}.
                  </td>
                </tr>
              ) : (
                tpsVoters.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-slate-50 text-center">
                    <td className="border border-black p-1">{idx + 1}</td>
                    <td className="border border-black p-1 font-mono font-semibold text-left">
                      {maskNikOption === "PLAIN" ? v.nik : v.nikMasked}
                    </td>
                    <td className="border border-black p-1 font-mono text-left">
                      {maskNikOption === "PLAIN" ? v.kk || "-" : `${v.kk?.slice(0, 6)}******`}
                    </td>
                    <td className="border border-black p-1 font-bold text-left">{v.namaLengkap}</td>
                    <td className="border border-black p-1">{v.jenisKelamin}</td>
                    <td className="border border-black p-1 text-left">
                      {v.tempatLahir}, {v.tanggalLahir}
                    </td>
                    <td className="border border-black p-1">{v.statusPerkawinan}</td>
                    <td className="border border-black p-1 text-left truncate max-w-xs">{v.alamat}</td>
                    <td className="border border-black p-1">{v.rt}</td>
                    <td className="border border-black p-1">{v.rw}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan Petugas Tabung */}
        <div className="mt-8 text-xs flex justify-between items-end">
          <div className="text-[10px] text-slate-500 max-w-xs">
            * Dokumen ini sah dan dicetak melalui Sistem Informasi Daftar Pemilih Pilkades Kalisalak 2026.
          </div>

          <div className="text-center space-y-12">
            <div>
              Kalisalak, 14 Agustus 2026
              <div className="font-bold uppercase">Ketua Petugas {(tpsObj?.namaTps || selectedTps).replace(/TPS/gi, "Tabung")}</div>
            </div>
            <div>
              <strong className="underline block font-bold uppercase">
                ( .................................................. )
              </strong>
              <span className="text-[10px] text-slate-600">Nama Terang & Tanda Tangan</span>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
};
