import React from "react";
import { Navbar, Footer } from "@/components/layout";
import { DpsTable } from "@/components/pages/dps/dps-table";

export const metadata = {
  title: "Calon DPS (Daftar Pemilih) | Pilkades Kalisalak",
  description: "Rekapitulasi resmi data Calon DPS per wilayah RW dan RT menuju penetapan DPS Pilkades Kalisalak.",
};

export default function DpsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <DpsTable />
      </main>
      <Footer />
    </div>
  );
}
