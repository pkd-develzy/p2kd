"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Database, Shield, History, ArrowRight, MapPin, Megaphone, HelpCircle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: <Database className="w-5 h-5 text-blue-700" />,
    bg: "bg-blue-50 border-blue-100",
    badge: "Transparansi",
    title: "Master Data Tunggal Pemilih",
    desc: "Seluruh warga Desa Kalisalak terdata dalam satu master identitas terpadu yang diaudit tanpa ada duplikasi NIK antara DPS dan DPT.",
    linkText: "Lihat Rekap DPS",
    href: "/dps",
  },
  {
    icon: <Shield className="w-5 h-5 text-emerald-700" />,
    bg: "bg-emerald-50 border-emerald-100",
    badge: "Keamanan UU PDP",
    title: "Proteksi Database Server Aman",
    desc: "Perlindungan data pribadi sesuai UU PDP No. 27/2022. Seluruh identitas warga terlindungi dengan protokol keamanan database server yang aman.",
    linkText: "Kebijakan Privasi",
    href: "/privasi",
  },
  {
    icon: <MapPin className="w-5 h-5 text-rose-700" />,
    bg: "bg-rose-50 border-rose-100",
    badge: "Aksesibilitas",
    title: "Sebaran Tabung Pemilihan Kalisalak",
    desc: "Alokasi 13 Tabung Pemilihan yang terpusat untuk melayani pemilih dari seluruh wilayah RW dan RT Desa Kalisalak pada hari pemungutan suara.",
    linkText: "Lihat Daftar Tabung",
    href: "/tps",
  },
  {
    icon: <History className="w-5 h-5 text-indigo-700" />,
    bg: "bg-indigo-50 border-indigo-100",
    badge: "Kepastian Hukum",
    title: "Tahapan & Jadwal Transparan",
    desc: "Jadwal resmi pelaksanaan Pilkades dari pemutakhiran data, pendaftaran bakal calon kades, hingga pemungutan suara.",
    linkText: "Buka Timeline Tahapan",
    href: "/tahapan",
  },
  {
    icon: <Megaphone className="w-5 h-5 text-amber-700" />,
    bg: "bg-amber-50 border-amber-100",
    badge: "Keterbukaan",
    title: "Publikasi Berita Acara P2KD",
    desc: "Keterbukaan informasi publik terkait surat keputusan, pengumuman pleno, dan tata tertib pemilu desa yang sah.",
    linkText: "Baca Pengumuman",
    href: "/pengumuman",
  },
  {
    icon: <HelpCircle className="w-5 h-5 text-teal-700" />,
    bg: "bg-teal-50 border-teal-100",
    badge: "Layanan Warga",
    title: "Pusat Bantuan & Layanan Aduan",
    desc: "Kanal resmi bagi warga Kalisalak untuk mengajukan sanggahan, koreksi data salah ketik, atau pelaporan pemilih meninggal (TMS).",
    linkText: "Kirim Aduan Warga",
    href: "/aduan",
  },
];

export const FeaturesGrid: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="text-center mb-10 space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Fasilitas Layanan Publik P2KD</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Layanan Terpadu Pilkades Desa Kalisalak
        </h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto font-medium">
          Fasilitas digital resmi yang disiapkan oleh Panitia Pemilihan Kepala Desa untuk melayani seluruh warga Desa Kalisalak.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((feat, i) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 + i * 0.05 }}
            whileHover={{ y: -4 }}
          >
            <Card className="h-full border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-lg transition-all p-6 flex flex-col justify-between group rounded-3xl">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className={`p-3 rounded-2xl border ${feat.bg} group-hover:scale-105 transition-transform shadow-2xs`}>
                    {feat.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {feat.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{feat.desc}</p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100">
                <Link
                  href={feat.href}
                  className="inline-flex items-center text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors group-hover:translate-x-1 duration-200"
                >
                  <span>{feat.linkText}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
