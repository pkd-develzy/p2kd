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
        {/* Official Crest Badge */}
        <div className="flex justify-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="inline-flex items-center justify-center"
          >
            <Logo size="lg" />
          </motion.div>
        </div>

        {/* Institution Badge */}
        <div className="inline-flex items-center gap-2 max-w-full">
          <Badge variant="primary" className="px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-normal sm:tracking-wider shadow-xs bg-blue-50 text-blue-800 border-blue-200 whitespace-nowrap max-w-full truncate">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 inline text-blue-700 shrink-0" />
            <span className="truncate">Panitia Pemilihan Kepala Desa (P2KD) • Desa Kalisalak</span>
          </Badge>
        </div>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
          Sistem Informasi & Pendaftaran Pemilih <br className="hidden sm:inline" />
          <span className="bg-linear-to-r from-blue-700 via-indigo-800 to-blue-950 bg-clip-text text-transparent">
            Pilkades Desa Kalisalak
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
          Kecamatan Margasari, Kabupaten Tegal • Masa Bakti 2027 – 2035. Portal resmi pengecekan hak suara, alokasi Tabung Pemilihan, rekapitulasi DPS, serta kanal pengaduan perbaikan data pemilih yang transparan dan aman.
        </p>

        {/* Fast Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-sm sm:max-w-none mx-auto w-full">
          <Link href="/cek-pemilih" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full shadow-lg shadow-blue-900/20 py-3 px-6 font-extrabold text-xs sm:text-sm rounded-xl justify-center whitespace-nowrap">
              <Search className="w-4 h-4 mr-2" />
              <span>Cek Hak Pilih Sekarang</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>

          <Link href="/aduan" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full shadow-xs py-3 px-5 font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-200 justify-center whitespace-nowrap">
              <FileText className="w-4 h-4 mr-2 text-blue-700" />
              <span>Formulir Aduan Warga</span>
            </Button>
          </Link>
        </div>

        {/* Status Indicator Bar */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
          <div className="inline-flex items-center gap-1.5 font-semibold text-slate-700 bg-white/90 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-slate-200 shadow-xs backdrop-blur-xs whitespace-nowrap">
            <Vote className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>Tahapan: <strong className="text-blue-900 font-bold">Persiapan & Sosialisasi</strong></span>
          </div>

          <div className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-emerald-200 shadow-xs whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Database Terverifikasi Aman</span>
          </div>

          <div className="inline-flex items-center gap-1.5 font-semibold text-indigo-800 bg-indigo-50 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-indigo-200 shadow-xs whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Proteksi Develzy Shield</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
