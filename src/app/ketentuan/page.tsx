import React from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Badge, Logo, Button } from "@/components/ui";
import {
  FileText,
  ShieldAlert,
  CheckCircle2,
  Scale,
  ArrowLeft,
  Vote,
  Award,
  ExternalLink,
  BookOpen,
  Calendar,
  AlertTriangle,
  FileCheck2,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Syarat & Larangan Pendaftaran Calon Kepala Desa | Pilkades Kalisalak 2027",
  description:
    "Persyaratan resmi, larangan, periodisasi masa jabatan 8 tahun, dan dasar hukum pencalonan Kepala Desa Kalisalak Kabupaten Tegal berdasarkan UU No. 3/2024 dan PP No. 16/2026.",
};

export default function KetentuanPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600/20 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full space-y-8">
        {/* Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Beranda
          </Link>

          <Link href="/calon">
            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl gap-1.5">
              <Vote className="w-3.5 h-3.5 text-blue-600" />
              <span>Lihat Profil Calon</span>
            </Button>
          </Link>
        </div>

        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="flex justify-center mb-2">
            <Logo size="md" />
          </div>
          <Badge variant="primary" className="px-3.5 py-1 text-xs font-bold">
            <Scale className="w-3.5 h-3.5 mr-1.5 inline text-blue-700" />
            Dokumen Regulasi & Pedoman Resmi P2KD
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Syarat dan Larangan Pendaftaran Calon Kepala Desa Kalisalak
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Kecamatan Margasari, Kabupaten Tegal • Berpedoman pada UU No. 3 Tahun 2024 & PP No. 16 Tahun 2026
          </p>
        </div>

        {/* Highlight Banner: Masa Jabatan 8 Tahun (UU 3/2024 & PP 16/2026) */}
        <Card className="p-6 sm:p-8 bg-linear-to-br from-slate-950 via-blue-950 to-indigo-950 text-white rounded-3xl shadow-xl border border-blue-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="text-[11px] font-black tracking-wider text-amber-300 uppercase bg-amber-400/15 px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Ketentuan Penting Masa Jabatan (Regulasi Nasional Terbaru)
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">
              Masa Jabatan Kepala Desa 8 Tahun & Maksimal 2 Kali Masa Jabatan
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Masa jabatan Kepala Desa adalah <strong>8 (delapan) tahun</strong> terhitung sejak tanggal pelantikan dan dapat menjabat paling banyak <strong>2 (dua) kali masa jabatan</strong>, baik secara berturut-turut maupun tidak secara berturut-turut.
            </p>
            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-xs text-amber-200">
              ⚠️ <strong>Catatan Penting:</strong> Seseorang yang telah menjabat Kepala Desa sebanyak 2 (dua) kali masa jabatan <strong>tidak dapat mencalonkan diri kembali</strong>. Ketentuan periodisasi tersebut juga mencakup masa jabatan Kepala Desa antarwaktu. Ketentuan baru 8 tahun 2 periode menggantikan aturan lama (6 tahun 3 periode) berdasarkan UU 3/2024 dan PP 16/2026.
            </div>
          </div>
        </Card>

        {/* Section A: Syarat Pendaftaran Calon Kepala Desa */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">BAGIAN A</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Persyaratan Calon Kepala Desa
              </h2>
            </div>
          </div>

          <Card className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
            <p className="text-xs sm:text-sm text-slate-700 font-medium">
              Calon Kepala Desa Kalisalak wajib memenuhi seluruh persyaratan administratif dan kualifikasi berikut:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[
                { no: 1, text: "Warga Negara Indonesia (WNI)." },
                { no: 2, text: "Bertakwa kepada Tuhan Yang Maha Esa." },
                {
                  no: 3,
                  text: "Memegang teguh dan mengamalkan Pancasila, melaksanakan UUD 1945, serta mempertahankan keutuhan NKRI dan Bhinneka Tunggal Ika.",
                },
                {
                  no: 4,
                  text: "Berpendidikan paling rendah tamat Sekolah Menengah Pertama (SMP) atau sederajat.",
                },
                {
                  no: 5,
                  text: "Berusia paling rendah 25 (dua puluh lima) tahun pada saat mendaftar.",
                },
                { no: 6, text: "Bersedia dicalonkan menjadi Kepala Desa." },
                { no: 7, text: "Tidak sedang menjalani hukuman pidana penjara." },
                {
                  no: 8,
                  text: "Tidak pernah dijatuhi pidana penjara berkekuatan hukum tetap karena tindak pidana berancaman ≥ 5 tahun, kecuali telah lewat 5 tahun setelah selesai menjalani pidana serta mengumumkan secara jujur dan terbuka kepada publik bahwa pernah dipidana dan bukan residivis.",
                },
                {
                  no: 9,
                  text: "Tidak sedang dicabut hak pilihnya berdasarkan putusan pengadilan yang telah mempunyai kekuatan hukum tetap.",
                },
                { no: 10, text: "Berbadan sehat jasmani dan rohani." },
                {
                  no: 11,
                  text: "Tidak pernah menjabat sebagai Kepala Desa selama 2 (dua) kali masa jabatan.",
                },
                {
                  no: 12,
                  text: "Memenuhi persyaratan lain yang ditetapkan dalam Peraturan Daerah Kabupaten Tegal dan peraturan pelaksanaannya yang sah.",
                },
              ].map((item) => (
                <div
                  key={item.no}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {item.no}
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-normal">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Section B: Larangan & Kriteria Tidak Memenuhi Syarat (TMS) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
            <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">BAGIAN B</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Larangan & Kriteria Tidak Memenuhi Syarat (TMS)
              </h2>
            </div>
          </div>

          <Card className="p-6 sm:p-8 bg-rose-50/40 border border-rose-200 rounded-3xl shadow-xs space-y-4">
            <p className="text-xs sm:text-sm text-rose-950 font-bold">
              Bakal calon Kepala Desa <span className="underline decoration-rose-500">TIDAK DAPAT DITETAPKAN</span> sebagai calon apabila:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Bukan Warga Negara Indonesia (WNI).",
                "Berusia kurang dari 25 (dua puluh lima) tahun pada saat mendaftar.",
                "Berpendidikan di bawah Sekolah Menengah Pertama (SMP) atau sederajat.",
                "Tidak bersedia dicalonkan menjadi Kepala Desa.",
                "Sedang menjalani hukuman pidana penjara.",
                "Belum memenuhi ketentuan mengenai riwayat tindak pidana sebagaimana dipersyaratkan dalam Pasal 33 UU Nomor 3 Tahun 2024.",
                "Sedang dicabut hak pilihnya berdasarkan putusan pengadilan yang berkekuatan hukum tetap.",
                "Telah pernah menjabat sebagai Kepala Desa selama 2 (dua) kali masa jabatan.",
                "Tidak memenuhi persyaratan kesehatan yang diwajibkan.",
                "Tidak memenuhi persyaratan lain yang secara sah ditetapkan dalam Peraturan Daerah Kabupaten Tegal dan peraturan pelaksanaannya.",
              ].map((larangan, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-rose-100 shadow-2xs text-xs text-rose-950 font-medium"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{larangan}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Section C: Dasar Hukum & Link Resmi */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">DASAR HUKUM RESMI</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Hierarki Regulasi & Referensi Peraturan Perundang-Undangan
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. UU 3/2024 */}
            <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="primary" className="text-[10px] font-bold">
                    UU RI No. 3 Tahun 2024
                  </Badge>
                  <span className="text-[10px] text-slate-400">Berlaku 25 April 2024</span>
                </div>
                <h3 className="text-sm font-black text-slate-900 leading-snug">
                  Perubahan Kedua UU No. 6/2014 tentang Desa
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Pasal 33</strong> (Persyaratan Calon Kepala Desa) & <strong>Pasal 39</strong> (Masa jabatan Kades 8 tahun dan paling banyak 2 kali masa jabatan berturut-turut atau tidak berturut-turut).
                </p>
              </div>

              <a
                href="https://peraturan.bpk.go.id/Details/283617/uu-no-3-tahun-2024"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs font-bold text-blue-700 hover:text-blue-900 gap-1 pt-2 border-t border-slate-100"
              >
                <span>Teks Resmi BPK RI (UU 3/2024)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Card>

            {/* 2. PP 16/2026 */}
            <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="primary" className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
                    PP RI No. 16 Tahun 2026
                  </Badge>
                  <span className="text-[10px] text-slate-400">Berlaku 27 Maret 2026</span>
                </div>
                <h3 className="text-sm font-black text-slate-900 leading-snug">
                  Peraturan Pelaksanaan UU Desa (Presiden RI)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mencabut PP 43/2014. <strong>Pasal 50</strong> menegaskan masa jabatan 8 tahun, maksimal 2 periode (termasuk jabatan antarwaktu).
                </p>
              </div>

              <a
                href="https://peraturan.bpk.go.id/Details/349409/pp-no-16-tahun-2026"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs font-bold text-indigo-700 hover:text-indigo-900 gap-1 pt-2 border-t border-slate-100"
              >
                <span>Teks Resmi BPK RI (PP 16/2026)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Card>

            {/* 3. Perda Kab Tegal 6/2015 jo 14/2016 */}
            <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold">
                    Perda Kab. Tegal 6/2015 & 14/2016
                  </Badge>
                  <span className="text-[10px] text-slate-400">JDIH Kab. Tegal</span>
                </div>
                <h3 className="text-sm font-black text-slate-900 leading-snug">
                  Kepala Desa, Perangkat Desa & BPD Kabupaten Tegal
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pengaturan teknis daerah mengenai tata laksana pemilihan, kelembagaan BPD, dan syarat pencalonan Kepala Desa di Kabupaten Tegal.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                <a
                  href="https://jdih.tegalkab.go.id/ProdukHukum/detail/417"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Perda 6/2015</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-300">•</span>
                <a
                  href="https://jdih.tegalkab.go.id/ProdukHukum/detail/634"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Perubahan (Perda 14/2016)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Card>

            {/* 4. Perbup Tegal 27/2018 jo 31/2019 */}
            <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold">
                    Perbup Tegal 27/2018 & 31/2019
                  </Badge>
                  <span className="text-[10px] text-slate-400">JDIH Kab. Tegal</span>
                </div>
                <h3 className="text-sm font-black text-slate-900 leading-snug">
                  Petunjuk Teknis Pelaksanaan Pilkades Kab. Tegal
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pedoman teknis panitia pemilihan (P2KD), penjaringan berkas, penyaringan seleksi tambahan (jika &gt; 5 calon), dan pemungutan suara.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                <a
                  href="https://jdih.tegalkab.go.id/ProdukHukum/detail/714"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Perbup 27/2018</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-300">•</span>
                <a
                  href="https://jdih.tegalkab.go.id/ProdukHukum/detail/782"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Perubahan (Perbup 31/2019)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Card>
          </div>
        </div>

        {/* Section D: Syarat Pemilih (Warga) */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
            <div className="p-2 bg-slate-100 text-slate-800 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">HAK SUARA WARGA</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Ketentuan Pemilih Terdaftar (Hak Pilih Warga)
              </h2>
            </div>
          </div>

          <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <p className="text-xs sm:text-sm text-slate-700">
              Warga Desa Kalisalak yang berhak didaftarkan dalam Daftar Pemilih Tetap (DPT) adalah:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
              <li>Warga Negara Indonesia (WNI) yang berdomisili di wilayah Desa Kalisalak dibuktikan dengan KTP-el / KK sah.</li>
              <li>Genap berumur 17 (tujuh belas) tahun atau lebih pada hari pemungutan suara (3 Februari 2027), atau sudah/pernah kawin.</li>
              <li>Tidak sedang dicabut hak pilihnya berdasarkan putusan pengadilan yang berkekuatan hukum tetap.</li>
              <li>Bukan merupakan anggota aktif TNI atau POLRI.</li>
              <li>Telah terdaftar dalam penetapan Daftar Pemilih Tetap (DPT) oleh P2KD Kalisalak.</li>
            </ul>
          </Card>
        </div>

        {/* Bottom CTA */}
        <Card className="p-6 sm:p-8 bg-slate-100 border border-slate-200 rounded-3xl text-center space-y-3">
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Konsultasi Pendaftaran Bakal Calon Kepala Desa
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
            Bakal calon Kepala Desa dapat berkonsultasi mengenai kelengkapan berkas pendaftaran langsung dengan Seksi 2 (Penjaringan) di Sekretariat P2KD Balai Desa Kalisalak.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tahapan">
              <Button variant="primary" size="sm" className="text-xs font-bold rounded-xl">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                <span>Lihat Jadwal Tahapan Penjaringan</span>
              </Button>
            </Link>
            <Link href="/calon">
              <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
                <Vote className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                <span>Lihat Profil Calon Kades</span>
              </Button>
            </Link>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
