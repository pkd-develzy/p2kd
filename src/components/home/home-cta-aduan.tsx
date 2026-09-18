"use client";

import React from "react";
import Link from "next/link";
import { MessageSquarePlus, ArrowRight, MapPin, HelpCircle, ShieldCheck, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PanitiaCarousel } from "./panitia-carousel";

export const HomeCtaAduan: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Col: Posko Pengaduan & Layanan Warga */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
          <Card className="h-full border-blue-900/40 bg-linear-to-br from-slate-950 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 md:p-10 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col justify-between">
            <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -top-16 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-black tracking-wider text-emerald-300 uppercase bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-600/40 flex items-center gap-1.5 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Posko Pengaduan & Layanan Warga
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
                Nama Anda Belum Terdaftar atau Terdapat Kesalahan Penulisan?
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Panitia Pemilihan Kepala Desa (P2KD) Kalisalak membuka kanal pelaporan perbaikan DPSHP secara transparan. Segera ajukan permohonan koreksi atau pendaftaran pemilih baru secara online atau kunjungi sekretariat P2KD di Balai Desa.
              </p>

              <div className="pt-1 flex flex-wrap gap-2.5 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10 text-[11px] sm:text-xs">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Balai Desa Kalisalak</span>
                </div>
                <a
                  href="https://wa.me/6285879584257?text=Halo%20Panitia%20P2KD%20Kalisalak%2C%20saya%20butuh%20bantuan%20layanan%20pemilih"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 transition-colors text-[11px] sm:text-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Hotline WA: 0858-7958-4257</span>
                </a>
              </div>
            </div>

            <div className="relative z-10 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/aduan" className="w-full">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center bg-white text-blue-950 hover:bg-slate-100 font-black shadow-xl rounded-xl py-3 text-xs sm:text-sm"
                >
                  <MessageSquarePlus className="w-4 h-4 mr-2 text-blue-700 shrink-0" />
                  <span>Kirim Aduan Online</span>
                  <ArrowRight className="w-4 h-4 ml-1.5 shrink-0" />
                </Button>
              </Link>

              <Link href="/faq" className="w-full">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-center border-slate-700 bg-white/5 text-white hover:bg-white/10 text-xs font-bold rounded-xl py-3 backdrop-blur-xs"
                >
                  <HelpCircle className="w-4 h-4 mr-2 text-slate-300 shrink-0" />
                  <span>Pusat Bantuan (FAQ)</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Col: Panitia Profil Showcase (Berganti 3 Detik Sekali) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col">
          <PanitiaCarousel />
        </div>
      </div>
    </div>
  );
};
