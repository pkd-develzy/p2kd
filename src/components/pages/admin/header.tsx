"use client";

import React from "react";
import { Menu, RefreshCw, Lock, KeyRound } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { TabType, DbStatus } from "./types";

interface HeaderProps {
  activeTab: TabType;
  onOpenSidebar: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  dbStatus: DbStatus | null;
  isAdmin: boolean;
  assignedTps?: string;
  isDptLocked: boolean;
  onOpenChangePassword?: () => void;
}

const tabTitles: Record<TabType, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Pusat Kendali & Rekapitulasi Eksekutif",
    subtitle: "Ringkasan menyeluruh seluruh tahapan, 13 Tabung Pemilihan, data calon, dan kesiapan Pilkades Kalisalak 2027",
  },
  anggota: {
    title: "Manajemen Anggota P2KD & Akun Petugas",
    subtitle: "Struktur kepanitiaan, hak akses, SK penetapan, dan cetak kartu tanda pengenal (ID Card)",
  },
  coklit: {
    title: "Coklit Lapangan (Koordinator RW)",
    subtitle: "Pencocokan, penelitian, dan verifikasi faktual pemilih door-to-door per RW",
  },
  pemilih: {
    title: "1.1 Daftar Pemilih Sementara (DPS)",
    subtitle: "Pemutakhiran, verifikasi faktual warga, dan promosi data pemilih masuk ke DPT",
  },
  dpt: {
    title: "1.2 Daftar Pemilih Tetap (DPT)",
    subtitle: "Daftar pemilih sah yang telah lolos verifikasi dan siap disahkan pada Sidang Pleno",
  },
  tps: {
    title: "13 Wilayah Tabung (RW)",
    subtitle: "Manajemen pembagian 13 Tabung Pemilihan berbasis Wilayah RW Pilkades Kalisalak",
  },
  aduan: {
    title: "Aduan & Masukan Masyarakat",
    subtitle: "Verifikasi tanggapan warga & sinkronisasi data master pemilih",
  },
  print: {
    title: "Seksi Perlengkapan: Pusat Cetak Dokumen Resmi",
    subtitle: "Cetak Berita Acara Pleno, Lembar DPT Model A, Form C6 & Stiker Coklit",
  },
  lock: {
    title: "Finalisasi & Segel DPT Pleno",
    subtitle: "Berita Acara Pleno DPT Pilkades Kalisalak 2026",
  },
  export: {
    title: "Buku Induk & Rekapitulasi Excel",
    subtitle: "Ekspor seluruh lembar kerja ke format Microsoft Excel (.xlsx)",
  },
  audit: {
    title: "Audit Trail & Keamanan Sistem",
    subtitle: "Catatan transaksi, waktu, user, dan alamat IP",
  },
  pengaturan_web: {
    title: "Pengaturan Website Publik & Lokasi Lapangan",
    subtitle: "Kendali konfigurasi lokasi terpusat, pengumuman running text, dan sakelar visibilitas fitur publik",
  },
  petugas_dpt: {
    title: "Pendaftaran Petugas Pendataan DPT",
    subtitle: "Penerimaan berkas, uji integritas netralitas, verifikasi tanda tangan digital, dan penetapan wilayah penugasan Pantarlih",
  },
  calon: {
    title: "Manajemen Calon & Pendaftar Kepala Desa",
    subtitle: "Pengaturan nomor urut resmi, foto profil, visi-misi, program kerja unggulan, dan status tampil di website publik",
  },
  berita: {
    title: "Manajemen Berita & Publikasi",
    subtitle: "CMS Penulisan & Publikasi Berita Warga, Liputan Kegiatan P2KD, dan Rilis Pers Resmi",
  },
};

export const AdminHeader: React.FC<HeaderProps> = ({
  activeTab,
  onOpenSidebar,
  onRefresh,
  isLoading,
  dbStatus,
  isAdmin,
  assignedTps = "SEMUA",
  isDptLocked,
  onOpenChangePassword,
}) => {
  const current = tabTitles[activeTab] || tabTitles.pemilih;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                {current.title}
              </h1>
              <Badge variant={isAdmin ? "primary" : "success"} className="hidden sm:inline-flex text-[10px]">
                {isAdmin ? "SUPERADMIN" : `PANTARLIH ${assignedTps}`}
              </Badge>
              {isDptLocked && activeTab === "lock" && (
                <Badge variant="danger" className="text-[10px]">
                  <Lock className="w-3 h-3 mr-1 inline" /> DIKUNCI
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* DB Indicator Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 border border-slate-200 text-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${dbStatus?.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
            />
            <span>
              {dbStatus?.connected
                ? `Terhubung ke server (${dbStatus.latencyMs}ms)`
                : "Offline (Local Sync Store)"}
            </span>
          </div>

          <button
            onClick={onRefresh}
            title="Segarkan Data"
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>

          {onOpenChangePassword && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenChangePassword}
              title="Ganti Kata Sandi Akun"
              className="text-xs border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300"
            >
              <KeyRound className="w-3.5 h-3.5 sm:mr-1 text-amber-600" />
              <span className="hidden md:inline">Ganti Sandi</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
