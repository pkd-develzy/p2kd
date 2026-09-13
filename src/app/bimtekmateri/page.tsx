"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Search,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Home,
  FileCheck2,
} from "lucide-react";
import { downloadBimtekPdf } from "@/lib/bimtek-pdf-generator";

export default function BimtekMateriPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModuleTab, setActiveModuleTab] = useState<string>("all");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    kit_rompi: true,
    kit_buku: true,
    kit_stiker: true,
    kit_tanda_bukti: true,
    kit_pulpen: true,
    kit_smartphone: true,
    kit_map: true,
  });

  // State Accordion FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecklistDone = useMemo(() => {
    return Object.values(checklist).every(Boolean);
  }, [checklist]);

  // Matrix Status Coklit
  const matrixStatus = [
    {
      kode: "S",
      label: "SESUAI",
      color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      desc: "Seluruh elemen data pemilih pada Model A identik dengan fisik KTP-el dan Kartu Keluarga asli warga.",
    },
    {
      kode: "U",
      label: "UBAH DATA",
      color: "bg-amber-100 text-amber-800 border-amber-300",
      desc: "Terdapat perbedaan data nama, tanggal lahir, status perkawinan, atau perbaikan RT/RW. Coret data lama, tulis perbaikan.",
    },
    {
      kode: "B",
      label: "PEMILIH BARU",
      color: "bg-blue-100 text-blue-800 border-blue-300",
      desc: "Warga yang genap 17 tahun pada hari-H pemungutan suara, pemilih pemula, atau warga baru ber-KTP Kalisalak yang belum ada di daftar.",
    },
    {
      kode: "TMS-1",
      label: "MENINGGAL",
      color: "bg-rose-100 text-rose-800 border-rose-300",
      desc: "Pemilih telah meninggal dunia. Wajib dikonfirmasi oleh keluarga atau Ketua RT setempat / Surat Keterangan Kematian.",
    },
    {
      kode: "TMS-2",
      label: "DATA GANDA",
      color: "bg-rose-100 text-rose-800 border-rose-300",
      desc: "Nama pemilih terdata lebih dari 1 kali di TPS yang sama atau antar TPS lain dalam Desa Kalisalak.",
    },
    {
      kode: "TMS-3",
      label: "DI BAWAH UMUR",
      color: "bg-rose-100 text-rose-800 border-rose-300",
      desc: "Belum genap berusia 17 tahun pada hari pemungutan suara dan belum pernah menikah secara sah.",
    },
    {
      kode: "TMS-4",
      label: "PINDAH DOMISILI",
      color: "bg-rose-100 text-rose-800 border-rose-300",
      desc: "Telah resmi pindah kependudukan ke luar Desa Kalisalak dan telah diterbitkan Surat Keterangan Pindah (SKPWNI).",
    },
    {
      kode: "TMS-5",
      label: "TNI / POLRI",
      color: "bg-rose-100 text-rose-800 border-rose-300",
      desc: "Telah diangkat menjadi anggota aktif Tentara Nasional Indonesia (TNI) atau Kepolisian Negara Republik Indonesia (Polri).",
    },
    {
      kode: "TMS-6",
      label: "BUKAN WARGA",
      color: "bg-rose-100 text-rose-800 border-rose-300",
      desc: "Tinggal berdomisili fisik di Kalisalak namun secara sah ber-KTP luar desa dan tidak memiliki dokumen mutasi kependudukan.",
    },
  ];

  // 13 TPS Table Data
  const tpsList = [
    { no: "01", rw: "RW 01", dusun: "Krajan", rt: "RT 01, RT 02, RT 03", lokasi: "Balai Desa Kalisalak (Halaman Utama)" },
    { no: "02", rw: "RW 02", dusun: "Kalisalak Tengah", rt: "RT 01, RT 02, RT 03", lokasi: "Area Terbuka Rumah Warga RT 02/02" },
    { no: "03", rw: "RW 03", dusun: "Karanganyar", rt: "RT 01, RT 02, RT 03", lokasi: "Halaman Madrasah / Pos RW 03" },
    { no: "04", rw: "RW 04", dusun: "Kalisalak Timur", rt: "RT 01, RT 02, RT 03", lokasi: "Gedung TPQ / Area Terbuka RW 04" },
    { no: "05", rw: "RW 05", dusun: "Kalisalak Barat", rt: "RT 01, RT 02, RT 03", lokasi: "Halaman Musholla RW 05" },
    { no: "06", rw: "RW 06", dusun: "Kalisalak Selatan", rt: "RT 01, RT 02, RT 03", lokasi: "Gedung Serbaguna RW 06" },
    { no: "07", rw: "RW 07", dusun: "Dukuh Anyar", rt: "RT 01, RT 02, RT 03", lokasi: "Halaman Rumah Kadus 07" },
    { no: "08", rw: "RW 08", dusun: "Kebonromo", rt: "RT 01, RT 02, RT 03", lokasi: "Balai Pertemuan / Pos Ronda RW 08" },
    { no: "09", rw: "RW 09", dusun: "Lemah Neundeut", rt: "RT 01, RT 02, RT 03", lokasi: "Area Lapangan Voli RW 09" },
    { no: "10", rw: "RW 10", dusun: "Karangdawa", rt: "RT 01, RT 02, RT 03", lokasi: "Gedung PAUD / Balai Warga RW 10" },
    { no: "11", rw: "RW 11", dusun: "Kalisalak Permai", rt: "RT 01, RT 02, RT 03", lokasi: "Gedung Pertemuan RW 11" },
    { no: "12", rw: "RW 12", dusun: "Wadasmalang", rt: "RT 01, RT 02, RT 03", lokasi: "Area Terbuka Pos RW 12" },
    { no: "13", rw: "RW 13", dusun: "Curugmas", rt: "RT 01, RT 02, RT 03", lokasi: "Balai Dusun Curugmas RW 13" },
  ];

  // FAQ List
  const faqList = [
    {
      q: "Bagaimana jika saat dikunjungi rumah dalam keadaan kosong / seluruh anggota keluarga bekerja?",
      a: "Jangan langsung mencoret atau mengisi status tanpa verifikasi. Tanyakan kepada tetangga atau Ketua RT jadwal warga berada di rumah. Lakukan kunjungan ulang minimal 3 kali pada jam yang berbeda (pagi, sore, atau akhir pekan).",
    },
    {
      q: "Warga ber-KTP Desa Kalisalak tetapi merantau ke Jakarta/luar kota, apakah tetap dicoklit?",
      a: "Ya, selama administrasi kependudukan (KTP dan KK) masih Desa Kalisalak dan tidak memiliki surat pindah resmi, warga tersebut TETAP MEMENUHI SYARAT (MS) dan dicatat melalui anggota keluarga serumah yang dapat ditemui.",
    },
    {
      q: "Ada anak yang saat dicoklit baru berusia 16 tahun, namun saat pemungutan suara sudah genap 17 tahun?",
      a: "Wajib dimasukkan sebagai PEMILIH BARU. Batas penentuan usia 17 tahun adalah tepat pada Hari Pemungutan Suara (Hari-H Pilkades).",
    },
    {
      q: "Ada warga tinggal di Kalisalak puluhan tahun tapi KTP masih desa/kabupaten lain?",
      a: "Sesuai regulasi Pilkades, hak pilih hanya diberikan kepada warga yang sah berdokumen KTP/KK Desa Kalisalak. Warga tersebut berstatus TMS-6 (Bukan Warga) untuk Pilkades Kalisalak, kecuali segera mengurus mutasi masuk ke Disdukcapil sebelum penetapan DPSHP.",
    },
    {
      q: "Bagaimana cara menempelkan stiker jika 1 rumah dihuni oleh 2 atau 3 Kepala Keluarga (KK)?",
      a: "Tempelkan stiker coklit secara terpisah untuk masing-masing KK, atau gunakan 1 stiker dengan mencantumkan seluruh rincian pemilih yang berhak di rumah tersebut.",
    },
    {
      q: "Bagaimana cara login ke portal digital untuk pantarlih?",
      a: "Kunjungi https://www.p2kdkalisalak.my.id/admin. Username adalah nama akhir Anda huruf kecil tanpa spasi (contoh: marufah, farida, yuswanti). Password default adalah 'p2kd2026'.",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 selection:bg-blue-600 selection:text-white pb-20">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 text-sm">
              P2KD
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                Portal Materi Bimbingan Teknis (Bimtek)
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Resmi Pantarlih
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Pilkades Desa Kalisalak 2026/2027 • 13 Wilayah RW
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadBimtekPdf("lengkap")}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              title="Unduh Buku Panduan Bimtek Lengkap (PDF 5 Halaman)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh PDF Lengkap</span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              title="Cetak Halaman"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8 space-y-8">
        {/* HERO BANNER */}
        <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-800/40 p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Dokumen Panduan Teknis Petugas Coklit Lapangan
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Bimbingan Teknis (Bimtek) & Pembekalan Lapangan Pantarlih
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Panduan lengkap tata cara pencocokan dan penelitian (Coklit) pemilih door-to-door,
              pengisian & penempelan stiker coklit, penomoran kode TMS, pemetaan 13 TPS, serta
              penggunaan portal digital P2KD Desa Kalisalak 2026/2027.
            </p>
          </div>

          {/* Direct Download Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => downloadBimtekPdf("lengkap")}
              className="p-4 rounded-2xl bg-blue-600/90 hover:bg-blue-600 border border-blue-400/40 text-left space-y-1 transition-all hover:scale-[1.01] shadow-lg shadow-blue-600/25 group cursor-pointer"
            >
              <div className="flex items-center justify-between text-white">
                <span className="text-xs font-bold uppercase tracking-wider">Modul Resmi Lengkap</span>
                <Download className="w-4 h-4 text-blue-200 group-hover:translate-y-0.5 transition-transform" />
              </div>
              <strong className="block text-sm sm:text-base text-white font-extrabold">
                Buku Panduan Bimtek (PDF 5 Hal)
              </strong>
              <span className="text-[11px] text-blue-200 block">
                Format resmi A4 lengkap kop surat & tanda tangan panitia
              </span>
            </button>

            <button
              type="button"
              onClick={() => downloadBimtekPdf("lembar-saku")}
              className="p-4 rounded-2xl bg-emerald-600/90 hover:bg-emerald-600 border border-emerald-400/40 text-left space-y-1 transition-all hover:scale-[1.01] shadow-lg shadow-emerald-600/25 group cursor-pointer"
            >
              <div className="flex items-center justify-between text-white">
                <span className="text-xs font-bold uppercase tracking-wider">Versi Lapangan</span>
                <Download className="w-4 h-4 text-emerald-200 group-hover:translate-y-0.5 transition-transform" />
              </div>
              <strong className="block text-sm sm:text-base text-white font-extrabold">
                Lembar Saku & Matrix Kode Coklit
              </strong>
              <span className="text-[11px] text-emerald-200 block">
                Ringkasan praktis 2 halaman untuk dibawa saat keliling RT
              </span>
            </button>

            <Link
              href="/admin"
              className="p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-left space-y-1 transition-all hover:scale-[1.01] group cursor-pointer sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-xs font-bold uppercase tracking-wider">Portal Digital</span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <strong className="block text-sm sm:text-base text-white font-extrabold">
                Login Akun Petugas Coklit
              </strong>
              <span className="text-[11px] text-slate-400 block">
                Gunakan username nama akhir & sandi &apos;p2kd2026&apos;
              </span>
            </Link>
          </div>
        </section>

        {/* SEARCH & FILTER BAR */}
        <section className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 backdrop-blur-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci materi: 'meninggal', 'stiker', 'pindah', 'tps 03', 'usia 17'..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveModuleTab("all")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeModuleTab === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Semua Modul
            </button>
            <button
              type="button"
              onClick={() => setActiveModuleTab("sop")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeModuleTab === "sop"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              SOP Coklit
            </button>
            <button
              type="button"
              onClick={() => setActiveModuleTab("kode")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeModuleTab === "kode"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Matrix Kode TMS
            </button>
            <button
              type="button"
              onClick={() => setActiveModuleTab("stiker")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeModuleTab === "stiker"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Stiker Coklit
            </button>
            <button
              type="button"
              onClick={() => setActiveModuleTab("tps")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeModuleTab === "tps"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Tabel 13 TPS
            </button>
          </div>
        </section>

        {/* KELENGKAPAN KIT KERJA PANTARLIH (INTERACTIVE CHECKLIST) */}
        <section className="p-6 rounded-3xl bg-linear-to-br from-slate-900 to-indigo-950/50 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                Checklist Perlengkapan Kerja Pantarlih Sebelum Berangkat
              </h2>
              <p className="text-xs text-slate-400">
                Pastikan seluruh perlengkapan berikut telah lengkap di dalam tas/map kerja Anda setiap hari sebelum turun ke lapangan.
              </p>
            </div>

            <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 w-fit">
              {allChecklistDone ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Siap Turun Lapangan
                </span>
              ) : (
                <span className="text-amber-400">Lengkapi Perlengkapan</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { id: "kit_rompi", label: "Rompi & Tanda Pengenal Resmi P2KD (Wajib Dikenakan)" },
              { id: "kit_buku", label: "Buku Model A-Daftar Pemilih Wilayah RW Tugas" },
              { id: "kit_stiker", label: "Bundel Stiker Coklit Berstempel P2KD" },
              { id: "kit_tanda_bukti", label: "Lembar Formulir Tanda Bukti Pendaftaran Pemilih" },
              { id: "kit_pulpen", label: "Alat Tulis (Ballpoint Tahan Air & Penggaris)" },
              { id: "kit_smartphone", label: "Smartphone Aktif (Koneksi Internet & Baterai Penuh)" },
              { id: "kit_map", label: "Map Plastik Tahan Air Pelindung Berkas" },
            ].map((item) => (
              <label
                key={item.id}
                className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer select-none transition-all ${
                  checklist[item.id]
                    ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                    : "bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(checklist[item.id])}
                  onChange={() => toggleChecklist(item.id)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-600"
                />
                <span className="text-xs font-semibold leading-snug">{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* MODUL 1: LANDASAN HUKUM & KODE ETIK */}
        {(activeModuleTab === "all" || activeModuleTab === "sop") && (
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-black">
                01
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-bold text-white">
                  Landasan Regulasi, Tugas Pokok, & Kode Etik Pantarlih
                </h3>
                <span className="text-xs text-slate-400">
                  Keputusan BPD & Peraturan Perbup Pemilihan Kepala Desa Kabupaten Tegal
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70 space-y-2">
                <strong className="text-blue-300 font-bold block">
                  3 Kewajiban Utama Pantarlih:
                </strong>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                  <li>Melakukan pencocokan data pemilih secara langsung door-to-door (dari rumah ke rumah).</li>
                  <li>Mencatat pemilih baru dan memverifikasi dokumen KTP-el / KK asli.</li>
                  <li>Melaporkan progres rekapitulasi data coklit secara berkala kepada P2KD.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70 space-y-2">
                <strong className="text-rose-300 font-bold block">
                  Larangan Keras Pantarlih (Pakta Integritas):
                </strong>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                  <li>Dilarang menjadi tim sukses, relawan, atau partisan calon Kepala Desa.</li>
                  <li>Dilarang menerima uang, bingkisan, atau fasilitas apapun dari pihak calon.</li>
                  <li>Dilarang membocorkan Nomor Induk Kependudukan (NIK) warga ke pihak ketiga.</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* MODUL 2: SOP LANGKAH KERJA COKLIT LAPANGAN */}
        {(activeModuleTab === "all" || activeModuleTab === "sop") && (
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-black">
                02
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-bold text-white">
                  SOP Standar Kunjungan Rumah ke Rumah (Door-to-Door)
                </h3>
                <span className="text-xs text-slate-400">
                  Tahapan sistematis saat bertemu Kepala Keluarga dan anggota keluarga pemilih
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  step: "Langkah 1",
                  title: "Salam & Identitas",
                  desc: "Ucapkan salam dengan sopan, kenakan rompi & tanda pengenal. Jelaskan maksud kedatangan pemutakhiran data Pilkades Kalisalak.",
                  color: "border-blue-500/40 bg-blue-950/20 text-blue-300",
                },
                {
                  step: "Langkah 2",
                  title: "Pemeriksaan KTP & KK",
                  desc: "Mohon izin memeriksa fisik KTP-el dan Kartu Keluarga (KK) asli. Teliti NIK, nama lengkap, dan status perkawinan setiap warga.",
                  color: "border-indigo-500/40 bg-indigo-950/20 text-indigo-300",
                },
                {
                  step: "Langkah 3",
                  title: "Tandai Form Model A",
                  desc: "Beri kode S (Sesuai), U (Ubah Data), B (Pemilih Baru), atau TMS 1-6 (Tidak Memenuhi Syarat) pada kolom yang disediakan.",
                  color: "border-purple-500/40 bg-purple-950/20 text-purple-300",
                },
                {
                  step: "Langkah 4",
                  title: "Stiker & Bukti Coklit",
                  desc: "Isi stiker coklit lengkap, minta tanda tangan kepala keluarga, tempel di depan rumah, dan serahkan lembar Tanda Bukti Pemilih.",
                  color: "border-emerald-500/40 bg-emerald-950/20 text-emerald-300",
                },
              ].map((s) => (
                <div key={s.step} className={`p-4 rounded-2xl border ${s.color} space-y-1.5`}>
                  <span className="text-[10px] font-black uppercase tracking-wider block opacity-80">
                    {s.step}
                  </span>
                  <strong className="block text-sm font-bold text-white">{s.title}</strong>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MODUL 3: MATRIX 9 KODE STATUS COKLIT */}
        {(activeModuleTab === "all" || activeModuleTab === "kode") && (
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black">
                03
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-bold text-white">
                  Matrix Kode Status Pemilih & Kriteria TMS
                </h3>
                <span className="text-xs text-slate-400">
                  Gunakan kode resmi ini saat mencatat di lembar kerja fisik maupun portal sistem
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {matrixStatus.map((item) => (
                <div
                  key={item.kode}
                  className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-2 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-black text-white">{item.kode}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.color}`}>
                      {item.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MODUL 4: MOCKUP & PANDUAN STIKER COKLIT */}
        {(activeModuleTab === "all" || activeModuleTab === "stiker") && (
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black">
                04
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-bold text-white">
                  Format Resmi & Tata Letak Penempelan Stiker Coklit
                </h3>
                <span className="text-xs text-slate-400">
                  Stiker tanda bukti fisik bahwa rumah warga telah diverifikasi sah oleh Pantarlih
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Visual Mockup Stiker */}
              <div className="lg:col-span-6 bg-linear-to-br from-amber-50 to-orange-50 text-slate-900 p-6 rounded-2xl border-2 border-dashed border-amber-400 shadow-2xl space-y-4 font-sans">
                <div className="text-center pb-2 border-b-2 border-amber-800/30 space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-800 tracking-wider uppercase block">
                    PANITIA PILKADES (P2KD) DESA KALISALAK
                  </span>
                  <strong className="text-sm font-black text-slate-900 block">
                    TANDA BUKTI PENCOCOKAN & PENELITIAN PEMILIH (COKLIT)
                  </strong>
                  <span className="text-[10px] text-slate-600 block">
                    Pemilihan Kepala Desa Kalisalak Periode 2026/2027
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Wilayah Penugasan:</span>
                    <strong>RW 03 / TPS 03</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Rukun Tetangga:</span>
                    <strong>RT 01 / Desa Kalisalak</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-amber-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Nama Kepala Keluarga:</span>
                    <strong className="text-sm text-blue-950">BAPAK AHMAD SUBARKAH</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Jumlah Pemilih Terdaftar:</span>
                    <div className="flex items-center gap-3 text-xs font-bold pt-0.5">
                      <span>L: 2 Orang</span>
                      <span>•</span>
                      <span>P: 2 Orang</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-extrabold">Total: 4 Pemilih</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t-2 border-amber-800/30 flex items-center justify-between text-[11px] text-slate-700">
                  <div className="text-center">
                    <span className="block text-[9px]">Kepala Keluarga,</span>
                    <div className="h-7 flex items-center justify-center font-serif italic text-xs font-bold text-slate-800">
                      [Ttd Warga]
                    </div>
                    <span className="block text-[9px] border-t border-slate-400 px-2">( Ahmad S. )</span>
                  </div>

                  <div className="text-center">
                    <span className="block text-[9px]">Petugas Pantarlih,</span>
                    <div className="h-7 flex items-center justify-center font-serif italic text-xs font-bold text-blue-900">
                      [Ttd Pantarlih]
                    </div>
                    <span className="block text-[9px] border-t border-slate-400 px-2">( Mar&apos;ufah )</span>
                  </div>
                </div>
              </div>

              {/* Ketentuan Penempelan */}
              <div className="lg:col-span-6 space-y-3 text-xs sm:text-sm text-slate-300">
                <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <Home className="w-4 h-4 text-amber-400" />
                  Aturan Penempelan Stiker di Rumah:
                </h4>
                <ul className="space-y-2 list-disc list-inside leading-relaxed text-slate-300">
                  <li>
                    <strong className="text-white">Lokasi Penempelan:</strong> Tempelkan pada daun pintu utama, kusen pintu, atau jendela depan rumah yang mudah terlihat dari luar tanpa merusak cat pemilik rumah.
                  </li>
                  <li>
                    <strong className="text-white">Izin Pemilik Rumah:</strong> Selalu minta izin terlebih dahulu dengan sopan sebelum menempelkan stiker.
                  </li>
                  <li>
                    <strong className="text-white">Kebersihan Permukaan:</strong> Usap debu atau kelembapan pada permukaan sebelum ditempel agar lem stiker merekat kuat dan bertahan hingga hari pencoblosan.
                  </li>
                  <li>
                    <strong className="text-white">Rumah Multi-KK:</strong> Apabila dalam satu rumah terdapat lebih dari satu KK, pasang stiker untuk masing-masing KK secara berjejer rapi.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* MODUL 5: TABEL PEMETAAN 13 RW & 13 TPS */}
        {(activeModuleTab === "all" || activeModuleTab === "tps") && (
          <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center font-black">
                05
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-bold text-white">
                  Tabel Pemetaan Wilayah 13 RW & Tabung TPS Desa Kalisalak
                </h3>
                <span className="text-xs text-slate-400">
                  Setiap RW melayani satu TPS resmi untuk memudahkan akses pencoblosan warga
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                  <tr>
                    <th className="p-3">Tabung TPS</th>
                    <th className="p-3">Wilayah Rukun Warga (RW)</th>
                    <th className="p-3">Dusun / Wilayah</th>
                    <th className="p-3">Rencana Lokasi TPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {tpsList.map((t) => (
                    <tr key={t.no} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-400">TPS {t.no}</td>
                      <td className="p-3 font-bold text-white">{t.rw}</td>
                      <td className="p-3 text-slate-300">{t.dusun}</td>
                      <td className="p-3 text-slate-400">{t.lokasi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* MODUL 6: PENGGUNAAN PORTAL DIGITAL & KREDENSIAL */}
        <section className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-900/50 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center font-black">
              06
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-bold text-white">
                Penggunaan Portal Digital & Kredensial Akun Petugas
              </h3>
              <span className="text-xs text-slate-400">
                Cara login dan sinkronisasi hasil coklit ke server pusat P2KD Kalisalak
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1.5">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">Kredensial Akun</span>
              <strong className="text-white block font-bold text-sm">Username Nama Akhir Anda</strong>
              <p className="text-slate-300 leading-relaxed">
                Username otomatis dibuat dari nama akhir Anda (huruf kecil). Contoh pendaftar MAR&apos;UFAH username adalah <code className="text-sky-300 font-mono font-bold">marufah</code>. Kata sandi awal: <code className="text-sky-300 font-mono font-bold">p2kd2026</code>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1.5">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">Akses Portal</span>
              <strong className="text-white block font-bold text-sm">Dashboard Pantarlih RW</strong>
              <p className="text-slate-300 leading-relaxed">
                Login melalui <Link href="/admin" className="text-blue-400 underline font-bold">/admin</Link> untuk melihat seluruh daftar pemilih di RW tugas Anda, memeriksa status TPS, dan mencari nama pemilih secara instan.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1.5">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">Sinkronisasi Realtime</span>
              <strong className="text-white block font-bold text-sm">Update Progres Harian</strong>
              <p className="text-slate-300 leading-relaxed">
                Hasil kunjungan harian langsung diinput ke portal agar progres rekapitulasi desa terupdate realtime di monitor utama P2KD Kalisalak.
              </p>
            </div>
          </div>
        </section>

        {/* MODUL 7: FAQ & PENANGANAN KASUS KHUSUS */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-black">
              07
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-bold text-white">
                Tanya Jawab (FAQ) & Penanganan Masalah Lapangan
              </h3>
              <span className="text-xs text-slate-400">
                Solusi praktis terhadap situasi tidak terduga saat bertugas di tengah masyarakat
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {faqList.map((f, idx) => (
              <div
                key={f.q}
                className="rounded-2xl border border-slate-800 bg-slate-800/40 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                    {f.q}
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="p-4 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-900/40">
                    <p>{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM DOWNLOAD CTA BANNER */}
        <section className="p-8 rounded-3xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-700/50 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-blue-300">
            <BookOpen className="w-6 h-6" />
          </div>

          <div className="space-y-1 max-w-lg mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Siap Menjalankan Tugas Mulia Pantarlih?
            </h3>
            <p className="text-xs sm:text-sm text-blue-200">
              Unduh salinan PDF buku panduan bimtek dan simpan di ponsel Anda agar dapat dibaca kapan saja saat bertugas di lapangan.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => downloadBimtekPdf("lengkap")}
              className="px-6 py-3 rounded-xl bg-white text-blue-950 font-black text-xs sm:text-sm shadow-xl hover:bg-blue-50 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-900" />
              Unduh Buku Panduan Bimtek (PDF)
            </button>

            <button
              type="button"
              onClick={() => downloadBimtekPdf("lembar-saku")}
              className="px-6 py-3 rounded-xl bg-blue-950/60 hover:bg-blue-950 text-white font-bold text-xs sm:text-sm border border-blue-400/40 flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              Unduh Lembar Saku & Checklist
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-slate-800 text-center py-6 text-xs text-slate-500">
        <p>© 2026/2027 Panitia Pemilihan Kepala Desa (P2KD) Desa Kalisalak • Kecamatan Margasari • Kabupaten Tegal</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Halaman Materi Pelatihan & Bimbingan Teknis Khusus Internal Petugas Pantarlih Terpilih
        </p>
      </footer>
    </div>
  );
}
