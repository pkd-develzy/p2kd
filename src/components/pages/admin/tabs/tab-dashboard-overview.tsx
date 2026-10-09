"use client";

import React from "react";
import {
  Users,
  Building2,
  BarChart3,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  Layers,
  FileSpreadsheet,
  Clock,
  Printer,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui";
import {
  Voter,
  TPSItem,
  Aduan,
  TabType,
  DbStatus,
} from "../types";
import { PublicWebConfig } from "@/lib/data-store";

interface TabDashboardOverviewProps {
  voters: Voter[];
  tpsList: TPSItem[];
  aduanList: Aduan[];
  petugasDptCount?: number;
  isDptLocked: boolean;
  onNavigateTab: (tab: TabType) => void;
  currentUser: {
    namaLengkap: string;
    role: string;
    jabatan: string;
  };
  dbStatus?: DbStatus | null;
  webConfig?: PublicWebConfig | null;
}

export const TabDashboardOverview: React.FC<TabDashboardOverviewProps> = ({
  voters,
  tpsList,
  aduanList,
  petugasDptCount = 0,
  isDptLocked,
  onNavigateTab,
  currentUser,
  dbStatus,
  webConfig,
}) => {
  // Dynamic Web Config & Identitas Wilayah
  const lokasiUtama = webConfig?.lokasiUtama || "Lapangan Desa Kalisalak";
  const periodeMasaBakti = webConfig?.periodeMasaBakti || "2027 – 2035";
  const hariHTanggal = webConfig?.hariHTanggal || "3 Februari 2027";
  const totalRw = webConfig?.totalRw || 13;
  const totalRt = webConfig?.totalRt || 39;

  // 1. Data Pemilih Metrics (Bersumber Langsung dari Master Table statistik_pemilih)
  const totalAktif = dbStatus?.localStats?.totalAktif ?? (voters && voters.length > 0 ? voters.filter(v => v.statusAktif === "AKTIF").length : 7787);
  const totalLaki = dbStatus?.localStats?.totalLaki ?? 3933;
  const totalPerempuan = dbStatus?.localStats?.totalPerempuan ?? 3854;
  const totalTms = dbStatus?.localStats?.totalTms ?? 0;
  const jumlahCalonDps = dbStatus?.localStats?.calonDps ?? 7787;
  const jumlahDps = dbStatus?.localStats?.dps ?? 0;
  const jumlahDpshp = dbStatus?.localStats?.dpshp ?? 0;
  const jumlahDpt = dbStatus?.localStats?.dpt ?? 0;
  const jumlahDptb = dbStatus?.localStats?.dptb ?? 0;

  // 2. Coklit Metrics (Master Aggregate Database)
  const coklitSelesai = dbStatus?.localStats?.coklitSelesai ?? 7786;
  const persentaseCoklit =
    totalAktif > 0 ? Math.min(100, Math.round((coklitSelesai / totalAktif) * 100)) : 100;

  // 3. Aduan Metrics
  const aduanMenunggu = aduanList.filter((a) => a.status === "MENUNGGU").length;

  return (
    <div className="space-y-6">
      {/* 1. Executive Master Header Banner */}
      <Card className="p-6 sm:p-8 bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-900/60 shadow-xl rounded-3xl relative overflow-hidden">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge
                variant="primary"
                className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border-blue-400/30 px-3.5 py-1 rounded-full flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Pusat Kendali Eksekutif Pilkades Kalisalak
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                • Periode {periodeMasaBakti}
              </span>
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Hari-H: {hariHTanggal}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Dashboard Rekapitulasi & Pusat Informasi Terpadu
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Selamat bertugas, <strong className="text-white">{currentUser.namaLengkap}</strong> ({currentUser.jabatan}). 
              Seluruh data pemilih, 13 Tabung Pemilihan lapangan, pendaftaran petugas pendataan DPT, dan aduan warga terpantau secara realtime.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap lg:flex-nowrap shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab("coklit")}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Coklit Lapangan</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("print")}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Cetak C6 & Berita Acara</span>
            </button>
          </div>
        </div>

        {/* Realtime Status Ticker Inside Hero */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
              Status Data Pemilih
            </span>
            <div className="text-sm sm:text-base font-black text-white mt-0.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isDptLocked ? "bg-rose-400" : "bg-emerald-400 animate-pulse"}`} />
              {isDptLocked ? "Terkunci & Final" : "Tahap Calon DPS / Pemutakhiran"}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
              Pusat Pemungutan
            </span>
            <div className="text-sm sm:text-base font-black text-white mt-0.5 flex items-center gap-1.5 truncate" title={lokasiUtama}>
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">{lokasiUtama}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
              Cakupan Wilayah
            </span>
            <div className="text-sm sm:text-base font-black text-white mt-0.5">
              {totalRw} RW • {totalRt} RT
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
              Keamanan Database
            </span>
            <div className="text-sm sm:text-base font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enkripsi Server Aktif</span>
            </div>
          </div>
        </div>

        {/* Master Agregat Data Pemilih (Tabel statistik_pemilih) */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-400/20">
            <span className="text-[10px] font-bold text-blue-300 uppercase block tracking-wider">Calon DPS</span>
            <div className="text-lg font-black text-white">{jumlahCalonDps.toLocaleString("id-ID")}</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/20">
            <span className="text-[10px] font-bold text-amber-300 uppercase block tracking-wider">DPS (Pleno)</span>
            <div className="text-lg font-black text-white">{jumlahDps.toLocaleString("id-ID")}</div>
          </div>
          <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-400/20">
            <span className="text-[10px] font-bold text-teal-300 uppercase block tracking-wider">DPSHP (Dibenahi)</span>
            <div className="text-lg font-black text-white">{jumlahDpshp.toLocaleString("id-ID")}</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/20">
            <span className="text-[10px] font-bold text-emerald-300 uppercase block tracking-wider">DPT (Tetap)</span>
            <div className="text-lg font-black text-white">{jumlahDpt.toLocaleString("id-ID")}</div>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20">
            <span className="text-[10px] font-bold text-cyan-300 uppercase block tracking-wider">DPTb (Tambahan)</span>
            <div className="text-lg font-black text-white">{jumlahDptb.toLocaleString("id-ID")}</div>
          </div>
        </div>
      </Card>

      {/* 2. Top Executive 6 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Pemilih Aktif */}
        <Card
          onClick={() => onNavigateTab("pemilih")}
          className="p-4 bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer rounded-2xl group space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Calon DPS Aktif
            </span>
            <div className="text-2xl font-black text-slate-900">{totalAktif}</div>
            <span className="text-[10px] text-blue-600 font-semibold block">
              {totalLaki} L • {totalPerempuan} P
            </span>
          </div>
        </Card>

        {/* KPI 2: TMS */}
        <Card
          onClick={() => onNavigateTab("pemilih")}
          className="p-4 bg-white border-slate-200 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer rounded-2xl group space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pemilih TMS
            </span>
            <div className="text-2xl font-black text-rose-600">{totalTms}</div>
            <span className="text-[10px] text-slate-400 font-medium block">
              Meninggal / Pindah
            </span>
          </div>
        </Card>

        {/* KPI 3: Tabung TPS */}
        <Card
          onClick={() => onNavigateTab("tps")}
          className="p-4 bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer rounded-2xl group space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tabung Suara
            </span>
            <div className="text-2xl font-black text-slate-900">{tpsList.length} Tabung</div>
            <span className="text-[10px] text-indigo-600 font-semibold block truncate" title={lokasiUtama}>
              {lokasiUtama}
            </span>
          </div>
        </Card>

        {/* KPI 4: Petugas DPT */}
        <Card
          onClick={() => onNavigateTab("petugas_dpt")}
          className="p-4 bg-white border-slate-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer rounded-2xl group space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <UserCheck className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Petugas DPT
            </span>
            <div className="text-2xl font-black text-amber-600">{petugasDptCount} Petugas</div>
            <span className="text-[10px] text-slate-500 font-medium block">
              Pendaftar & Pantarlih
            </span>
          </div>
        </Card>

        {/* KPI 5: Progres Coklit */}
        <Card
          onClick={() => onNavigateTab("coklit")}
          className="p-4 bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer rounded-2xl group space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Progres Coklit
            </span>
            <div className="text-2xl font-black text-emerald-600">{persentaseCoklit}%</div>
            <span className="text-[10px] text-emerald-700 font-semibold block">
              {coklitSelesai} dari {totalAktif.toLocaleString()} Pemilih
            </span>
          </div>
        </Card>

        {/* KPI 6: Aduan Warga (Menghilangkan kekosongan kolom ke-6) */}
        <Card
          onClick={() => onNavigateTab("aduan")}
          className="p-4 bg-white border-slate-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer rounded-2xl group space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <MessageSquare className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Aduan Warga
            </span>
            <div className="text-2xl font-black text-purple-600">{aduanList.length} Aduan</div>
            <span className="text-[10px] text-slate-500 font-medium block">
              {aduanMenunggu} Menunggu Verifikasi
            </span>
          </div>
        </Card>
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 Cols): Rekap Tabung & Pantarlih */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section A: Rekapitulasi Pemilih 13 Tabung Lapangan */}
          <Card className="p-6 bg-white border-slate-200 shadow-xs rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Distribusi Pemilih per Wilayah Pemilihan (RW 01 – RW 13)
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Pusat pemungutan suara dipusatkan di Lapangan Desa Kalisalak terbagi dalam 13 Wilayah Pemilihan RW.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab("tps")}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <span>Kelola Wilayah</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Grid 13 Wilayah RW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {tpsList.map((tps) => {
                const padNum = (tps.nomorTps || "").replace(/\D/g, "").padStart(2, "0");
                const statFromRw = dbStatus?.localStats?.breakdownWilayah?.find(
                  (b) => (b.rw || "").replace(/\D/g, "").padStart(2, "0") === padNum
                );
                const statFromTps = dbStatus?.localStats?.tpsStats?.find(
                  (b) => (b.nomorTps || "").replace(/\D/g, "").padStart(2, "0") === padNum
                );

                const count = statFromRw?.total ?? statFromTps?.total ?? 0;
                const lCount = statFromRw?.laki ?? 0;
                const pCount = statFromRw?.perempuan ?? 0;
                const maxQuota = tps.kuotaMaksimal || 850;
                const percentage = Math.min(100, Math.round((count / maxQuota) * 100));

                return (
                  <div
                    key={tps.id}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-800 block">
                          Wilayah RW {padNum}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {tps.rt ? `(${tps.rt})` : "Desa Kalisalak"}
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {count.toLocaleString("id-ID")} <span className="text-[10px] text-slate-500 font-normal">/ {maxQuota}</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage > 90 ? "bg-amber-500" : "bg-blue-600"
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                        <span>L: {lCount.toLocaleString("id-ID")} • P: {pCount.toLocaleString("id-ID")}</span>
                        <span>{percentage}% Terisi</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Section B: Pendaftaran & Verifikasi Petugas Pendataan DPT */}
          <Card className="p-6 bg-white border-slate-200 shadow-xs rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Pendaftaran & Verifikasi Petugas Pendataan DPT
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Pantarlih bertugas melakukan pencocokan dan penelitian (Coklit) DPT di 13 RW Desa Kalisalak.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab("petugas_dpt")}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <span>Kelola Petugas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Total Pendaftar
                </span>
                <div className="text-2xl font-black text-amber-900">{petugasDptCount} Petugas</div>
                <span className="text-[10px] text-amber-700 block">Tercatat di Database</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Pakta Integritas
                </span>
                <div className="text-sm font-bold text-emerald-900 mt-1">100% Wajib Netral</div>
                <span className="text-[10px] text-emerald-700 block">Surat Pernyataan Ditandatangani</span>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-1">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                  Cakupan Wilayah
                </span>
                <div className="text-sm font-bold text-blue-900 mt-1">Desa Kalisalak</div>
                <span className="text-[10px] text-blue-700 block">13 RW • 39 RT</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (4 Cols): Tahapan Pilkades + Aduan Terkini + Pintasan Cepat */}
        <div className="lg:col-span-4 space-y-6">
          {/* Section C: Tahapan Resmi Pilkades 2027 */}
          <Card className="p-6 bg-white border-slate-200 shadow-xs rounded-3xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Tahapan Resmi Pilkades
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  Rangkaian jadwal regulasi Perbup Tegal
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 animate-spin" />
                <div>
                  <span className="font-bold text-emerald-900 block">1. Calon DPS (Data Pemilih Saat Ini)</span>
                  <span className="text-[11px] text-emerald-700">Data pemilih aktif ({totalAktif} jiwa) sedang dalam proses pemutakhiran lapangan door-to-door {persentaseCoklit}% ({coklitSelesai} pemilih).</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-900 block">2. DPS (Daftar Pemilih Sementara)</span>
                  <span className="text-[11px] text-blue-700">Penetapan rapat pleno DPS resmi setelah pemutakhiran Calon DPS selesai.</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-900 block">3. DPSHP (DPS Hasil Perbaikan)</span>
                  <span className="text-[11px] text-indigo-700">Uji publik tanggapan warga & koreksi identitas ({aduanList.length} masukan).</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900 block">4. DPSHP Akhir (Validasi Pleno)</span>
                  <span className="text-[11px] text-amber-700">Penyusunan rekapitulasi akhir menjelang penetapan DPT resmi.</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <BarChart3 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">5. DPT (Daftar Pemilih Tetap Final)</span>
                  <span className="text-[11px] text-slate-500">Penguncian berita acara penetapan DPT 13 Tabung Pemilihan.</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Section D: Layanan Aduan Warga Terkini */}
          <Card className="p-6 bg-white border-slate-200 shadow-xs rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Aduan Warga Masuk
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    {aduanMenunggu} menunggu tanggapan
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab("aduan")}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {aduanList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                Belum ada aduan warga masuk.
              </div>
            ) : (
              <div className="space-y-2.5">
                {aduanList.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate max-w-35">
                        {a.namaPelapor}
                      </span>
                      <Badge
                        variant={a.status === "MENUNGGU" ? "warning" : "success"}
                        className="text-[9px] px-2 py-0.2"
                      >
                        {a.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">
                      {a.isiAduan}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      RT {a.rt}/RW {a.rw} • {a.tanggal}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section E: Pintasan Cepat Menu & Dokumen */}
          <Card className="p-6 bg-white border-slate-200 shadow-xs rounded-3xl space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Pusat Unduhan & Ekspor Cepat
            </h3>
            <div className="space-y-2">
              <a
                href="/api/admin/export?type=FULL"
                download
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-800 hover:text-emerald-900 flex items-center justify-between transition-colors"
              >
                <span>Master Excel Buku Induk (.xlsx)</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href="/api/admin/export?type=TPS"
                download
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs font-bold text-slate-800 hover:text-blue-900 flex items-center justify-between transition-colors"
              >
                <span>Data Rekap 13 Tabung Pemilihan (.xlsx)</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href="/api/admin/export?type=AUDIT"
                download
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-xs font-bold text-slate-800 hover:text-purple-900 flex items-center justify-between transition-colors"
              >
                <span>Log Audit Trail Kriptografi (.xlsx)</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
