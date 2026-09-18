import React from "react";
import { Navbar, Footer } from "@/components/layout";
import { KetentuanPemilihContent } from "@/components/pages/ketentuan/ketentuan-pemilih-content";

export const metadata = {
  title: "Ketentuan & Syarat Pemilih | Pilkades Desa Kalisalak 2027",
  description:
    "Ketentuan syarat hak pilih pemilih, kriteria TMS, mekanisme DPT/DPS/DPTb, dan dokumen wajib TPS Pilkades Desa Kalisalak, Kecamatan Margasari, Kabupaten Tegal.",
};

export default function KetentuanPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600/20 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <KetentuanPemilihContent />
      </main>

      <Footer />
    </div>
  );
}
