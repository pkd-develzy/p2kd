import React from "react";
import Link from "next/link";
import { ShieldAlert, KeyRound, Home, ArrowLeft, LifeBuoy } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export const metadata = {
  title: "403 Akses Dibatasi | P2KD Desa Kalisalak",
  description: "Halaman ini memerlukan otorisasi akun Panitia P2KD atau Petugas Pantarlih resmi.",
};

export default function Forbidden() {
  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Glow Effects */}
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl rounded-3xl p-6 sm:p-8 md:p-10 text-center">
        {/* Branding */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Logo size="sm" showText={false} />
          <div className="h-5 w-px bg-slate-700" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
            PORTAL KEAMANAN P2KD
          </span>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span>Akses Terbatas (403 Forbidden)</span>
        </div>

        {/* Central Icon */}
        <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-rose-600/20 rounded-2xl blur-lg" />
          <div className="relative w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Izin Akses Ditolak
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
          Halaman atau berkas administrasi ini hanya diperuntukkan bagi Panitia P2KD, Petugas Pantarlih, atau Tim Verifikator terdaftar.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-600/25 transition-all duration-200 hover:-translate-y-0.5"
          >
            <KeyRound className="w-4 h-4 text-slate-950" />
            <span>Masuk Akun Petugas</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 active:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4" />
            <span>Portal Utama</span>
          </Link>
        </div>

        {/* Helpdesk link */}
        <div className="pt-2 text-xs text-slate-400">
          <span>Merasa ini sebuah kesalahan? </span>
          <Link href="/aduan" className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4">
            Laporkan ke Sekretariat P2KD
          </Link>
        </div>

        {/* Security watermark */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-[11px] text-slate-600">
          IP & Aktivitas Terproteksi oleh Protokol Integritas Pilkades Kalisalak 2026
        </div>
      </div>
    </div>
  );
}
