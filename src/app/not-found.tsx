import React from "react";
import Link from "next/link";
import {
  FileQuestion,
  Home,
  Search,
  Users,
  Vote,
  MessageSquareWarning,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

export const metadata = {
  title: "404 Halaman Tidak Ditemukan | P2KD Desa Kalisalak",
  description: "Halaman yang Anda tuju tidak ditemukan atau telah dipindahkan.",
};

export default function NotFound() {
  const quickLinks = [
    { label: "Cek Hak Pilih DPT", href: "/cek-pemilih", icon: Search },
    { label: "Daftar Calon Kades", href: "/calon", icon: Vote },
    { label: "Struktur Panitia P2KD", href: "/struktur", icon: Users },
    { label: "Posko Aduan Warga", href: "/aduan", icon: MessageSquareWarning },
  ];

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl rounded-3xl p-6 sm:p-8 md:p-10 text-center">
        {/* Branding */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Logo size="sm" showText={false} />
          <div className="h-5 w-px bg-slate-700" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
            PORTAL PILKADES KALISALAK
          </span>
        </div>

        {/* 404 Large Display */}
        <div className="relative mb-6">
          <span className="text-7xl sm:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-300 to-purple-400 select-none opacity-90">
            404
          </span>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-semibold -mt-2">
            <FileQuestion className="w-3.5 h-3.5 text-blue-400" />
            <span>Halaman Tidak Ditemukan</span>
          </div>
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-3">
          Tautan Tidak Tersedia
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-md mx-auto">
          Alamat web yang Anda tuju mungkin salah ketik, telah diperbarui, atau dipindahkan ke tahapan pemilihan yang baru.
        </p>

        {/* Back to Home Button */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>

        {/* Quick Navigation Cards */}
        <div className="text-left pt-6 border-t border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Tautan Cepat Layanan Pemilih:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickLinks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-[11px] text-slate-600">
          P2KD Desa Kalisalak • Kecamatan Margasari, Kabupaten Tegal
        </div>
      </div>
    </div>
  );
}
