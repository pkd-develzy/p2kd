"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Globe,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button, Logo } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { CloudflareTurnstileShield, TurnstileShieldHandle } from "@/components/ui/cloudflare-turnstile-shield";

export const AdminLoginForm: React.FC = () => {
  const router = useRouter();
  const toast = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [isSecurityVerified, setIsSecurityVerified] = useState(false);
  const turnstileRef = useRef<TurnstileShieldHandle>(null);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setIsSecurityVerified(Boolean(token));
  }, []);
  const [currentDateStr] = useState<string>(() => {
    try {
      const now = new Date();
      return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now);
    } catch {
      return "Pilkades Kalisalak 2027";
    }
  });

  const [isStandalone] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
        document.documentElement.classList.contains("is-pwa-app")
      );
    }
    return false;
  });

  // Auto-restore session: If already logged in, redirect directly to dashboard without re-authenticating
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token");
    const storedUserData = localStorage.getItem("admin_user_data");

    if (token && storedUserData) {
      try {
        const parsed = JSON.parse(storedUserData);
        const targetRole = (parsed.role || "SUPER_ADMIN").toLowerCase();
        const targetTps = parsed.assignedTps || "SEMUA";
        const targetUser = parsed.username || "";
        const mustChange = Boolean(parsed.mustChangePassword);

        router.replace(
          `/admin/dashboard?role=${encodeURIComponent(targetRole)}&tps=${encodeURIComponent(
            targetTps
          )}&user=${encodeURIComponent(targetUser)}&force_change=${mustChange ? "true" : "false"}`
        );
      } catch {
        // Corrupted user data, allow login form
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.warning("Form Belum Lengkap", "Silakan masukkan username dan kata sandi.");
      return;
    }

    if (!turnstileToken) {
      toast.warning(
        "Verifikasi Keamanan Wajib",
        "Silakan selesaikan verifikasi keamanan Cloudflare Turnstile terlebih dahulu."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error("Gagal Masuk", data.message || "Username atau kata sandi tidak cocok.");
        setLoading(false);
        turnstileRef.current?.reset();
        return;
      }

      toast.success(
        "Autentikasi Berhasil",
        `Selamat datang, ${data.data.nama}!`
      );

      if (typeof window !== "undefined" && data.data?.token) {
        localStorage.setItem("admin_token", data.data.token);
        sessionStorage.setItem("admin_token", data.data.token);
        localStorage.setItem("admin_user_data", JSON.stringify(data.data));
      }

      const targetRole = (data.data.role || "SUPER_ADMIN").toLowerCase();
      const targetTps = data.data.assignedTps || "SEMUA";
      const targetUser = data.data.username;
      const mustChange = Boolean(data.data.mustChangePassword);

      router.push(
        `/admin/dashboard?role=${encodeURIComponent(targetRole)}&tps=${encodeURIComponent(
          targetTps
        )}&user=${encodeURIComponent(targetUser)}&force_change=${mustChange ? "true" : "false"}`
      );
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menghubungi server database resmi P2KD.");
      setLoading(false);
      turnstileRef.current?.reset();
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between overflow-x-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Hero Image with Deep Luxury Gradient Overlay */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{
          backgroundImage: "url('/images/p2kd-musyawarah-kalisalak.png')",
        }}
      />
      {/* Multi-layered dark glass overlay for high readability */}
      <div className="fixed inset-0 z-0 bg-linear-to-r from-slate-950/95 via-slate-950/85 to-blue-950/90 backdrop-blur-[2px]" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.15),rgba(255,255,255,0))]" />

      {/* Top Header Navbar */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white drop-shadow-sm">
              P2KD DESA KALISALAK
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Kecamatan Margasari • Kabupaten Tegal
            </span>
          </div>
        </div>

        {/* Live Date Indicator Pill */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs font-semibold text-amber-300 backdrop-blur-md shadow-lg font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{currentDateStr || "Pilkades Kalisalak 2027"}</span>
        </div>
      </header>

      {/* Main Container: 2-Column Split Hero Layout */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 py-4 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center w-full">
          {/* Left Column: Glassmorphism Login Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:mx-0">
            <div className="relative rounded-3xl bg-slate-900/80 border border-white/15 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/70 space-y-6">
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shadow-inner">
                    <Logo size="sm" showText={false} />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                      <Sparkles className="w-3 h-3" /> PORTAL RESMI P2KD
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                      Portal Sekretariat
                    </h2>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Super Admin • Seksi 1-4 • Koordinator Pantarlih & KPPS RW
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider">
                    USERNAME PETUGAS
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username akun..."
                      className="w-full h-12 pl-10 pr-4 text-xs font-bold rounded-2xl bg-slate-100/95 text-slate-950 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 border-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider">
                    KATA SANDI
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 pl-10 pr-11 text-xs font-bold rounded-2xl bg-slate-100/95 text-slate-950 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 border-none transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
                      title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Cloudflare Turnstile Shield */}
                <div className="pt-1">
                  <CloudflareTurnstileShield
                    ref={turnstileRef}
                    action="login"
                    isVerified={isSecurityVerified}
                    onVerify={handleTurnstileVerify}
                    label="Verifikasi Akses Panitia Lolos • Cloudflare Turnstile"
                  />
                </div>

                {/* Primary Action Button */}
                <div className="pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={loading}
                    disabled={!isSecurityVerified || loading}
                    className="w-full h-12 font-black text-xs sm:text-sm rounded-2xl bg-linear-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/30 border border-blue-400/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Masuk Aplikasi Sekretariat</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Secondary Button: Return to Public Portal (Hidden on PWA Standalone App) */}
                {!isStandalone && (
                  <div>
                    <Link href="/" className="block w-full">
                      <button
                        type="button"
                        className="w-full h-11 rounded-2xl bg-slate-950/60 hover:bg-slate-950/80 border border-white/10 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 hover:border-white/20 cursor-pointer"
                      >
                        <Globe className="w-4 h-4 text-blue-400" />
                        <span>Kembali ke Portal Informasi Publik</span>
                      </button>
                    </Link>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right Column: Hero Institutional Section */}
          <div className="lg:col-span-7 space-y-7 text-left">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-md">
              <span>🏛️</span>
              <span>PANITIA PEMILIHAN KEPALA DESA (P2KD)</span>
            </div>

            {/* Big Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                Sistem Informasi &amp; Layanan Terpadu
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed font-normal drop-shadow-sm">
                P2KD Desa Kalisalak Kecamatan Margasari — Software Operasional Sekretariat Administrator Terintegrasi, Penetapan DPT Faktual, Rekapitulasi Berita Acara &amp; Real Count Pilkades 2027 – 2035.
              </p>
            </div>

            {/* 2 Feature Glass Cards Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              {/* Feature 1 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md shadow-xl space-y-1.5 hover:border-amber-400/30 transition-all">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Encrypted 256-bit</span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Keamanan Data Pemilih
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Enkripsi NIK &amp; proteksi privasi ketat serta perlindungan jejak audit log.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md shadow-xl space-y-1.5 hover:border-blue-400/30 transition-all">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-mono font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Realtime Sync Supabase</span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Pleno &amp; Coklit Terpadu
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Sinkronisasi 13 Wilayah RW secara instan dengan verifikasi QR Code C6 &amp; Stiker.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full px-6 sm:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-white/5">
        <div>
          © {new Date().getFullYear()} P2KD Desa Kalisalak • Kecamatan Margasari • Kabupaten Tegal. All rights reserved.
        </div>
        <div className="font-mono text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Dev: DEVELZY Indonesia © 2027</span>
        </div>
      </footer>
    </div>
  );
};
