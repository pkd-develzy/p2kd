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
  LayoutTemplate,
  X,
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

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Ukuran gambar maksimal 5 MB." });
      return;
    }

    setIsUploadingImage(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.secure_url || data.url) {
        const uploadedUrl = data.secure_url || data.url;
        setImageUrl(uploadedUrl);
        setIsBanner(true); // Otomatis aktifkan banner jika mengunggah gambar
        setStatusMessage({ type: "success", text: "Gambar poster banner berhasil diunggah!" });
      } else {
        setStatusMessage({ type: "error", text: data.message || "Gagal mengunggah gambar." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Terjadi kesalahan saat mengunggah gambar." });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !pesan.trim()) {
      setStatusMessage({ type: "error", text: "Judul dan isi pesan wajib diisi." });
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
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage({ 
          type: "success", 
          text: isBanner 
            ? "Banner pengumuman bergambar berhasil diterbitkan ke Beranda Aplikasi Petugas!" 
            : "Notifikasi berhasil disiarkan ke aplikasi Android petugas!" 
        });
        setJudul("");
        setPesan("");
        setImageUrl("");
        setIsBanner(false);
        setKategori("INFORMASI");
        fetchNotifications();
      } else {
        setStatusMessage({ type: "error", text: json.message || "Gagal menyiarkan notifikasi." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Terjadi kesalahan jaringan saat mengirim notifikasi." });
    } finally {
      setIsSubmitting(false);
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Judul Notifikasi / Banner <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Batas Akhir Coklit RW 04 Hari Ini Jam 17:00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kategori</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value as "INFORMASI")}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-blue-500 transition"
                >
                  <option value="INFORMASI">INFORMASI (Biru)</option>
                  <option value="INSTRUKSI">INSTRUKSI (Biru Terang)</option>
                  <option value="PENTING">PENTING (Merah)</option>
                  <option value="PEMBARUAN">PEMBARUAN (Hijau)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Peran Petugas</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-blue-500 transition"
                >
                  <option value="SEMUA">Semua Petugas (Umum)</option>
                  <option value="PANTARLIH">Khusus Pantarlih Lapangan</option>
                  <option value="PETUGAS">Petugas Coklit</option>
                  <option value="SEKSI1">Koordinator Seksi 1</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Wilayah RW / TPS</label>
                <select
                  value={targetTps}
                  onChange={(e) => setTargetTps(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-blue-500 transition"
                >
                  <option value="SEMUA">Semua RW (01 s/d 13)</option>
                  {Array.from({ length: 13 }, (_, i) => {
                    const num = String(i + 1).padStart(2, "0");
                    return (
                      <option key={num} value={`TPS ${num}`}>
                        RW {num} (TPS {num})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Isi Pesan Notifikasi <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                placeholder="Tuliskan arahan, penjelasan teknis, batas waktu, atau instruksi kerja yang harus dipahami petugas lapangan..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
              />
            </div>

            {/* In-App Announcement Banner Settings */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <LayoutTemplate className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Tampilkan Sebagai Banner di Beranda Aplikasi
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Muncul di kartu papan pengumuman Beranda aplikasi HP petugas (menggantikan banner lama).
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
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
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

      {/* Riwayat Notifikasi Aktif */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Daftar Notifikasi & Banner Aktif di Aplikasi Petugas ({notifications.length})
          </h3>
          <span className="text-xs text-slate-400">Dapat dihapus sewaktu-waktu oleh Admin</span>
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
            {notifications.map((item) => (
              <div key={item.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/30 px-3 rounded-xl transition">
                <div className="flex items-start gap-3">
                  {item.image_url ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
                      <Image
                        src={item.image_url}
                        alt="Thumbnail"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.is_banner && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ★ BANNER BERANDA
                        </span>
                      )}
                      {getKategoriBadge(item.kategori)}
                      <h4 className="text-xs font-bold text-white">{item.judul}</h4>
                      <span className="text-[10px] text-slate-500">
                        • {new Date(item.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 max-w-2xl">{item.pesan}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                      <span>Oleh: <strong className="text-slate-300">{item.author}</strong></span>
                      <span>• Target Role: <strong className="text-slate-300">{item.target_role}</strong></span>
                      <span>• Target Wilayah: <strong className="text-slate-300">{item.target_tps}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  title="Hapus Notifikasi"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/60 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
