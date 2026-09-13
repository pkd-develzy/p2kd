import React from "react";
import { Navbar, Footer } from "@/components/layout";
import { TpsList } from "@/components/pages/tps/tps-list";

export const metadata = {
  title: "Daftar Tabung Pemilihan | Pilkades Desa Kalisalak",
  description: "Daftar lokasi dan sebaran 13 Tabung Pemilihan Pilkades Desa Kalisalak.",
};

export default function TpsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <TpsList />
      </main>
      <Footer />
    </div>
  );
}
