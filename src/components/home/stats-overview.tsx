"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, FileCheck2, UserCheck, MapPinned, ArrowUpRight } from "lucide-react";
import { Card, AnimatedCounter } from "@/components/ui";

interface StatsData {
  totalAktif: number;
  totalLaki: number;
  totalPerempuan: number;
  totalTps: number;
  totalRw: number;
  totalRt: number;
}

const DEFAULT_STATS: StatsData = {
  totalAktif: 0,
  totalLaki: 0,
  totalPerempuan: 0,
  totalTps: 0,
  totalRw: 0,
  totalRt: 0,
};

export const StatsOverview: React.FC = () => {
  const [data, setData] = useState<StatsData>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("p2kd_public_stats_cache");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.totalAktif === "number") return parsed;
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_STATS;
  });

  useEffect(() => {
    let isMounted = true;
    const fetchLiveStats = async () => {
      try {
        const res = await fetch("/api/stats");
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          const freshStats: StatsData = {
            totalAktif: Number(json.data.totalAktif) || 0,
            totalLaki: Number(json.data.totalLaki) || 0,
            totalPerempuan: Number(json.data.totalPerempuan) || 0,
            totalTps: Number(json.data.totalTps) || 0,
            totalRw: Number(json.data.totalRw) || 0,
            totalRt: Number(json.data.totalRt) || 0,
          };
          setData(freshStats);
          try {
            localStorage.setItem("p2kd_public_stats_cache", JSON.stringify(freshStats));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data statistik live database:", err);
      }
    };

    fetchLiveStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const total = data.totalAktif || 0;
  const laki = data.totalLaki || 0;
  const perempuan = data.totalPerempuan || 0;
  const rw = data.totalRw || 0;
  const rt = data.totalRt || 0;

  const pctLaki = total > 0 ? Math.round((laki / total) * 100) : 0;
  const pctPerempuan = total > 0 ? Math.round((perempuan / total) * 100) : 0;

  const stats = [
    {
      title: "Total DPS Pilkades",
      targetValue: total,
      renderValue: () => (
        <AnimatedCounter from={1} to={total} duration={1800} />
      ),
      renderLabel: () => (
        <span>{total > 0 ? "Pemilih Terdaftar Sah" : "Tahap Pemutakhiran"}</span>
      ),
      icon: <Users className="w-5 h-5 text-blue-700" />,
      href: "/dps",
      bg: "bg-blue-50/70",
      border: "border-blue-200/80 hover:border-blue-400",
    },
    {
      title: "Pemilih Laki-Laki",
      targetValue: laki,
      renderValue: () => (
        <AnimatedCounter from={1} to={laki} duration={1800} />
      ),
      renderLabel: () => (
        <span>
          <AnimatedCounter from={1} to={pctLaki} duration={1500} suffix="% dari Total" />
        </span>
      ),
      icon: <UserCheck className="w-5 h-5 text-indigo-700" />,
      href: "/dps",
      bg: "bg-indigo-50/70",
      border: "border-indigo-200/80 hover:border-indigo-400",
    },
    {
      title: "Pemilih Perempuan",
      targetValue: perempuan,
      renderValue: () => (
        <AnimatedCounter from={1} to={perempuan} duration={1800} />
      ),
      renderLabel: () => (
        <span>
          <AnimatedCounter from={1} to={pctPerempuan} duration={1500} suffix="% dari Total" />
        </span>
      ),
      icon: <UserCheck className="w-5 h-5 text-teal-700" />,
      href: "/dps",
      bg: "bg-teal-50/70",
      border: "border-teal-200/80 hover:border-teal-400",
    },
    {
      title: "Wilayah Administratif",
      targetValue: rw,
      renderValue: () => (
        <AnimatedCounter from={1} to={rw} duration={1200} suffix=" RW" />
      ),
      renderLabel: () => (
        <span>
          <AnimatedCounter from={1} to={rt} duration={1400} suffix=" Rukun Tetangga (RT)" />
        </span>
      ),
      icon: <MapPinned className="w-5 h-5 text-emerald-700" />,
      href: "/tps",
      bg: "bg-emerald-50/70",
      border: "border-emerald-200/80 hover:border-emerald-400",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 mb-3.5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <FileCheck2 className="w-4 h-4 text-blue-700 shrink-0" />
          <span>Rekapitulasi Live Database Pemilih Kalisalak</span>
        </h3>
        <Link href="/dps" className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-0.5 shrink-0">
          <span>Lihat Rincian DPS</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          >
            <Link href={stat.href}>
              <Card className={`p-3 sm:p-4 transition-all duration-200 bg-white hover:shadow-md cursor-pointer ${stat.border}`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 truncate whitespace-nowrap">{stat.title}</span>
                  <div className={`p-1.5 sm:p-2 rounded-xl border border-slate-100 shrink-0 ${stat.bg}`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-2 sm:mt-2.5">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight min-h-7 sm:min-h-8 flex items-center whitespace-nowrap">
                    {stat.renderValue()}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-medium min-h-4 truncate whitespace-nowrap">
                    {stat.renderLabel()}
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

