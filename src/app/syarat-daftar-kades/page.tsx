import React from "react";
import { Navbar, Footer } from "@/components/layout";
import { SyaratKadesContent } from "@/components/pages/syarat-kades/syarat-kades-content";

export const metadata = {
  title: "Syarat & Larangan Pendaftaran Calon Kepala Desa | Pilkades Kalisalak 2027",
  description:
    "Syarat resmi pendaftaran calon Kepala Desa, larangan, periodisasi masa jabatan 8 tahun, dan dasar hukum UU No. 3/2024 serta PP No. 16/2026 Desa Kalisalak Kabupaten Tegal.",
};

export default function SyaratDaftarKadesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600/20 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <SyaratKadesContent />
      </main>

      <Footer />
    </div>
  );
}
