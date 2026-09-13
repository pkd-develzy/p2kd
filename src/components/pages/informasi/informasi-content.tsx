"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, Logo } from "@/components/ui";
import { ShieldCheck, Users, Landmark, Scale, BookOpen, UserCheck, Award, FileCheck2 } from "lucide-react";

export const InformasiContent: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-3">
          <Logo size="md" />
        </div>
        <Badge variant="primary" className="mb-2">
          <BookOpen className="w-3.5 h-3.5 mr-1.5 inline text-blue-700" />
          Portal Regulasi & Informasi Resmi Pilkades
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Pemilihan Kepala Desa Kalisalak
        </h1>
        <p className="text-sm text-slate-600 mt-2 font-medium">
          Kecamatan Margasari, Kabupaten Tegal • Masa Bakti 2027 – 2035 (8 Tahun) • Panitia Pemilihan Kepala Desa (P2KD)
        </p>
      </div>

      {/* Tata Cara Pilkades Berdasarkan PP No. 16 Tahun 2026 */}
      <Card className="p-6 sm:p-8 bg-linear-to-br from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl shadow-xl border border-blue-800/40">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-800/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600/30 border border-blue-400/30 rounded-xl">
                <Scale className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider">
                  REGULASI UTAMA NASIONAL
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Tata Cara Pilkades Menurut PP Nomor 16 Tahun 2026 (Pasal 38 s/d 50)
                </h3>
              </div>
            </div>
            <Badge variant="primary" className="bg-blue-600 text-white border-none font-bold text-[11px]">
              PP 16/2026 & UU 3/2024
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-200">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2">
              <h4 className="font-bold flex items-center gap-2 text-sm text-blue-300">
                <Users className="w-4 h-4 text-blue-400" />
                1. Tahapan & Jumlah Calon (Pasal 38 & 39)
              </h4>
              <p className="leading-relaxed text-slate-300">
                Pilkades dilaksanakan bergelombang dalam 4 tahapan makro (Persiapan, Pencalonan, Pemungutan Suara, Penetapan). Jumlah calon yang berhak mengikuti Pilkades ditetapkan <strong>paling sedikit 2 (dua) orang dan paling banyak 5 (lima) orang</strong>.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2">
              <h4 className="font-bold flex items-center gap-2 text-sm text-amber-300">
                <Award className="w-4 h-4 text-amber-400" />
                2. Masa Jabatan Kades 8 Tahun (Pasal 50)
              </h4>
              <p className="leading-relaxed text-slate-300">
                Kepala Desa terpilih memegang jabatan selama <strong>8 (delapan) tahun</strong> (Masa Bakti 2027–2035) dan dapat menjabat paling banyak <strong>2 (dua) kali masa jabatan</strong> secara berturut-turut atau tidak berturut-turut.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2">
              <h4 className="font-bold flex items-center gap-2 text-sm text-emerald-300">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                3. Ketentuan Pilkades 1 Calon (Pasal 44 & 46)
              </h4>
              <p className="leading-relaxed text-slate-300">
                Jika hanya 1 calon setelah perpanjangan pendaftaran (15 hari + 10 hari) dan disepakati bersama BPD, pemilihan tetap dilaksanakan menggunakan surat suara 2 kolom: <strong>1 kolom foto calon dan 1 kolom kosong tidak bergambar</strong>.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2">
              <h4 className="font-bold flex items-center gap-2 text-sm text-rose-300">
                <UserCheck className="w-4 h-4 text-rose-400" />
                4. Kewajiban Cuti & Pengunduran Diri (Pasal 40–42)
              </h4>
              <p className="leading-relaxed text-slate-300">
                Kades petahana wajib cuti sejak ditetapkan sebagai calon. PNS wajib izin tertulis & cuti. Perangkat Desa yang mencalonkan diri wajib cuti dan <strong>wajib mengundurkan diri</strong> dari jabatan perangkat setelah ditetapkan sebagai calon resmi.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid Informasi Umum */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="h-full border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                  <Landmark className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">Visi Pemilihan Bersih & Damai</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2.5 pt-4">
              <p className="leading-relaxed">
                Menjamin hak pilih setiap warga Desa Kalisalak untuk menentukan pemimpin desa secara demokratis, transparan, jujur, dan berkeadilan.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 pt-1 font-medium">
                <li>Satu data master pemilih terpadu untuk seluruh 13 RW dan 39 RT Desa Kalisalak.</li>
                <li>Perlindungan privasi identitas NIK warga Kalisalak dengan sistem keamanan database terverifikasi.</li>
                <li>Penyediaan posko aduan dan perbaikan data yang terbuka untuk masyarakat.</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="h-full border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Scale className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">Hierarki Regulasi & Dasar Hukum</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2.5 pt-4">
              <p className="leading-relaxed">
                Penyelenggaraan Pilkades Serentak Desa Kalisalak berpedoman teguh pada regulasi resmi:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 pt-1 font-medium">
                <li><strong>UU No. 3 Tahun 2024</strong> tentang Perubahan Kedua UU No. 6 Tahun 2014 tentang Desa.</li>
                <li><strong>PP Republik Indonesia No. 16 Tahun 2026</strong> tentang Peraturan Pelaksanaan UU Desa (Ditetapkan Presiden Prabowo Subianto).</li>
                <li><strong>Keputusan Bupati Tegal No. 100.3.3.2/713 Tahun 2026</strong> tentang Tahapan Pilkades Serentak Gelombang I Tahun 2027 (Tertanggal 4 Agustus 2026).</li>
                <li><strong>Perbup Tegal No. 27 Tahun 2018 jo. Perbup No. 31 Tahun 2019</strong> tentang Petunjuk Teknis Kepala Desa.</li>
                <li><strong>Keputusan BPD Desa Kalisalak</strong> tentang Pembentukan Panitia Pemilihan Kepala Desa (P2KD).</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="h-full border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Users className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">Penyelenggara & Pengawas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2.5 pt-4">
              <p className="leading-relaxed">
                Struktur kepanitiaan dan pengawasan pelaksanaan Pilkades:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 pt-1 font-medium">
                <li><strong className="text-slate-900 font-bold">P2KD Kalisalak:</strong> Panitia Pemilihan Kepala Desa selaku pelaksana teknis.</li>
                <li><strong className="text-slate-900 font-bold">BPD Kalisalak:</strong> Badan Permusyawaratan Desa selaku penanggung jawab pembentukan & pengawasan.</li>
                <li><strong className="text-slate-900 font-bold">Pantarlih RT/RW:</strong> Petugas pemutakhiran data pemilih di tingkat rukun tetangga.</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="h-full border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">Sistem Informasi Desa Digital</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2.5 pt-4">
              <p className="leading-relaxed">
                Sesuai amanat Pasal 164 PP No. 16 Tahun 2026 mengenai Sistem Informasi Desa:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 pt-1 font-medium">
                <li>Satu basis data digital terpadu dengan perlindungan privasi server yang aman.</li>
                <li>Pencatatan Audit Trail transparan untuk setiap aksi petugas administrasi.</li>
                <li>Penguncian data DPT menggunakan tanda tangan digital berstandar keamanan resmi.</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
