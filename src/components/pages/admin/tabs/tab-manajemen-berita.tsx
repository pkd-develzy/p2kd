"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Newspaper,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Star,
  Calendar,
  User,
  Sparkles,
  ExternalLink,
  X,
  RefreshCw,
  Loader2,
  Upload,
  ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, Badge } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { MasterBerita, BeritaKategori } from "@/lib/data-store";

interface TabManajemenBeritaProps {
  currentUser?: string;
  isSekretaris?: boolean;
  isSeksiPublikasi?: boolean;
  isAdmin?: boolean;
}

// In-memory client cache for instant 0ms tab switching
let globalCachedBeritaList: MasterBerita[] | null = null;

export const TabManajemenBerita: React.FC<TabManajemenBeritaProps> = () => {
  const toast = useToast();
  const { confirm } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [articles, setArticles] = useState<MasterBerita[]>(() => globalCachedBeritaList || []);
  const [loading, setLoading] = useState(() => !globalCachedBeritaList);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<string>("ALL");

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editingArticle, setEditingArticle] = useState<MasterBerita | null>(null);

  const [formData, setFormData] = useState({
    judul: "",
    kategori: "SOSIALISASI" as BeritaKategori,
    ringkasan: "",
    konten: "",
    gambarUrl: "https://res.cloudinary.com/xwgfvkld/image/upload/v1790082178/p2kd_berita/p2kd-musyawarah-kalisalak.png",
    status: "PUBLISHED" as "PUBLISHED" | "DRAFT" | "ARCHIVED",
    isHeadline: false,
    lampiranPdfUrl: "",
    lampiranPdfNama: "",
  });

  const getAuthHeaders = useCallback((extraHeaders?: Record<string, string>) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token")
        : null;
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    };
  }, []);

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format File Salah", "Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran Terlalu Besar", "Ukuran foto maksimal adalah 10MB.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "p2kd_berita");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: getAuthHeaders(),
        body: data,
      });

      const json = await res.json();
      if (json.success && json.data?.url) {
        setFormData((prev) => ({ ...prev, gambarUrl: json.data.url }));
        toast.success("Foto Terunggah", "Foto liputan berhasil disimpan ke Cloudinary Storage.");
      } else {
        toast.error("Gagal Upload", json.message || "Gagal mengunggah foto ke Cloudinary.");
      }
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menghubungi server upload Cloudinary.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/berita", {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) {
        globalCachedBeritaList = json.data;
        setArticles(json.data);
      }
    } catch {
      toast.error("Gagal Memuat", "Tidak dapat mengambil daftar berita dari server.");
    } finally {
      setLoading(false);
    }
  }, [toast, getAuthHeaders]);

  useEffect(() => {
    if (globalCachedBeritaList && globalCachedBeritaList.length > 0) {
      return;
    }
    let isMounted = true;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token")
        : null;

    fetch("/api/admin/berita", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && json.data) {
          globalCachedBeritaList = json.data;
          setArticles(json.data);
        }
      })
      .catch(() => {
        // Handled silently on mount
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openAddModal = () => {
    setEditingArticle(null);
    setFormData({
      judul: "",
      kategori: "SOSIALISASI",
      ringkasan: "",
      konten: "",
      gambarUrl: "https://res.cloudinary.com/xwgfvkld/image/upload/v1790082178/p2kd_berita/p2kd-musyawarah-kalisalak.png",
      status: "PUBLISHED",
      isHeadline: false,
      lampiranPdfUrl: "",
      lampiranPdfNama: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (art: MasterBerita) => {
    setEditingArticle(art);
    setFormData({
      judul: art.judul,
      kategori: art.kategori,
      ringkasan: art.ringkasan || "",
      konten: art.konten,
      gambarUrl: art.gambarUrl || "https://res.cloudinary.com/xwgfvkld/image/upload/v1790082178/p2kd_berita/p2kd-musyawarah-kalisalak.png",
      status: art.status,
      isHeadline: Boolean(art.isHeadline),
      lampiranPdfUrl: art.lampiranPdfUrl || "",
      lampiranPdfNama: art.lampiranPdfNama || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul.trim() || !formData.konten.trim()) {
      toast.warning("Form Belum Lengkap", "Judul dan konten berita wajib diisi.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingArticle) {
        // Update
        const res = await fetch("/api/admin/berita", {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            id: editingArticle.id,
            ...formData,
          }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Berita Diperbarui", "Artikel berita berhasil disimpan.");
          setIsModalOpen(false);
          fetchArticles();
        } else {
          toast.error("Gagal Memperbarui", json.message);
        }
      } else {
        // Create
        const res = await fetch("/api/admin/berita", {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Berita Diterbitkan", "Artikel berita berhasil ditayangkan ke portal publik.");
          setIsModalOpen(false);
          fetchArticles();
        } else {
          toast.error("Gagal Menerbitkan", json.message);
        }
      }
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menghubungi server database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (art: MasterBerita) => {
    const ok = await confirm({
      title: "Hapus Artikel Berita?",
      message: `Apakah Anda yakin ingin menghapus artikel "${art.judul}"? Berita ini akan ditarik dari portal publik.`,
      confirmText: "Hapus Artikel",
      cancelText: "Batal",
      variant: "danger",
    });

    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/berita?id=${encodeURIComponent(art.id)}`, {
        method: "DELETE",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id: art.id, slug: art.slug }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Berita Dihapus", "Artikel telah dihapus dari sistem.");
        fetchArticles();
      } else {
        toast.error("Gagal Menghapus", json.message);
      }
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menghapus artikel.");
    }
  };

  const handleToggleHeadline = async (art: MasterBerita) => {
    try {
      const res = await fetch("/api/admin/berita", {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          id: art.id,
          isHeadline: !art.isHeadline,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Headline Diperbarui", !art.isHeadline ? "Artikel disematkan sebagai Berita Utama." : "Status Headline dicabut.");
        fetchArticles();
      }
    } catch {
      toast.error("Gagal", "Gagal memperbarui status headline.");
    }
  };

  const getKategoriBadge = (kat: string) => {
    switch (kat) {
      case "TAHAPAN":
        return <Badge variant="primary">Tahapan Pilkades</Badge>;
      case "RAPAT_BA":
        return <Badge variant="success">Rapat &amp; Pleno</Badge>;
      case "SOSIALISASI":
        return <Badge variant="warning">Sosialisasi</Badge>;
      case "DOKUMENTASI":
        return <Badge variant="default">Dokumentasi</Badge>;
      default:
        return <Badge>{kat}</Badge>;
    }
  };

  const filtered = articles.filter((a) => {
    const matchSearch =
      searchTerm === "" ||
      a.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.ringkasan && a.ringkasan.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchKat = selectedKategori === "ALL" || a.kategori === selectedKategori;

    return matchSearch && matchKat;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="p-6 bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-blue-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.3),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CMS Publikasi Sekretariat P2KD</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-amber-400" />
              <span>Manajemen Berita &amp; Liputan Media Warga</span>
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed font-normal">
              Kelola berita resmi, rilis pers pleno, sosialisasi tahapan, serta dokumentasi kegiatan desa Kalisalak yang tampil langsung pada homepage portal publik.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchArticles}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              <span>Segarkan</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={openAddModal}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black border-none shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tulis Berita Baru</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul atau isi berita..."
            className="w-full h-10 pl-10 pr-4 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Kategori:</span>
          {["ALL", "TAHAPAN", "RAPAT_BA", "SOSIALISASI", "DOKUMENTASI"].map((k) => (
            <button
              key={k}
              onClick={() => setSelectedKategori(k)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedKategori === k
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {k === "ALL" ? "Semua Kategori" : k === "TAHAPAN" ? "Tahapan" : k === "RAPAT_BA" ? "Rapat & BA" : k === "SOSIALISASI" ? "Sosialisasi" : "Dokumentasi"}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid / Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>Memuat arsip berita publik...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <Newspaper className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">Belum Ada Artikel Berita</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Gunakan tombol &quot;Tulis Berita Baru&quot; untuk menerbitkan rilis pers atau laporan kegiatan P2KD.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((art) => (
            <Card
              key={art.id}
              className={`p-4 bg-white border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                art.isHeadline ? "border-amber-400 ring-1 ring-amber-400/50 bg-amber-50/20" : "border-slate-200"
              }`}
            >
              <div className="space-y-3">
                {/* Thumbnail Preview */}
                <div className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <Image
                    src={art.gambarUrl || "https://res.cloudinary.com/xwgfvkld/image/upload/v1790082178/p2kd_berita/p2kd-musyawarah-kalisalak.png"}
                    alt={art.judul}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {getKategoriBadge(art.kategori)}
                    {art.isHeadline && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-md">
                        <Star className="w-3 h-3 fill-slate-950" />
                        <span>HEADLINE</span>
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] text-white font-mono flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{art.viewsCount || 0} dibaca</span>
                  </div>
                </div>

                {/* Title & Excerpt */}
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2 hover:text-blue-700">
                    {art.judul}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                    {art.ringkasan || art.konten.slice(0, 120)}
                  </p>
                </div>

                {/* Author & Meta */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-medium truncate max-w-40">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{art.penulisNama || "Sekretariat P2KD"}</span>
                  </span>
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(art.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                <a
                  href={`/berita/${art.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                  title="Lihat Pratinjau di Web Publik"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Lihat</span>
                </a>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleHeadline(art)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      art.isHeadline
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                    title={art.isHeadline ? "Hapus dari Headline" : "Jadikan Headline Utama"}
                  >
                    <Star className={`w-4 h-4 ${art.isHeadline ? "fill-amber-500 text-amber-500" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(art)}
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Edit Berita"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(art)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Hapus Berita"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Form Tambah / Edit Berita */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header (Fixed / Sticky) */}
            <div className="px-5 py-4 sm:px-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {editingArticle ? "Edit Artikel Berita" : "Tulis Berita / Liputan Baru"}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Publikasikan informasi resmi untuk portal warga Desa Kalisalak
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content (Scrollable) */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Kolom Kiri: Konten Teks Berita */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Judul */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                        Judul Berita / Rilis Pers <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.judul}
                        onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                        placeholder="Contoh: P2KD Kalisalak Gelar Rapat Pleno Terbuka Rekapitulasi DPS..."
                        className="w-full h-11 px-3.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Kategori & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                          Kategori Berita <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.kategori}
                          onChange={(e) => setFormData({ ...formData, kategori: e.target.value as BeritaKategori })}
                          className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="TAHAPAN">Tahapan Pilkades</option>
                          <option value="RAPAT_BA">Rapat &amp; Berita Acara Pleno</option>
                          <option value="SOSIALISASI">Sosialisasi Warga</option>
                          <option value="DOKUMENTASI">Dokumentasi Lapangan</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                          Status Publikasi
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              status: e.target.value as "PUBLISHED" | "DRAFT" | "ARCHIVED",
                            })
                          }
                          className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PUBLISHED">Tayang Langsung (Published)</option>
                          <option value="DRAFT">Simpan Sebagai Draft</option>
                          <option value="ARCHIVED">Arsipkan</option>
                        </select>
                      </div>
                    </div>

                    {/* Ringkasan */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                        Ringkasan / Paragraf Pengantar (Lead)
                      </label>
                      <textarea
                        rows={2}
                        value={formData.ringkasan}
                        onChange={(e) => setFormData({ ...formData, ringkasan: e.target.value })}
                        placeholder="Ringkasan singkat 1-2 kalimat yang menarik minat pembaca warga..."
                        className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-normal"
                      />
                    </div>

                    {/* Konten Lengkap */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                        Isi Berita Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={9}
                        required
                        value={formData.konten}
                        onChange={(e) => setFormData({ ...formData, konten: e.target.value })}
                        placeholder="Tuliskan isi berita lengkap. Gunakan baris baru antar paragraf..."
                        className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-normal"
                      />
                    </div>
                  </div>

                  {/* Kolom Kanan: Media, Lampiran & Headline */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Gambar Cover Banner Liputan (Cloudinary Storage) */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>Foto Cover Liputan</span>
                        </label>
                        {formData.gambarUrl?.includes("cloudinary.com") && (
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-sky-600" />
                            <span>Cloudinary</span>
                          </span>
                        )}
                      </div>

                      {/* Preview Thumbnail */}
                      <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-200 border border-slate-200 group">
                        <Image
                          src={formData.gambarUrl || "https://res.cloudinary.com/xwgfvkld/image/upload/v1790082178/p2kd_berita/p2kd-musyawarah-kalisalak.png"}
                          alt="Preview Berita"
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-2.5">
                          <span className="text-[10px] font-medium text-white/90 drop-shadow-xs truncate max-w-full font-mono">
                            {formData.gambarUrl}
                          </span>
                        </div>
                      </div>

                      {/* Upload Controls */}
                      <div className="space-y-2 pt-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png, image/jpeg, image/webp, image/gif"
                          className="hidden"
                          onChange={handleImageFileSelect}
                        />

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={isUploadingImage}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 cursor-pointer gap-1.5 text-xs py-2"
                          >
                            {isUploadingImage ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Mengunggah...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload Foto</span>
                              </>
                            )}
                          </Button>

                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                gambarUrl: "https://res.cloudinary.com/xwgfvkld/image/upload/v1790082178/p2kd_berita/p2kd-musyawarah-kalisalak.png",
                              })
                            }
                            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Default
                          </button>
                        </div>

                        <input
                          type="text"
                          value={formData.gambarUrl}
                          onChange={(e) => setFormData({ ...formData, gambarUrl: e.target.value })}
                          placeholder="Atau tempel URL gambar eksternal (https://...)"
                          className="w-full h-8 px-2.5 text-[11px] font-mono rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Lampiran PDF (Opsional) */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <label className="text-xs font-black uppercase text-slate-700 tracking-wider block">
                        Dokumen Lampiran PDF (Opsional)
                      </label>
                      <input
                        type="text"
                        value={formData.lampiranPdfNama}
                        onChange={(e) => setFormData({ ...formData, lampiranPdfNama: e.target.value })}
                        placeholder="Nama file: misal Berita Acara No. 04.pdf"
                        className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={formData.lampiranPdfUrl}
                        onChange={(e) => setFormData({ ...formData, lampiranPdfUrl: e.target.value })}
                        placeholder="URL Link PDF: https://..."
                        className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Toggle Headline */}
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <Star className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Jadikan Berita Utama (Headline)</span>
                          <span className="text-[10px] text-slate-600 leading-tight block">Tampil dengan banner besar paling atas di beranda website.</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.isHeadline}
                        onChange={(e) => setFormData({ ...formData, isHeadline: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer (Sticky / Fixed) */}
              <div className="px-5 py-3.5 sm:px-6 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer shadow-md"
                >
                  {editingArticle ? "Perbarui Artikel" : "Terbitkan Sekarang"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
