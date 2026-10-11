"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Bell,
  Send,
  Trash2,
  RefreshCw,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Info,
  ImageIcon,
  Upload,
  X,
  Calendar,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";

interface NotifikasiPetugasItem {
  id: string;
  judul: string;
  pesan: string;
  kategori: string;
  target_role: string;
  target_tps: string;
  author: string;
  image_url?: string | null;
  is_banner?: boolean;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
}

export const TabNotifikasiPetugas: React.FC = () => {
  const [notifications, setNotifications] = useState<NotifikasiPetugasItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [judul, setJudul] = useState("");
  const [pesan, setPesan] = useState("");
  const [kategori, setKategori] = useState<"INFORMASI" | "PENTING" | "INSTRUKSI" | "PEMBARUAN">("INFORMASI");
  const [targetRole, setTargetRole] = useState("SEMUA");
  const [targetTps, setTargetTps] = useState("SEMUA");
  
  // Banner Pengumuman Gambar (In-App Announcement Banner)
  const [isBanner, setIsBanner] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Jadwal Penayangan Otomatis (Waktu Indonesia Barat - WIB)
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState("");

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/notifikasi-petugas");
      const json = await res.json();
      if (json.success && Array.isArray(json.notifications)) {
        setNotifications(json.notifications);
      }
    } catch (e) {
      console.error("Gagal memuat notifikasi:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/notifikasi-petugas");
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.notifications)) {
          setNotifications(json.notifications);
        }
      } catch (e) {
        console.error("Gagal memuat notifikasi:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "File harus berupa format gambar (PNG / JPG / WebP)." });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Ukuran gambar maksimal 10 MB." });
      return;
    }

    setIsUploadingImage(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "p2kd_banner_petugas");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      const uploadedUrl = data.data?.url || data.secure_url || data.url;

      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
        setIsBanner(true); // Otomatis aktifkan mode banner jika ada poster gambar
        setStatusMessage({ type: "success", text: "Gambar poster banner berhasil diunggah ke Cloudinary!" });
      } else {
        setStatusMessage({ type: "error", text: data.message || "Gagal mengunggah gambar." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Terjadi kesalahan saat mengunggah gambar ke server." });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasImage = Boolean(imageUrl.trim());
    if (!hasImage && (!judul.trim() || !pesan.trim())) {
      setStatusMessage({ type: "error", text: "Judul dan isi pesan wajib diisi jika tidak menyertakan foto/poster." });
      return;
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      setStatusMessage({ type: "error", text: "Jadwal berakhir harus lebih lama dari jadwal mulai publikasi." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/notifikasi-petugas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: judul.trim(),
          pesan: pesan.trim(),
          kategori,
          target_role: targetRole,
          target_tps: targetTps,
          image_url: imageUrl.trim() || null,
          is_banner: isBanner,
          start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
          end_date: endDate && endDate.trim() ? new Date(endDate).toISOString() : null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage({ 
          type: "success", 
          text: isBanner 
            ? "Banner pengumuman bergambar berhasil diterbitkan/dijadwalkan ke Beranda Aplikasi Petugas!" 
            : "Notifikasi berhasil disiarkan/dijadwalkan ke aplikasi Android petugas!" 
        });
        setJudul("");
        setPesan("");
        setImageUrl("");
        setIsBanner(false);
        setEndDate("");
        await fetchNotifications();
      } else {
        setStatusMessage({ type: "error", text: json.message || "Gagal menerbitkan notifikasi." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Terjadi kesalahan jaringan saat mengirim notifikasi." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/notifikasi-petugas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          is_active: !currentActive,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_active: !currentActive } : n))
        );
      } else {
        alert(json.message || "Gagal mengubah status aktif.");
      }
    } catch {
      alert("Kesalahan koneksi saat mengubah status notifikasi.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus notifikasi ini dari aplikasi seluruh petugas?")) return;
    try {
      const res = await fetch(`/api/admin/notifikasi-petugas?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } else {
        alert(json.message || "Gagal menghapus notifikasi");
      }
    } catch {
      alert("Kesalahan koneksi saat menghapus notifikasi");
    }
  };

  const getScheduleStatus = (item: NotifikasiPetugasItem) => {
    if (!item.is_active) {
      return {
        label: "NONAKTIF",
        style: "bg-slate-800 text-slate-400 border-slate-700",
        icon: "⚪",
      };
    }
    const now = new Date();
    const start = item.start_date ? new Date(item.start_date) : null;
    const end = item.end_date ? new Date(item.end_date) : null;

    if (start && start > now) {
      return {
        label: "TERJADWAL (AKAN TAYANG)",
        style: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        icon: "⏳",
      };
    }
    if (end && end < now) {
      return {
        label: "BERAKHIR / KADALUARSA",
        style: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        icon: "🛑",
      };
    }
    return {
      label: "SEDANG TAYANG",
      style: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      icon: "🟢",
    };
  };

  const getKategoriBadge = (kat: string) => {
    switch (kat.toUpperCase()) {
      case "PENTING":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">PENTING</span>;
      case "INSTRUKSI":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">INSTRUKSI</span>;
      case "PEMBARUAN":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">PEMBARUAN</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">INFORMASI</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Pusat Notifikasi Aplikasi Native Petugas
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-medium">Khusus Android</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Kelola siaran pemberitahuan, poster banner beranda, dan rilis pembaruan langsung ke HP petugas Coklit P2KD. (Terpisah 100% dari Portal Publik).
            </p>
          </div>
        </div>
        <button
          onClick={fetchNotifications}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Segarkan
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            statusMessage.type === "success"
              ? "bg-emerald-950/60 border-emerald-600/60 text-emerald-300"
              : "bg-rose-950/60 border-rose-600/60 text-rose-300"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid: Form Kirim & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Kirim Notifikasi & Banner (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Send className="w-4 h-4 text-blue-400" />
            Terbitkan Notifikasi atau Banner Beranda ke HP Petugas
          </h3>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Judul Notifikasi / Pengumuman {imageUrl ? <span className="text-emerald-400 font-normal">(Opsional untuk Foto Poster)</span> : "*"}</span>
              </label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder={imageUrl ? "Opsional — Bisa dikosongkan jika hanya ingin menampilkan foto/poster" : "Contoh: Jadwal Penyerahan Berkas Model A-Pilkades Kalisalak"}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                required={!imageUrl}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kategori Notifikasi
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value as "INFORMASI" | "PENTING" | "INSTRUKSI" | "PEMBARUAN")}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="INFORMASI">INFORMASI (Reguler)</option>
                  <option value="PENTING">PENTING (Darurat/Urgent)</option>
                  <option value="INSTRUKSI">INSTRUKSI (Tugas Lapangan)</option>
                  <option value="PEMBARUAN">PEMBARUAN (Data/Sistem)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Petugas
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="SEMUA">Semua Petugas & Panitia</option>
                  <option value="PANTARLIH">Petugas Pantarlih Lapangan</option>
                  <option value="KOORDINATOR">Koordinator RW</option>
                  <option value="SEKSI1">Koordinator Seksi 1</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Wilayah TPS / RW
                </label>
                <select
                  value={targetTps}
                  onChange={(e) => setTargetTps(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="SEMUA">Semua Wilayah (RW 01 s/d 13)</option>
                  {Array.from({ length: 13 }, (_, i) => {
                    const no = (i + 1).toString().padStart(2, "0");
                    return (
                      <option key={no} value={`RW ${no}`}>
                        Wilayah RW {no} (TPS {no})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Isi Pesan / Instruksi Petugas {imageUrl ? <span className="text-emerald-400 font-normal">(Opsional untuk Foto Poster)</span> : "*"}</span>
              </label>
              <textarea
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                rows={3}
                placeholder={imageUrl ? "Opsional — Bisa dikosongkan jika hanya ingin menampilkan foto/poster banner saja" : "Tuliskan instruksi atau pengumuman secara jelas untuk petugas di lapangan..."}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 leading-relaxed"
                required={!imageUrl}
              />
            </div>

            {/* In-App Announcement Banner Settings */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <ImageIcon className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">Tampilkan Sebagai Banner di Beranda Aplikasi</h4>
                    <span className="text-[11px] text-slate-400">
                      Poster pengumuman akan muncul di bagian atas halaman Beranda HP petugas.
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBanner}
                    onChange={(e) => setIsBanner(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Unggah Gambar Banner Poster */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                    Poster / Foto Banner (PNG, JPG, WebP)
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Hapus Gambar
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/... atau unggah gambar langsung"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                  >
                    {isUploadingImage ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Upload Gambar
                  </button>
                </div>

                {imageUrl && (
                  <div className="relative mt-2 rounded-lg overflow-hidden border border-slate-800 max-h-36 bg-slate-900">
                    <Image
                      src={imageUrl}
                      alt="Banner Preview"
                      width={600}
                      height={144}
                      className="w-full h-36 object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Pengaturan Jadwal Penayangan Otomatis (WIB) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    Jadwal Penayangan Otomatis (WIB)
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Waktu Indonesia Barat (WIB)
                    </span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Atur jadwal kapan pengumuman mulai tayang secara otomatis dan kapan berakhir di aplikasi.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-300 mb-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Jadwal Mulai Publikasi (WIB) *
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Pengumuman otomatis publik saat waktu ini tiba.
                  </span>
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-300 mb-1">
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    Jadwal Berakhir Publikasi (WIB - Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Kosongkan jika ingin terus tayang tanpa batas waktu.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !judul.trim() || !pesan.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-900/30"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Menyiarkan...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    {isBanner ? "Terbitkan Sebagai Banner Beranda" : "Kirim ke Aplikasi Petugas"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Tampilan di HP Petugas (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Simulasi Tampilan di HP Petugas
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                {isBanner ? "Papan Beranda HP" : "Layar Lonceng"}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {isBanner 
                ? "Pratinjau tampilan kartu Papan Pengumuman Bergambar di halaman Beranda aplikasi Android."
                : "Pratinjau tampilan kartu di Pusat Notifikasi (Icon Lonceng) pada aplikasi Android."}
            </p>

            {/* Simulasi Card Android Sesuai Mode */}
            {isBanner ? (
              // Simulasi Banner Beranda
              <div className="rounded-xl bg-white border border-slate-200 shadow-md text-slate-900 overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-900 text-amber-300">
                    📢 {kategori}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Beranda Aplikasi</span>
                </div>
                {imageUrl && (
                  <div className="relative w-full h-28 bg-slate-200">
                    <Image
                      src={imageUrl}
                      alt="Preview Poster"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="p-3">
                  <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                    {judul || "Judul Banner Pengumuman Resmi"}
                  </h4>
                  <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                    {pesan || "Isi pengumuman resmi dan instruksi penting untuk petugas Coklit di lapangan."}
                  </p>
                </div>
              </div>
            ) : (
              // Simulasi Card Notifikasi Lonceng
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-md text-slate-900">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                    {kategori}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Baru Saja</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                  {judul || "Judul Notifikasi Resmi Petugas"}
                </h4>
                <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                  {pesan || "Pratinjau isi pemberitahuan akan terlihat di sini seperti di perangkat Android petugas lapangan."}
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Target: {targetRole} ({targetTps})</span>
                  <span className="font-semibold text-blue-600">P2KD Kalisalak</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 p-3 rounded-xl bg-blue-950/40 border border-blue-900/30 text-xs text-blue-300 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-blue-400" />
            <span>Tersimpan di tabel khusus notifikasi_petugas. Bebas dari kebocoran berita website umum.</span>
          </div>
        </div>
      </div>

      {/* Riwayat Notifikasi Aktif & Terjadwal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Daftar Notifikasi & Banner Petugas ({notifications.length})
          </h3>
          <span className="text-xs text-slate-400">Mendukung otomatisasi jadwal publikasi & masa tayang (WIB)</span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
            <p className="text-xs">Memuat riwayat notifikasi...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Belum ada notifikasi petugas yang diterbitkan. Gunakan formulir di atas untuk mengirim instruksi atau banner pertama.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {notifications.map((item) => {
              const schedule = getScheduleStatus(item);
              return (
                <div key={item.id} className="py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-slate-800/30 px-3 rounded-xl transition">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {item.image_url ? (
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
                        <Image
                          src={item.image_url}
                          alt="Thumbnail"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                        <Bell className="w-5 h-5" />
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.is_banner && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            ★ BANNER BERANDA
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${schedule.style}`}>
                          <span>{schedule.icon}</span>
                          {schedule.label}
                        </span>
                        {getKategoriBadge(item.kategori)}
                        <h4 className="text-xs font-bold text-white truncate max-w-md">{item.judul}</h4>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{item.pesan}</p>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[10px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3 h-3 text-emerald-400" />
                          Mulai: <strong>{item.start_date ? new Date(item.start_date).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : "-"} WIB</strong>
                        </span>
                        {item.end_date ? (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Clock className="w-3 h-3 text-rose-400" />
                            Berakhir: <strong>{new Date(item.end_date).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB</strong>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Tanpa Batas Waktu</span>
                        )}
                        <span>• Target: <strong className="text-slate-300">{item.target_role} ({item.target_tps})</strong></span>
                        <span>• Oleh: <strong className="text-slate-300">{item.author}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => handleToggleActive(item.id, item.is_active)}
                      title={item.is_active ? "Nonaktifkan Notifikasi" : "Aktifkan Notifikasi"}
                      className={`p-2 rounded-lg border transition flex items-center gap-1 text-xs font-medium ${
                        item.is_active
                          ? "text-slate-300 hover:text-amber-400 hover:bg-amber-950/30 border-slate-700"
                          : "text-emerald-400 hover:bg-emerald-950/30 border-emerald-900/60"
                      }`}
                    >
                      {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span className="text-[11px]">{item.is_active ? "Jeda" : "Aktifkan"}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Hapus Notifikasi"
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/60 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
