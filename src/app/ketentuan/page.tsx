import React from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Badge, Logo } from "@/components/ui";
import { FileText, ShieldAlert, CheckCircle, Scale, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Ketentuan Layanan | Sistem Pendaftaran Pemilih Kabupaten Tegal",
  description: "Syarat dan ketentuan administrasi pendaftaran pemilih resmi Kabupaten Tegal.",
};

export default function KetentuanPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        {/* Breadcrumb / Back button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Logo size="sm" />
            <Badge variant="primary">Dokumen Regulasi Resmi</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Syarat & Ketentuan Pendaftaran Pemilih
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Panitia Pemilihan Kepala Desa Kalisalak • Terakhir diperbarui: 14 Agustus 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0 mt-0.5">
                <Scale className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">1. Landasan Hukum & Ketentuan Umum</h2>
                <p>
                  Sistem Pendaftaran Pemilih Pilkades Kalisalak diselenggarakan oleh Panitia Pemilihan Kepala Desa Kalisalak berdasarkan Peraturan Daerah Kabupaten Tegal dan Regulasi Pilkades yang berlaku. Layanan ini bertujuan untuk memastikan setiap warga Desa Kalisalak yang memenuhi persyaratan memiliki hak pilih yang sah dan terdaftar dalam Daftar Pemilih Tetap (DPT).
                </p>
              </div>
            </div>
          </Card>

          {/* Section 2 */}
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">2. Syarat Pemilih Terdaftar</h2>
                <p>Warga yang berhak didaftarkan sebagai pemilih adalah mereka yang memenuhi kriteria berikut:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs sm:text-sm">
                  <li>Warga Negara Indonesia (WNI) yang berdomisili di wilayah Kabupaten Tegal.</li>
                  <li>Genap berumur 17 (tujuh belas) tahun atau lebih pada hari pemungutan suara, atau sudah/pernah kawin.</li>
                  <li>Tidak sedang dicabut hak pilihnya berdasarkan putusan pengadilan yang telah mempunyai kekuatan hukum tetap.</li>
                  <li>Bukan merupakan anggota aktif Tentara Nasional Indonesia (TNI) atau Kepolisian Negara Republik Indonesia (Polri).</li>
                  <li>Memiliki Kartu Tanda Penduduk Elektronik (KTP-el) atau Kartu Keluarga (KK) yang valid.</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Section 3 */}
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">3. Prosedur Perbaikan & Mutasi Pemilih</h2>
                <p>
                  Selama masa pengumuman Daftar Pemilih Sementara (DPS), masyarakat dan pengurus wilayah (RT/RW/PPS) berhak mengajukan:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs sm:text-sm">
                  <li><strong>Koreksi Data:</strong> Pembenahan kesalahan penulisan nama, tanggal lahir, jenis kelamin, atau alamat domisili.</li>
                  <li><strong>Pendaftaran Pemilih Baru:</strong> Bagi pemilih pemula atau warga yang belum terdata di DPS.</li>
                  <li><strong>Laporan TMS (Tidak Memenuhi Syarat):</strong> Pelaporan pemilih yang telah meninggal dunia, pindah domisili ke luar daerah, atau menjadi anggota TNI/Polri.</li>
                  <li><strong>Mutasi Tabung:</strong> Permohonan penyesuaian lokasi Tabung Pemilihan sesuai kedekatan tempat tinggal terkini.</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Section 4 */}
          <Card className="p-6 border-rose-200 bg-rose-50/40">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-rose-900">4. Larangan & Sanksi Hukum</h2>
                <p className="text-rose-800 text-xs sm:text-sm">
                  Dilarang keras melakukan manipulasi data kependudukan, pemalsuan identitas NIK/KK, maupun pendaftaran ganda secara sengaja. Segala bentuk pelanggaran hukum administrasi kependudukan dan kepemiluan akan diproses sesuai dengan ketentuan pidana yang berlaku.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
