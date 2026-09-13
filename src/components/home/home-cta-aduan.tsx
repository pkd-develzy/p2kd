"use client";

import React from "react";
import Link from "next/link";
import { MessageSquarePlus, ArrowRight, MapPin, HelpCircle, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const HomeCtaAduan: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <Card className="border-blue-900/40 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white p-8 sm:p-12 rounded-3xl shadow-2xl overflow-hidden relative">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-emerald-300 uppercase bg-emerald-950/80 px-3.5 py-1 rounded-full border border-emerald-600/40 flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Posko Pengaduan & Layanan Warga
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-snug">
              Nama Anda Belum Terdaftar atau Terdapat Kesalahan Penulisan?
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-normal">
              Panitia Pemilihan Kepala Desa (P2KD) Kalisalak membuka kanal pelaporan perbaikan DPSHP secara transparan. Segera ajukan permohonan koreksi atau pendaftaran pemilih baru secara online atau kunjungi sekretariat P2KD di Balai Desa.
            </p>

            <div className="pt-2 flex flex-wrap gap-5 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Balai Desa Kalisalak, Kec. Margasari</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3.5 justify-center">
            <Link href="/aduan" className="w-full">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center bg-white text-blue-950 hover:bg-slate-100 font-black shadow-xl rounded-xl py-3.5 text-sm"
              >
                <MessageSquarePlus className="w-4 h-4 mr-2 text-blue-700" />
                <span>Kirim Aduan Online</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>

            <Link href="/faq" className="w-full">
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-center border-slate-700 bg-white/5 text-white hover:bg-white/10 text-xs font-bold rounded-xl py-3.5 backdrop-blur-xs"
              >
                <HelpCircle className="w-4 h-4 mr-2 text-slate-300" />
                <span>Pusat Bantuan (FAQ)</span>
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};
