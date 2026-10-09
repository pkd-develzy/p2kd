"use client";

import React from "react";
import Image from "next/image";
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
  isFieldOfficer?: boolean;
  assignedTps?: string;
  isDptLocked: boolean;
  onOpenChangePassword?: () => void;
  userName?: string;
  userFoto?: string;
}

const tabTitles: Record<
  TabType,
  { title: string; subtitle: string; shortTitle: string }
> = {
  dashboard: {
    title: "Pusat Kendali & Rekapitulasi Eksekutif",
    subtitle:
      "Ringkasan menyeluruh seluruh tahapan, 13 Tabung Pemilihan, data calon, dan kesiapan Pilkades Kalisalak 2027",
    shortTitle: "Pusat Kendali",
  },
  anggota: {
    title: "Manajemen Anggota P2KD & Akun Petugas",
    subtitle:
      "Struktur kepanitiaan, hak akses, SK penetapan, dan cetak kartu tanda pengenal (ID Card)",
    shortTitle: "Anggota & Akun",
  },
  coklit: {
    title: "Pemutakhiran Data Pemilih (Koordinator RW)",
    subtitle:
      "Pencocokan, penelitian, dan pemutakhiran faktual pemilih door-to-door per lingkungan RW",
    shortTitle: "Pemutakhiran Coklit",
  },
  pemilih: {
    title: "1.1 Calon DPS (Data Pemilih Saat Ini)",
    subtitle:
      "Runtutan pemutakhiran data: Calon DPS → DPS → DPSHP → DPSHP Akhir → DPT",
    shortTitle: "1.1 Calon DPS",
  },
  dpt: {
    title: "1.2 Daftar Pemilih Tetap (DPT)",
    subtitle:
      "Daftar pemilih sah yang telah lolos verifikasi dan siap disahkan pada Sidang Pleno",
    shortTitle: "1.2 DPT Tetap",
  },
  akun: {
    title: "Profil & Keamanan Akun Petugas",
    subtitle:
      "Informasi identitas penugasan, pembaruan foto profil, dan pengaturan kata sandi",
    shortTitle: "Akun Petugas",
  },
  tps: {
    title: "13 Wilayah Tabung (RW)",
    subtitle:
      "Manajemen pembagian 13 Tabung Pemilihan berbasis Wilayah RW Pilkades Kalisalak",
    shortTitle: "Wilayah Tabung RW",
  },
  aduan: {
    title: "Aduan & Masukan Masyarakat",
    subtitle:
      "Verifikasi tanggapan warga & sinkronisasi data master pemilih",
    shortTitle: "Aduan Warga",
  },
  print: {
    title: "Seksi Perlengkapan: Pusat Cetak Dokumen Resmi",
    subtitle:
      "Cetak Berita Acara Pleno, Lembar DPT Model A, Form C6 & Stiker Coklit",
    shortTitle: "Cetak Dokumen",
  },
  lock: {
    title: "Finalisasi & Segel DPT Pleno",
    subtitle: "Berita Acara Pleno DPT Pilkades Kalisalak 2026",
    shortTitle: "Segel DPT Pleno",
  },
  export: {
    title: "Buku Induk & Rekapitulasi Excel",
    subtitle: "Ekspor seluruh lembar kerja ke format Microsoft Excel (.xlsx)",
    shortTitle: "Ekspor Excel",
  },
  audit: {
    title: "Audit Trail & Keamanan Sistem",
    subtitle: "Catatan transaksi, waktu, user, dan alamat IP",
    shortTitle: "Audit Log",
  },
  pengaturan_web: {
    title: "Pengaturan Website Publik & Lokasi Lapangan",
    subtitle:
      "Kendali konfigurasi lokasi terpusat, pengumuman running text, dan sakelar visibilitas fitur publik",
    shortTitle: "Pengaturan Web",
  },
  petugas_dpt: {
    title: "Pendaftaran Petugas Pendataan DPT",
    subtitle:
      "Penerimaan berkas, uji integritas netralitas, verifikasi tanda tangan digital, dan penetapan wilayah penugasan Pantarlih",
    shortTitle: "Petugas Pendataan",
  },
  calon: {
    title: "Manajemen Calon & Pendaftar Kepala Desa",
    subtitle:
      "Pengaturan nomor urut resmi, foto profil, visi-misi, program kerja unggulan, dan status tampil di website publik",
    shortTitle: "Calon Kades",
  },
  berita: {
    title: "Manajemen Berita & Publikasi",
    subtitle:
      "CMS Penulisan & Publikasi Berita Warga, Liputan Kegiatan P2KD, dan Rilis Pers Resmi",
    shortTitle: "Berita Warga",
  },
};

export const AdminHeader: React.FC<HeaderProps> = ({
  activeTab,
  onOpenSidebar,
  onRefresh,
  isLoading,
  dbStatus,
  isAdmin,
  isFieldOfficer = false,
  assignedTps = "SEMUA",
  isDptLocked,
  onOpenChangePassword,
  userFoto,
}) => {
  const current = tabTitles[activeTab] || tabTitles.pemilih;
  const rwBadgeText = assignedTps.startsWith("RW")
    ? assignedTps
    : `RW ${(assignedTps || "").replace(/\D/g, "") || "01"}`;

  return (
    <header className="sticky top-0 z-30 bg-white/95 border-b border-slate-200/90 shadow-2xs backdrop-blur-xl w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
        {/* ========================================================= */}
        {/* MODE A: HEADER NATIVE APK KHUSUS PETUGAS LAPANGAN         */}
        {/* ========================================================= */}
        {isFieldOfficer ? (
          <>
            {/* Left Side: Logo Resmi & Brand Title Premium */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="relative shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-linear-to-b from-slate-900 via-blue-950 to-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shadow-md">
                <Image
                  src="/logo-v2.png"
                  alt="Logo Resmi P2KD Desa Kalisalak"
                  width={34}
                  height={34}
                  className="object-contain w-full h-full drop-shadow-sm"
                  priority
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black tracking-wider uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200/70">
                    P2KD KALISALAK
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 font-bold hidden xs:inline">
                    PANTARLIH
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate mt-0.5">
                  {current.title}
                </h1>
              </div>
            </div>

            {/* Right Side: Badge Penugasan RW & Status Online (Tanpa tombol reload / kunci) */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono font-black tracking-tight uppercase text-emerald-300">
                  {rwBadgeText}
                </span>
              </div>

              {userFoto && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-2xs shrink-0 hidden sm:block">
                  <Image
                    src={userFoto}
                    alt="Foto Profil"
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          /* ========================================================= */
          /* MODE B: HEADER DESKTOP / SUPERADMIN                       */
          /* ========================================================= */
          <>
            {/* Left Side */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={onOpenSidebar}
                className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                title="Menu Navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                    {current.title}
                  </h1>
                  <Badge
                    variant={isAdmin ? "primary" : "success"}
                    className="hidden sm:inline-flex text-[10px] shrink-0"
                  >
                    {isAdmin ? "SUPERADMIN" : `PANTARLIH ${assignedTps}`}
                  </Badge>
                  {isDptLocked && activeTab === "lock" && (
                    <Badge variant="danger" className="text-[10px] shrink-0">
                      <Lock className="w-3 h-3 mr-1 inline" /> DIKUNCI
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                  {current.subtitle}
                </p>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* DB Indicator Pill */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                <span
                  className={`w-2 h-2 rounded-full ${
                    dbStatus === null || (isLoading && !dbStatus)
                      ? "bg-blue-500 animate-pulse"
                      : dbStatus?.connected
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-amber-500"
                  }`}
                />
                <span>
                  {dbStatus === null || (isLoading && !dbStatus)
                    ? "Menghubungkan server..."
                    : dbStatus?.connected
                    ? `Terhubung ke server (${dbStatus.latencyMs ?? 35}ms)`
                    : "Offline (Local Sync Store)"}
                </span>
              </div>

              <button
                onClick={onRefresh}
                title="Segarkan Data"
                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`}
                />
              </button>

              {onOpenChangePassword && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOpenChangePassword}
                  title="Ganti Kata Sandi Akun"
                  className="text-xs border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 shrink-0 px-2 sm:px-3 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 sm:mr-1 text-amber-600" />
                  <span className="hidden md:inline">Ganti Sandi</span>
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
