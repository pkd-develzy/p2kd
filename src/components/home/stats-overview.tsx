"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, FileCheck2, UserCheck, Landmark, MapPinned, ArrowUpRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsData {
  totalAktif: number;
  totalLaki: number;
  totalPerempuan: number;
  totalTps: number;
  totalRw: number;
  totalRt: number;
}

export const StatsOverview: React.FC = () => {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveStats = async () => {
      try {
        const res = await fetch("/api/stats");
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setData({
            totalAktif: Number(json.data.totalAktif) || 0,
            totalLaki: Number(json.data.totalLaki) || 0,
            totalPerempuan: Number(json.data.totalPerempuan) || 0,
            totalTps: Number(json.data.totalTps) || Number(json.data.tpsStats?.length) || 7,
            totalRw: Number(json.data.totalRw) || 13,
            totalRt: Number(json.data.totalRt) || 39,
          });
        }
      } catch (err) {
        console.error("Gagal mengambil data statistik live database:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const total = data?.totalAktif || 0;
  const laki = data?.totalLaki || 0;
  const perempuan = data?.totalPerempuan || 0;
  const tps = data?.totalTps || 7;
  const rw = data?.totalRw || 13;
  const rt = data?.totalRt || 39;

  const pctLaki = total > 0 ? Math.round((laki / total) * 100) : 0;
  const pctPerempuan = total > 0 ? Math.round((perempuan / total) * 100) : 0;

  const stats = [
    {
      title: "Total DPS Pilkades",
      value: loading ? null : `${total.toLocaleString("id-ID")}`,
      label: total > 0 ? "Pemilih Terdaftar Sah" : "Tahap Pemutakhiran",
      icon: <Users className="w-5 h-5 text-blue-700" />,
      href: "/dps",
      bg: "bg-blue-50/70",
      border: "border-blue-200/80 hover:border-blue-400",
    },
    {
      title: "Pemilih Laki-Laki",
      value: loading ? null : `${laki.toLocaleString("id-ID")}`,
      label: total > 0 ? `${pctLaki}% dari Total` : "Data Terverifikasi",
      icon: <UserCheck className="w-5 h-5 text-indigo-700" />,
      href: "/dps",
      bg: "bg-indigo-50/70",
      border: "border-indigo-200/80 hover:border-indigo-400",
    },
    {
      title: "Pemilih Perempuan",
      value: loading ? null : `${perempuan.toLocaleString("id-ID")}`,
      label: total > 0 ? `${pctPerempuan}% dari Total` : "Data Terverifikasi",
      icon: <UserCheck className="w-5 h-5 text-teal-700" />,
      href: "/dps",
      bg: "bg-teal-50/70",
      border: "border-teal-200/80 hover:border-teal-400",
    },
    {
      title: "Tabung Pemilihan",
      value: loading ? null : `${tps} Tabung`,
      label: "Wilayah Desa Kalisalak",
      icon: <Landmark className="w-5 h-5 text-amber-700" />,
      href: "/tps",
      bg: "bg-amber-50/70",
      border: "border-amber-200/80 hover:border-amber-400",
    },
    {
      title: "Wilayah Administratif",
      value: loading ? null : `${rw} RW`,
      label: `${rt} Rukun Tetangga (RT)`,
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
                  <div className="text-2xl font-black text-slate-900 tracking-tight min-h-[32px] flex items-center">
                    {loading || stat.value === null ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Sinkronisasi...</span>
                      </span>
                    ) : (
                      stat.value
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium min-h-[16px]">
                    {loading ? "Sinkronisasi..." : stat.label}
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
