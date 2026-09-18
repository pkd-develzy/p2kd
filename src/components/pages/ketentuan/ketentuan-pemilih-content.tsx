"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  ShieldAlert,
  FileCheck2,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Scale,
  BookOpen,
  MapPin,
  Vote,
  ExternalLink,
  AlertTriangle,
  FileText,
  BadgeCheck,
  Building2,
  Search,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, Logo, Button } from "@/components/ui";
import { PublicWebConfig } from "@/lib/data-store";

export const KetentuanPemilihContent: React.FC = () => {
  const [config, setConfig] = useState<Partial<PublicWebConfig> | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setConfig(json.data);
      })
      .catch((err) => console.warn("Failed loading config:", err));
  }, []);

  const desa = config?.namaDesa || "Kalisalak";
  const kecamatan = config?.kecamatan || "Margasari";
  const kabupaten = config?.kabupaten || "Tegal";
  const hariH = config?.hariHTanggal || "Rabu, 3 Februari 2027";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full space-y-8">
      {/* Breadcrumb / Action Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali ke Beranda
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/cek-pemilih">
            <Button variant="primary" size="sm" className="text-xs font-bold rounded-xl gap-1.5 bg-blue-600 hover:bg-blue-500">
              <Search className="w-3.5 h-3.5" />
              <span>Cek Hak Pilih Online</span>
            </Button>
          </Link>
          <Link href="/syarat-daftar-kades">
            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl gap-1.5 border-slate-300">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>Syarat Calon Kades</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Header Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="flex justify-center mb-2">
          <Logo size="md" />
        </div>
        <Badge variant="primary" className="px-3.5 py-1 text-xs font-bold">
          <Users className="w-3.5 h-3.5 mr-1.5 inline text-blue-700" />
          Pedoman Hak Konstitusional Pemilih Warga Desa
        </Badge>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Ketentuan & Syarat Pemilih Pilkades {desa}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Kecamatan {kecamatan}, Kabupaten {kabupaten} • Pelaksanaan Pemungutan Suara: <strong>{hariH}</strong>
        </p>
      </div>

      {/* Highlight Banner: Hak Pilih LUBER JURDIL */}
      <Card className="p-6 sm:p-8 bg-linear-to-br from-slate-950 via-blue-950 to-indigo-950 text-white rounded-3xl shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2">
            <span className="text-[11px] font-black tracking-wider text-amber-300 uppercase bg-amber-400/15 px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
              Asas Demokrasi Desa: LUBER & JURDIL
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">
            Hak Menentukan Pemimpin Desa Kalisalak untuk 8 Tahun ke Depan
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Setiap warga Desa Kalisalak yang memenuhi persyaratan perundang-undangan berhak menggunakan hak suaranya secara <strong>Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil</strong> tanpa diskriminasi, tekanan, atau paksaan dari pihak mana pun.
          </p>
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-xs text-blue-200 flex items-center gap-2">
            <span>💡 <strong>Penting:</strong> Pastikan Nomor Induk Kependudukan (NIK) Anda telah tercantum dalam Daftar Pemilih Tetap (DPT) Desa Kalisalak sebelum hari pemungutan suara.</span>
          </div>
        </div>
      </Card>

      {/* Section 1: Syarat Menjadi Pemilih (Memenuhi Syarat / MS) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">BAGIAN 1</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Syarat Utama Pemilih (Kriteria Memenuhi Syarat / MS)
            </h2>
          </div>
        </div>

        <Card className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
          <p className="text-xs sm:text-sm text-slate-700 font-medium">
            Warga masyarakat yang berhak memilih dalam Pemilihan Kepala Desa {desa} wajib memenuhi ketentuan berikut:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[
              {
                no: 1,
                title: "Warga Negara Indonesia (WNI)",
                desc: "Merupakan Warga Negara Indonesia yang terdaftar secara sah dalam administrasi kependudukan.",
              },
              {
                no: 2,
                title: "Usia Minimal 17 Tahun atau Pernah Kawin",
                desc: "Telah berusia genap 17 (tujuh belas) tahun pada hari pemungutan suara (Rabu, 3 Februari 2027) ATAU sudah/pernah kawin/menikah meskipun belum berusia 17 tahun.",
              },
              {
                no: 3,
                title: "Domisili di Desa Kalisalak Minimal 6 Bulan",
                desc: "Nyata-nyata bertempat tinggal dan berdomisili di Desa Kalisalak sekurang-kurangnya 6 (enam) bulan berturut-turut sebelum disahkannya DPS, dibuktikan dengan KTP-el atau Kartu Keluarga (KK) Kalisalak.",
              },
              {
                no: 4,
                title: "Tidak Sedang Terganggu Jiwa / Ingatan",
                desc: "Sehat rohani dan tidak sedang terganggu jiwa/ingatannya berdasarkan surat keterangan medis resmi.",
              },
              {
                no: 5,
                title: "Tidak Sedang Dicabut Hak Pilihnya",
                desc: "Tidak sedang dicabut hak pilihnya berdasarkan putusan pengadilan yang telah mempunyai kekuatan hukum tetap.",
              },
              {
                no: 6,
                title: "Bukan Anggota Aktif TNI / Polri",
                desc: "Masyarakat sipil dan bukan anggota aktif Tentara Nasional Indonesia (TNI) atau Kepolisian Negara Republik Indonesia (Polri) yang berstatus netral.",
              },
              {
                no: 7,
                title: "Terdaftar dalam Daftar Pemilih",
                desc: "Tercantum dalam Daftar Pemilih Tetap (DPT) Desa Kalisalak yang telah ditetapkan secara resmi oleh P2KD dan BPD.",
              },
              {
                no: 8,
                title: "Satu Orang Satu Suara (One Person, One Vote)",
                desc: "Hanya berhak memberikan 1 (satu) suara pada 1 (satu) Tempat Pemungutan Suara (TPS) yang telah ditentukan.",
              },
            ].map((item) => (
              <div
                key={item.no}
                className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {item.no}
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Section 2: Kriteria Pemilih Tidak Memenuhi Syarat (TMS) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">BAGIAN 2</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kriteria Tidak Memenuhi Syarat (TMS) Pemilih
            </h2>
          </div>
        </div>

        <Card className="p-6 sm:p-8 bg-rose-50/40 border border-rose-200 rounded-3xl shadow-xs space-y-4">
          <p className="text-xs sm:text-sm text-rose-950 font-bold">
            Seorang warga <span className="underline decoration-rose-500">DICORET DARI DAFTAR PEMILIH</span> atau TIDAK DAPAT menggunakan hak pilih apabila tergolong dalam kriteria berikut:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: "Meninggal Dunia", desc: "Pemilih telah meninggal dunia dibuktikan dengan Surat Keterangan Kematian dari Desa/Dukcapil." },
              { label: "Mutasi / Pindah Domisili Keluar", desc: "Telah pindah domisili keluar wilayah Desa Kalisalak dengan Surat Keterangan Pindah WNI (SKPWNI)." },
              { label: "Belum Cukup Umur", desc: "Berusia di bawah 17 tahun pada tanggal 3 Februari 2027 dan belum pernah menikah/kawin." },
              { label: "Anggota TNI / Polri Aktif", desc: "Telah diangkat menjadi prajurit TNI atau anggota POLRI aktif." },
              { label: "Pencabutan Hak Pilih oleh Pengadilan", desc: "Hak pilihnya dicabut berdasarkan amar putusan vonis pengadilan berkekuatan hukum tetap." },
              { label: "Data Ganda / Fiktif", desc: "Tercatat lebih dari 1 kali dalam DPT (dihapus salah satunya dan disesuaikan TPS domisili riil)." },
              { label: "Bukan Penduduk Desa Kalisalak", desc: "Tidak memiliki dokumen KTP-el / KK Kalisalak dan tidak berdomisili minimal 6 bulan berturut-turut." },
              { label: "Hilang Ingatan / Gangguan Jiwa Berat", desc: "Mengalami gangguan jiwa permanen berdasarkan surat keterangan dokter/rumah sakit jiwa." },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border border-rose-100 shadow-2xs text-xs"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-rose-950 block">{item.label}</span>
                  <span className="text-[11px] text-slate-600 leading-relaxed block">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Section 3: Klasifikasi Daftar Pemilih (DPT, DPS, DPTb) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">BAGIAN 3</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Klasifikasi & Mekanisme Daftar Pemilih
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5">
            <Badge variant="primary" className="text-[10px] font-black">
              1. DPT (Daftar Pemilih Tetap)
            </Badge>
            <h3 className="text-sm font-black text-slate-900">Pemilih Utama Terdaftar</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Daftar pemilih yang telah melalui proses pencocokan & penelitian (Coklit) oleh Pantarlih dan telah ditetapkan secara resmi. Pemilih DPT mencoblos pukul <strong>07:00 – 13:00 WIB</strong> di TPS yang ditentukan.
            </p>
          </Card>

          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5">
            <Badge variant="warning" className="text-[10px] font-black">
              2. DPS & DPSHP
            </Badge>
            <h3 className="text-sm font-black text-slate-900">Uji Publik & Masa Sanggah</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Daftar Pemilih Sementara yang diumumkan di balai desa & tempat strategis untuk menerima masukan, koreksi data, atau laporan warga yang belum terdaftar sebelum ditetapkan menjadi DPT.
            </p>
          </Card>

          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5">
            <Badge variant="success" className="text-[10px] font-black">
              3. DPTb / Pemilih Tambahan
            </Badge>
            <h3 className="text-sm font-black text-slate-900">Warga Ber-KTP Kalisalak</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Pemilih yang memenuhi syarat namun belum terdaftar di DPT. Dapat menggunakan hak pilih pada pukul <strong>12:00 – 13:00 WIB</strong> dengan membawa KTP-el Kalisalak asli di TPS sesuai alamat RT/RW (selama surat suara tersedia).
            </p>
          </Card>
        </div>
      </div>

      {/* Section 4: Dokumen Wajib Dibawa Saat Mencoblos */}
      <Card className="p-6 sm:p-8 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <Vote className="w-5 h-5 text-blue-700" />
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Dokumen Wajib yang Harus Dibawa Pemilih ke TPS
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-700">
          Saat hadir di Tempat Pemungutan Suara (TPS) pada hari pemungutan suara, pemilih wajib menunjukkan:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-blue-700 uppercase">Dokumen 1 (Utama)</span>
            <h4 className="text-sm font-black text-slate-900">Formulir Pemberitahuan Memilih (Model C6-KWK)</h4>
            <p className="text-xs text-slate-500 font-normal">
              Surat undangan memilih resmi dari P2KD yang telah didistribusikan oleh petugas KPPS/Pantarlih sebelum hari H.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-blue-700 uppercase">Dokumen 2 (Identitas)</span>
            <h4 className="text-sm font-black text-slate-900">KTP-el Asli / Biodata Kependudukan / IKD</h4>
            <p className="text-xs text-slate-500 font-normal">
              Kartu Tanda Penduduk Elektronik asli Desa Kalisalak atau Identitas Kependudukan Digital (IKD) yang sah.
            </p>
          </div>
        </div>
      </Card>

      {/* Section 5: Posko Layanan & Tindakan Cepat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between text-center">
          <div className="space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Cek NIK di DPT Online</h4>
            <p className="text-[11px] text-slate-500 font-normal">
              Periksa status kepesertaan dan nomor TPS Anda secara instan hanya dengan NIK.
            </p>
          </div>
          <Link href="/cek-pemilih">
            <Button variant="primary" size="sm" className="w-full text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500">
              Cek DPT Sekarang
            </Button>
          </Link>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between text-center">
          <div className="space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Posko Pengaduan Pemilih</h4>
            <p className="text-[11px] text-slate-500 font-normal">
              Belum terdaftar atau data salah? Kirimkan permohonan ke sekretariat P2KD.
            </p>
          </div>
          <Link href="/aduan">
            <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100">
              Lapor Aduan Warga
            </Button>
          </Link>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between text-center">
          <div className="space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Lokasi 13 TPS Desa</h4>
            <p className="text-[11px] text-slate-500 font-normal">
              Cek sebaran lokasi TPS di seluruh 13 RW dan 39 RT Desa Kalisalak.
            </p>
          </div>
          <Link href="/tps">
            <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100">
              Lihat Sebaran TPS
            </Button>
          </Link>
        </Card>
      </div>

      {/* Section 6: Dasar Hukum Regulasi Pemilih */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <div className="p-2 bg-slate-100 text-slate-800 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">DASAR HUKUM RESMI</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Regulasi Penyelenggaraan Hak Pilih Pemilih
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
            <Badge variant="primary" className="text-[10px] font-bold">
              UU RI No. 6/2014 jo UU No. 3/2024
            </Badge>
            <h3 className="text-sm font-black text-slate-900 leading-snug">
              Undang-Undang tentang Desa (Pasal 31 s/d 34)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Mengatur bahwa Pemilihan Kepala Desa bersifat langsung, umum, bebas, rahasia, jujur, dan adil oleh warga desa yang telah memenuhi kriteria hak pilih.
            </p>
          </Card>

          <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
            <Badge variant="primary" className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
              PP RI No. 16 Tahun 2026 & Perbup Tegal No. 27/2018
            </Badge>
            <h3 className="text-sm font-black text-slate-900 leading-snug">
              Peraturan Tata Cara Pemilihan & Pemutakhiran DPT
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Mengatur tata cara pencocokan dan penelitian (Coklit) oleh Pantarlih, penetapan DPS, DPSHP, DPT, serta penggunaan DPTb di Tempat Pemungutan Suara.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
