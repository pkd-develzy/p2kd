import React from "react";
import { Navbar, Footer } from "@/components/layout";
import {
  HeroSection,
  StatsOverview,
  NewsSection,
  HomeTahapanPreview,
  FeaturesGrid,
  HomeCtaAduan,
} from "@/components/home";

export const metadata = {
  title: "Pilkades Desa Kalisalak 2027 | Portal Berita & Informasi Resmi Pemilih",
  description:
    "Portal Berita, Sistem Informasi dan Data Pemilih Pilkades Serentak Desa Kalisalak, Kecamatan Margasari, Kabupaten Tegal.",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600/20 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar />

      <main className="flex-1 space-y-12 pb-16">
        {/* 1. Hero Banner */}
        <section>
          <HeroSection />
        </section>

        {/* 2. Live Metrics & Counters */}
        <section>
          <StatsOverview />
        </section>

        {/* 3. Portal Berita & Dokumentasi Media Warga */}
        <section>
          <NewsSection />
        </section>

        {/* 4. Active Timeline Preview */}
        <section>
          <HomeTahapanPreview />
        </section>

        {/* 4. Citizen Service Modules */}
        <section>
          <FeaturesGrid />
        </section>

        {/* 5. Support & Feedback Helpdesk Banner */}
        <section>
          <HomeCtaAduan />
        </section>
      </main>

      {/* Institutional Footer */}
      <Footer />
    </div>
  );
}
