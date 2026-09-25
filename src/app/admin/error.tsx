"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  ShieldAlert,
  Database,
  Home,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ServerOff,
  LogIn,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const digestCode = error?.digest || `ADM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      try {
        reset();
      } catch {
        window.location.reload();
      }
      setIsRetrying(false);
    }, 400);
  };

  const copyDiagnostic = () => {
    const text = `[DIAGNOSTIK PANEL ADMIN P2KD]\nKode Tiket: ${digestCode}\nError: ${error?.message || "Admin Dashboard Exception"}\nWaktu: ${new Date().toLocaleString("id-ID")}\nURL: ${typeof window !== "undefined" ? window.location.href : "-"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl rounded-3xl p-6 sm:p-8 md:p-10 text-center">
        {/* Branding */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Logo size="sm" showText={false} />
          <div className="h-5 w-px bg-slate-700" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
            PANEL KENDALI ADMINISTRATOR
          </span>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
          <span>Kendala Sinkronisasi Admin</span>
        </div>

        {/* Central Icon */}
        <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/20 to-blue-600/20 rounded-2xl blur-lg" />
          <div className="relative w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 border border-rose-500/30 rounded-2xl flex items-center justify-center shadow-inner">
            <ServerOff className="w-10 h-10 text-rose-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Gagal Memuat Data Panel
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-md mx-auto">
          Terjadi anomali saat mengambil konfigurasi atau data pemilih dari basis data. Pastikan koneksi internet stabil dan sesi petugas Anda masih valid.
        </p>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Menyegarkan..." : "Muat Ulang Panel"}</span>
          </button>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 active:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 transition-all duration-200 hover:-translate-y-0.5"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk Ulang Petugas</span>
          </Link>
        </div>

        {/* Diagnostic Toggle */}
        <div className="flex items-center justify-center gap-4 pt-2 text-xs text-slate-400">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-slate-200 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-800/60"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Portal Depan</span>
          </Link>

          <span className="text-slate-700">•</span>

          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="inline-flex items-center gap-1.5 hover:text-slate-200 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-800/60"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Detail Teknis</span>
            {showTechnical ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Technical Details Accordion */}
        {showTechnical && (
          <div className="mt-6 text-left bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Diagnostik Database & Routing
              </span>
              <button
                type="button"
                onClick={copyDiagnostic}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1.5 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">ID Sesi Tiket:</span>
                <span className="text-cyan-400 font-bold">{digestCode}</span>
              </div>
              {error?.message && (
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-slate-500">Detail Error:</span>
                  <div className="p-2 rounded bg-slate-900 text-rose-300 text-[11px] leading-relaxed max-h-28 overflow-y-auto break-all">
                    {error.message}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-[11px] text-slate-600">
          Panel Administrasi Terenkripsi • P2KD Desa Kalisalak 2026
        </div>
      </div>
    </div>
  );
}
