"use client";

import React, { useState } from "react";
import { Voter, TPSItem } from "../types";
import { Printer, ArrowLeft, Download, FileSpreadsheet, Sparkles } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { exportModelA1Excel, exportModelA1Pdf, matchTpsVoter } from "@/lib/print-models-export";

interface PrintModelA1DpsProps {
  voters: Voter[];
  tpsList: TPSItem[];
  defaultTps?: string;
  isAdmin: boolean;
  onBack: () => void;
}

export const PrintModelA1Dps: React.FC<PrintModelA1DpsProps> = ({
  voters,
  tpsList,
  defaultTps,
  isAdmin,
  onBack,
}) => {
  const [selectedTps, setSelectedTps] = useState(defaultTps || "SEMUA");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const filteredVoters = voters.filter((v) => {
    const isTpsMatch = matchTpsVoter(v.tps, selectedTps) || matchTpsVoter(v.rw, selectedTps);

    if (!isTpsMatch) return false;
    if (filterStatus === "SESUAI") return v.coklitStatus === "SESUAI";
    if (filterStatus === "UBAH_DATA") return v.coklitStatus === "UBAH_DATA";
    if (filterStatus === "TMS") return v.coklitStatus === "TMS" || v.statusAktif === "TMS";
    if (filterStatus === "BELUM") return !v.coklitStatus || v.coklitStatus === "BELUM_COKLIT";
    return true;
  });

  const lCount = filteredVoters.filter((v) => v.jenisKelamin === "L").length;
  const pCount = filteredVoters.filter((v) => v.jenisKelamin === "P").length;

  return (
    <div className="space-y-4">
      {/* Action Bar (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack} className="text-xs">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Pusat Cetak
          </Button>
          <Badge variant="primary" className="text-[10px] font-bold bg-amber-500/10 text-amber-800 border-amber-300">
            MODEL A.1 • DPS PILKADES ({filteredVoters.length} Pemilih)
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tabung Selector */}
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

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 px-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="ALL">Semua Data</option>
              <option value="BELUM">Belum Coklit</option>
              <option value="SESUAI">Sesuai</option>
              <option value="UBAH_DATA">Diperbaiki</option>
              <option value="TMS">TMS</option>
            </select>
          </div>

          {/* Download Excel */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportModelA1Excel(filteredVoters, selectedTps)}
            className="text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Unduh Excel (.xlsx)
          </Button>

          {/* Download PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportModelA1Pdf(filteredVoters, selectedTps)}
            className="text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50"
          >
            <Download className="w-4 h-4 mr-1.5 text-rose-600" />
            Unduh PDF
          </Button>

          {/* Print A4 */}
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
      <div className="bg-white text-black p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-lg max-w-6xl mx-auto font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
        {/* Kop Resmi */}
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
            MODEL A.1-PILKADES (LEMBAR KERJA PEMUTAKHIRAN DPS)
          </div>
          <h3 className="text-sm font-bold uppercase">
            DAFTAR PEMILIH SEMENTARA (DPS) PEMILIHAN KEPALA DESA KALISALAK 2026/2027
          </h3>
          <h2 className="text-base font-black uppercase tracking-wide mt-0.5">
            LEMBAR KERJA COKLIT PANTARLIH • WILAYAH: {selectedTps.replace(/TPS/gi, "TABUNG")}
          </h2>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Kecamatan Margasari, Kabupaten Tegal • Format Standar Berkas Faktual Lapangan
          </p>
        </div>

        {/* Ringkasan */}
        <div className="flex items-center justify-between text-xs mb-4 pb-2 border-b border-slate-200">
          <div>
            Total Pemilih: <strong>{filteredVoters.length} Orang</strong> (L: <strong>{lCount}</strong>, P: <strong>{pCount}</strong>)
          </div>
          <div className="text-[11px] text-slate-500 italic">
            * Setiap 1 data pemilih dilengkapi 1 sub-tabel verifikasi faktual lapangan
          </div>
        </div>

        {/* Daftar Pemilih dengan Sub-Tabel */}
        <div className="space-y-3">
          {filteredVoters.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl">
              Tidak ada data pemilih yang sesuai kriteria filter.
            </div>
          ) : (
            filteredVoters.map((v, idx) => {
              const isSesuai = v.coklitStatus === "SESUAI";
              const isUbah = v.coklitStatus === "UBAH_DATA";
              const isTms = v.coklitStatus === "TMS" || v.statusAktif === "TMS";

              return (
                <div
                  key={v.id}
                  className="border border-black rounded-lg overflow-hidden text-xs break-inside-avoid"
                >
                  {/* Baris 1: Tabel Data Utama Pemilih */}
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-black text-slate-800">
                        <th className="p-1.5 w-8 text-center border-r border-black">NO</th>
                        <th className="p-1.5 w-36 border-r border-black">NOMOR NIK</th>
                        <th className="p-1.5 w-36 border-r border-black">NOMOR KK</th>
                        <th className="p-1.5 border-r border-black">NAMA LENGKAP</th>
                        <th className="p-1.5 w-10 text-center border-r border-black">JK</th>
                        <th className="p-1.5 w-40 border-r border-black">TEMPAT / TGL LAHIR</th>
                        <th className="p-1.5 w-16 text-center border-r border-black">KAWIN</th>
                        <th className="p-1.5 border-r border-black">ALAMAT DOMISILI</th>
                        <th className="p-1.5 w-12 text-center border-r border-black">RT/RW</th>
                        <th className="p-1.5 w-20 text-center">TABUNG</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-medium bg-white">
                        <td className="p-1.5 text-center font-bold border-r border-black">{idx + 1}</td>
                        <td className="p-1.5 font-mono font-bold border-r border-black">{v.nik}</td>
                        <td className="p-1.5 font-mono border-r border-black">{v.kk || "-"}</td>
                        <td className="p-1.5 font-bold uppercase text-slate-950 border-r border-black">
                          {v.namaLengkap}
                        </td>
                        <td className="p-1.5 text-center border-r border-black">{v.jenisKelamin}</td>
                        <td className="p-1.5 border-r border-black">
                          {v.tempatLahir}, {v.tanggalLahir}
                        </td>
                        <td className="p-1.5 text-center border-r border-black">
                          {v.statusPerkawinan === "S" ? "Kawin" : v.statusPerkawinan === "B" ? "Belum" : "Pernah"}
                        </td>
                        <td className="p-1.5 border-r border-black truncate max-w-xs">{v.alamat}</td>
                        <td className="p-1.5 text-center border-r border-black">
                          {v.rt}/{v.rw}
                        </td>
                        <td className="p-1.5 text-center font-bold text-blue-900">{v.tps.replace(/TPS/gi, "Tabung")}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Baris 2: SUB-TABEL VERIFIKASI COKLIT DI BAWAHNYA */}
                  <div className="bg-slate-50 border-t border-black p-2">
                    <div className="text-[10px] font-black text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Sub-Tabel Verifikasi Faktual Lapangan (Model A.1)
                    </div>

                    <table className="w-full text-[10.5px] border border-slate-400 bg-white">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 font-bold text-center border-b border-slate-400">
                          <th className="p-1 border-r border-slate-400 w-36">STATUS FAKTUAL</th>
                          <th className="p-1 border-r border-slate-400">KOREKSI ELEMEN DATA</th>
                          <th className="p-1 border-r border-slate-400">CATATAN LAPANGAN / BUKTI</th>
                          <th className="p-1 border-r border-slate-400 w-44">PETUGAS VERIFIKATOR</th>
                          <th className="p-1 border-r border-slate-400 w-28">TGL VERIFIKASI</th>
                          <th className="p-1 w-24">PARAF PETUGAS</th>
                          <th className="p-1 w-24 border-l border-slate-400">PARAF PEMILIH</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          {/* Status */}
                          <td className="p-1.5 border-r border-slate-400 text-left font-bold">
                            <div className="space-y-0.5 text-[10px]">
                              <div className={`flex items-center gap-1 ${isSesuai ? "text-emerald-700 font-black" : "text-slate-500"}`}>
                                <span>{isSesuai ? "[✓]" : "[ ]"}</span>
                                <span>SESUAI</span>
                              </div>
                              <div className={`flex items-center gap-1 ${isUbah ? "text-blue-700 font-black" : "text-slate-500"}`}>
                                <span>{isUbah ? "[✓]" : "[ ]"}</span>
                                <span>UBAH DATA</span>
                              </div>
                              <div className={`flex items-center gap-1 ${isTms ? "text-rose-700 font-black" : "text-slate-500"}`}>
                                <span>{isTms ? "[✓]" : "[ ]"}</span>
                                <span>TMS</span>
                              </div>
                            </div>
                          </td>

                          {/* Koreksi Data */}
                          <td className="p-1.5 border-r border-slate-400 text-left">
                            {v.coklitCatatan ? (
                              <span className="font-semibold text-blue-900">{v.coklitCatatan}</span>
                            ) : (
                              <span className="text-slate-300 font-mono select-none">..........................................................................</span>
                            )}
                          </td>

                          {/* Catatan Lapangan */}
                          <td className="p-1.5 border-r border-slate-400 text-left">
                            {v.alasanTms ? (
                              <span className="font-bold text-rose-700">TMS: {v.alasanTms}</span>
                            ) : (
                              <span className="text-slate-300 font-mono select-none">..........................................................................</span>
                            )}
                          </td>

                          {/* Petugas Verifikator */}
                          <td className="p-1.5 border-r border-slate-400 text-left font-semibold">
                            {v.coklitPetugas || <span className="text-slate-300 font-mono select-none">................................................</span>}
                          </td>

                          {/* Tanggal */}
                          <td className="p-1.5 border-r border-slate-400 text-center font-mono text-[10px]">
                            {v.coklitTanggal || <span className="text-slate-300 select-none">..../..../2026</span>}
                          </td>

                          {/* Paraf Petugas */}
                          <td className="p-1.5 text-center">
                            <div className="h-8 border border-dashed border-slate-400 rounded flex items-center justify-center text-[9px] text-slate-400">
                              Paraf
                            </div>
                          </td>

                          {/* Paraf Pemilih */}
                          <td className="p-1.5 border-l border-slate-400 text-center">
                            <div className="h-8 border border-dashed border-slate-400 rounded flex items-center justify-center text-[9px] text-slate-400">
                              Paraf
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Pengesahan Pantarlih */}
        <div className="mt-8 text-xs flex justify-between items-end">
          <div className="text-[10px] text-slate-500 max-w-sm">
            * Lembar Kerja Model A.1 ini dicetak dan dikelola melalui Sistem Informasi Pemilih P2KD Desa Kalisalak 2026/2027.
          </div>

          <div className="text-center space-y-12">
            <div>
              Kalisalak, 14 September 2026
              <div className="font-bold uppercase">Petugas Pantarlih / Koordinator {selectedTps.replace(/TPS/gi, "Tabung")}</div>
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
    </div>
  );
};
