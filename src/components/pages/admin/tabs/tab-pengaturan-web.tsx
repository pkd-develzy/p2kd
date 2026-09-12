"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, Input } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  MapPin,
  Megaphone,
  Sliders,
  PhoneCall,
  Save,
  Loader2,
  RefreshCw,
  Shield,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  ExternalLink,
  X,
} from "lucide-react";
import { PublicWebConfig, MasterPengumuman } from "@/lib/data-store";

interface TabPengaturanWebProps {
  currentUser: {
    namaLengkap: string;
    role: string;
  };
}

const defaultWebConfig: PublicWebConfig = {
  namaDesa: "Kalisalak",
  kecamatan: "Margasari",
  kabupaten: "Tegal",
  provinsi: "Jawa Tengah",
  lokasiUtama: "Desa Kalisalak",
  lokasiMapsUrl: "https://www.google.com/maps/search/?api=1&query=Desa+Kalisalak+Margasari+Tegal",
  periodeMasaBakti: "2027 – 2035",
  hariHTanggal: "Rabu, 3 Februari 2027",
  runningText: "Pemberitahuan Resmi P2KD: Seluruh rangkaian pemungutan dan penghitungan suara Pilkades Desa Kalisalak diselenggarakan pada hari Rabu, 3 Februari 2027. Mohon membawa KTP-el dan Undangan Memilih.",
  isRunningTextActive: true,
  isCekHakPilihOpen: true,
  isProfilCalonVisible: true,
  isRealCountPublic: false,
  isAduanOpen: true,
  kontakWaP2kd: "081234567890",
  jamLayanan: "08.00 - 15.00 WIB (Senin - Sabtu)",
  alamatSekretariat: "Kantor Balai Desa Kalisalak, Jl. Raya Kalisalak No. 01, Kec. Margasari, Kab. Tegal",
  totalRw: 13,
  totalRt: 39,
};

export const TabPengaturanWeb: React.FC<TabPengaturanWebProps> = ({ currentUser }) => {
  const toast = useToast();
  const [config, setConfig] = useState<PublicWebConfig>(defaultWebConfig);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pengumuman state
  const [pengumumanList, setPengumumanList] = useState<MasterPengumuman[]>([]);
  const [loadingPengumuman, setLoadingPengumuman] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterPengumuman | null>(null);
  const [formPengumuman, setFormPengumuman] = useState({
    nomor: "",
    judul: "",
    kategori: "PENGUMUMAN P2KD",
    tanggal: "",
    ringkasan: "",
    fileUrl: "/docs/Tahapan_Pilkades_2027.pdf",
    fileName: "Dokumen_P2KD.pdf",
    fileSize: "PDF Resmi",
  });

  const fetchAllConfigAndAnnouncements = async () => {
    try {
      const [resConfig, resAnn] = await Promise.all([
        fetch("/api/config"),
        fetch("/api/pengumuman"),
      ]);
      const jsonConfig = await resConfig.json();
      const jsonAnn = await resAnn.json();

      if (jsonConfig.success && jsonConfig.data) {
        setConfig(jsonConfig.data);
      }
      if (jsonAnn.success && Array.isArray(jsonAnn.data)) {
        setPengumumanList(jsonAnn.data);
      }
    } catch (err) {
      console.error("Gagal memuat data database:", err);
    } finally {
      setLoadingPengumuman(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([fetch("/api/config"), fetch("/api/pengumuman")])
      .then(async ([resConfig, resAnn]) => {
        const jsonConfig = await resConfig.json();
        const jsonAnn = await resAnn.json();
        if (active) {
          if (jsonConfig.success && jsonConfig.data) setConfig(jsonConfig.data);
          if (jsonAnn.success && Array.isArray(jsonAnn.data)) setPengumumanList(jsonAnn.data);
          setLoadingPengumuman(false);
        }
      })
      .catch((err) => {
        console.error("Error loading initial data:", err);
        if (active) setLoadingPengumuman(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchAllConfigAndAnnouncements();
    toast.info("Database Terkini Dimuat", "Seluruh konfigurasi dan pengumuman berhasil disinkronkan.");
    setRefreshing(false);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: config,
          user: currentUser.namaLengkap,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Pengaturan Disimpan ke Database", "Konfigurasi website publik berhasil diperbarui secara realtime.");
        setConfig(json.data);
      } else {
        toast.error("Gagal Menyimpan", json.message || "Terjadi kesalahan.");
      }
    } catch (err) {
      console.error("Gagal menyimpan konfigurasi:", err);
      toast.error("Gagal Menyimpan", "Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormPengumuman({
      nomor: `00${pengumumanList.length + 1}/P2KD-KLS/I/2027`,
      judul: "",
      kategori: "PENGUMUMAN P2KD",
      tanggal: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      ringkasan: "",
      fileUrl: "/docs/Tahapan_Pilkades_2027.pdf",
      fileName: "Surat_Edaran_P2KD.pdf",
      fileSize: "Dokumen PDF Asli",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: MasterPengumuman) => {
    setEditingItem(item);
    setFormPengumuman({
      nomor: item.nomor,
      judul: item.judul,
      kategori: item.kategori,
      tanggal: item.tanggal,
      ringkasan: item.ringkasan,
      fileUrl: item.fileUrl,
      fileName: item.fileName,
      fileSize: item.fileSize,
    });
    setShowModal(true);
  };

  const handleDeletePengumuman = async (id: string, judul: string) => {
    if (!confirm(`Hapus pengumuman "${judul}" dari database?`)) return;

    try {
      const res = await fetch("/api/pengumuman", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, user: currentUser.namaLengkap }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Pengumuman Dihapus", "Pengumuman berhasil dihapus dari database.");
        setPengumumanList((prev) => prev.filter((p) => p.id !== id));
      } else {
        toast.error("Gagal Menghapus", json.message || "Terjadi kesalahan.");
      }
    } catch {
      toast.error("Gagal", "Tidak dapat menghapus data.");
    }
  };

  const handleSavePengumuman = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const res = await fetch("/api/pengumuman", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingItem.id,
            data: formPengumuman,
            user: currentUser.namaLengkap,
          }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Pengumuman Diperbarui", "Perubahan pengumuman tersimpan di database.");
          setShowModal(false);
          fetchAllConfigAndAnnouncements();
        } else {
          toast.error("Gagal", json.message);
        }
      } else {
        const res = await fetch("/api/pengumuman", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formPengumuman,
            user: currentUser.namaLengkap,
          }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Pengumuman Ditambahkan", "Pengumuman baru berhasil disimpan ke database.");
          setShowModal(false);
          fetchAllConfigAndAnnouncements();
        } else {
          toast.error("Gagal", json.message);
        }
      }
    } catch {
      toast.error("Gagal", "Terjadi gangguan koneksi.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-900/60 shadow-lg rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary" className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border-blue-400/30 px-3 py-0.5 rounded-full">
                SUPER ADMIN CONTROL
              </Badge>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Database Server Terkoneksi
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Globe className="w-6 h-6 text-blue-400" />
              Pengaturan Website Publik & Database Live
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-normal">
              Kelola lokasi pemungutan di Desa Kalisalak, banner teks berjalan (*running text*), sakelar visibilitas modul publik, dan kelola dokumen pengumuman resmi.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={saving || refreshing}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
              <span>Sinkronkan Ulang</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Form Settings */}
      <form onSubmit={handleSaveConfig} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Lokasi & Identitas Desa */}
          <Card className="p-6 border-slate-200 shadow-xs space-y-4 bg-white">
            <CardHeader className="p-0 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <MapPin className="w-4 h-4" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Lokasi Pemungutan & Identitas Wilayah
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Lokasi Utama Pemungutan Suara (Terpusat)
                </label>
                <Input
                  value={config.lokasiUtama}
                  onChange={(e) => setConfig({ ...config, lokasiUtama: e.target.value })}
                  placeholder="Contoh: Desa Kalisalak"
                  className="text-xs font-bold text-rose-950"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Seluruh pemilih berkumpul di lokasi ini dengan pembagian Tabung/Kotak Pemilihan.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Link Google Maps Lokasi Lapangan
                </label>
                <Input
                  value={config.lokasiMapsUrl}
                  onChange={(e) => setConfig({ ...config, lokasiMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Nama Desa</label>
                  <Input
                    value={config.namaDesa}
                    onChange={(e) => setConfig({ ...config, namaDesa: e.target.value })}
                    className="text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Kecamatan</label>
                  <Input
                    value={config.kecamatan}
                    onChange={(e) => setConfig({ ...config, kecamatan: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Masa Bakti (8 Tahun)</label>
                  <Input
                    value={config.periodeMasaBakti}
                    onChange={(e) => setConfig({ ...config, periodeMasaBakti: e.target.value })}
                    placeholder="2027 – 2035"
                    className="text-xs font-bold text-blue-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Hari H Pencoblosan</label>
                  <Input
                    value={config.hariHTanggal}
                    onChange={(e) => setConfig({ ...config, hariHTanggal: e.target.value })}
                    placeholder="Rabu, 3 Februari 2027"
                    className="text-xs font-bold text-indigo-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Jumlah RW Desa</label>
                  <Input
                    type="number"
                    value={config.totalRw}
                    onChange={(e) => setConfig({ ...config, totalRw: Number(e.target.value) || 13 })}
                    className="text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Jumlah RT Desa (Total)</label>
                  <Input
                    type="number"
                    value={config.totalRt}
                    onChange={(e) => setConfig({ ...config, totalRt: Number(e.target.value) || 39 })}
                    className="text-xs font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Banner Pengumuman Berjalan (Running Announcement) */}
          <Card className="p-6 border-slate-200 shadow-xs space-y-4 bg-white">
            <CardHeader className="p-0 border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Pengumuman Berjalan (*Running Ticker*)
                  </CardTitle>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-bold text-slate-700">Status Banner:</span>
                  <input
                    type="checkbox"
                    checked={config.isRunningTextActive}
                    onChange={(e) => setConfig({ ...config, isRunningTextActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Teks Pengumuman Berjalan Publik
                </label>
                <textarea
                  rows={4}
                  value={config.runningText}
                  onChange={(e) => setConfig({ ...config, runningText: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ketik teks pengumuman penting yang akan tampil berjalan perlahan di bagian paling atas website publik..."
                />
              </div>

              {config.isRunningTextActive && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <span className="font-bold text-[11px] uppercase tracking-wider block text-amber-800">
                    Pratinjau Animasi Ticker:
                  </span>
                  <div className="p-2 bg-white rounded-lg border border-amber-200 text-xs font-medium text-slate-800 overflow-hidden relative">
                    <div className="animate-marquee-seamless text-amber-900 font-semibold">
                      <span className="inline-flex items-center gap-2 pr-12 shrink-0">
                        📢 <strong>PENGUMUMAN RESMI:</strong> {config.runningText}
                      </span>
                      <span className="inline-flex items-center gap-2 pr-12 shrink-0">
                        📢 <strong>PENGUMUMAN RESMI:</strong> {config.runningText}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Sakelar Visibilitas Modul Publik */}
          <Card className="p-6 border-slate-200 shadow-xs space-y-4 bg-white">
            <CardHeader className="p-0 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Sliders className="w-4 h-4" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Kontrol Visibilitas Fitur Publik
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-3 text-xs">
              <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Kanal Cek Hak Pilih Mandiri</span>
                  <span className="text-slate-500 text-[11px]">Izinkan masyarakat mencari NIK dan nomor Tabung Suara.</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.isCekHakPilihOpen}
                  onChange={(e) => setConfig({ ...config, isCekHakPilihOpen: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Tampilkan Profil Calon Kades</span>
                  <span className="text-slate-500 text-[11px]">Buka halaman profil calon resmi setelah Pleno Penetapan Calon.</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.isProfilCalonVisible}
                  onChange={(e) => setConfig({ ...config, isProfilCalonVisible: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Hasil Hitung Cepat Real Count (Publik)</span>
                  <span className="text-slate-500 text-[11px]">Buka grafik hasil perolehan suara per tabung pada Hari H.</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.isRealCountPublic}
                  onChange={(e) => setConfig({ ...config, isRealCountPublic: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Kanal Aduan & Tanggapan Online</span>
                  <span className="text-slate-500 text-[11px]">Izinkan warga mengirim formulir perbaikan data DPS online.</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.isAduanOpen}
                  onChange={(e) => setConfig({ ...config, isAduanOpen: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Kontak Hotline & Sekretariat P2KD */}
          <Card className="p-6 border-slate-200 shadow-xs space-y-4 bg-white">
            <CardHeader className="p-0 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Kontak Hotline & Sekretariat P2KD
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Nomor WhatsApp Hotline P2KD
                </label>
                <Input
                  value={config.kontakWaP2kd}
                  onChange={(e) => setConfig({ ...config, kontakWaP2kd: e.target.value })}
                  placeholder="081234567890"
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Jam Pelayanan Sekretariat
                </label>
                <Input
                  value={config.jamLayanan}
                  onChange={(e) => setConfig({ ...config, jamLayanan: e.target.value })}
                  placeholder="08.00 - 15.00 WIB (Senin - Sabtu)"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Alamat Sekretariat P2KD
                </label>
                <textarea
                  rows={2}
                  value={config.alamatSekretariat}
                  onChange={(e) => setConfig({ ...config, alamatSekretariat: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Nomor SK Resmi & Dasar Regulasi Hukum (Dapat Diedit Dinamis) */}
          <Card className="p-6 border-slate-200 shadow-xs space-y-4 bg-white lg:col-span-2">
            <CardHeader className="p-0 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Nomor SK Resmi & Dasar Hukum Regulasi (Dinamis / Tidak Hardcode)
                  </CardTitle>
                  <p className="text-xs text-slate-500 font-normal">
                    Ubah nomor Surat Keputusan (SK) dan Berita Acara kapan saja. Seluruh cetakan dokumen, tanda pengenal, dan berita acara akan otomatis menggunakan data ini.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  1. SK Pembentukan P2KD oleh BPD
                </label>
                <Input
                  value={config.skP2KD || ""}
                  onChange={(e) => setConfig({ ...config, skP2KD: e.target.value })}
                  placeholder="Contoh: Keputusan BPD Desa Kalisalak No. 04/BPD-KLS/VII/2026"
                  className="text-xs font-mono font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Digunakan pada ID Card Panitia & Struktur Organisasi</span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  2. SK Pengumuman & Verifikasi Penjaringan Balon
                </label>
                <Input
                  value={config.skPenetapanBalon || ""}
                  onChange={(e) => setConfig({ ...config, skPenetapanBalon: e.target.value })}
                  placeholder="Contoh: Keputusan P2KD No. 05/P2KD-KLS/VIII/2026"
                  className="text-xs font-mono font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Digunakan pada Berkas Penjaringan Bakal Calon</span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  3. SK Penetapan Calon Kades & Nomor Urut
                </label>
                <Input
                  value={config.skPenetapanCalon || ""}
                  onChange={(e) => setConfig({ ...config, skPenetapanCalon: e.target.value })}
                  placeholder="Contoh: Keputusan P2KD No. 06/P2KD-KLS/IX/2026"
                  className="text-xs font-mono font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Digunakan pada Penetapan Calon & Visi Misi</span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  4. Berita Acara & SK Penetapan DPT Final
                </label>
                <Input
                  value={config.skPenetapanDPT || ""}
                  onChange={(e) => setConfig({ ...config, skPenetapanDPT: e.target.value })}
                  placeholder="Contoh: Berita Acara & Keputusan P2KD No. 07/BA-DPT/X/2026"
                  className="text-xs font-mono font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Digunakan pada Berita Acara Pleno DPT & Formulir C6</span>
              </div>

              <div className="md:col-span-2">
                <label className="font-bold text-slate-800 block mb-1">
                  5. Dasar Hukum & Peraturan Perundang-Undangan Pilkades
                </label>
                <Input
                  value={config.perbupPilkades || ""}
                  onChange={(e) => setConfig({ ...config, perbupPilkades: e.target.value })}
                  placeholder="Contoh: Perda No. 2/2015 & Perbup Tegal No. 27/2018 jo PP No. 16/2026"
                  className="text-xs font-mono font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Digunakan pada konsiderans dan rujukan hukum dokumen resmi</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button Bar */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Perubahan tersimpan langsung ke basis data server resmi secara realtime.</span>
          </span>

          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="font-bold text-xs px-6 py-2.5 rounded-xl shadow-md bg-blue-900 hover:bg-blue-800 text-white"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Simpan Konfigurasi Web
          </Button>
        </div>
      </form>

      {/* Section 5: Manajemen Pengumuman & Berkas Resmi (CRUD Database) */}
      <Card className="p-6 border-slate-200 shadow-xs space-y-5 bg-white rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Manajemen Pengumuman & Dokumen Resmi (Tabel Database)
              </h3>
              <p className="text-xs text-slate-500">
                Tambah, edit, dan hapus pengumuman publik yang langsung tampil pada halaman /pengumuman.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Pengumuman Baru
          </Button>
        </div>

        {loadingPengumuman ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs text-slate-500 font-semibold">Memuat data pengumuman...</span>
          </div>
        ) : pengumumanList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Belum ada pengumuman di database. Klik tombol di atas untuk membuat pengumuman pertama.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pengumumanList.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" className="text-[10px] font-bold bg-blue-100 text-blue-900 border-none">
                      {item.kategori}
                    </Badge>
                    <span className="text-xs text-slate-500 font-mono">No: {item.nomor}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.tanggal}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{item.judul}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.ringkasan}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="text-xs rounded-xl text-slate-600 hover:text-blue-700">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      File
                    </Button>
                  </a>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    className="text-xs rounded-xl text-blue-700 border-blue-200 hover:bg-blue-50"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePengumuman(item.id, item.judul)}
                    className="text-xs rounded-xl text-rose-700 border-rose-200 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Add / Edit Pengumuman */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-700" />
                {editingItem ? "Edit Pengumuman Resmi" : "Tambah Pengumuman Resmi Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePengumuman} className="space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Nomor Pengumuman / SK</label>
                  <Input
                    value={formPengumuman.nomor}
                    onChange={(e) => setFormPengumuman({ ...formPengumuman, nomor: e.target.value })}
                    placeholder="Contoh: 007/P2KD-KLS/I/2027"
                    required
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Kategori Pengumuman</label>
                  <select
                    value={formPengumuman.kategori}
                    onChange={(e) => setFormPengumuman({ ...formPengumuman, kategori: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="PENGUMUMAN P2KD">PENGUMUMAN P2KD</option>
                    <option value="BERITA ACARA">BERITA ACARA</option>
                    <option value="JADWAL RESMI">JADWAL RESMI</option>
                    <option value="KEPUTUSAN BUPATI">KEPUTUSAN BUPATI</option>
                    <option value="PERATURAN PEMERINTAH">PERATURAN PEMERINTAH</option>
                    <option value="PERATURAN BUPATI">PERATURAN BUPATI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Judul Pengumuman</label>
                <Input
                  value={formPengumuman.judul}
                  onChange={(e) => setFormPengumuman({ ...formPengumuman, judul: e.target.value })}
                  placeholder="Ketik judul pengumuman resmi..."
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Tanggal Terbit</label>
                  <Input
                    value={formPengumuman.tanggal}
                    onChange={(e) => setFormPengumuman({ ...formPengumuman, tanggal: e.target.value })}
                    placeholder="Contoh: 15 Januari 2027"
                    required
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Keterangan Ukuran File</label>
                  <Input
                    value={formPengumuman.fileSize}
                    onChange={(e) => setFormPengumuman({ ...formPengumuman, fileSize: e.target.value })}
                    placeholder="Contoh: 2.5 MB (PDF Asli)"
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Ringkasan / Isi Pengumuman</label>
                <textarea
                  rows={3}
                  value={formPengumuman.ringkasan}
                  onChange={(e) => setFormPengumuman({ ...formPengumuman, ringkasan: e.target.value })}
                  placeholder="Ketik ringkasan atau poin-poin penting isi pengumuman..."
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Nama File PDF</label>
                  <Input
                    value={formPengumuman.fileName}
                    onChange={(e) => setFormPengumuman({ ...formPengumuman, fileName: e.target.value })}
                    placeholder="Contoh: Surat_Edaran_P2KD.pdf"
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">URL / Path Dokumen PDF</label>
                  <Input
                    value={formPengumuman.fileUrl}
                    onChange={(e) => setFormPengumuman({ ...formPengumuman, fileUrl: e.target.value })}
                    placeholder="/docs/..."
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-xs rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  Simpan Pengumuman ke Database
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
