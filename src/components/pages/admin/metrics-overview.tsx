"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui";
import { Lock } from "lucide-react";

interface MetricsOverviewProps {
  totalAktif: number;
  totalLaki: number;
  totalPerempuan: number;
  totalTms: number;
  tpsCount: number;
  aduanCount: number;
  aduanPendingCount: number;
  isDptLocked: boolean;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  totalAktif,
  totalLaki,
  totalPerempuan,
  totalTms,
  tpsCount,
  aduanCount,
  aduanPendingCount,
  isDptLocked,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <Card className="p-3.5 bg-white border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
        <span className="text-[11px] font-bold text-slate-500 uppercase">Pemilih Aktif</span>
        <div className="text-2xl font-black text-blue-700 mt-1">{totalAktif}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          L: <strong className="text-slate-800">{totalLaki}</strong> • P:{" "}
          <strong className="text-slate-800">{totalPerempuan}</strong>
        </div>
      </Card>

      <Card className="p-3.5 bg-white border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
        <span className="text-[11px] font-bold text-slate-500 uppercase">Total Pemilih TMS</span>
        <div className="text-2xl font-black text-rose-600 mt-1">{totalTms}</div>
        <div className="text-[10px] text-rose-600/80 mt-0.5">Meninggal / Pindah</div>
      </Card>

      <Card className="p-3.5 bg-white border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
        <span className="text-[11px] font-bold text-slate-500 uppercase">Master Tabung Pemilihan</span>
        <div className="text-2xl font-black text-slate-900 mt-1">{tpsCount}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          {tpsCount > 0 ? `${tpsCount} Tabung Terdaftar` : "Belum Ada Data Tabung"}
        </div>
      </Card>

      <Card className="p-3.5 bg-white border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
        <span className="text-[11px] font-bold text-slate-500 uppercase">Aduan Masuk</span>
        <div className="text-2xl font-black text-amber-600 mt-1">{aduanCount}</div>
        <div className="text-[10px] text-amber-700 mt-0.5">
          {aduanPendingCount > 0 ? (
            <span className="font-bold text-amber-600">{aduanPendingCount} Butuh Verifikasi</span>
          ) : (
            "Semua Terverifikasi"
          )}
        </div>
      </Card>

      <Card className="p-3.5 bg-white border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
        <span className="text-[11px] font-bold text-slate-500 uppercase">Tahapan Pilkades</span>
        <div className="text-xs font-black text-emerald-700 mt-2 truncate">DPSHP & UJI PUBLIK</div>
        <div className="text-[10px] text-emerald-700 mt-0.5">Masa Tanggapan Warga</div>
      </Card>

      <Card className="p-3.5 bg-white border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
        <span className="text-[11px] font-bold text-slate-500 uppercase">Status DPT Final</span>
        <div className="mt-1.5 flex items-center gap-1.5">
          {isDptLocked ? (
            <Badge variant="danger" className="text-[10px]">
              <Lock className="w-3 h-3 mr-1 inline" /> DIKUNCI
            </Badge>
          ) : (
            <Badge variant="warning" className="text-[10px]">
              DRAFT / PROSES
            </Badge>
          )}
        </div>
        <div className="text-[10px] text-slate-500 mt-1 truncate">
          {isDptLocked ? "Segel Kripto Aktif" : "Menunggu Pleno"}
        </div>
      </Card>
    </div>
  );
};
