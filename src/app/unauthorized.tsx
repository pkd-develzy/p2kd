import React from "react";
import Link from "next/link";
import { Lock, LogIn, Home } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export const metadata = {
  title: "401 Sesi Diperlukan | P2KD Desa Kalisalak",
  description: "Silakan masuk dengan akun terverifikasi untuk melanjutkan.",
};

export default function Unauthorized() {
  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl rounded-3xl p-6 sm:p-8 md:p-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Logo size="sm" showText={false} />
          <div className="h-5 w-px bg-slate-700" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
            OTORISASI PETUGAS
          </span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span>Sesi Kedaluwarsa / Diperlukan (401)</span>
        </div>

        <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 rounded-2xl blur-lg" />
          <div className="relative w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-inner">
            <Lock className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Sesi Telah Berakhir
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
          Demi keamanan data pemilu, sesi login Anda telah berakhir atau belum terautentikasi. Silakan masuk kembali.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all duration-200 hover:-translate-y-0.5"
          >
            <LogIn className="w-4 h-4" />
            <span>Login Kembali</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-bold text-sm border border-slate-700 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4" />
            <span>Portal Warga</span>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-[11px] text-slate-600">
          Sistem Autentikasi Pilkades Kalisalak • Margasari, Tegal
        </div>
      </div>
    </div>
  );
}
