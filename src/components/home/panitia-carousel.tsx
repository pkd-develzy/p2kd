/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Users,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface PanitiaProfile {
  id: string;
  namaLengkap: string;
  jabatan: string;
  seksi: string;
  seksiLabel: string;
  fotoUrl?: string | null;
}

// Fallback seed data in case API is loading or empty
const DEFAULT_PANITIA_FALLBACK: PanitiaProfile[] = [
  {
    id: "p-1",
    namaLengkap: "KHASANUDIN, S.Pd.SD",
    jabatan: "Ketua P2KD",
    seksi: "PIMPINAN",
    seksiLabel: "Pimpinan Panitia (Ketua)",
  },
  {
    id: "p-2",
    namaLengkap: "HERIK, S.Pd",
    jabatan: "Wakil Ketua",
    seksi: "PIMPINAN",
    seksiLabel: "Pimpinan Panitia (Wakil Ketua)",
  },
  {
    id: "p-3",
    namaLengkap: "AKHMAD SAIFUDIN, S.Kom",
    jabatan: "Sekretaris",
    seksi: "PIMPINAN",
    seksiLabel: "Pimpinan Panitia (Sekretariat)",
  },
  {
    id: "p-4",
    namaLengkap: "MOH. FAUZAN, S.Ak",
    jabatan: "Bendahara",
    seksi: "PIMPINAN",
    seksiLabel: "Pimpinan Panitia (Kebendaharaan)",
  },
  {
    id: "p-5",
    namaLengkap: "AGUS SUPRIYADI",
    jabatan: "Ketua Seksi 1: Pendaftaran Pemilih",
    seksi: "SEKSI_PEMILIH",
    seksiLabel: "Seksi 1: Pendaftaran Pemilih",
  },
  {
    id: "p-6",
    namaLengkap: "BAMBANG IRAWAN",
    jabatan: "Ketua Seksi 2: Penjaringan Balon",
    seksi: "SEKSI_PENJARINGAN",
    seksiLabel: "Seksi 2: Penjaringan Calon",
  },
  {
    id: "p-7",
    namaLengkap: "SLAMET RIYADI",
    jabatan: "Ketua Seksi 3: Penyaringan & Uji Berkas",
    seksi: "SEKSI_PENYARINGAN",
    seksiLabel: "Seksi 3: Penyaringan Calon",
  },
  {
    id: "p-8",
    namaLengkap: "NUR HIDAYAT",
    jabatan: "Ketua Seksi 4: Pemungutan & Penghitungan",
    seksi: "SEKSI_PUNGUT_HITUNG",
    seksiLabel: "Seksi 4: Pungut Hitung",
  },
  {
    id: "p-9",
    namaLengkap: "DIDI SETIAWAN",
    jabatan: "Ketua Seksi 5: Logistik, Publikasi & Humas",
    seksi: "SEKSI_LOGISTIK_PUBLIKASI",
    seksiLabel: "Seksi 5: Logistik & Humas",
  },
];

export const PanitiaCarousel: React.FC = () => {
  const [panitiaList, setPanitiaList] = useState<PanitiaProfile[]>(DEFAULT_PANITIA_FALLBACK);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real-time data from database
  useEffect(() => {
    let isMounted = true;
    fetch("/api/panitia")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setPanitiaList(json.data);
        }
      })
      .catch((err) => console.warn("Load panitia failed:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  // 3-Second Automatic Rotation Timer
  useEffect(() => {
    if (panitiaList.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % panitiaList.length);
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [panitiaList.length, isPaused, currentIndex]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? panitiaList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % panitiaList.length);
  };

  const currentMember = panitiaList[currentIndex] || panitiaList[0];

  const getSeksiColor = (seksi: string) => {
    switch (seksi) {
      case "PIMPINAN":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "SEKSI_PEMILIH":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "SEKSI_PENJARINGAN":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "SEKSI_PENYARINGAN":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
      case "SEKSI_PUNGUT_HITUNG":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "SEKSI_LOGISTIK_PUBLIKASI":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .replace(/S\.Pd\.SD|S\.Pd|S\.Kom|S\.Ak|H\.|Hj\./gi, "")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "PK";
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 30 : -30,
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.35, ease: "easeOut" as const },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -30 : 30,
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.25, ease: "easeIn" as const },
    }),
  };

  return (
    <div
      className="h-full flex flex-col"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Card className="h-full border-blue-800/40 bg-linear-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Card */}
        <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 block">
                Panitia Pelaksana Pilkades
              </span>
              <span className="text-xs font-bold text-white block">
                P2KD Desa Kalisalak
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              {currentIndex + 1} / {panitiaList.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Panitia Sebelumnya"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Panitia Selanjutnya"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Member Profile Showcase (Animated per 3s) */}
        <div className="relative z-10 my-auto py-4 min-h-[140px] flex items-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentMember?.id || currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full flex items-center gap-4"
            >
              {/* Photo Avatar / Frame */}
              <div className="shrink-0 relative">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl p-0.5 bg-linear-to-tr from-amber-400 via-blue-500 to-indigo-500 shadow-md">
                  <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-900 flex items-center justify-center relative">
                    {currentMember?.fotoUrl ? (
                      <img
                        src={currentMember.fotoUrl}
                        alt={currentMember.namaLengkap}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to text avatar on image error
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-blue-900 to-slate-900 text-amber-300 font-black text-xl">
                        {getInitials(currentMember?.namaLengkap || "Panitia")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-blue-600 text-white border-2 border-slate-950 shadow-xs">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              </div>

              {/* Text Information */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <Badge
                  variant="outline"
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getSeksiColor(
                    currentMember?.seksi || "PIMPINAN"
                  )}`}
                >
                  {currentMember?.seksiLabel || currentMember?.seksi}
                </Badge>

                <h3 className="text-sm sm:text-base font-black text-white tracking-tight leading-snug line-clamp-2">
                  {currentMember?.namaLengkap}
                </h3>

                <p className="text-xs font-semibold text-amber-300 line-clamp-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{currentMember?.jabatan}</span>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Bar: 3s Progress Indicator & Footer Link */}
        <div className="relative z-10 pt-3 border-t border-white/10 space-y-2.5">
          {/* Animated 3-Second Progress Bar */}
          <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
            <motion.div
              key={currentIndex}
              initial={{ width: "0%" }}
              animate={{ width: isPaused ? "100%" : "100%" }}
              transition={{ duration: isPaused ? 0 : 3, ease: "linear" }}
              className="h-full bg-linear-to-r from-amber-400 to-blue-400 rounded-full"
            />
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 text-[10px]">
              {isPaused ? "⏸ Dihentikan (Arahkan kursor)" : "⏱ Berganti otomatis tiap 3 dtk"}
            </span>

            <Link
              href="/informasi"
              className="text-blue-300 hover:text-white font-bold flex items-center gap-1 transition-colors hover:underline"
            >
              <span>Struktur Lengkap</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};
