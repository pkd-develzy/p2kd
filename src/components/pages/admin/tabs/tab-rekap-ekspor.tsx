"use client";

import React from "react";
import { FileSpreadsheet, Layers, UserX, AlertTriangle, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, Badge } from "@/components/ui";
import { Voter, TPSItem } from "../types";

interface TabRekapEksporProps {
  tpsList: TPSItem[];
  voters: Voter[];
}

export const TabRekapEkspor: React.FC<TabRekapEksporProps> = ({
  tpsList,
  voters,
}) => {
  return (
    <div className="space-y-5">
      {/* Featured Master Multi-Sheet Excel Workbook Card */}
      <Card className="p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-900/60 shadow-lg rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="primary"
                className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border-blue-400/30 px-3 py-0.5 rounded-full"
              >
                Format Resmi Buku Induk (.xlsx)
              </Badge>
              <span className="text-xs text-slate-400 font-medium">• Multi-Sheet Workbook Otomatis</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              Buku Induk & Rekapitulasi Ekspor Pilkades 2027
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-normal">
              Satu berkas Excel komprehensif memuat seluruh lembar kerja resmi: Lembar Ringkasan & Berita Acara Pleno, Rekapitulasi 13 Tabung, Master DPT Final, Daftar TMS, dan Aduan Warga.
            </p>
          </div>

          <a href="/api/admin/export?type=FULL" download className="shrink-0">
            <button
              type="button"
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Master Excel (.xlsx)</span>
            </button>
          </a>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 space-y-2">
          <div className="p-2 w-fit rounded-lg bg-blue-50 text-blue-700">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Daftar DPT Final</h4>
          <p className="text-[11px] text-slate-500">Seluruh pemilih aktif format Excel resmi (.xlsx) per Tabung.</p>
          <a href="/api/admin/export?type=DPT" download className="block pt-2">
            <Button variant="primary" size="sm" className="w-full text-xs font-bold">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Unduh Excel DPT
            </Button>
          </a>
        </Card>

        <Card className="p-4 bg-white border-slate-200 space-y-2">
          <div className="p-2 w-fit rounded-lg bg-emerald-50 text-emerald-700">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Rekapitulasi Tabung</h4>
          <p className="text-[11px] text-slate-500">Tabel ringkasan jumlah pemilih L/P tiap Tabung format Excel.</p>
          <a href="/api/admin/export?type=REKAP" download className="block pt-2">
            <Button variant="outline" size="sm" className="w-full text-xs font-bold">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Unduh Excel Rekap
            </Button>
          </a>
        </Card>

        <Card className="p-4 bg-white border-slate-200 space-y-2">
          <div className="p-2 w-fit rounded-lg bg-rose-50 text-rose-700">
            <UserX className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Daftar Pemilih TMS</h4>
          <p className="text-[11px] text-slate-500">Daftar warga TMS beserta alasan format Excel (.xlsx).</p>
          <a href="/api/admin/export?type=TMS" download className="block pt-2">
            <Button variant="danger" size="sm" className="w-full text-xs font-bold">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Unduh Excel TMS
            </Button>
          </a>
        </Card>

        <Card className="p-4 bg-white border-slate-200 space-y-2">
          <div className="p-2 w-fit rounded-lg bg-amber-50 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Aduan Masyarakat</h4>
          <p className="text-[11px] text-slate-500">Seluruh berkas tiket laporan aduan warga format Excel.</p>
          <a href="/api/admin/export?type=ADUAN" download className="block pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-bold border-amber-300 text-amber-800 hover:bg-amber-50"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Unduh Excel Aduan
            </Button>
          </a>
        </Card>
      </div>

      {/* Rekap Table */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-slate-900">Rekapitulasi Pemilih Per Tabung Desa Kalisalak</h4>
          <a href="/api/admin/export?type=REKAP" download title="Unduh Tabel Rekapitulasi (.xlsx)">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Ekspor Excel Tabel Ini
            </Button>
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">TABUNG</th>
                <th className="py-2.5 px-3">Lokasi Pemungutan</th>
                <th className="py-2.5 px-3">Laki-laki</th>
                <th className="py-2.5 px-3">Perempuan</th>
                <th className="py-2.5 px-3">Total Pemilih</th>
                <th className="py-2.5 px-3">Kapasitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tpsList.map((t, idx) => {
                const votersInTps = voters.filter(
                  (v) =>
                    v.statusAktif === "AKTIF" &&
                    v.tps.toLowerCase().includes(t.nomorTps.toLowerCase())
                );
                const l = votersInTps.filter((v) => v.jenisKelamin === "L").length;
                const p = votersInTps.filter((v) => v.jenisKelamin === "P").length;
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{t.namaTps.replace(/TPS/gi, "Tabung")}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.lokasi}</td>
                    <td className="py-2.5 px-3 text-slate-800">{l}</td>
                    <td className="py-2.5 px-3 text-slate-800">{p}</td>
                    <td className="py-2.5 px-3 font-bold text-blue-700">{votersInTps.length}</td>
                    <td className="py-2.5 px-3 text-slate-500">{t.kuotaMaksimal} org</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
