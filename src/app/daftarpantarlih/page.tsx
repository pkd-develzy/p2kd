"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Navbar, Footer } from "@/components/layout";
import {
  UserCheck,
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Phone,
  RefreshCw,
  Sparkles,
  Info,
  Calendar,
  Lock,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { SignaturePad } from "@/components/ui/signature-pad";
import { DAFTAR_RW_KALISALAK, DAFTAR_RT_KALISALAK } from "@/lib/kalisalak-wilayah";
import { MasterPetugasDpt } from "@/lib/data-store";
import { downloadPetugasPdf } from "@/lib/petugas-pdf-generator";

const formatTanggalWaktu = (val?: string) => {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function PendaftaranPetugasPage() {
  const [activeTab, setActiveTab] = useState<"daftar" | "status">("daftar");

  // Form Registration States
  const [formData, setFormData] = useState({
    nik: "",
    namaLengkap: "",
    tempatLahir: "",
    tanggalLahir: "",
    jenisKelamin: "L" as "L" | "P",
    noKk: "",
    alamat: "",
    rt: "01",
    rw: "01",
    dusun: "Desa Kalisalak",
    nomorWa: "",
    // Questions
    isCalonKades: false,
    keteranganCalonKades: "",
    isTimSukses: false,
    keteranganTimSukses: "",
    isKepentinganCalon: false,
    keteranganKepentingan: "",
    persetujuanPernyataan: false,
  });

  const [tandaTanganUrl, setTandaTanganUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<MasterPetugasDpt | null>(null);

  // Status Lookup States
  const [searchReg, setSearchReg] = useState("");
  const [searchWa, setSearchWa] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [statusResult, setStatusResult] = useState<MasterPetugasDpt | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Public Edit States (Pendaftar)
  const [isEditingPublic, setIsEditingPublic] = useState(false);
  const [publicEditData, setPublicEditData] = useState({
    namaLengkap: "",
    nik: "",
    noKk: "",
    tempatLahir: "",
    tanggalLahir: "",
    jenisKelamin: "L" as "L" | "P",
    nomorWa: "",
    alamat: "",
    rt: "01",
    rw: "01",
    dusun: "Desa Kalisalak",
    isCalonKades: false,
    keteranganCalonKades: "",
    isTimSukses: false,
    keteranganTimSukses: "",
    isKepentinganCalon: false,
    keteranganKepentingan: "",
  });
  const [publicEditSignature, setPublicEditSignature] = useState<string | null>(null);
  const [isSavingPublicEdit, setIsSavingPublicEdit] = useState(false);
  const [publicEditSuccess, setPublicEditSuccess] = useState<string | null>(null);
  const [publicEditError, setPublicEditError] = useState<string | null>(null);

  // Start Public Edit
  const handleStartPublicEdit = () => {
    if (!statusResult) return;
    setPublicEditData({
      namaLengkap: statusResult.namaLengkap || "",
      nik: statusResult.nik || "",
      noKk: statusResult.noKk || "",
      tempatLahir: statusResult.tempatLahir || "",
      tanggalLahir: statusResult.tanggalLahir || "",
      jenisKelamin: (statusResult.jenisKelamin as "L" | "P") || "L",
      nomorWa: statusResult.nomorWa || "",
      alamat: statusResult.alamat || "",
      rt: statusResult.rt || "01",
      rw: statusResult.rw || "01",
      dusun: statusResult.dusun || "Desa Kalisalak",
      isCalonKades: Boolean(statusResult.isCalonKades),
      keteranganCalonKades: statusResult.keteranganCalonKades || "",
      isTimSukses: Boolean(statusResult.isTimSukses),
      keteranganTimSukses: statusResult.keteranganTimSukses || "",
      isKepentinganCalon: Boolean(statusResult.isKepentinganCalon),
      keteranganKepentingan: statusResult.keteranganKepentingan || "",
    });
    setPublicEditSignature(null);
    setIsEditingPublic(true);
    setPublicEditSuccess(null);
    setPublicEditError(null);
  };

  // Save Public Edit
  const handleSavePublicEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusResult) return;
    setPublicEditError(null);
    setPublicEditSuccess(null);

    const cleanNik = publicEditData.nik.replace(/\D/g, "");
    if (cleanNik && cleanNik.length !== 16) {
      setPublicEditError("NIK harus tepat 16 digit angka.");
      return;
    }
    const cleanKk = publicEditData.noKk.replace(/\D/g, "");
    if (cleanKk && cleanKk.length !== 16) {
      setPublicEditError("Nomor Kartu Keluarga (KK) harus tepat 16 digit angka.");
      return;
    }
    const cleanWa = publicEditData.nomorWa.replace(/\D/g, "");
    if (cleanWa.length < 9) {
      setPublicEditError("Nomor WhatsApp minimal 9 digit angka.");
      return;
    }

    setIsSavingPublicEdit(true);

    try {
      const authWa = searchWa.replace(/\D/g, "") || statusResult.nomorWa.replace(/\D/g, "");
      const res = await fetch("/api/petugas-dpt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomorRegistrasi: statusResult.nomorRegistrasi,
          noWaAuth: authWa,
          ...publicEditData,
          nik: cleanNik,
          noKk: cleanKk,
          nomorWa: cleanWa,
          ...(publicEditSignature ? { tandaTanganUrl: publicEditSignature } : {}),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setPublicEditError(json.message || "Gagal memperbarui data pendaftaran.");
        setIsSavingPublicEdit(false);
        return;
      }

      setStatusResult(json.data);
      setIsEditingPublic(false);
      setPublicEditSuccess(
        "Data pendaftaran Anda berhasil diperbarui! Berkas Anda kini tercatat dan siap diverifikasi oleh Panitia P2KD."
      );
    } catch {
      setPublicEditError("Terjadi kendala koneksi ke server. Silakan coba kembali.");
    } finally {
      setIsSavingPublicEdit(false);
    }
  };

  // Handle Input Changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validations
    const cleanNik = formData.nik.replace(/\D/g, "");
    if (cleanNik.length !== 16) {
      setFormError("NIK harus tepat 16 digit angka.");
      return;
    }

    const cleanKk = formData.noKk.replace(/\D/g, "");
    if (cleanKk.length !== 16) {
      setFormError("Nomor Kartu Keluarga (KK) harus tepat 16 digit angka.");
      return;
    }

    const cleanWa = formData.nomorWa.replace(/\D/g, "");
    if (cleanWa.length < 9 || cleanWa.length > 15) {
      setFormError("Nomor WhatsApp harus valid (antara 9 - 15 digit angka).");
      return;
    }

    if (!formData.persetujuanPernyataan) {
      setFormError("Anda wajib mencentang persetujuan Surat Pernyataan Netralitas dan Integritas.");
      return;
    }

    if (!tandaTanganUrl) {
      setFormError("Tanda tangan digital belum dibuat. Silakan tanda tangani di area layar yang disediakan.");
      return;
    }

    // Required explanation if answered "Ya"
    if (formData.isCalonKades && !formData.keteranganCalonKades.trim()) {
      setFormError("Mohon berikan keterangan mengenai status pencalonan Kepala Desa Anda.");
      return;
    }
    if (formData.isTimSukses && !formData.keteranganTimSukses.trim()) {
      setFormError("Mohon berikan keterangan mengenai tim sukses/relawan yang Anda ikuti.");
      return;
    }
    if (formData.isKepentinganCalon && !formData.keteranganKepentingan.trim()) {
      setFormError("Mohon berikan penjelasan mengenai kepentingan atau afiliasi Anda dengan calon.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/petugas-dpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          nik: cleanNik,
          noKk: cleanKk,
          nomorWa: cleanWa,
          tandaTanganUrl,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setFormError(json.message || "Gagal mengirim pendaftaran. Silakan periksa isian data Anda.");
        setIsSubmitting(false);
        return;
      }

      // Successful submission
      const fullCreatedObj: MasterPetugasDpt = {
        ...formData,
        id: json.data.id,
        nomorRegistrasi: json.data.nomorRegistrasi,
        nik: cleanNik,
        nikMasked: json.data.nikMasked,
        noKk: cleanKk,
        noKkMasked: json.data.noKkMasked,
        status: json.data.status,
        tandaTanganUrl,
        assignedWilayah: `RW ${formData.rw}`,
        tanggalPendaftaran: json.data.tanggalPendaftaran,
        updatedAt: json.data.tanggalPendaftaran,
      };

      setSubmittedData(fullCreatedObj);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError("Terjadi gangguan koneksi internet. Silakan coba kembali beberapa saat lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Search Handler
  const handleSearchStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setStatusResult(null);

    if (!searchReg.trim() || !searchWa.trim()) {
      setSearchError("Nomor Registrasi dan Nomor WhatsApp wajib diisi.");
      return;
    }

    setIsSearching(true);

    try {
      const cleanWa = searchWa.replace(/\D/g, "");
      const res = await fetch(
        `/api/petugas-dpt?noRegistrasi=${encodeURIComponent(searchReg.trim())}&noWa=${encodeURIComponent(cleanWa)}`
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        setSearchError(json.message || "Data pendaftaran tidak ditemukan. Pastikan data yang dimasukkan benar.");
        setIsSearching(false);
        return;
      }

      setStatusResult(json.data);
    } catch {
      setSearchError("Gagal memeriksa status. Periksa jaringan internet Anda.");
    } finally {
      setIsSearching(false);
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "MENUNGGU_VERIFIKASI":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Menunggu Verifikasi
          </span>
        );
      case "PERLU_KLARIFIKASI":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
            Perlu Klarifikasi Panitia
          </span>
        );
      case "LOLOS":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Lolos Seleksi Administrasi
          </span>
        );
      case "DITETAPKAN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Ditetapkan Sebagai Petugas
          </span>
        );
      case "TIDAK_LOLOS":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Tidak Lolos
          </span>
        );
      default:
        return <span className="text-xs font-bold text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-slate-50 via-slate-100 to-slate-200 text-slate-800 selection:bg-blue-600/20 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* Header Banner */}
        <div className="relative bg-linear-to-r from-blue-950 via-slate-900 to-indigo-950 text-white pt-10 sm:pt-14 pb-16 px-4 shadow-xl border-b border-blue-800/40">
          <div className="max-w-4xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Panitia Pemilihan Kepala Desa (P2KD) Kalisalak 2026/2027
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Pendaftaran Petugas Pendataan DPT
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Rekrutmen resmi Petugas Pemutakhiran Data Pemilih (Pantarlih/Coklit) Desa Kalisalak.
              Wajib berintegritas tinggi, jujur, dan netral dari kepentingan calon manapun.
            </p>

            {/* Privacy & Legal Notice Badge */}
            <div className="pt-2 flex flex-wrap justify-center items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                UU PDP Terlindungi
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                Pakta Integritas Digital
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                Tanda Tangan Layar HP
              </span>
            </div>
          </div>
        </div>

        {/* Main Container */}
        <div className="max-w-4xl mx-auto px-4 -mt-7 relative z-20">
          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 flex gap-1.5 mb-8">
          <button
            type="button"
            onClick={() => {
              setActiveTab("daftar");
              setSubmittedData(null);
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === "daftar"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Formulir Pendaftaran
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("status")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === "status"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Search className="w-4 h-4" />
            Cek Status Pendaftaran
          </button>
        </div>

        {/* Tab 1: FORM PENDAFTARAN */}
        {activeTab === "daftar" && (
          <div>
            {/* SUCCESS VIEW AFTER REGISTRATION */}
            {submittedData ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-xl border border-emerald-200 p-6 sm:p-10 space-y-6"
              >
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Pendaftaran Berhasil Dikirim!
                  </h2>
                  <p className="text-sm text-slate-600 max-w-lg mx-auto">
                    Data Anda telah resmi tersimpan di server P2KD Kalisalak. Simpan Nomor Registrasi berikut
                    untuk memeriksa tahapan seleksi administrasi.
                  </p>
                </div>

                {/* Big Badge Number */}
                <div className="bg-linear-to-r from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center space-y-1 shadow-sm">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                    Nomor Registrasi Resmi Anda
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-blue-900 font-mono tracking-wide">
                    {submittedData.nomorRegistrasi}
                  </div>
                  <div className="pt-2 flex justify-center">
                    {renderStatusBadge(submittedData.status)}
                  </div>
                </div>

                {/* Information Checklist */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-600" />
                    Rincian Pendaftar:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <span className="text-slate-400">Nama:</span>{" "}
                      <strong>{submittedData.namaLengkap}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">NIK:</span>{" "}
                      <strong>{submittedData.nikMasked}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Wilayah:</span>{" "}
                      <strong>
                        RW {submittedData.rw} • Desa Kalisalak
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">WhatsApp:</span>{" "}
                      <strong>{submittedData.nomorWa}</strong>
                    </div>
                  </div>
                </div>

                {/* PDF Download Action Buttons */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                    Unduh Dokumen Berkas Pendaftaran Resmi (PDF)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => downloadPetugasPdf(submittedData, "pernyataan")}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center gap-2 shadow-md shadow-blue-700/20 transition-all hover:scale-[1.01]"
                    >
                      <Download className="w-4 h-4" />
                      Unduh Surat Pernyataan Netralitas (PDF)
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadPetugasPdf(submittedData, "bukti")}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-950 text-white flex items-center justify-center gap-2 shadow-md shadow-slate-900/20 transition-all hover:scale-[1.01]"
                    >
                      <Download className="w-4 h-4" />
                      Unduh Tanda Bukti Pendaftaran (PDF)
                    </button>
                  </div>
                </div>

                {/* Re-check button */}
                <div className="text-center pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchReg(submittedData.nomorRegistrasi);
                      setSearchWa(submittedData.nomorWa);
                      setActiveTab("status");
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1.5"
                  >
                    Buka Halaman Cek Status <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              /* REGISTRATION FORM */
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-10 space-y-8"
              >
                {/* Error Banner */}
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 font-medium"
                  >
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">{formError}</div>
                  </motion.div>
                )}

                {/* BAGIAN 1: BIODATA PENDAFTAR */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center">
                      1
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Identitas Diri & Kependudukan
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    {/* NIK */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 flex items-center justify-between">
                        <span>NIK (Nomor Induk Kependudukan) <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-slate-400 font-normal">16 Digit</span>
                      </label>
                      <input
                        type="text"
                        name="nik"
                        maxLength={16}
                        required
                        value={formData.nik}
                        onChange={handleChange}
                        placeholder="Contoh: 3328091205900001"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono"
                      />
                    </div>

                    {/* Nomor KK */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 flex items-center justify-between">
                        <span>Nomor Kartu Keluarga (KK) <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-slate-400 font-normal">16 Digit</span>
                      </label>
                      <input
                        type="text"
                        name="noKk"
                        maxLength={16}
                        required
                        value={formData.noKk}
                        onChange={handleChange}
                        placeholder="Contoh: 3328092408100002"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono"
                      />
                    </div>

                    {/* Nama Lengkap */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-semibold text-slate-700">
                        Nama Lengkap (Sesuai KTP-el) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="namaLengkap"
                        required
                        value={formData.namaLengkap}
                        onChange={handleChange}
                        placeholder="Masukkan nama lengkap beserta gelar jika ada"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all uppercase"
                      />
                    </div>

                    {/* Tempat Lahir */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">
                        Tempat Lahir <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="tempatLahir"
                        required
                        value={formData.tempatLahir}
                        onChange={handleChange}
                        placeholder="Contoh: Tegal"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>

                    {/* Tanggal Lahir */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">
                        Tanggal Lahir <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="tanggalLahir"
                        required
                        value={formData.tanggalLahir}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>

                    {/* Jenis Kelamin */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">
                        Jenis Kelamin <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="jenisKelamin"
                        value={formData.jenisKelamin}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>

                    {/* Nomor WhatsApp */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 flex items-center justify-between">
                        <span>Nomor WhatsApp Aktif <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Verifikasi Status
                        </span>
                      </label>
                      <input
                        type="text"
                        name="nomorWa"
                        required
                        value={formData.nomorWa}
                        onChange={handleChange}
                        placeholder="Contoh: 081234567890"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* BAGIAN 2: DOMISILI & PENUGASAN WILAYAH */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-black text-sm flex items-center justify-center">
                      2
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Alamat Domisili & Wilayah Pendaftaran
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                    {/* Alamat Jalan / Gang */}
                    <div className="space-y-1.5 sm:col-span-3">
                      <label className="font-semibold text-slate-700">
                        Alamat Lengkap / Jalan / Gang <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="alamat"
                        required
                        value={formData.alamat}
                        onChange={handleChange}
                        placeholder="Contoh: Jl. Ki Hajar Dewantara No. 14"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>

                    {/* RT */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">
                        RT <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="rt"
                        value={formData.rt}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                      >
                        {DAFTAR_RT_KALISALAK.map((rt) => (
                          <option key={rt.value} value={rt.value}>
                            {rt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* RW */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">
                        RW (Wilayah Tugas) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="rw"
                        value={formData.rw}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white font-semibold text-blue-900"
                      >
                        {DAFTAR_RW_KALISALAK.map((rw) => (
                          <option key={rw.value} value={rw.value}>
                            {rw.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Desa (Permanen dan Hanya 1) */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 flex items-center justify-between">
                        <span>Desa <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Permanen</span>
                      </label>
                      <input
                        type="text"
                        name="dusun"
                        readOnly
                        value="Desa Kalisalak"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-100 text-slate-800 font-bold outline-none cursor-not-allowed select-none shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* BAGIAN 3: SKRINING NETRALITAS & INTEGRITAS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-black text-sm flex items-center justify-center">
                      3
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        Uji Integritas & Skrining Netralitas Wajib
                      </h2>
                      <p className="text-xs text-slate-500">
                        Jawablah pertanyaan berikut secara jujur dan terbuka demi menjaga netralitas Pilkades.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm">
                    {/* Pertanyaan 1: Calon Kades */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800">
                          1. Apakah Anda merupakan calon / bakal calon Kepala Desa Kalisalak?
                        </span>
                        <div className="flex items-center gap-4 shrink-0 font-bold">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="isCalonKades"
                              checked={formData.isCalonKades === true}
                              onChange={() => setFormData((prev) => ({ ...prev, isCalonKades: true }))}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Ya</span>
                          </label>
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="isCalonKades"
                              checked={formData.isCalonKades === false}
                              onChange={() =>
                                setFormData((prev) => ({ ...prev, isCalonKades: false, keteranganCalonKades: "" }))
                              }
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Tidak</span>
                          </label>
                        </div>
                      </div>

                      {formData.isCalonKades && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pt-2 space-y-1.5"
                        >
                          <label className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Keterangan Tambahan Calon Kepala Desa (Wajib Diisi):
                          </label>
                          <textarea
                            rows={2}
                            name="keteranganCalonKades"
                            value={formData.keteranganCalonKades}
                            onChange={handleChange}
                            placeholder="Tuliskan alasan / rincian status pencalonan Anda..."
                            className="w-full px-3 py-2 text-xs rounded-lg border border-rose-300 focus:ring-2 focus:ring-rose-200 outline-none bg-white"
                          />
                          <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                            Status pendaftaran Anda otomatis menjadi <strong>Perlu Verifikasi Panitia</strong> karena adanya potensi benturan kepentingan.
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Pertanyaan 2: Tim Sukses */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800">
                          2. Apakah Anda merupakan tim sukses / relawan salah satu calon Kepala Desa?
                        </span>
                        <div className="flex items-center gap-4 shrink-0 font-bold">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="isTimSukses"
                              checked={formData.isTimSukses === true}
                              onChange={() => setFormData((prev) => ({ ...prev, isTimSukses: true }))}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Ya</span>
                          </label>
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="isTimSukses"
                              checked={formData.isTimSukses === false}
                              onChange={() =>
                                setFormData((prev) => ({ ...prev, isTimSukses: false, keteranganTimSukses: "" }))
                              }
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Tidak</span>
                          </label>
                        </div>
                      </div>

                      {formData.isTimSukses && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pt-2 space-y-1.5"
                        >
                          <label className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Keterangan Tim Sukses / Relawan (Wajib Diisi):
                          </label>
                          <textarea
                            rows={2}
                            name="keteranganTimSukses"
                            value={formData.keteranganTimSukses}
                            onChange={handleChange}
                            placeholder="Tuliskan nama calon atau peran Anda dalam kegiatan tim..."
                            className="w-full px-3 py-2 text-xs rounded-lg border border-rose-300 focus:ring-2 focus:ring-rose-200 outline-none bg-white"
                          />
                          <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                            Status pendaftaran Anda otomatis menjadi <strong>Perlu Verifikasi Panitia</strong> untuk pemeriksaan keabsahan netralitas oleh P2KD.
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Pertanyaan 3: Kepentingan dengan Calon */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800">
                          3. Apakah Anda memiliki kepentingan khusus atau hubungan keluarga inti dengan salah satu calon?
                        </span>
                        <div className="flex items-center gap-4 shrink-0 font-bold">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="isKepentinganCalon"
                              checked={formData.isKepentinganCalon === true}
                              onChange={() => setFormData((prev) => ({ ...prev, isKepentinganCalon: true }))}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Ya</span>
                          </label>
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="isKepentinganCalon"
                              checked={formData.isKepentinganCalon === false}
                              onChange={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  isKepentinganCalon: false,
                                  keteranganKepentingan: "",
                                }))
                              }
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Tidak</span>
                          </label>
                        </div>
                      </div>

                      {formData.isKepentinganCalon && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pt-2 space-y-1.5"
                        >
                          <label className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Keterangan Kepentingan / Hubungan Keluarga (Wajib Diisi):
                          </label>
                          <textarea
                            rows={2}
                            name="keteranganKepentingan"
                            value={formData.keteranganKepentingan}
                            onChange={handleChange}
                            placeholder="Tuliskan hubungan kekeluargaan atau kepentingan yang Anda miliki..."
                            className="w-full px-3 py-2 text-xs rounded-lg border border-rose-300 focus:ring-2 focus:ring-rose-200 outline-none bg-white"
                          />
                          <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                            Status pendaftaran Anda otomatis menjadi <strong>Perlu Verifikasi Panitia</strong> untuk pencegahan diskriminasi data pemilih.
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* BAGIAN 4: SURAT PERNYATAAN NETRALITAS & INTEGRITAS RESMI */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                      4
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        Surat Pernyataan Netralitas & Integritas
                      </h2>
                      <p className="text-xs text-slate-500">
                        Komitmen mutlak petugas pendataan DPT demi tegaknya Pilkades yang jujur dan adil.
                      </p>
                    </div>
                  </div>

                  {/* Document Box */}
                  <div className="p-5 rounded-xl border border-blue-200 bg-linear-to-br from-blue-50/50 via-slate-50 to-indigo-50/50 space-y-3.5">
                    <div className="text-xs font-bold text-blue-900 uppercase tracking-wider text-center pb-2 border-b border-blue-200/60">
                      Isi Pokok Surat Pernyataan Netralitas Petugas:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                      <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Tidak menjadi</strong> calon Kepala Desa.</span>
                      </div>

                      <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Tidak menjadi</strong> tim sukses atau relawan calon.</span>
                      </div>

                      <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Tidak memihak</strong> kepada calon Kepala Desa tertentu.</span>
                      </div>

                      <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Tidak menerima uang</strong>, hadiah, atau fasilitas dari calon/tim.</span>
                      </div>

                      <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Tidak memanipulasi</strong> data pemilih dalam bentuk apapun.</span>
                      </div>

                      <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Tidak membocorkan</strong> data pemilih ke pihak tidak berwenang.</span>
                      </div>

                      <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Bersedia menjaga</strong> kerahasiaan data warga sesuai UU PDP.</span>
                      </div>

                      <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Bersedia diberhentikan</strong> dan diproses hukum jika melanggar.</span>
                      </div>
                    </div>

                    {/* Mandatory Agreement Checkbox */}
                    <div className="pt-3 border-t border-blue-200/80">
                      <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-xl bg-blue-100/70 hover:bg-blue-100 border border-blue-300 transition-all">
                        <input
                          type="checkbox"
                          name="persetujuanPernyataan"
                          required
                          checked={formData.persetujuanPernyataan}
                          onChange={handleChange}
                          className="w-5 h-5 text-blue-700 rounded border-slate-300 focus:ring-blue-500 mt-0.5 shrink-0"
                        />
                        <span className="text-xs sm:text-sm font-bold text-blue-950 leading-snug">
                          Saya telah membaca, memahami, dan menyetujui seluruh pernyataan di atas tanpa paksaan dari pihak manapun.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* BAGIAN 5: TANDA TANGAN DIGITAL LANGSUNG DI LAYAR HP */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-black text-sm flex items-center justify-center">
                      5
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        Tanda Tangan Digital Pendaftar
                      </h2>
                      <p className="text-xs text-slate-500">
                        Bubuhkan tanda tangan Anda langsung pada kotak di bawah menggunakan jari atau stylus.
                      </p>
                    </div>
                  </div>

                  {/* Digital Signature Pad Component */}
                  <SignaturePad
                    onSignatureChange={(sig) => setTandaTanganUrl(sig)}
                    height={190}
                  />

                  <p className="text-[11px] text-slate-500 italic">
                    * Tanda tangan digital ini akan secara otomatis dimasukkan ke dalam Surat Pernyataan Netralitas & Tanda Bukti Pendaftaran berformat PDF resmi.
                  </p>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.persetujuanPernyataan || !tandaTanganUrl}
                    className="w-full py-4 px-6 rounded-xl font-bold text-sm sm:text-base bg-linear-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white shadow-lg shadow-blue-700/25 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.005] active:scale-[0.995]"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Memproses Pendaftaran & Menerbitkan Nomor Dokumen...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5" />
                        Kirim Pendaftaran Petugas Pendataan DPT
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <span className="text-[11px] text-slate-500">
                      Dengan mengirimkan form ini, data Anda diverifikasi oleh Sistem Keamanan P2KD Desa Kalisalak.
                    </span>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: CEK STATUS PENDAFTARAN */}
        {activeTab === "status" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-1.5 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Search className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Cek Status Pendaftaran Petugas
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Masukkan Nomor Registrasi dan Nomor WhatsApp Anda untuk melihat hasil verifikasi berkas oleh Panitia P2KD.
                </p>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearchStatus} className="space-y-4 max-w-lg mx-auto">
                {searchError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{searchError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Nomor Registrasi Pendaftaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={searchReg}
                    onChange={(e) => setSearchReg(e.target.value)}
                    placeholder="Contoh: PTG-KLS-2026-00001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm font-mono uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Nomor WhatsApp Terdaftar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={searchWa}
                    onChange={(e) => setSearchWa(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Mencari Data Pendaftaran...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Periksa Status Pendaftaran
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* STATUS RESULT CARD */}
            {statusResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6"
              >
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Nomor Registrasi
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-blue-950 font-mono">
                      {statusResult.nomorRegistrasi}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Daftar: {formatTanggalWaktu(statusResult.tanggalPendaftaran)}
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Status Saat Ini
                    </span>
                    {renderStatusBadge(statusResult.status)}
                  </div>
                </div>

                {/* Catatan Panitia jika ada */}
                {statusResult.catatanPanitia && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 space-y-1">
                    <strong className="flex items-center gap-1.5 text-amber-800">
                      <Info className="w-4 h-4 text-amber-600" />
                      Catatan Resmi Panitia P2KD:
                    </strong>
                    <p className="leading-relaxed pl-5">{statusResult.catatanPanitia}</p>
                  </div>
                )}

                {/* Biodata Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nama Lengkap:</span>
                    <strong className="text-slate-900">{statusResult.namaLengkap}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">NIK Terdaftar:</span>
                    <strong className="font-mono text-slate-900">{statusResult.nikMasked}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Wilayah Penugasan:</span>
                    <strong className="text-blue-900 font-bold">
                      {statusResult.assignedWilayah || `RW ${statusResult.rw}`} • Desa Kalisalak
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nomor Kontak:</span>
                    <strong className="font-mono text-slate-900">{statusResult.nomorWa}</strong>
                  </div>
                </div>

                {/* Success Alert after public edit */}
                {publicEditSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Pembaruan Berhasil Disimpan!</strong>
                      <span>{publicEditSuccess}</span>
                    </div>
                  </div>
                )}

                {/* FORM EDIT DATA MANDIRI OLEH PENDAFTAR */}
                {isEditingPublic ? (
                  <form onSubmit={handleSavePublicEdit} className="space-y-6 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                      <div className="flex items-center gap-2 text-amber-900">
                        <Edit3 className="w-5 h-5 text-amber-600" />
                        <h3 className="font-bold text-sm sm:text-base">
                          Formulir Koreksi / Perbaikan Data Mandiri
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingPublic(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {publicEditError && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{publicEditError}</span>
                      </div>
                    )}

                    {/* Section 1: Biodata */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="font-bold text-xs text-blue-900 uppercase tracking-wider block">
                        1. Data Biodata & Kependudukan
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-xs">Nama Lengkap:</label>
                          <input
                            type="text"
                            required
                            value={publicEditData.namaLengkap}
                            onChange={(e) =>
                              setPublicEditData({ ...publicEditData, namaLengkap: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-xs">Nomor WhatsApp Aktif:</label>
                          <input
                            type="text"
                            required
                            value={publicEditData.nomorWa}
                            onChange={(e) =>
                              setPublicEditData({
                                ...publicEditData,
                                nomorWa: e.target.value.replace(/\D/g, ""),
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-xs">NIK (16 Digit):</label>
                          <input
                            type="text"
                            maxLength={16}
                            required
                            value={publicEditData.nik}
                            onChange={(e) =>
                              setPublicEditData({
                                ...publicEditData,
                                nik: e.target.value.replace(/\D/g, ""),
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-xs">Nomor Kartu Keluarga (KK):</label>
                          <input
                            type="text"
                            maxLength={16}
                            required
                            value={publicEditData.noKk}
                            onChange={(e) =>
                              setPublicEditData({
                                ...publicEditData,
                                noKk: e.target.value.replace(/\D/g, ""),
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-xs">Tempat Lahir:</label>
                          <input
                            type="text"
                            required
                            value={publicEditData.tempatLahir}
                            onChange={(e) =>
                              setPublicEditData({ ...publicEditData, tempatLahir: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-xs">Tanggal Lahir:</label>
                          <input
                            type="date"
                            required
                            value={publicEditData.tanggalLahir}
                            onChange={(e) =>
                              setPublicEditData({ ...publicEditData, tanggalLahir: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-xs">Jenis Kelamin:</label>
                          <select
                            value={publicEditData.jenisKelamin}
                            onChange={(e) =>
                              setPublicEditData({
                                ...publicEditData,
                                jenisKelamin: e.target.value as "L" | "P",
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-500 outline-none"
                          >
                            <option value="L">Laki-laki (L)</option>
                            <option value="P">Perempuan (P)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-xs">Wilayah Domisili:</label>
                          <input
                            type="text"
                            value={publicEditData.dusun}
                            onChange={(e) =>
                              setPublicEditData({ ...publicEditData, dusun: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="font-bold text-slate-700 text-xs">Alamat Jalan / Gang:</label>
                          <input
                            type="text"
                            required
                            value={publicEditData.alamat}
                            onChange={(e) =>
                              setPublicEditData({ ...publicEditData, alamat: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Wilayah Domisili Kalisalak */}
                    <div className="space-y-3 bg-blue-50/40 p-4 rounded-xl border border-blue-200">
                      <span className="font-bold text-xs text-blue-900 uppercase tracking-wider block">
                        2. Wilayah Domisili (RW & RT)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-xs">Pilihan Rukun Warga (RW):</label>
                          <select
                            value={publicEditData.rw}
                            onChange={(e) =>
                              setPublicEditData({ ...publicEditData, rw: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-blue-900 focus:border-blue-500 outline-none"
                          >
                            {DAFTAR_RW_KALISALAK.map((rw) => (
                              <option key={rw.value} value={rw.value}>
                                {rw.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-xs">Pilihan Rukun Tetangga (RT):</label>
                          <select
                            value={publicEditData.rt}
                            onChange={(e) =>
                              setPublicEditData({ ...publicEditData, rt: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:border-blue-500 outline-none"
                          >
                            {DAFTAR_RT_KALISALAK.map((rt) => (
                              <option key={rt.value} value={rt.value}>
                                {rt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Uji Netralitas */}
                    <div className="space-y-3 bg-amber-50/40 p-4 rounded-xl border border-amber-200">
                      <span className="font-bold text-xs text-amber-900 uppercase tracking-wider block">
                        3. Pernyataan Integritas & Uji Netralitas
                      </span>

                      {/* Q1 */}
                      <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={publicEditData.isCalonKades}
                            onChange={(e) =>
                              setPublicEditData({ ...publicEditData, isCalonKades: e.target.checked })
                            }
                            className="w-4 h-4 text-amber-600 rounded"
                          />
                          <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                            Saya adalah Calon Kepala Desa Kalisalak
                          </span>
                        </label>
                        {publicEditData.isCalonKades && (
                          <input
                            type="text"
                            value={publicEditData.keteranganCalonKades}
                            onChange={(e) =>
                              setPublicEditData({
                                ...publicEditData,
                                keteranganCalonKades: e.target.value,
                              })
                            }
                            placeholder="Berikan keterangan pencalonan..."
                            className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-xs outline-none"
                          />
                        )}
                      </div>

                      {/* Q2 */}
                      <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={publicEditData.isTimSukses}
                            onChange={(e) =>
                              setPublicEditData({ ...publicEditData, isTimSukses: e.target.checked })
                            }
                            className="w-4 h-4 text-amber-600 rounded"
                          />
                          <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                            Saya adalah Tim Sukses / Relawan Salah Satu Calon
                          </span>
                        </label>
                        {publicEditData.isTimSukses && (
                          <input
                            type="text"
                            value={publicEditData.keteranganTimSukses}
                            onChange={(e) =>
                              setPublicEditData({
                                ...publicEditData,
                                keteranganTimSukses: e.target.value,
                              })
                            }
                            placeholder="Berikan keterangan tim sukses..."
                            className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-xs outline-none"
                          />
                        )}
                      </div>

                      {/* Q3 */}
                      <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={publicEditData.isKepentinganCalon}
                            onChange={(e) =>
                              setPublicEditData({
                                ...publicEditData,
                                isKepentinganCalon: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-amber-600 rounded"
                          />
                          <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                            Saya memiliki hubungan keluarga / kepentingan langsung dengan Calon
                          </span>
                        </label>
                        {publicEditData.isKepentinganCalon && (
                          <input
                            type="text"
                            value={publicEditData.keteranganKepentingan}
                            onChange={(e) =>
                              setPublicEditData({
                                ...publicEditData,
                                keteranganKepentingan: e.target.value,
                              })
                            }
                            placeholder="Berikan keterangan kepentingan / afiliasi..."
                            className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-xs outline-none"
                          />
                        )}
                      </div>
                    </div>

                    {/* Section 4: Spesimen Tanda Tangan */}
                    <div className="space-y-3 bg-purple-50/40 p-4 rounded-xl border border-purple-200">
                      <span className="font-bold text-xs text-purple-900 uppercase tracking-wider block">
                        4. Spesimen Tanda Tangan Digital (Opsional)
                      </span>
                      <p className="text-xs text-slate-600">
                        Bila tidak perlu mengganti tanda tangan, Anda dapat membiarkannya kosong. Tanda tangan terdahulu akan tetap digunakan.
                      </p>
                      <SignaturePad
                        onSignatureChange={(sig) => setPublicEditSignature(sig)}
                        height={160}
                      />
                    </div>

                    {/* Submit Edit Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setIsEditingPublic(false)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-all text-center"
                      >
                        Batalkan Koreksi
                      </button>

                      <button
                        type="submit"
                        disabled={isSavingPublicEdit}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {isSavingPublicEdit ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Menyimpan Perubahan...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Simpan & Kirim Perbaikan Data
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Action Buttons to re-download PDFs & Edit */}
                    <div className="pt-2 space-y-3">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                        Tindakan Dokumen & Perbaikan Data:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => downloadPetugasPdf(statusResult, "pernyataan")}
                          className="py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Surat Pernyataan (PDF)
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadPetugasPdf(statusResult, "bukti")}
                          className="py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-950 text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Tanda Bukti Pendaftaran (PDF)
                        </button>
                      </div>

                      {/* EDIT BUTTON UNTUK PENDAFTAR */}
                      {statusResult.status !== "DITETAPKAN" ? (
                        <button
                          type="button"
                          onClick={handleStartPublicEdit}
                          className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                          Perbaiki / Koreksi Data Pendaftaran Saya
                        </button>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Data Anda telah resmi <strong>Ditetapkan</strong> oleh Panitia P2KD. Silakan hubungi Sekretariat P2KD jika terdapat kekeliruan data.
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </main>

    <Footer />
  </div>
);
}
