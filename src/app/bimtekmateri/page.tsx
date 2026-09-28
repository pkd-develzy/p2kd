"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  CheckCircle,
  XCircle,
  Edit,
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
  User,
  LayoutGrid,
  FileCheck,
  ClipboardCheck,
  Layers,
  Info,
} from "lucide-react";
import { downloadBimtekPdf } from "@/lib/bimtek-pdf-generator";

export default function BimtekMateriPage() {
  // Active Tab Menu Guide (5 Menus of the Field System)
  const [activeMenuTab, setActiveMenuTab] = useState<"pemutakhiran" | "calon_dps" | "camera" | "dpt" | "akun">("pemutakhiran");

  // Demo Interactive State untuk Simulasi Pemutakhiran Langsung di Materi Bimtek
  const [demoStatus, setDemoStatus] = useState<"BELUM" | "SESUAI" | "UBAH_DATA" | "TMS">("BELUM");
  const [demoTmsReason, setDemoTmsReason] = useState<string>("MENINGGAL");
  const [showTmsModal, setShowTmsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [demoName, setDemoName] = useState("SLAMET RIYADI");
  const demoNik = "3328011508920003";
  const [demoAlamat, setDemoAlamat] = useState("RT 02 / RW 03");
  const [demoDisabilitas, setDemoDisabilitas] = useState<string>("TIDAK");
  const [demoRtFilter, setDemoRtFilter] = useState<string>("SEMUA");

  // Demo Stage Tab di Calon DPS Menu
  const [demoSelectedStage, setDemoSelectedStage] = useState<"SEMUA" | "CALON_DPS" | "DPS" | "DPSHP" | "DPSHP_AKHIR">("CALON_DPS");

  // State Checklist Persiapan Lapangan
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    hp_baterai: true,
    kuota_internet: true,
    login_berhasil: true,
    cek_calon_dps: true,
    izin_kamera: true,
    tanda_pengenal: true,
    ballpoint_cadangan: true,
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
      bukti: "Pengecekan NIK kembar pada sistem Calon DPS",
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
      desc: "Belum genap berusia 17 tahun pada hari pemungutan suara (3 Februari 2027) dan belum pernah menikah.",
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

  // FAQ Penanganan Lapangan Terkini
  const faqs = [
    {
      q: "Mengapa aplikasi petugas sekarang tidak memiliki sidebar dan tampilannya seperti aplikasi HP native?",
      a: "Sistem petugas telah disesuaikan menjadi aplikasi Native Mobile (PWA/.APK) dengan Bilah Navigasi Bawah (Bottom Bar 5 Menu). Sidebar hanya dibuka untuk pengurus komputer Sekretariat Balai Desa. Dengan navigasi bawah, petugas lapangan dapat menjangkau seluruh menu dengan satu jempol tanpa repot membuka menu samping atau mengalami layar tergeser ke kanan.",
    },
    {
      q: "Mengapa data yang kami bawa sekarang disebut 'CALON DPS' dan bukan DPS?",
      a: "Sesuai regulasi Pilkades serentak, runtutan resmi data pemilih adalah: CALON DPS → DPS → DPSHP → DPSHP Akhir → DPT. Data awal sebanyak 7.787 pemilih yang Anda bawa berstatus CALON DPS (potensial pemilih DP4). Setelah Anda selesai memutakhirkan door-to-door, data tersebut baru akan diplenokan secara resmi oleh P2KD menjadi DPS untuk diumumkan kepada masyarakat.",
    },
    {
      q: "Bagaimana cara kerja Menu ke-3 (Camera)?",
      a: "Menu Camera di tengah bilah navigasi langsung mengaktifkan kamera belakang smartphone Anda seketika (direct rear camera). Kamera ini berfungsi ganda: (1) Memindai QR Code stiker pemilih untuk pencarian instan tanpa mengetik NIK, dan (2) Memotret dokumen fisik (KTP-el/KK warga baru, surat kematian untuk TMS, atau bukti mutasi) sebagai arsip digital.",
    },
    {
      q: "Apa saja fungsi Menu ke-5 (AKUN) bagi saya?",
      a: "Tab AKUN berisi informasi profil lengkap Anda (Nama, NIK, No WA, Wilayah RW/RT, Peran, dan ID Sesi). Di tab ini, Anda dapat mengganti foto profil dengan foto berseragam resmi (dikompresi otomatis oleh sistem), memperbarui kata sandi secara mandiri jika password default p2kd2026 ingin diubah, serta melakukan logout sesi yang aman.",
    },
    {
      q: "Bagaimana jika sinyal internet di rumah warga yang saya datangi sangat lambat atau hilang?",
      a: "Aplikasi PWA/APK tetap menyimpan daftar nama pemilih Calon DPS RW Anda di memori HP. Anda tetap dapat mencocokkan dokumen fisik warga dan mencatat sementara di lembar saku. Begitu kembali ke area yang mendapat sinyal internet, buka aplikasi dan sentuh tombol 'Sesuai' atau 'Ubah Data' untuk warga-warga tersebut.",
    },
    {
      q: "Apakah warga yang sedang merantau ke luar kota (Jakarta/Surabaya) harus ditandai TMS?",
      a: "TIDAK BOLEH. Selama warga tersebut masih ber-KTP atau ber-Kartu Keluarga Desa Kalisalak dan belum menerbitkan surat pindah resmi (SKPWNI), hak pilihnya tetap SAH. Tanyakan dan cocokkan dokumen KTP/KK kepada anggota keluarga yang berada di rumah saat Anda berkunjung, lalu tandai 'SESUAI'.",
    },
    {
      q: "Bagaimana jika saya tidak sengaja salah menekan tombol 'Sesuai' padahal orangnya sudah meninggal (TMS)?",
      a: "Sistem sangat fleksibel dan aman. Pada kartu pemilih yang sudah diberi status, akan muncul tombol 'Reset / Batal' dengan ikon putar balik. Cukup tekan tombol tersebut, maka status pemilih akan kembali menjadi 'Belum Pemutakhiran', lalu Anda bisa menekan tombol 'TMS' yang benar.",
    },
    {
      q: "Bagaimana jika ada warga yang komplain di portal publik bahwa dirinya belum terdaftar?",
      a: "Portal publik menyediakan fitur aduan warga. Semua laporan warga Kalisalak akan masuk ke tab 'Aduan Warga' di sistem P2KD. Petugas di wilayah RW terkait dapat memantau aduan tersebut dan langsung mendatangi alamat warga untuk melakukan pemutakhiran faktual.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-blue-600 selection:text-white">
      {/* Top Banner / Sticky Action Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Panduan Komprehensif Petugas Pemutakhiran Data Pemilih (Pantarlih & Koordinator RW)
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Buku Panduan Sistem Petugas Lapangan & Aplikasi Mobile P2KD
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Materi resmi Bimbingan Teknis (Bimtek) tata kerja sistem aplikasi mobile PWA / APK{" "}
            <strong className="text-white font-bold">p2kd-kalisalak.apk</strong> untuk verifikasi faktual door-to-door Calon DPS di 13 Wilayah RW Desa Kalisalak.
          </p>

          {/* Runtutan Tahapan Banner */}
          <div className="p-3.5 rounded-2xl bg-linear-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300 font-medium">Runtutan Pemutakhiran Resmi:</span>
              <strong className="text-white font-black">
                CALON DPS → DPS → DPSHP → DPSHP Akhir → DPT
              </strong>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold shrink-0">
              Data Saat Ini: Calon DPS (7.787 Pemilih)
            </span>
          </div>
        </header>

        {/* HERO CARD: REVOLUSI DIGITAL & MODEL APLIKASI PETUGAS */}
        <section className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-blue-950 via-slate-900 to-slate-900 border border-blue-800/50 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-wider">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Struktur & Arsitektur Aplikasi Petugas Yang Anda Bawa
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              Aplikasi Mobile Native: Tanpa Sidebar, Navigasi 5 Menu Bawah & Anti Layar Tergeser
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              Sistem kerja petugas lapangan P2KD Kalisalak dirancang khusus agar Anda bekerja dengan nyaman di smartphone:
              tidak ada sidebar samping yang menghalangi layar, tidak ada geser kanan-kiri yang melebihi batas layar, dan
              seluruh perintah utama dapat diakses langsung menggunakan jempol Anda melalui <strong>Bottom Navigation Bar</strong>.
            </p>

            {/* 4 Pilar Arsitektur */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm">
                  1
                </div>
                <h3 className="text-sm font-bold text-white">Native Bottom Bar</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  5 Menu langsung di bawah layar: Pemutakhiran, Calon DPS, Camera, DPT, dan Akun.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                  2
                </div>
                <h3 className="text-sm font-bold text-white">Smart RW Locking</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Sistem otomatis mengunci wilayah kerja sesuai RW penugasan Anda. Data 100% aman dan tidak tertukar.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
                  3
                </div>
                <h3 className="text-sm font-bold text-white">Instant Rear Camera</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Kamera belakang aktif langsung untuk scan QR stiker dan foto bukti fisik warga baru/TMS.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-sm">
                  4
                </div>
                <h3 className="text-sm font-bold text-white">Realtime Cloud Sync</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Setiap sentuhan tombol di lapangan langsung tercatat dengan stempel nama petugas dan waktu di server desa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MODUL UTAMA: PANDUAN INTERAKTIF 5 MENU APLIKASI LAPANGAN */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                <Layers className="w-4 h-4 text-blue-400" />
                Tur Sistem Antarmuka Petugas Lapangan
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white">
                Bedah Detail 5 Menu Utama Pada Bilah Navigasi Bawah
              </h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full self-start sm:self-auto">
              Klik Tab Menu di Bawah Untuk Mempelajari Fiturnya
            </span>
          </div>

          {/* Navigasi Tab 5 Menu */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveMenuTab("pemutakhiran")}
              className={`p-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMenuTab === "pemutakhiran"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>1. Pemutakhiran</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMenuTab("calon_dps")}
              className={`p-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMenuTab === "calon_dps"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>2. Calon DPS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMenuTab("camera")}
              className={`p-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMenuTab === "camera"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>3. Camera</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMenuTab("dpt")}
              className={`p-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMenuTab === "dpt"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>4. DPT</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMenuTab("akun")}
              className={`p-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMenuTab === "akun"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <User className="w-4 h-4" />
              <span>5. Akun</span>
            </button>
          </div>

          {/* TAB CONTENT 1: PEMUTAKHIRAN */}
          {activeMenuTab === "pemutakhiran" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/40 space-y-2">
                <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-blue-400" />
                  Menu 1: Pemutakhiran (Lembar Kerja Utama Lapangan Door-to-Door)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Dahulu disebut menu Coklit, kini dinamai <strong>PEMUTAKHIRAN</strong>. Menu ini adalah ruang kerja utama Anda saat berdiri di depan rumah warga. Anda dapat menyaring data per RT (misal: RT 01, RT 02, RT 03), mencari nama warga atau NIK, memeriksa data disabilitas & KTP-el, serta memberikan status verifikasi seketika.
                </p>
              </div>

              {/* SIMULASI INTERAKTIF KARTU PEMILIH PEMUTAKHIRAN */}
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
                          <Clock className="w-3 h-3 text-amber-600" /> BELUM PEMUTAKHIRAN
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black text-slate-900">{demoName}</h4>

                    <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>JK: <strong>Laki-laki</strong></span>
                      <span>Lahir: <strong>Tegal, 15-08-1992</strong></span>
                      <span>Status: <strong>Kawin</strong></span>
                      <span>Alamat: <strong>{demoAlamat}, Kalisalak</strong></span>
                      <span>Disabilitas: <strong>{demoDisabilitas}</strong></span>
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

                {/* Filter RT Demo */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
                  <span>Simulasi Filter RT:</span>
                  {["SEMUA", "RT 01", "RT 02", "RT 03"].map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => setDemoRtFilter(rt)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                        demoRtFilter === rt
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {rt}
                    </button>
                  ))}
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
                          setDemoDisabilitas("TIDAK");
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Status Disabilitas</label>
                      <select
                        value={demoDisabilitas}
                        onChange={(e) => setDemoDisabilitas(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg bg-slate-900 text-white border border-slate-700 font-bold"
                      >
                        <option value="TIDAK">Bukan Disabilitas</option>
                        <option value="FISIK">Disabilitas Fisik</option>
                        <option value="NETRA">Disabilitas Netra</option>
                        <option value="RUNGU">Disabilitas Rungu</option>
                        <option value="MENTAL">Disabilitas Mental</option>
                      </select>
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
                    <span>Simulasi Modal: Pilih Alasan TMS Resmi</span>
                    <button onClick={() => setShowTmsModal(false)} className="text-white hover:text-red-400">
                      ✕ Tutup
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <label className="block text-slate-300 font-bold">Pilih Kategori TMS Baku:</label>
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
            </div>
          )}

          {/* TAB CONTENT 2: CALON DPS */}
          {activeMenuTab === "calon_dps" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/40 space-y-2">
                <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-blue-400" />
                  Menu 2: Calon DPS (Grid 4 Tahapan & Rekap Data Berjenjang)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Menu ini menyajikan <strong>Grid 4 Kartu Tahapan Pemutakhiran</strong> yang memungkinkan Anda melihat seluruh pemilih Calon DPS di wilayah RW Anda serta mengelompokkannya ke dalam tahapan berikutnya. Seluruh 7.787 pemilih yang saat ini ada di sistem berstatus <strong>CALON DPS</strong>.
                </p>
              </div>

              {/* SIMULASI GRID 4 TAHAPAN */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 block">
                  Simulasi 4 Kartu Grid Tahapan Pemilih (Klik kartu untuk menyaring):
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Kartu 1: Calon DPS */}
                  <button
                    type="button"
                    onClick={() => setDemoSelectedStage("CALON_DPS")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      demoSelectedStage === "CALON_DPS"
                        ? "bg-linear-to-br from-blue-600 to-indigo-700 text-white border-blue-400 shadow-lg scale-[1.02]"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-black uppercase">
                      <span>Tahap 1</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-white">Aktif Saat Ini</span>
                    </div>
                    <div className="text-sm font-black mt-2">CALON DPS</div>
                    <div className="text-2xl font-black mt-0.5">7.787</div>
                    <div className="text-[10px] mt-1 text-blue-200">Data Master Pemutakhiran</div>
                  </button>

                  {/* Kartu 2: DPS */}
                  <button
                    type="button"
                    onClick={() => setDemoSelectedStage("DPS")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      demoSelectedStage === "DPS"
                        ? "bg-linear-to-br from-amber-600 to-orange-700 text-white border-amber-400 shadow-lg scale-[1.02]"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-black uppercase">
                      <span>Tahap 2</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">Uji Publik</span>
                    </div>
                    <div className="text-sm font-black mt-2">DPS</div>
                    <div className="text-2xl font-black mt-0.5">7.650</div>
                    <div className="text-[10px] mt-1 text-slate-400">Pasca Pleno Calon DPS</div>
                  </button>

                  {/* Kartu 3: DPSHP */}
                  <button
                    type="button"
                    onClick={() => setDemoSelectedStage("DPSHP")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      demoSelectedStage === "DPSHP"
                        ? "bg-linear-to-br from-teal-600 to-emerald-700 text-white border-teal-400 shadow-lg scale-[1.02]"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-black uppercase">
                      <span>Tahap 3</span>
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">Perbaikan</span>
                    </div>
                    <div className="text-sm font-black mt-2">DPSHP</div>
                    <div className="text-2xl font-black mt-0.5">7.610</div>
                    <div className="text-[10px] mt-1 text-slate-400">Masukan & Aduan Warga</div>
                  </button>

                  {/* Kartu 4: DPSHP Akhir */}
                  <button
                    type="button"
                    onClick={() => setDemoSelectedStage("DPSHP_AKHIR")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      demoSelectedStage === "DPSHP_AKHIR"
                        ? "bg-linear-to-br from-indigo-600 to-purple-700 text-white border-indigo-400 shadow-lg scale-[1.02]"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-black uppercase">
                      <span>Tahap 4</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">Validasi Final</span>
                    </div>
                    <div className="text-sm font-black mt-2">DPSHP AKHIR</div>
                    <div className="text-2xl font-black mt-0.5">7.595</div>
                    <div className="text-[10px] mt-1 text-slate-400">Penyusunan Menuju DPT</div>
                  </button>
                </div>
              </div>

              {/* Rincian Runtutan 5 Tahap */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <span className="font-bold text-white block">Aturan Main & Makna 5 Tahapan:</span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li><strong>CALON DPS (Data Saat Ini)</strong>: Data kependudukan awal (DP4) yang diverifikasi door-to-door oleh Pantarlih.</li>
                  <li><strong>DPS (Daftar Pemilih Sementara)</strong>: Hasil rekapitulasi pemutakhiran Calon DPS yang diumumkan di balai desa & tempat strategis.</li>
                  <li><strong>DPSHP (DPS Hasil Perbaikan)</strong>: Rekapitulasi perbaikan setelah uji publik tanggapan warga berlangsung 10 hari.</li>
                  <li><strong>DPSHP Akhir</strong>: Perbaikan tahap akhir setelah seluruh berkas tanggapan dan TMS disaring bersih.</li>
                  <li><strong>DPT (Daftar Pemilih Tetap)</strong>: Data final yang disahkan dalam Berita Acara Rapat Pleno dan dikunci secara permanen.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB CONTENT 3: CAMERA */}
          {activeMenuTab === "camera" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 space-y-2">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  Menu 3: Camera (Aktivasi Langsung Kamera Belakang Smartphone)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Begitu Anda menekan tombol menu Camera di bilah bawah, sistem secara instan menyalakan <strong>Kamera Belakang (Rear Camera)</strong> HP Anda. Fitur ini dirancang khusus tanpa perlu tombol upload gambar manual, sehingga petugas langsung membidik QR Code stiker atau dokumen fisik warga dalam hitungan detik.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <span className="font-bold text-white flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Fungsi Utama Fitur Camera:
                  </span>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Scan Barcode/QR Stiker Pemutakhiran:</strong> Langsung membuka kartu pemilih bersangkutan di layar tanpa mengetik 16 digit NIK.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Foto Bukti KTP-el / KK Baru:</strong> Untuk mendokumentasikan pemilih baru usia 17 tahun atau mutasi masuk.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Foto Surat Kematian / Pindah:</strong> Sebagai lampiran digital bukti pendukung saat menetapkan status TMS.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-amber-400" />
                    Panduan & Izin Akses Kamera:
                  </span>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                    <li>Saat pertama kali ditekan, browser HP akan menampilkan dialog: <em>&quot;Izinkan p2kdkalisalak.my.id mengakses kamera Anda?&quot;</em></li>
                    <li>Pilih <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded font-bold">Izinkan / Allow</strong>.</li>
                    <li>Posisikan dokumen dalam bingkai kotak bidik (viewfinder) di layar dengan pencahayaan yang cukup.</li>
                    <li>Tersedia tombol senter/flash jika memotret di dalam rumah warga yang minim cahaya.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT 4: DPT */}
          {activeMenuTab === "dpt" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/40 space-y-2">
                <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-400" />
                  Menu 4: DPT (Daftar Pemilih Tetap & Tabung Pemilihan)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Menu ini memuat informasi rekapitulasi resmi penetapan DPT Pilkades Kalisalak 2027 serta pemetaan nomor Tabung Pemilihan di Lapangan Desa. Setelah sidang pleno penetapan DPT, seluruh data dikunci secara digital melalui sistem penguncian terenkripsi (Digital Hash Lock).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Lock className="w-4 h-4" />
                    Sistem Penguncian Digital (Digital Hash Lock)
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Setelah berita acara rapat pleno ditandatangani oleh Ketua P2KD, BPD, dan saksi calon kades, sistem akan mengunci database DPT. Seluruh pemilih yang sah mendapatkan nomor urut DPT resmi yang tidak dapat ditambah atau diubah oleh siapapun, demi menjaga netralitas dan kejujuran pemilihan.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <MapPin className="w-4 h-4" />
                    Pusat Pemungutan Suara Terpusat
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Pemungutan suara Pilkades Kalisalak dipusatkan di <strong>Lapangan Desa Kalisalak</strong> dengan 13 Tabung Pemilihan yang melayani masing-masing wilayah RW 01 hingga RW 13. Petugas mengarahkan warga untuk mengingat nomor tabung sesuai wilayah RW mereka.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT 5: AKUN */}
          {activeMenuTab === "akun" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/40 space-y-2">
                <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  Menu 5: Akun Petugas (Profil, Foto Seragam, Ganti Sandi & Logout)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Menu ini adalah ruang kendali pribadi Anda. Petugas dapat melihat kartu identitas digital, mengunggah foto profil seragam resmi, memperbarui password akun secara mandiri, memeriksa keamanan sesi login perangkat, dan keluar dari sistem dengan aman.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fitur Profil & Foto */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <span className="font-bold text-white flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-blue-400" />
                    Profil Petugas & Update Foto Resmi:
                  </span>
                  <ul className="space-y-2 text-slate-300">
                    <li>• Menampilkan Nama Lengkap, NIK, No WhatsApp, dan Wilayah Penugasan RW & RT.</li>
                    <li>• Menampilkan ID Sesi aktif dan status peran (Pantarlih / Koordinator RW).</li>
                    <li>• <strong>Kompresi Foto Otomatis:</strong> Petugas dapat mengambil swafoto seragam atau memilih dari galeri. Sistem secara otomatis memperkecil ukuran gambar hingga di bawah 100 KB sehingga hemat kuota dan cepat tersimpan.</li>
                  </ul>
                </div>

                {/* Fitur Ganti Password & Keamanan */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <span className="font-bold text-white flex items-center gap-2 text-sm">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    Pergantian Kata Sandi & Sesi Login:
                  </span>
                  <ul className="space-y-2 text-slate-300">
                    <li>• <strong>Ganti Kata Sandi Mandiri:</strong> Masukkan kata sandi lama (bawaan: <code className="text-emerald-400 font-bold">p2kd2026</code>), lalu masukkan kata sandi baru minimal 6 karakter dan konfirmasi.</li>
                    <li>• <strong>Info Keamanan Perangkat:</strong> Sistem mencatat tipe smartphone, sistem operasi, browser, dan alamat IP Anda untuk melindungi akun dari penyalahgunaan.</li>
                    <li>• <strong>Tombol Keluar Sesi:</strong> Diletakkan di bagian paling bawah dengan warna merah untuk mengakhiri sesi kerja pada smartphone Anda.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* MODUL 2: CARA LOGIN RESMI PETUGAS */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <KeyRound className="w-4 h-4 text-blue-400" />
            Langkah Masuk: Kredensial Login Resmi Akun Petugas
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white">
            Format Username & Password Bawaan Akun Lapangan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                Setiap petugas yang telah ditetapkan secara resmi telah dibuatkan akun di sistem.
                Buka aplikasi PWA atau kunjungi portal admin:
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
                <strong>Contoh Username Petugas Kalisalak:</strong>
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
                  Fitur Smart Locking: Anda Hanya Mengakses RW Penugasan
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Anda tidak perlu khawatir data tertukar dengan RW lain. Ketika berhasil login menggunakan akun petugas RW Anda (contoh: Petugas RW 03), sistem secara otomatis mengunci cakupan data hanya untuk <strong>&quot;Wilayah RW 03&quot;</strong>.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-xl font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% presisi: Hanya data warga RW penugasan Anda yang tampil di layar.</span>
              </div>
            </div>
          </div>
        </section>

        {/* MODUL 3: MATRIKS STANDAR 6 ALASAN TMS */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <XCircle className="w-4 h-4 text-rose-400" />
            Standar Database: 6 Kategori Resmi Tidak Memenuhi Syarat (TMS)
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white">
            Matriks Penetapan TMS & Bukti Faktual Wajib
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Saat Anda menekan tombol merah &apos;TMS&apos;, pilihlah satu alasan yang sesuai dari 6 kategori baku berikut. Pemilih berstatus TMS akan disaring keluar dari penetapan DPSHP dan DPT bersih desa:
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

        {/* MODUL 4: PEMETAAN 13 TABUNG PEMILIHAN VS 13 RW */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-blue-400" />
            Wilayah Tugas: Pemetaan 13 Tabung & 13 RW Desa Kalisalak
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white">
            Penugasan Presisi 1 Tabung Melayani 1 Wilayah RW
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            P2KD Kalisalak menetapkan pemetaan wilayah Tabung Pemilihan berbasis RW secara 1-to-1 mapping. Petugas yang ditugaskan di RW tertentu otomatis bertanggung jawab memverifikasi calon pemilih di Tabung tersebut:
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

        {/* MODUL 5: CHECKLIST KESIAPAN SEBELUM TURUN LAPANGAN */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              Checklist Kesiapan Petugas Sebelum Turun ke Rumah Warga
            </div>
            <span className="text-[11px] text-slate-400">
              Centang untuk memeriksa kelengkapan Anda
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {[
              { id: "hp_baterai", label: "Smartphone dengan Baterai Penuh (Min 80%)" },
              { id: "kuota_internet", label: "Paket Data Internet Aktif & Cukup" },
              { id: "login_berhasil", label: "Sudah Coba Login di Aplikasi Lapangan" },
              { id: "cek_calon_dps", label: "Data Calon DPS RW Anda Sudah Tampil di Menu Pemutakhiran" },
              { id: "izin_kamera", label: "Izin Kamera Belakang Sudah Diaktifkan di HP" },
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

        {/* MODUL 6: FAQ & PENANGANAN KENDALA TEKNIS */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-blue-400" />
            Tanya Jawab & Solusi Kendala Lapangan (FAQ)
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white">
            Hal-Hal yang Sering Dihadapi Petugas di Lapangan
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
            Unduh Buku Pedoman Resmi Sekarang & Simpan di Smartphone Anda
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 max-w-2xl mx-auto leading-relaxed">
            Kedua dokumen PDF di bawah telah diperbarui sesuai sistem aplikasi mobile 5 Menu Navigasi Bawah dan runtutan data Calon DPS lengkap dengan pengesahan resmi P2KD Kalisalak 2026/2027.
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
              href="https://wa.me/6287830188452?text=Halo%20Admin%20P2KD%2C%20saya%20petugas%20Pantarlih%20ingin%20konsultasi%20sistem"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline"
            >
              +62 878-3018-8452
            </a>{" "}
            • Balai Desa Kalisalak, Margasari
          </p>
          <p className="text-[11px] text-slate-600 pt-2">
            Dokumen Resmi Internal • Khusus Petugas Pemutakhiran Data Pemilih P2KD Desa Kalisalak
          </p>
        </footer>
      </div>
    </div>
  );
}
