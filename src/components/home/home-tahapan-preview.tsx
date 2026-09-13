"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, Vote, Lock } from "lucide-react";

const emptySubscribe = () => () => {};

export const HomeTahapanPreview: React.FC = () => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const formattedDate = isMounted
    ? new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-blue-700 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Keputusan Bupati Tegal No. 100.3.3.2/713 Tahun 2026
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tahapan & Agenda Resmi Terkini
          </h2>
          {formattedDate && (
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Status Terhitung Otomatis per Hari Ini: <strong className="text-slate-800">{formattedDate}</strong>
            </p>
          )}
        </div>
        <Link
          href="/tahapan"
          className="inline-flex items-center text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all w-fit"
        >
          <span>Lihat Seluruh 9 Tahapan Lengkap</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Phase 1: Currently Active (Persiapan & Sosialisasi) */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card className="h-full p-6 border-2 border-blue-500 bg-gradient-to-b from-blue-50/80 to-white rounded-3xl shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-2.5 h-full bg-blue-600" />
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-black text-blue-900 bg-blue-100 px-2.5 py-1 rounded-lg">
                  TAHAP 01 (AKTIF)
                </span>
                <Badge variant="primary" className="font-black animate-pulse px-2.5 py-0.5 shadow-xs">
                  SEDANG BERJALAN
                </Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Persiapan & Pembentukan Panitia</h3>
              <div className="text-xs text-blue-900 font-bold flex items-center gap-1.5 mb-3 bg-blue-100/80 p-2 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                <span>Agustus – November 2026</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sosialisasi tingkat Kabupaten/Kecamatan/Desa, pembentukan Panitia Pilkades oleh BPD (24 Ags 2026), dan persiapan administrasi.
              </p>
            </div>
            <div className="pt-4 border-t border-blue-100 mt-4 text-[11px] font-bold text-blue-800 flex items-center justify-between">
              <span>Dasar: SK Bupati Tegal</span>
              <Link href="/informasi" className="text-blue-700 hover:underline">
                Pelajari Regulasi →
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Phase 2: Upcoming (Pencalonan & Pendataan Pemilih) */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card className="h-full p-6 border-slate-200/90 bg-gradient-to-b from-slate-50/60 to-white rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  TAHAP 02 & 03
                </span>
                <Badge variant="outline" className="font-bold border-slate-300">
                  TERJADWAL
                </Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Pencalonan & Pendataan DPS</h3>
              <div className="text-xs text-slate-600 font-semibold flex items-center gap-1.5 mb-3 bg-slate-100 p-2 rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Nov – Des 2026</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pendaftaran bakal calon kades (12–20 Nov), pendataan penduduk pemilih, penetapan DPS (11 Des), dan tanggapan perbaikan DPSHP (14–24 Des).
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>Penetapan DPT: 28 Des 2026</span>
              <Link href="/tahapan" className="text-slate-700 hover:underline font-bold">
                Lihat Jadwal →
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Phase 3: Voting Day Target */}
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card className="h-full p-6 border-indigo-200/90 bg-gradient-to-b from-indigo-50/50 to-white rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-black text-indigo-900 bg-indigo-100 px-2.5 py-1 rounded-lg">
                  TAHAP 08 (HARI H)
                </span>
                <Badge variant="outline" className="font-bold border-indigo-300 text-indigo-900">
                  PEMUNGUTAN SUARA
                </Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Pencoblosan & Penetapan</h3>
              <div className="text-xs text-indigo-900 font-bold flex items-center gap-1.5 mb-3 bg-indigo-100/80 p-2 rounded-xl">
                <Vote className="w-3.5 h-3.5 text-indigo-700" />
                <span>Rabu, 3 Februari 2027</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pencoblosan serentak di seluruh Tabung Pemilihan Desa Kalisalak (07.00–13.00 WIB), penghitungan suara, dan penetapan Calon Kades Terpilih.
              </p>
            </div>
            <div className="pt-4 border-t border-indigo-100 mt-4 text-[11px] font-semibold text-indigo-900 flex items-center gap-1">
              <Lock className="w-3 h-3 text-indigo-500" />
              <span>Pelantikan Serentak: Feb–Apr 2027</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
