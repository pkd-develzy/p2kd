"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetAuthContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"PIN" | "PASSWORD">("PIN");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg("Token otentikasi tidak ditemukan pada tautan ini.");
      return;
    }

    if (mode === "PIN") {
      if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        setErrorMsg("PIN harus berupa 6 angka.");
        return;
      }
      if (pin !== confirmPin) {
        setErrorMsg("Konfirmasi PIN tidak cocok.");
        return;
      }
    } else {
      if (password.length < 6) {
        setErrorMsg("Kata sandi minimal 6 karakter.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Konfirmasi kata sandi tidak cocok.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/app/auth/reset-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPin: mode === "PIN" ? pin : undefined,
          newPassword: mode === "PASSWORD" ? password : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
      } else {
        setErrorMsg(data.message || "Gagal memperbarui kredensial.");
      }
    } catch {
      setErrorMsg("Terjadi gangguan jaringan. Silakan coba kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center p-2 mb-3 shadow-sm">
            <span className="text-2xl font-black text-blue-700">P2KD</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Pemulihan Akses Petugas P2KD
          </h1>
          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-1">
            Pilkades Kalisalak 2026
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Tautan Rahasia Satu Kali Pakai (Single-Use Magic Link)
          </p>
        </div>

        {/* Sukses Banner */}
        {successMsg ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-emerald-900">Pembaruan Berhasil!</h2>
            <p className="text-xs text-emerald-700 mt-2 leading-relaxed">{successMsg}</p>
            <div className="mt-5">
              <Link
                href="/"
                className="inline-block px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow hover:bg-emerald-700 transition"
              >
                Kembali ke Beranda Resmi
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Banner */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-600 font-medium leading-relaxed">
                {errorMsg}
              </div>
            )}

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setMode("PIN")}
                className={`flex-1 py-2 rounded-lg transition ${
                  mode === "PIN" ? "bg-white text-blue-700 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                Atur 6-Digit PIN
              </button>
              <button
                type="button"
                onClick={() => setMode("PASSWORD")}
                className={`flex-1 py-2 rounded-lg transition ${
                  mode === "PASSWORD" ? "bg-white text-blue-700 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                Atur Kata Sandi
              </button>
            </div>

            {mode === "PIN" ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Masukkan 6-Digit PIN Baru
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="Contoh: 123456"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3.5 py-2.5 text-center text-xl font-bold tracking-widest border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Konfirmasi 6-Digit PIN Baru
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="Ketik ulang 6 angka PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3.5 py-2.5 text-center text-xl font-bold tracking-widest border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi Baru (Min. 6 Karakter)
                  </label>
                  <input
                    type="password"
                    placeholder="Masukkan kata sandi baru"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Memproses Kredensial...</span>
              ) : (
                <span>Simpan & Terapkan Perubahan</span>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Sistem Terotentikasi & Terenkripsi SHA-256 P2KD Kalisalak
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-bold text-slate-500">Memuat halaman pemulihan...</div>}>
      <ResetAuthContent />
    </Suspense>
  );
}
