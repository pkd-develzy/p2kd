"use client";

import React, { useState, useMemo } from "react";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { validatePasswordPolicy, isInitialDefaultPassword } from "@/lib/password-policy";

interface ModalForceChangePasswordProps {
  isOpen: boolean;
  isForced?: boolean;
  username: string;
  namaLengkap: string;
  onSuccess: () => void;
  onClose?: () => void;
}

export const ModalForceChangePassword: React.FC<ModalForceChangePasswordProps> = ({
  isOpen,
  isForced = true,
  username,
  namaLengkap,
  onSuccess,
  onClose,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const validation = useMemo(() => {
    return validatePasswordPolicy(newPassword);
  }, [newPassword]);

  const isMatching = useMemo(() => {
    return newPassword.length > 0 && newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const isDefaultReuse = useMemo(() => {
    return isInitialDefaultPassword(newPassword);
  }, [newPassword]);

  const canSubmit = validation.isValid && isMatching && !isDefaultReuse && !loading;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid) {
      toast.warning("Kriteria Belum Terpenuhi", validation.errors[0] || "Lengkapi seluruh kriteria kata sandi.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning("Kata Sandi Tidak Cocok", "Konfirmasi kata sandi harus sama persis dengan kata sandi baru.");
      return;
    }

    if (isDefaultReuse) {
      toast.error("Dilarang", "Dilarang menggunakan kembali Kata Sandi Awal Bawaan.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          currentPassword: currentPassword || undefined,
          newPassword,
          confirmPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error("Gagal Memperbarui", json.message || "Gagal mengganti kata sandi.");
        setLoading(false);
        return;
      }

      toast.success(
        "Kata Sandi Berhasil Diperbarui",
        "Kata sandi baru Anda telah tersimpan dengan aman di server database."
      );

      // Update local storage token / data
      if (typeof window !== "undefined") {
        if (json.data?.token) {
          localStorage.setItem("admin_token", json.data.token);
          sessionStorage.setItem("admin_token", json.data.token);
        }
        const existingData = localStorage.getItem("admin_user_data");
        if (existingData) {
          try {
            const parsed = JSON.parse(existingData);
            parsed.mustChangePassword = false;
            localStorage.setItem("admin_user_data", JSON.stringify(parsed));
          } catch {
            // ignore
          }
        }
      }

      setLoading(false);
      onSuccess();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menghubungi server database resmi.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp">
        {/* Header Banner */}
        <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 p-6 text-white border-b border-blue-900/60 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                  Wajib Ganti Sandi
                </span>
                <span className="text-xs text-slate-400">P2KD Kalisalak</span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">
                Pembaruan Kata Sandi Akun
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
            Akun <strong className="text-white">{namaLengkap}</strong> ({username}) terdeteksi masih menggunakan <strong>Kata Sandi Awal Bawaan</strong>. Wajib membuat kata sandi baru yang kuat untuk melanjutkan.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi Saat Ini / Sandi Awal Bawaan
            </label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi awal akun..."
                className="text-xs pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Buat kata sandi baru (8-16 karakter)..."
                className="text-xs pr-10 font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ulangi / Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru..."
                className="text-xs pr-10 font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Strength Meter & Live Checklist */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Standar Kriteria Keamanan Sandi Resmi:
              </span>
              <span className="text-[10px] font-black text-blue-700">
                {validation.score} / 5 Terpenuhi
              </span>
            </div>

            {/* Strength Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden flex gap-1">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  validation.score >= 1 ? (validation.score <= 2 ? "bg-rose-500 w-1/5" : validation.score <= 4 ? "bg-amber-500 w-1/5" : "bg-emerald-500 w-1/5") : "w-0"
                }`}
              />
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  validation.score >= 2 ? (validation.score <= 4 ? "bg-amber-500 w-1/5" : "bg-emerald-500 w-1/5") : "w-0"
                }`}
              />
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  validation.score >= 3 ? (validation.score <= 4 ? "bg-amber-500 w-1/5" : "bg-emerald-500 w-1/5") : "w-0"
                }`}
              />
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  validation.score >= 4 ? (validation.score === 5 ? "bg-emerald-500 w-1/5" : "bg-amber-500 w-1/5") : "w-0"
                }`}
              />
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  validation.score === 5 ? "bg-emerald-500 w-1/5" : "w-0"
                }`}
              />
            </div>

            {/* 5 Realtime Criteria Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {/* 1. 8-16 Karakter */}
              <div
                className={`flex items-center gap-1.5 p-1.5 rounded-xl border transition-colors ${
                  validation.rules.length
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                {validation.rules.length ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span>8 – 16 Karakter ({newPassword.length}/16)</span>
              </div>

              {/* 2. 1 Huruf Besar */}
              <div
                className={`flex items-center gap-1.5 p-1.5 rounded-xl border transition-colors ${
                  validation.rules.hasUppercase
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                {validation.rules.hasUppercase ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span>Minimal 1 Huruf Besar (A-Z)</span>
              </div>

              {/* 3. 1 Huruf Kecil */}
              <div
                className={`flex items-center gap-1.5 p-1.5 rounded-xl border transition-colors ${
                  validation.rules.hasLowercase
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                {validation.rules.hasLowercase ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span>Minimal 1 Huruf Kecil (a-z)</span>
              </div>

              {/* 4. 1 Angka */}
              <div
                className={`flex items-center gap-1.5 p-1.5 rounded-xl border transition-colors ${
                  validation.rules.hasNumber
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                {validation.rules.hasNumber ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span>Minimal 1 Angka (0-9)</span>
              </div>

              {/* 5. 1 Karakter Khusus */}
              <div
                className={`sm:col-span-2 flex items-center gap-1.5 p-1.5 rounded-xl border transition-colors ${
                  validation.rules.hasSpecial
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                {validation.rules.hasSpecial ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span>Minimal 1 Karakter Khusus (! @ # $ % ^ & * () _ + - =)</span>
              </div>

              {/* 6. Match Status */}
              {confirmPassword.length > 0 && (
                <div
                  className={`sm:col-span-2 flex items-center gap-1.5 p-1.5 rounded-xl border transition-colors ${
                    isMatching
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  {isMatching ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span>
                    {isMatching
                      ? "Konfirmasi kata sandi cocok!"
                      : "Konfirmasi kata sandi belum sama dengan kata sandi baru."}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            {!isForced && onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="text-xs"
              >
                Batal
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit}
              className="w-full sm:w-auto text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl shadow-md disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Server...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Simpan Kata Sandi Baru</span>
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
