"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  Check,
  MapPin,
  Clock,
  Sparkles,
  Camera,
  Download,
  Printer,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Lock,
  ExternalLink,
  HelpCircle,
  CheckSquare,
  KeyRound,
} from "lucide-react";
import { downloadBimtekPdf } from "@/lib/bimtek-pdf-generator";

export default function BimtekMateriPage() {
  // Demo Interactive State untuk Simulasi Coklit Langsung di Materi Bimtek
  const [demoStatus, setDemoStatus] = useState<"BELUM" | "SESUAI" | "UBAH_DATA" | "TMS">("BELUM");
  const [demoTmsReason, setDemoTmsReason] = useState<string>("MENINGGAL");
  const [showTmsModal, setShowTmsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [demoName, setDemoName] = useState("SLAMET RIYADI");
  const demoNik = "3328011508920003";
  const [demoAlamat, setDemoAlamat] = useState("RT 02 / RW 03");

  // State Checklist Persiapan Lapangan
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    hp_baterai: true,
    kuota_internet: true,
    login_berhasil: true,
    cek_dps_rw: true,
    ballpoint_cadangan: true,
    tanda_pengenal: true,
  });

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // State Accordion FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // 6 Alasan Resmi TMS di Sistem Database P2KD
  const tmsCategories = [
    {
      id: "MENINGGAL",
      title: "1. Meninggal Dunia",
      desc: "Warga telah meninggal dunia. Wajib dikonfirmasi oleh keluarga atau Ketua RT setempat / Surat Kematian Desa.",
      bukti: "Surat Kematian Desa / Surat Rumah Sakit / Keterangan Ahli Waris",
      badge: "TMS-1",
    },
    {
      id: "GANDA",
      title: "2. Data Ganda",
      desc: "NIK atau Nama warga terdaftar lebih dari satu kali di dalam database pemilih desa Kalisalak.",
      bukti: "Pengecekan NIK kembar pada sistem DPS",
      badge: "TMS-2",
    },
    {
      id: "PINDAH_DOMISILI",
      title: "3. Pindah Domisili Keluar Desa",
      desc: "Warga telah resmi pindah kependudukan ke luar Desa Kalisalak dan telah diterbitkan surat pindah (SKPWNI).",
      bukti: "Surat Keterangan Pindah WNI / KTP & KK baru luar desa",
      badge: "TMS-3",
    },
    {
      id: "DI_BAWAH_UMUR",
      title: "4. Di Bawah Umur / Bukan Pemilih",
      desc: "Belum genap berusia 17 tahun pada hari pemungutan suara dan belum pernah melangsungkan perkawinan.",
      bukti: "Tanggal lahir pada Akta Kelahiran / Kartu Keluarga",
      badge: "TMS-4",
    },
    {
      id: "TNI_POLRI",
      title: "5. Menjadi Anggota TNI / POLRI",
      desc: "Warga telah diangkat menjadi prajurit aktif Tentara Nasional Indonesia atau anggota Kepolisian RI.",
      bukti: "Kartu Tanda Anggota (KTA) TNI/Polri / Keterangan Keluarga",
      badge: "TMS-5",
    },
    {
      id: "BUKAN_WARGA",
      title: "6. Bukan Warga Desa Kalisalak",
      desc: "Tinggal fisik di desa namun secara administrasi kependudukan ber-KTP luar desa tanpa mutasi resmi.",
      bukti: "KTP-el beralamat luar wilayah administratif Desa Kalisalak",
      badge: "TMS-6",
    },
  ];

  // Pemetaan 13 Tabung & 13 RW
  const pemetaanTps = [
    { tps: "Tabung 01", rw: "Wilayah RW 01", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 02", rw: "Wilayah RW 02", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 03", rw: "Wilayah RW 03", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 04", rw: "Wilayah RW 04", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 05", rw: "Wilayah RW 05", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 06", rw: "Wilayah RW 06", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 07", rw: "Wilayah RW 07", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 08", rw: "Wilayah RW 08", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 09", rw: "Wilayah RW 09", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 10", rw: "Wilayah RW 10", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 11", rw: "Wilayah RW 11", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 12", rw: "Wilayah RW 12", rt: "RT 01, RT 02, RT 03" },
    { tps: "Tabung 13", rw: "Wilayah RW 13", rt: "RT 01, RT 02, RT 03" },
  ];

  // FAQ Penanganan Lapangan
  const faqs = [
    {
      q: "Apa fungsi utama dibuatkannya sistem website DPS/DPT ini bagi saya sebagai petugas?",
      a: "Sistem website ini diciptakan sebagai ALAT KERJA UTAMA Anda di smartphone. Anda tidak perlu lagi membawa tumpukan map tebal berisi lembaran kertas Model A yang merepotkan dan rawan tercecer. Cukup bawa HP, buka website di depan rumah warga, verifikasi dengan 1 kali sentuhan (1-Tap), dan data langsung tersimpan aman ke cloud server P2KD secara otomatis.",
    },
    {
      q: "Bagaimana jika sinyal internet di rumah warga yang saya datangi sangat lambat atau hilang?",
      a: "Tenang, jangan panik! Halaman Tab Coklit RW yang sudah Anda buka di browser HP tetap menyimpan daftar nama warga. Catat sementara nama-nama yang telah Anda temui di buku saku. Begitu Anda sampai di area yang memiliki sinyal baik (atau saat kembali ke rumah), Anda tinggal membuka kembali website dan menekan tombol 'Sesuai' atau 'Ubah Data' untuk warga-warga tersebut.",
    },
    {
      q: "Bagaimana jika saya tidak sengaja salah menekan tombol 'Sesuai' padahal orangnya sudah meninggal (TMS)?",
      a: "Sistem P2KD sangat fleksibel dan aman. Pada kartu pemilih yang sudah diberi status, akan muncul tombol 'Reset / Batal' dengan ikon putar balik. Cukup tekan tombol tersebut, maka status pemilih akan kembali menjadi 'Belum Coklit', lalu Anda bisa menekan tombol 'TMS' yang benar.",
    },
    {
      q: "Apakah warga yang sedang merantau ke luar kota (Jakarta/Surabaya) harus ditandai TMS?",
      a: "TIDAK. Selama warga tersebut masih ber-KTP atau ber-Kartu Keluarga Desa Kalisalak dan belum menerbitkan surat pindah resmi (SKPWNI), hak pilihnya tetap SAH. Tanyakan dan cocokkan dokumen KTP/KK kepada anggota keluarga yang berada di rumah saat Anda berkunjung, lalu tandai 'SESUAI'.",
    },
    {
      q: "Bagaimana jika saya menemukan warga baru usia 17 tahun yang belum ada di daftar pemilih sistem?",
      a: "Klik tombol biru '+ Temuan Baru' di kanan atas layar ponsel Anda. Masukkan 16 digit NIK, No KK, Nama Lengkap, Tempat & Tanggal Lahir, Jenis Kelamin, serta alamat RT/RW. Sistem otomatis menetapkan Tabung Pemilihan dan memasukkannya ke dalam daftar pemilih RW Anda.",
    },
    {
      q: "Bagaimana jika ada warga yang protes di portal publik bahwa dirinya belum terdaftar?",
      a: "Portal publik www.p2kdkalisalak.my.id/cekdpt menyediakan fitur aduan warga. Semua laporan warga Kalisalak akan masuk ke tab 'Aduan Warga' di sistem admin. Anda sebagai koordinator RW terkait dapat memantau aduan tersebut dan langsung mendatangi alamat warga untuk melakukan coklit faktual.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-blue-600 selection:text-white">
      {/* Top Banner / Breadcrumb Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Portal Bimbingan Teknis Resmi P2KD
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-300 font-semibold hidden sm:inline">
              Pilkades Desa Kalisalak 2026/2027
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadBimtekPdf("lengkap")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Buku Panduan PDF (5 Hal)
            </button>
            <button
              onClick={() => downloadBimtekPdf("lembar-saku")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Lembar Saku PDF (2 Hal)
            </button>
            <button
              onClick={() => window.print()}
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
              title="Cetak Halaman"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8 space-y-8">
        {/* Header Section */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Khusus Petugas Pemutakhiran Data Pemilih (Pantarlih & Koordinator RW)
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Panduan Operasional Sistem Digital DPS / DPT & Aplikasi Lapangan Coklit
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Materi resmi Bimbingan Teknis (Bimtek) tata cara penggunaan portal sistem{" "}
            <strong className="text-white font-bold">www.p2kdkalisalak.my.id/admin</strong> melalui
            smartphone saat verifikasi faktual pemilih door-to-door di lingkungan RW masing-masing.
          </p>
        </header>

        {/* HERO CARD: FUNGSI DIBUATKANNYA SISTEM WEBSITE */}
        <section className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-blue-950 via-slate-900 to-slate-900 border border-blue-800/50 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-wider">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Mengapa Sistem Ini Dibuatkan Untuk Membantu Anda?
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              Bukan Coklit Kertas Manual Biasa — Ini Adalah Revolusi Digital Kerja Lapangan P2KD!
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              P2KD Desa Kalisalak membangun sistem website ini secara khusus agar petugas lapangan
              tidak lagi dipusingkan oleh tumpukan formulir kertas Model A, coret-mencoret berkas yang
              kotor, atau menghitung manual persentase di malam hari. Semua proses verifikasi, koreksi,
              penyaringan data ganda, hingga rekapitulasi diselesaikan secara instan dari genggaman
              smartphone Anda.
            </p>

            {/* 4 Pilar Keunggulan Sistem */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm">
                  1
                </div>
                <h3 className="text-sm font-bold text-white">Bebas Kertas Manual</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Cukup bawa smartphone. Seluruh daftar nama warga di RW Anda sudah otomatis termuat
                  di layar.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                  2
                </div>
                <h3 className="text-sm font-bold text-white">Verifikasi 1-Sentuhan</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Jika data KTP/KK warga cocok, tekan tombol hijau &apos;Sesuai&apos;. Sistem seketika mencatat
                  nama Anda & jam verifikasi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
                  3
                </div>
                <h3 className="text-sm font-bold text-white">Koreksi Cepat di Tempat</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Ada salah ketik nama atau NIK? Langsung perbaiki dari formulir digital di HP Anda
                  dalam 10 detik.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-sm">
                  4
                </div>
                <h3 className="text-sm font-bold text-white">Rekap Real-Time Cloud</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Setiap kali Anda menekan tombol di jalan, kantor Sekretariat P2KD langsung melihat
                  bar progres Anda bertambah!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MODUL 1: CARA LOGIN AKUN RESMI PETUGAS */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <KeyRound className="w-4 h-4 text-blue-400" />
            Langkah 1: Masuk ke Portal Akun Anda
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white">
            Kredensial Login Resmi & Penguncian Otomatis Wilayah RW
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                Setiap pendaftar yang dinyatakan lolos administrasi telah dibuatkan akun resmi oleh
                Sistem P2KD. Gunakan browser di smartphone Anda (Google Chrome / Safari) dan buka
                tautan berikut:
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Alamat Portal:</span>
                  <Link
                    href="/admin"
                    target="_blank"
                    className="text-blue-400 font-bold hover:underline flex items-center gap-1"
                  >
                    p2kdkalisalak.my.id/admin <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Username Petugas:</span>
                  <span className="text-amber-400 font-bold">
                    Nama akhir pendaftar (huruf kecil)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Password Bawaan:</span>
                  <span className="text-emerald-400 font-bold">p2kd2026</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed">
                <strong>Contoh Username:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Ibu MAR&apos;UFAH &rarr; username: <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200 font-bold">marufah</code></li>
                  <li>Ibu LINDA FARIDA &rarr; username: <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200 font-bold">farida</code></li>
                  <li>Ibu YANI YUSWANTI &rarr; username: <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200 font-bold">yuswanti</code></li>
                </ul>
              </div>
            </div>

            {/* Smart Wilayah Feature Info */}
            <div className="p-5 rounded-2xl bg-linear-to-br from-slate-950 to-blue-950/40 border border-blue-900/40 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Fitur Smart Locking: Anda Hanya Melihat RW Anda
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Anda tidak perlu khawatir tertukar data dengan RW lain. Ketika Anda berhasil login
                menggunakan akun petugas RW Anda (contoh: Petugas RW 03), sistem secara otomatis
                mengunci filter ke <strong>&quot;Wilayah RW 03&quot;</strong>.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-xl font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Data pemilih yang tampil 100% tepat sasaran untuk wilayah kerja Anda.</span>
              </div>
            </div>
          </div>
        </section>

        {/* MODUL 2: SIMULASI INTERAKTIF & CARA KERJA 4 TOMBOL AKSI */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Langkah 2: Operasional Tab &quot;Coklit RW&quot; di Depan Rumah Warga
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
              Coba Klik Tombol di Bawah Untuk Simulasi
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-white">
              Simulasi Nyata: Apa yang Anda Tekan Saat Memeriksa KTP/KK Warga
            </h2>
            <p className="text-xs text-slate-300">
              Berikut adalah tampilan persis kartu pemilih yang akan muncul di layar smartphone Anda.
              Pelajari fungsi 4 tombol aksinya:
            </p>
          </div>

          {/* SIMULASI INTERAKTIF KARTU PEMILIH */}
          <div className="p-5 rounded-2xl bg-white text-slate-900 shadow-xl border-2 border-blue-400 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black text-slate-900">{demoNik}</span>
                  <span className="text-slate-300">•</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black">
                    Wilayah RW 03 (Tabung 03)
                  </span>

                  {/* Badges Status */}
                  {demoStatus === "SESUAI" && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> SESUAI
                    </span>
                  )}
                  {demoStatus === "UBAH_DATA" && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black flex items-center gap-1">
                      <Edit className="w-3 h-3 text-blue-600" /> DIPERBAIKI
                    </span>
                  )}
                  {demoStatus === "TMS" && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" /> TMS ({demoTmsReason})
                    </span>
                  )}
                  {demoStatus === "BELUM" && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> BELUM COKLIT
                    </span>
                  )}
                </div>

                <h3 className="text-base font-black text-slate-900">{demoName}</h3>

                <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span>JK: <strong>Laki-laki</strong></span>
                  <span>Lahir: <strong>Tegal, 15-08-1992</strong></span>
                  <span>Status: <strong>Kawin</strong></span>
                  <span>Alamat: <strong>{demoAlamat}, Kalisalak</strong></span>
                </div>
              </div>

              {/* Timestamp & Verifikator jika sudah dicoklit */}
              {demoStatus !== "BELUM" && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-left sm:text-right space-y-0.5">
                  <div className="text-[10px] text-emerald-800 font-bold flex items-center sm:justify-end gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Tervalidasi di Sistem Cloud:
                  </div>
                  <div className="text-xs font-black text-emerald-950">Petugas Pantarlih RW 03</div>
                  <div className="text-[10px] text-slate-500 font-mono">14-09-2026 • 09:42 WIB</div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS SIMULATION */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-xs font-bold text-slate-500">
                Tekan tombol aksi untuk mencoba simulasi:
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Tombol Sesuai */}
                <button
                  type="button"
                  onClick={() => setDemoStatus("SESUAI")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    demoStatus === "SESUAI"
                      ? "bg-emerald-700 text-white ring-2 ring-emerald-400 scale-105"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {demoStatus === "SESUAI" ? "Sesuai ✓" : "Sesuai"}
                </button>

                {/* 2. Tombol Ubah Data */}
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-blue-300 text-blue-700 bg-white hover:bg-blue-50 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Ubah Data
                </button>

                {/* 3. Tombol TMS */}
                <button
                  type="button"
                  onClick={() => setShowTmsModal(true)}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  TMS
                </button>

                {/* 4. Reset Button */}
                {demoStatus !== "BELUM" && (
                  <button
                    type="button"
                    onClick={() => {
                      setDemoStatus("BELUM");
                      setDemoName("SLAMET RIYADI");
                      setDemoAlamat("RT 02 / RW 03");
                    }}
                    className="px-2.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center gap-1 transition-all cursor-pointer"
                    title="Batal / Reset Status"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Dialog Modal Simulasi Edit */}
          {showEditModal && (
            <div className="p-4 rounded-2xl bg-blue-950/80 border border-blue-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-blue-300 font-bold border-b border-blue-900 pb-2">
                <span>Simulasi Modal: Koreksi Data Pemilih</span>
                <button onClick={() => setShowEditModal(false)} className="text-white hover:text-red-400">
                  ✕ Tutup
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nama Pemilih</label>
                  <input
                    type="text"
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-slate-900 text-white border border-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Alamat RT/RW</label>
                  <input
                    type="text"
                    value={demoAlamat}
                    onChange={(e) => setDemoAlamat(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-slate-900 text-white border border-slate-700 font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setDemoStatus("UBAH_DATA");
                    setShowEditModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs"
                >
                  Simpan Perubahan & Tandai &apos;Diperbaiki&apos;
                </button>
              </div>
            </div>
          )}

          {/* Dialog Modal Simulasi TMS */}
          {showTmsModal && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-rose-300 font-bold border-b border-rose-900 pb-2">
                <span>Simulasi Modal: Pilih Alasan TMS</span>
                <button onClick={() => setShowTmsModal(false)} className="text-white hover:text-red-400">
                  ✕ Tutup
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <label className="block text-slate-300 font-bold">Pilih Kategori TMS Resmi:</label>
                <select
                  value={demoTmsReason}
                  onChange={(e) => setDemoTmsReason(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-slate-900 text-white border border-slate-700 font-bold"
                >
                  <option value="MENINGGAL">1. Meninggal Dunia</option>
                  <option value="GANDA">2. Data Ganda</option>
                  <option value="PINDAH_DOMISILI">3. Pindah Domisili Keluar Desa</option>
                  <option value="DI_BAWAH_UMUR">4. Di Bawah Umur</option>
                  <option value="TNI_POLRI">5. Menjadi Anggota TNI / POLRI</option>
                  <option value="BUKAN_WARGA">6. Bukan Warga Desa Kalisalak</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setDemoStatus("TMS");
                    setShowTmsModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
                >
                  Tetapkan Status TMS
                </button>
              </div>
            </div>
          )}

          {/* Rincian Penjelasan 4 Tombol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle className="w-4 h-4" /> 1. Tombol &apos;Sesuai&apos; (Hijau)
              </div>
              <p className="text-slate-300 leading-relaxed">
                Tekan jika KTP-el / KK asli warga 100% identik dengan layar. Cukup 1 sentuhan, data
                langsung sah dan tidak perlu mengetik apapun!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <Edit className="w-4 h-4" /> 2. Tombol &apos;Ubah Data&apos; (Biru)
              </div>
              <p className="text-slate-300 leading-relaxed">
                Tekan jika ada salah ketik nama, tanggal lahir, NIK, atau status perkawinan baru.
                Formulir digital akan muncul untuk Anda edit di tempat.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <XCircle className="w-4 h-4" /> 3. Tombol &apos;TMS&apos; (Merah)
              </div>
              <p className="text-slate-300 leading-relaxed">
                Tekan jika pemilih telah meninggal dunia, pindah domisili, data ganda, atau menjadi
                TNI/Polri. Pilih alasannya dan simpan.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Plus className="w-4 h-4" /> 4. Tombol &apos;+ Temuan Baru&apos;
              </div>
              <p className="text-slate-300 leading-relaxed">
                Terletak di kanan atas. Tekan jika menemukan warga Kalisalak berusia 17 tahun atau
                warga baru yang belum terdaftar sama sekali di DPS.
              </p>
            </div>
          </div>
        </section>

        {/* MODUL 3: FITUR SCAN KAMERA QR CODE (SCAN STIKER) */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
            <Camera className="w-4 h-4 text-teal-400" />
            Langkah 3: Pemindai Kamera Instan (Scan Stiker)
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white">
            Pencarian Kilat Tanpa Ketik NIK Menggunakan Kamera Smartphone
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
            <div className="md:col-span-2 space-y-3">
              <p className="leading-relaxed">
                Untuk mempercepat kerja lapangan dan menghindari kesalahan pengetikan 16 digit NIK,
                sistem web dilengkapi fitur pemindai kamera (QR Code Scanner) yang terpasang di menu
                bawah ponsel Anda:
              </p>

              <ol className="list-decimal list-inside space-y-2 font-medium">
                <li>
                  Tekan <strong className="text-teal-400 font-bold">tombol bulat hijau kamera</strong> yang
                  melayang di bagian tengah bawah layar ponsel.
                </li>
                <li>
                  Saat pertama kali membuka, browser akan meminta izin akses kamera. Tekan{" "}
                  <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                    &apos;Izinkan / Allow&apos;
                  </strong>.
                </li>
                <li>
                  Arahkan kamera belakang ke QR Code pada dokumen warga atau stiker Coklit.
                </li>
                <li>
                  Sistem seketika memproses dan langsung membuka kartu pemilih bersangkutan untuk Anda
                  berikan status!
                </li>
              </ol>
            </div>

            <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-800/40 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-linear-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <div className="text-xs font-black text-teal-300 uppercase tracking-tight">
                Tombol Tengah Melayang
              </div>
              <p className="text-[11px] text-slate-400">
                Dapat digunakan kapan saja di lapangan tanpa instalasi aplikasi dari luar browser!
              </p>
            </div>
          </div>
        </section>

        {/* MODUL 4: 6 ALASAN TMS DI SISTEM DATABASE */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <XCircle className="w-4 h-4 text-rose-400" />
            Standar Database: 6 Kategori Resmi TMS
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white">
            Matriks Penetapan Tidak Memenuhi Syarat (TMS) di Sistem
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Saat Anda menekan tombol merah &apos;TMS&apos;, pilihlah satu alasan yang sesuai dari 6
            kategori resmi berikut. Pemilih bertanda TMS akan secara otomatis disaring keluar dari
            penetapan DPT Bersih desa:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {tmsCategories.map((tms) => (
              <div
                key={tms.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-400">{tms.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold border border-rose-900/60">
                    {tms.badge}
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-300 leading-relaxed">{tms.desc}</p>
                <div className="text-[10.5px] text-slate-400 pt-1 border-t border-slate-900 font-medium">
                  <span className="text-amber-400 font-bold">Bukti Faktual:</span> {tms.bukti}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MODUL 5: PEMETAAN 13 TABUNG TERHADAP 13 RW */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-blue-400" />
            Wilayah Tugas: Pemetaan 13 Tabung & 13 RW Desa Kalisalak
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white">
            Penugasan Presisi 1 Tabung Melayani 1 Wilayah RW
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            P2KD Kalisalak menetapkan pemetaan wilayah Tabung Pemilihan berbasis RW secara 1-to-1 mapping. Petugas
            yang ditugaskan di RW tertentu otomatis bertanggung jawab memverifikasi calon pemilih di
            Tabung tersebut:
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                  <th className="p-3">Tabung Pemilihan</th>
                  <th className="p-3">Wilayah RW Penugasan</th>
                  <th className="p-3">Cakupan Lingkungan RT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {pemetaanTps.map((row) => (
                  <tr key={row.tps} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-black text-white font-mono">{row.tps}</td>
                    <td className="p-3 font-bold text-blue-300">{row.rw}</td>
                    <td className="p-3 text-slate-300">{row.rt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* MODUL 6: CHECKLIST KESIAPAN SEBELUM JALAN */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              Checklist Kesiapan Petugas Sebelum Turun ke Lapangan
            </div>
            <span className="text-[11px] text-slate-400">
              Centang untuk memeriksa kelengkapan Anda
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {[
              { id: "hp_baterai", label: "Smartphone dengan Baterai Penuh (Min 80%)" },
              { id: "kuota_internet", label: "Paket Data Internet Aktif & Cukup" },
              { id: "login_berhasil", label: "Sudah Coba Login di p2kdkalisalak.my.id/admin" },
              { id: "cek_dps_rw", label: "Daftar Pemilih RW Anda Sudah Terlihat di Tab Coklit" },
              { id: "tanda_pengenal", label: "Mengenakan Tanda Pengenal / ID Card Resmi P2KD" },
              { id: "ballpoint_cadangan", label: "Membawa Buku Catatan Kecil & Ballpoint Cadangan" },
            ].map((item) => (
              <label
                key={item.id}
                onClick={() => toggleChecklist(item.id)}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  checklist[item.id]
                    ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-200"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checklist[item.id] || false}
                  onChange={() => {}}
                  className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span className="font-bold leading-tight">{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* MODUL 7: FAQ & PENANGANAN KENDALA TEKNIS */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-blue-400" />
            Tanya Jawab & Solusi Kendala Lapangan (FAQ)
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white">
            Hal-Hal yang Sering Ditanyakan oleh Petugas Coklit
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-900/50 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center shrink-0 font-black">
                        {idx + 1}
                      </span>
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-900 pl-11">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CALL TO ACTION DUA TOMBOL PDF */}
        <section className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-blue-900 via-indigo-950 to-slate-950 border border-blue-800 text-center space-y-4">
          <h2 className="text-lg sm:text-2xl font-black text-white">
            Unduh Buku Pedoman Resmi Sekarang & Simpan di Ponsel Anda
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 max-w-2xl mx-auto leading-relaxed">
            Kedua dokumen PDF di bawah telah disusun secara komprehensif lengkap dengan stempel dan
            pengesahan resmi Panitia Pilkades Kalisalak 2026/2027.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => downloadBimtekPdf("lengkap")}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Buku Panduan Sistem (PDF 5 Halaman)
            </button>
            <button
              onClick={() => downloadBimtekPdf("lembar-saku")}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm border border-slate-700 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Lembar Saku Coklit (PDF 2 Halaman)
            </button>
          </div>
        </section>

        {/* FOOTER HELPDESK & P2KD CONTACT */}
        <footer className="pt-6 border-t border-slate-800 text-center text-xs text-slate-400 space-y-2">
          <p>
            Memerlukan bantuan teknis atau pendampingan operasional saat bertugas di lapangan?
          </p>
          <p className="font-bold text-slate-300">
            Hubungi Helpdesk Teknis P2KD via WhatsApp:{" "}
            <a
              href="https://wa.me/6285879584257?text=Halo%20Admin%20P2KD%2C%20saya%20petugas%20Pantarlih%20ingin%20konsultasi%20sistem"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline"
            >
              0858-7958-4257
            </a>{" "}
            • Balai Desa Kalisalak, Margasari
          </p>
          <p className="text-[11px] text-slate-600 pt-2">
            Dokumen Rahasia & Internal • Hanya Untuk Petugas Pantarlih Terpilih P2KD Desa Kalisalak
          </p>
        </footer>
      </div>
    </div>
  );
}
