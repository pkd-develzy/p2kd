"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Sparkles, ShieldCheck, ChevronRight } from "lucide-react";

interface AppleWelcomeScreenProps {
  officerName?: string;
  assignedRw?: string;
  durationMs?: number;
  onFinish?: () => void;
  forceShow?: boolean;
}

export const AppleWelcomeScreen: React.FC<AppleWelcomeScreenProps> = ({
  officerName,
  assignedRw,
  durationMs = 3000,
  onFinish,
  forceShow = false,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (forceShow) return true;
    try {
      return sessionStorage.getItem("p2kd_apple_welcome_shown") !== "true";
    } catch {
      return false;
    }
  });

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(15);

  const handleDismiss = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("p2kd_apple_welcome_shown", "true");
        } catch {}
      }
      onFinish?.();
    }, 650);
  }, [onFinish]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ekspos method untuk replay/preview jika diperlukan
    (window as unknown as { __showAppleWelcome?: () => void }).__showAppleWelcome = () => {
      setIsFadingOut(false);
      setProgress(15);
      setIsVisible(true);
    };

    if (!isVisible) return;

    // Animasi progress bar halus seperti booting macOS/iOS
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 18) + 8;
      });
    }, 180);

    const timer = setTimeout(() => {
      handleDismiss();
    }, durationMs);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [isVisible, durationMs, handleDismiss]);

  if (!isVisible) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 flex flex-col items-center justify-between p-6 sm:p-10 select-none bg-black text-white cursor-pointer transition-all duration-700 ease-out ${
        isFadingOut
          ? "opacity-0 scale-105 pointer-events-none blur-[2px]"
          : "opacity-100 scale-100"
      }`}
      style={{
        zIndex: 99999,
        backgroundColor: "#000000",
      }}
    >
      {/* 1. Ambient Apple-Style Chromatic Aurora Glowing Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/12 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-130 h-130 bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />
      </div>

      {/* Skip Button Top Right */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="absolute top-5 right-5 sm:top-8 sm:right-8 z-20 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-slate-300 hover:text-white text-xs font-medium tracking-wide backdrop-blur-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5"
      >
        <span>Lewati</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* 2. Top Pill Header: Identitas Resmi P2KD */}
      <div className="relative z-10 pt-4 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <Image
            src="/logo-v2.png"
            alt="Logo P2KD Kalisalak"
            width={18}
            height={18}
            className="w-4.5 h-4.5 object-contain"
            priority
          />
          <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-slate-300">
            P2KD DESA KALISALAK
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>
      </div>

      {/* 3. Centerpiece: Iconic Apple Latin Handwriting Cursive Script Animation */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center px-4 max-w-xl">
        {/* SVG Handwriting Canvas with Gradient Stroke & Shimmer */}
        <div className="relative w-full max-w-85 sm:max-w-120 aspect-video flex items-center justify-center">
          <svg
            viewBox="0 0 540 220"
            className="w-full h-full drop-shadow-[0_0_35px_rgba(52,211,153,0.35)]"
          >
            <defs>
              <linearGradient id="appleWelcomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#ecfdf5" />
                <stop offset="75%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#67e8f9" />
              </linearGradient>

              <linearGradient id="appleGlowStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="50%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#a7f3d0" />
              </linearGradient>
            </defs>

            {/* Tulisan Latin Baris 1: Selamat Datang */}
            <text
              x="50%"
              y="95"
              textAnchor="middle"
              className="font-apple-script animate-apple-stroke"
              style={{
                fontSize: "76px",
                stroke: "url(#appleGlowStroke)",
                strokeWidth: "1.4px",
                paintOrder: "stroke fill",
              }}
            >
              Selamat Datang
            </text>

            {/* Tulisan Latin Baris 2: Petugas */}
            <text
              x="50%"
              y="175"
              textAnchor="middle"
              className="font-apple-script animate-apple-stroke"
              style={{
                fontSize: "82px",
                stroke: "url(#appleGlowStroke)",
                strokeWidth: "1.5px",
                animationDelay: "0.35s",
                paintOrder: "stroke fill",
              }}
            >
              Petugas
            </text>

            {/* Signature Flourish Swoop under Petugas */}
            <path
              d="M 155 194 C 235 212, 315 212, 385 194"
              fill="none"
              stroke="url(#appleGlowStroke)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="animate-apple-stroke"
              style={{ animationDelay: "0.7s" }}
            />
          </svg>

          {/* Sparkle Accent */}
          <div className="absolute -top-2 right-4 text-emerald-300 animate-pulse pointer-events-none">
            <Sparkles className="w-5 h-5 drop-shadow-[0_0_12px_#34d399]" />
          </div>
        </div>

        {/* Subtitle Minimalis Khas Apple Typography */}
        <div className="space-y-1.5 mt-2 animate-in fade-in duration-1000 delay-300">
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-slate-300 uppercase">
            Sistem Pemutakhiran Data Pemilih
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {officerName ? `${officerName}` : "Petugas Lapangan P2KD"}
              {assignedRw && assignedRw !== "SEMUA" ? ` • ${assignedRw}` : " • Kalisalak"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Bottom iOS/macOS Thin Loader Bar */}
      <div className="relative z-10 pb-4 w-full max-w-xs flex flex-col items-center space-y-2.5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
          <div
            className="h-full bg-linear-to-r from-emerald-400 via-teal-300 to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_#34d399]"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
          <span>Menyiapkan Sistem Administrasi</span>
          <span className="text-emerald-400">...</span>
        </p>
      </div>
    </div>
  );
};
