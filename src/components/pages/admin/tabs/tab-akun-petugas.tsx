/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import {
  User,
  KeyRound,
  LogOut,
  Camera,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, Badge } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { AnggotaP2KD } from "../types";

interface TabAkunPetugasProps {
  userName: string;
  userRole?: string;
  userSeksi: string;
  userJabatan: string;
  assignedTps: string;
  anggotaList: AnggotaP2KD[];
  onLogout: () => Promise<void>;
  onRefresh?: () => void;
}

export const TabAkunPetugas: React.FC<TabAkunPetugasProps> = ({
  userName,
  userSeksi,
  userJabatan,
  assignedTps,
  anggotaList,
  onLogout,
  onRefresh,
}) => {
  const toast = useToast();
  const { confirm, isOpen: isConfirmOpen, options: confirmOptions, handleConfirm, handleCancel } = useConfirm();

  // Find current matched anggota record from list
  const cleanCurrentUsername = userName.toLowerCase().replace("@kalisalak.desa.id", "").trim();
  const matchedMember = anggotaList.find(
    (a) =>
      a.username.toLowerCase().trim() === cleanCurrentUsername ||
      a.namaLengkap.toLowerCase().trim() === userName.toLowerCase().trim()
  );

  // Profile Photo State
  const [currentFoto, setCurrentFoto] = useState<string>(matchedMember?.fotoUrl || "");
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Password Policy Checks
  const passChecks = {
    length: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSymbol: /[^A-Za-z0-9]/.test(newPassword),
  };
  const isPassValid =
    passChecks.length &&
    passChecks.hasUpper &&
    passChecks.hasLower &&
    passChecks.hasNumber &&
    passChecks.hasSymbol;
  const isMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Handle Photo Picker & Compression
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format Tidak Valid", "Harap pilih file gambar (JPG, PNG, atau WebP).");
      return;
    }

    setIsUploadingFoto(true);

    try {
      // Compress image via HTML Canvas (max 400x400)
      const compressedDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxDim = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Gagal memproses canvas gambar"));
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            resolve(dataUrl);
          };
          img.onerror = () => reject(new Error("Gagal membaca file gambar"));
          img.src = readerEvent.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Gagal membaca file"));
        reader.readAsDataURL(file);
      });

      // Target member ID: if matchedMember exists use its ID, or pass username
      const targetId = matchedMember?.id || "CURRENT_USER";

      const res = await fetch("/api/admin/anggota", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetId,
          action: "update_foto",
          username: cleanCurrentUsername,
          fotoUrl: compressedDataUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memperbarui foto profil.");
      }

      setCurrentFoto(compressedDataUrl);
      toast.success("Foto Diperbarui", "Foto profil akun Anda berhasil disimpan.");
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses foto profil.";
      toast.error("Gagal Menyimpan Foto", msg);
    } finally {
      setIsUploadingFoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle Change Password Submit
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword.trim()) {
      toast.error("Validasi Gagal", "Kata sandi saat ini wajib diisi.");
      return;
    }

    if (!isPassValid) {
      toast.error(
        "Sandi Kurang Kuat",
        "Kata sandi baru harus memenuhi 5 kriteria keamanan (minimal 8 karakter, huruf besar, kecil, angka & simbol)."
      );
      return;
    }

    if (!isMatch) {
      toast.error("Validasi Gagal", "Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
      return;
    }

    setIsChangingPass(true);

    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanCurrentUsername,
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
          confirmPassword: confirmPassword.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memperbarui kata sandi.");
      }

      // Update token in storage if issued
      if (json.data?.token) {
        localStorage.setItem("admin_token", json.data.token);
        sessionStorage.setItem("admin_token", json.data.token);
      }

      toast.success(
        "Sandi Berhasil Diubah",
        "Kata sandi akun Anda telah berhasil diperbarui dan akun telah diaktivasi."
      );

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah kata sandi.";
      toast.error("Gagal Mengubah Sandi", msg);
    } finally {
      setIsChangingPass(false);
    }
  };

  // Handle Logout with confirmation
  const handleLogoutClick = async () => {
    const confirmed = await confirm({
      title: "Keluar dari Akun Petugas?",
      message: "Sesi kerja Anda pada perangkat ini akan diakhiri. Pastikan semua data pemilih telah tersinkronisasi.",
      confirmText: "Ya, Keluar Sesi",
      cancelText: "Batal",
      variant: "danger",
    });

    if (confirmed) {
      await onLogout();
    }
  };

  // Masked NIK helper
  const displayNik = matchedMember?.nik
    ? `${matchedMember.nik.slice(0, 6)}******${matchedMember.nik.slice(12)}`
    : "332801******0001";

  const isActivated = matchedMember?.isActivated || matchedMember?.hasChangedPassword;

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-8">
      {/* 1. Header Profile Card */}
      <Card className="p-5 sm:p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 text-white border border-blue-900/60 shadow-xl rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative z-10 text-center sm:text-left">
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-linear-to-tr from-blue-600 via-indigo-600 to-teal-400 p-0.5 shadow-2xl overflow-hidden">
              {currentFoto ? (
                <img
                  src={currentFoto}
                  alt={userName}
                  className="w-full h-full rounded-[22px] object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center text-white font-black text-3xl">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
              disabled={isUploadingFoto}
            />

            {/* Trigger Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFoto}
              className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-2 border-slate-950 cursor-pointer hover:scale-105 active:scale-95 transition-all"
              title="Ganti Foto Profil"
            >
              {isUploadingFoto ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* User Details */}
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <Badge variant="success" className="text-[10px] font-bold px-3 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse inline-block" />
                AKUN AKTIF
              </Badge>
              {isActivated ? (
                <Badge variant="primary" className="text-[10px] font-bold px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                  <CheckCircle2 className="w-3 h-3 mr-1 inline text-emerald-400" />
                  Sandi Pribadi Aktif
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[10px] font-bold px-3 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3 mr-1 inline" />
                  Sandi Bawaan Awal
                </Badge>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
              {matchedMember?.namaLengkap || userName}
            </h1>

            <p className="text-xs sm:text-sm text-blue-200 font-semibold flex items-center justify-center sm:justify-start gap-1.5 truncate">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{userJabatan || "Petugas Pemutakhiran Data Pemilih (Pantarlih)"}</span>
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-300 pt-1 flex-wrap font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                {assignedTps ? `Wilayah Penugasan ${assignedTps}` : "Seluruh Wilayah Desa"}
              </span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                NIK: {displayNik}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Informasi Detail Penugasan & Kredensial */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-xs rounded-3xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Rincian Identitas & Surat Keputusan</h2>
            <p className="text-[11px] text-slate-500">Legalitas dan wewenang petugas lapangan Pilkades Kalisalak 2027</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username Login</div>
            <div className="font-mono font-bold text-slate-900 text-sm">@{cleanCurrentUsername}</div>
            <div className="text-[10px] text-slate-500">Portal Petugas & Aplikasi Android APK</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wilayah Tugas RW</div>
            <div className="font-bold text-blue-900 text-sm">{assignedTps || "Semua Lingkungan RW"}</div>
            <div className="text-[10px] text-slate-500">Pencocokan & Pemutakhiran Data Warga</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Seksi Kepanitiaan</div>
            <div className="font-bold text-slate-900 text-sm">{matchedMember?.seksiLabel || userSeksi || "Seksi Pendaftaran Pemilih"}</div>
            <div className="text-[10px] text-slate-500">P2KD Kalisalak Masa Bakti 2026-2027</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SK Penetapan BPD</div>
            <div className="font-semibold text-slate-800 text-[11px] truncate" title={matchedMember?.skPenetapan || "Keputusan BPD No. 04/BPD-KLS/VII/2026"}>
              {matchedMember?.skPenetapan || "Keputusan BPD No. 04/BPD-KLS/VII/2026"}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">Sah & Terverifikasi</div>
          </div>
        </div>

        {/* Action Button: Ganti Foto Profil */}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingFoto}
            className="w-full text-xs font-bold rounded-2xl py-2.5 flex items-center justify-center gap-2 border-slate-300 hover:bg-slate-50"
          >
            {isUploadingFoto ? (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <Camera className="w-4 h-4 text-blue-600" />
            )}
            <span>{isUploadingFoto ? "Mengompres & Menyimpan Foto..." : "Ganti Foto Profil dari Galeri / Kamera"}</span>
          </Button>
        </div>
      </Card>

      {/* 3. Form Pergantian Password Akun */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-xs rounded-3xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pergantian Kata Sandi Akun</h2>
            <p className="text-[11px] text-slate-500">Perbarui kata sandi secara berkala untuk menjaga integritas data pemilih</p>
          </div>
        </div>

        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Kata Sandi Saat Ini <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPass ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi lama / sandi saat ini"
                required
                className="w-full h-11 px-3.5 pr-10 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showCurrentPass ? "Sembunyikan" : "Tampilkan"}
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Kata Sandi Baru <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter dengan huruf besar, angka & simbol"
                required
                className="w-full h-11 px-3.5 pr-10 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showNewPass ? "Sembunyikan" : "Tampilkan"}
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Policy Indicators */}
            {newPassword.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-[11px] mt-2">
                <div className="font-bold text-slate-600 text-[10px] uppercase tracking-wider mb-1">
                  Standar Keamanan Kata Sandi:
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className={`flex items-center gap-1.5 ${passChecks.length ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                    <Check className="w-3.5 h-3.5" /> Minimal 8 Karakter
                  </div>
                  <div className={`flex items-center gap-1.5 ${passChecks.hasUpper ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                    <Check className="w-3.5 h-3.5" /> Huruf Besar (A-Z)
                  </div>
                  <div className={`flex items-center gap-1.5 ${passChecks.hasLower ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                    <Check className="w-3.5 h-3.5" /> Huruf Kecil (a-z)
                  </div>
                  <div className={`flex items-center gap-1.5 ${passChecks.hasNumber ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                    <Check className="w-3.5 h-3.5" /> Angka (0-9)
                  </div>
                  <div className={`flex items-center gap-1.5 ${passChecks.hasSymbol ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                    <Check className="w-3.5 h-3.5" /> Karakter Simbol (@#$%)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                required
                className="w-full h-11 px-3.5 pr-10 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showConfirmPass ? "Sembunyikan" : "Tampilkan"}
              >
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {confirmPassword.length > 0 && (
              <div className={`text-[11px] font-bold ${isMatch ? "text-emerald-600" : "text-rose-600"}`}>
                {isMatch ? "✓ Konfirmasi kata sandi cocok." : "✕ Kata sandi konfirmasi belum cocok."}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={isChangingPass || !isPassValid || !isMatch}
            className="w-full text-xs font-bold rounded-2xl py-3 bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            {isChangingPass ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4 mr-2" />
            )}
            <span>{isChangingPass ? "Memvalidasi & Memperbarui..." : "Perbarui Kata Sandi Akun"}</span>
          </Button>
        </form>
      </Card>

      {/* 4. Keamanan Sesi & Logout */}
      <Card className="p-5 bg-white border border-rose-100 shadow-xs rounded-3xl space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <h2 className="text-sm font-bold flex items-center gap-1.5 text-rose-700">
              <LogOut className="w-4 h-4" />
              Keluar Sesi Akun
            </h2>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Keluarkan sesi akun pada perangkat ini. Semua data tersimpan aman di server terpusat.
            </p>
          </div>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleLogoutClick}
            className="shrink-0 text-xs font-bold rounded-2xl px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Keluar Sesi
          </Button>
        </div>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        options={confirmOptions}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};
