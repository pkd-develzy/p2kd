"use client";

import React, { useState, useRef } from "react";
import { Lock, KeyRound, Eye, EyeOff, RefreshCw, ArrowRight, LogOut } from "lucide-react";
import { CloudflareTurnstileShield, TurnstileShieldHandle } from "@/components/ui/cloudflare-turnstile-shield";
import { useToast } from "@/hooks/use-toast";

interface AdminLockScreenProps {
  userName: string;
  userJabatan: string;
  username: string;
  fotoUrl?: string | null;
  onUnlockSuccess: () => void;
  onLogout: () => void;
}

export const AdminLockScreen: React.FC<AdminLockScreenProps> = ({
  userName,
  userJabatan,
  username,
  fotoUrl,
  onUnlockSuccess,
  onLogout,
}) => {
  const toast = useToast();
  const [unlockPassword, setUnlockPassword] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [unlockTurnstileToken, setUnlockTurnstileToken] = useState("");
  const unlockTurnstileRef = useRef<TurnstileShieldHandle>(null);

  const handleQuickUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockPassword.trim()) {
      toast.warning("Kata Sandi Wajib", "Silakan masukkan kata sandi akun Anda.");
      return;
    }

    if (!unlockTurnstileToken) {
      toast.warning("Verifikasi Diperlukan", "Harap selesaikan verifikasi Cloudflare Turnstile terlebih dahulu.");
      return;
    }

    setIsUnlocking(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password: unlockPassword,
          turnstileToken: unlockTurnstileToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error("Gagal Membuka Kunci", data.error || "Kata sandi salah. Silakan coba kembali.");
        unlockTurnstileRef.current?.reset();
        setUnlockTurnstileToken("");
        return;
      }

      // Update last activity
      if (typeof window !== "undefined") {
        localStorage.setItem("p2kd_app_locked", "false");
        localStorage.setItem("p2kd_last_activity", Date.now().toString());
      }
      toast.success("Kunci Terbuka", `Selamat datang kembali, ${userName}`);
      onUnlockSuccess();
    } catch {
      toast.error("Koneksi Bermasalah", "Gagal memverifikasi akun ke server. Periksa jaringan Anda.");
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900/95 border border-white/15 p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* User Identity Avatar */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl">
              {fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fotoUrl}
                  alt={userName}
                  className="w-full h-full rounded-[14px] object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white font-black text-xl">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-500 text-slate-950 shadow-md">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h3 className="text-base font-black text-white">{userName}</h3>
            <p className="text-xs text-blue-300 font-medium">{userJabatan}</p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="inline-block text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                @{username}
              </span>
              <span className="inline-block text-[10px] text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                🔒 Terkunci (Inaktif 30m)
              </span>
            </div>
          </div>
        </div>

        {/* Quick Unlock Form */}
        <form onSubmit={handleQuickUnlock} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider">
              KATA SANDI AKUN
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showUnlockPassword ? "text" : "password"}
                autoFocus
                required
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full h-11 pl-10 pr-11 text-xs font-bold rounded-xl bg-slate-100/95 text-slate-950 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title={showUnlockPassword ? "Sembunyikan" : "Tampilkan"}
              >
                {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Cloudflare Turnstile Bot Protection */}
          <div className="pt-1">
            <CloudflareTurnstileShield
              ref={unlockTurnstileRef}
              action="login"
              isVerified={Boolean(unlockTurnstileToken)}
              onVerify={(token) => setUnlockTurnstileToken(token)}
              size="flexible"
              theme="dark"
              variant="dark"
              label="Verifikasi Akses Layar Kunci • Turnstile"
            />
          </div>

          <button
            type="submit"
            disabled={isUnlocking || !unlockTurnstileToken}
            className="w-full h-11 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUnlocking ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Buka Kunci Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full text-center text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors pt-2 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun Sepenuhnya (Logout)</span>
          </button>
        </form>
      </div>
    </div>
  );
};
