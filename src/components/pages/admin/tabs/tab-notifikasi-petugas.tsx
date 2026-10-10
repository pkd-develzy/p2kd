"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Send,
  Trash2,
  RefreshCw,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";

interface NotifikasiPetugasItem {
  id: string;
  judul: string;
  pesan: string;
  kategori: string;
  target_role: string;
  target_tps: string;
  author: string;
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
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage({ type: "success", text: "Notifikasi berhasil disiarkan ke aplikasi Android petugas!" });
        setJudul("");
        setPesan("");
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
              Kelola siaran pemberitahuan, instruksi lapangan, dan rilis pembaruan langsung ke notifikasi HP petugas Coklit P2KD. (Terpisah dari Website Publik).
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
        {/* Form Kirim Notifikasi (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Send className="w-4 h-4 text-blue-400" />
            Terbitkan Notifikasi Baru ke HP Petugas
          </h3>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Judul Notifikasi <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Rapat Koordinasi Rekapitulasi RW 05 Jam 14:00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kategori</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value as unknown as "INFORMASI")}
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
                rows={4}
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                placeholder="Tuliskan arahan, penjelasan teknis, batas waktu, atau tautan instruksi yang harus dipahami petugas lapangan..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
              />
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
                    Menyiarkan Notifikasi...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Kirim ke Aplikasi Petugas
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Tampilan di HP Petugas (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3 pb-3 border-b border-slate-800">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Simulasi Tampilan di HP Petugas
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Kartu notifikasi akan langsung muncul di Layar Pusat Notifikasi (Icon Lonceng) pada aplikasi PETUGAS P2KD.
            </p>

            {/* Simulasi Card Android */}
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
          </div>

          <div className="mt-6 p-3 rounded-xl bg-blue-950/40 border border-blue-900/30 text-xs text-blue-300 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-blue-400" />
            <span>Notifikasi ini tersimpan eksklusif untuk aplikasi mobile dan tidak tampil di halaman berita umum warga.</span>
          </div>
        </div>
      </div>

      {/* Riwayat Notifikasi Aktif */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Daftar Notifikasi Aktif di Aplikasi Petugas ({notifications.length})
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
            Belum ada notifikasi petugas yang diterbitkan. Gunakan formulir di atas untuk mengirim instruksi pertama.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {notifications.map((item) => (
              <div key={item.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/30 px-3 rounded-xl transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
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

                <button
                  onClick={() => handleDelete(item.id)}
                  title="Hapus Notifikasi"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/60 transition"
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
