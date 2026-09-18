import React from "react";
import { Navbar, Footer } from "@/components/layout";
import { StrukturContent } from "@/components/pages/struktur/struktur-content";

export const metadata = {
  title: "Struktur Organisasi Panitia P2KD | Pilkades Desa Kalisalak 2027",
  description:
    "Susunan resmi Struktur Organisasi, Pimpinan, dan Seksi 1 s/d Seksi 6 Panitia Pemilihan Kepala Desa (P2KD) Kalisalak, Kecamatan Margasari, Kabupaten Tegal.",
};

export default function StrukturPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600/20 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <StrukturContent />
      </main>

      <Footer />
    </div>
  );
}
