import React from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Badge, Logo } from "@/components/ui";
import { Shield, Lock, EyeOff, Server, ArrowLeft, KeyRound } from "lucide-react";

export const metadata = {
  title: "Kebijakan Privasi | Sistem Pendaftaran Pemilih Kabupaten Tegal",
  description: "Standar perlindungan data pribadi dan enkripsi kependudukan Kabupaten Tegal.",
};

export default function PrivasiPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        {/* Breadcrumb */}
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
            <Badge variant="success">UU PDP No. 27 Tahun 2022 Compliant</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kebijakan Perlindungan Data Pribadi (Privasi)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Panitia Pemilihan Kepala Desa Kalisalak • Komitmen Keamanan Database Tertinggi
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">1. Komitmen Perlindungan Data Kependudukan</h2>
                <p>
                  Panitia Pemilihan Kepala Desa Kalisalak berkomitmen penuh untuk melindungi kerahasiaan dan integritas data pribadi seluruh warga negara sesuai dengan <strong>Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)</strong>. Data yang dikumpulkan semata-mata digunakan untuk kepentingan validasi hak pilih dan administrasi kepemiluan yang sah.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 2 */}
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0 mt-0.5">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">2. Sistem Keamanan & Proteksi Database Terenkripsi</h2>
                <p>
                  Sistem menerapkan arsitektur perlindungan data modern pada informasi kependudukan warga:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs sm:text-sm">
                  <li><strong>Proteksi Identitas:</strong> Nomor Induk Kependudukan (NIK) dan Nomor Kartu Keluarga (KK) dilindungi enkripsi server tingkat tinggi sebelum disimpan ke database.</li>
                  <li><strong>Validasi Integritas:</strong> Database menjaga keaslian data pemilih dan mencegah kebocoran dengan protokol keamanan berlapis.</li>
                  <li><strong>Koneksi Terenkripsi Aman:</strong> Seluruh komunikasi data dari browser warga ke server dilindungi oleh enkripsi transit SSL/TLS terverifikasi.</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Section 3 */}
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 shrink-0 mt-0.5">
                <EyeOff className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">3. Pembatasan Tampilan Publik (Data Masking)</h2>
                <p>
                  Pada portal pencarian mandiri (Cek Hak Pilih publik), sistem secara ketat membatasi informasi yang ditampilkan:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs sm:text-sm">
                  <li>NIK tidak pernah ditampilkan secara utuh pada layar publik.</li>
                  <li>Alamat lengkap RT/RW spesifik, nomor kontak, dan data keluarga tidak diekspos melalui API publik.</li>
                  <li>API publik dilengkapi dengan <em>Rate Limiter</em> untuk mencegah teknik pencarian otomatis (scraping / automated enumeration).</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Section 4 */}
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">4. Pembatasan Hak Akses & Audit Trail</h2>
                <p>
                  Akses terhadap data pemilih hanya diberikan kepada petugas resmi yang memiliki otorisasi melalui sistem <strong>Role-Based Access Control (RBAC)</strong>. Setiap aktivitas membuka, mengubah, atau mengekspor data dicatat dalam <em>Audit Log</em> permanen yang mencantumkan waktu, alamat IP, dan identitas petugas.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 5 */}
          <Card className="p-6 border-blue-200 bg-blue-50/40">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                <Server className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-blue-900">5. Ketiadaan Bagi-Pakai Komersial</h2>
                <p className="text-blue-800 text-xs sm:text-sm">
                  Panitia Pemilihan Kepala Desa Kalisalak tidak pernah menjual, menyewakan, atau membagikan data pemilih kepada pihak ketiga untuk kepentingan komersial, periklanan, maupun kepentingan non-pemerintahan lainnya.
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
