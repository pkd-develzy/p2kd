"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, FileCheck2, UserCheck, Landmark, MapPinned, ArrowUpRight } from "lucide-react";
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
  totalAktif: 7787,
  totalLaki: 3933,
  totalPerempuan: 3854,
  totalTps: 13,
  totalRw: 13,
  totalRt: 39,
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
            totalAktif: Number(json.data.totalAktif) || 7787,
            totalLaki: Number(json.data.totalLaki) || 3933,
            totalPerempuan: Number(json.data.totalPerempuan) || 3854,
            totalTps: Number(json.data.totalTps) || 13,
            totalRw: Number(json.data.totalRw) || 13,
            totalRt: Number(json.data.totalRt) || 39,
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

  const total = data.totalAktif || 7787;
  const laki = data.totalLaki || 3933;
  const perempuan = data.totalPerempuan || 3854;
  const tps = data.totalTps || 13;
  const rw = data.totalRw || 13;
  const rt = data.totalRt || 39;

  const pctLaki = total > 0 ? Math.round((laki / total) * 100) : 51;
  const pctPerempuan = total > 0 ? Math.round((perempuan / total) * 100) : 49;

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
      title: "Tabung Pemilihan",
      targetValue: tps,
      renderValue: () => (
        <AnimatedCounter from={1} to={tps} duration={1200} suffix=" Tabung" />
      ),
      renderLabel: () => <span>Wilayah Desa Kalisalak</span>,
      icon: <Landmark className="w-5 h-5 text-amber-700" />,
      href: "/tps",
      bg: "bg-amber-50/70",
      border: "border-amber-200/80 hover:border-amber-400",
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <FileCheck2 className="w-4 h-4 text-blue-700" />
          Rekapitulasi Live Database Pemilih Kalisalak
        </h3>
        <Link href="/dps" className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-0.5">
          <span>Lihat Rincian DPS</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          >
            <Link href={stat.href}>
              <Card className={`p-4 transition-all duration-200 bg-white hover:shadow-md cursor-pointer ${stat.border}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 truncate">{stat.title}</span>
                  <div className={`p-2 rounded-xl border border-slate-100 ${stat.bg}`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl font-black text-slate-900 tracking-tight min-h-8 flex items-center">
                    {stat.renderValue()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium min-h-4">
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

