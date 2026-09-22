import React from "react";
import { Navbar, Footer } from "@/components/layout";
import {
  HeroSection,
  StatsOverview,
  NewsSection,
  HomeCalonSection,
  HomeTahapanPreview,
  FeaturesGrid,
  HomeCtaAduan,
  PopupInfoModal,
} from "@/components/home";
import { dataStore } from "@/lib/data-store";

export const revalidate = 60;

export const metadata = {
  title: "Pilkades Desa Kalisalak 2027 | Portal Berita & Informasi Resmi Pemilih",
  description:
    "Portal Berita, Sistem Informasi dan Data Pemilih Pilkades Serentak Desa Kalisalak, Kecamatan Margasari, Kabupaten Tegal.",
};

export default async function Home() {
  await dataStore.ensureSynced();

  const webConfig = dataStore.getWebConfig();
  const allBerita = dataStore.getBeritaList("ALL", "PUBLISHED");
  const headline = allBerita.find((b) => b.isHeadline) || allBerita[0] || null;
  const initialCalonList = dataStore.getKandidatList();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600/20 selection:text-blue-900">
      {/* Informational Announcement Popup Modal (Cloudinary Storage, max 3 slides) */}
      <PopupInfoModal
        isPopupActive={webConfig.isPopupActive}
        popupSlides={webConfig.popupSlides}
        popupAutoSlide={webConfig.popupAutoSlide}
        popupInterval={webConfig.popupInterval}
      />

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
          <NewsSection initialHeadline={headline} initialArticles={allBerita.slice(0, 6)} />
        </section>

        {/* 4. Detail Profil Calon & Pendaftar Kepala Desa */}
        <section>
          <HomeCalonSection initialCalonList={initialCalonList} />
        </section>

        {/* 5. Active Timeline Preview */}
        <section>
          <HomeTahapanPreview />
        </section>

        {/* 6. Citizen Service Modules */}
        <section>
          <FeaturesGrid />
        </section>

        {/* 7. Support & Feedback Helpdesk Banner */}
        <section>
          <HomeCtaAduan />
        </section>
      </main>

      {/* Institutional Footer */}
      <Footer />
    </div>
  );
}
