import React from "react";
import { Navbar, Footer } from "@/components/layout";
import { QuickCheckCard } from "@/components/home/quick-check-card";
import { Badge, Logo } from "@/components/ui";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Cek Hak Pilih Mandiri | Pilkades Desa Kalisalak 2026",
  description: "Layanan periksa NIK dan data pemilih online Pilkades Desa Kalisalak, Kec. Margasari, Kab. Tegal.",
};

export default function CekPemilihPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Logo size="md" />
          </div>
          <Badge variant="primary" className="mb-2">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 inline text-blue-700" />
            Layanan Pencarian Terproteksi Enkripsi
          </Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Pengecekan Daftar Pemilih Mandiri
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Masukkan Nomor Induk Kependudukan (NIK) dan tanggal lahir Anda untuk mengecek status keterdaftaran dan lokasi Tabung Pemilihan Anda di Pilkades Desa Kalisalak.
          </p>
        </div>

        <QuickCheckCard />
      </main>
      <Footer />
    </div>
  );
}
