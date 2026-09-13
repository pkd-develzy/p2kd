"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Vote, Search, FileText, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Badge, Logo, Button } from "@/components/ui";

export const HeroSection: React.FC = () => {
  return (
    <div className="relative pt-8 pb-14 text-center max-w-5xl mx-auto px-4 overflow-hidden">
      {/* Dynamic Background Glowing Mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-162.5 h-85 bg-linear-to-tr from-blue-200/60 via-indigo-100/50 to-teal-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Official Crest Badge with Glow */}
        <div className="flex justify-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-3.5 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-blue-900/5 backdrop-blur-xs"
          >
            <Logo size="lg" />
          </motion.div>
        </div>

        {/* Institution Badge */}
        <div className="inline-flex items-center gap-2">
          <Badge variant="primary" className="px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-xs bg-blue-50 text-blue-800 border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 inline text-blue-700" />
            Panitia Pemilihan Kepala Desa (P2KD) • Desa Kalisalak
          </Badge>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
          Sistem Informasi & Pendaftaran Pemilih <br className="hidden sm:inline" />
          <span className="bg-linear-to-r from-blue-700 via-indigo-800 to-blue-950 bg-clip-text text-transparent">
            Pilkades Desa Kalisalak
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
          Kecamatan Margasari, Kabupaten Tegal • Masa Bakti 2027 – 2035. Portal resmi pengecekan hak suara, alokasi TPS, rekapitulasi DPS, serta kanal pengaduan perbaikan data pemilih yang transparan dan aman.
        </p>

        {/* Fast Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
          <Link href="/cek-pemilih">
            <Button variant="primary" size="lg" className="shadow-lg shadow-blue-900/20 py-3 px-6 font-extrabold text-sm rounded-xl">
              <Search className="w-4 h-4 mr-2" />
              <span>Cek Hak Pilih Sekarang</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>

          <Link href="/aduan">
            <Button variant="secondary" size="lg" className="shadow-xs py-3 px-5 font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-200">
              <FileText className="w-4 h-4 mr-2 text-blue-700" />
              <span>Formulir Aduan Warga</span>
            </Button>
          </Link>
        </div>

        {/* Status Indicator Bar */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white/90 px-4 py-2 rounded-full border border-slate-200 shadow-xs backdrop-blur-xs">
            <Vote className="w-4 h-4 text-blue-700" />
            <span>Tahapan Berjalan: <strong className="text-blue-900 font-bold">Persiapan & Sosialisasi</strong></span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-full border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sistem Database Server Terverifikasi Aman</span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 px-3.5 py-2 rounded-full border border-indigo-200 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Proteksi Keamanan Database • Develzy Shield</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
