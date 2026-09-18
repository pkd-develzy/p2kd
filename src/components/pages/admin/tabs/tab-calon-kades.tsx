/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Vote,
  UserPlus,
  Edit2,
  Trash2,
  ExternalLink,
  Plus,
  X,
  Upload,
  User,
  GraduationCap,
  Briefcase,
  Calendar,
  Sparkles,
  Loader2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Check,
  Scale,
  FileText,
  ShieldAlert,
  RotateCcw,
  AlertTriangle,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, Input, Badge } from "@/components/ui";
import { KandidatKades, SeksiP2KDType } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/ui/dialog";
import { compressImage } from "@/lib/image-compressor";
import { DEFAULT_SYARAT_KADES, DEFAULT_LARANGAN_KADES } from "@/lib/data-store";

interface TabCalonKadesProps {
  isAdmin: boolean;
  userRole?: string;
  userSeksi?: SeksiP2KDType;
  currentUser: string;
  onRefresh?: () => void;
}

const COLOR_PRESETS = [
  { name: "Navy Classic", value: "#1e3a8a", bgClass: "bg-blue-900" },
  { name: "Emerald Hijau", value: "#065f46", bgClass: "bg-emerald-900" },
  { name: "Indigo Modern", value: "#312e81", bgClass: "bg-indigo-900" },
  { name: "Crimson Elegan", value: "#881337", bgClass: "bg-rose-900" },
  { name: "Slate Deep", value: "#0f172a", bgClass: "bg-slate-900" },
  { name: "Amber Emas", value: "#78350f", bgClass: "bg-amber-900" },
];

export const TabCalonKades: React.FC<TabCalonKadesProps> = ({
  isAdmin,
  userRole = "SUPER_ADMIN",
  userSeksi = "PIMPINAN",
  currentUser,
}) => {
  const toast = useToast();
  const { confirm, isOpen: isConfirmOpen, options: confirmOptions, handleConfirm, handleCancel } = useConfirm();

  const isAuthorized =
    isAdmin ||
    userRole === "SUPER_ADMIN" ||
    userRole === "PIMPINAN" ||
    userRole === "KETUA" ||
    userRole === "SEKRETARIS" ||
    userRole === "SEKSI_1" ||
    userRole === "SEKSI_2" ||
    userRole === "SEKSI_3" ||
    userSeksi === "PIMPINAN" ||
    userSeksi === "SEKSI_PENJARINGAN" ||
    userSeksi === "SEKSI_PENYARINGAN";

  const [calonList, setCalonList] = useState<KandidatKades[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal Calon State
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Syarat & Larangan State (Dapat diubah Sekretaris & Seksi terkait)
  const [showSyaratModal, setShowSyaratModal] = useState(false);
  const [activeSyaratTab, setActiveSyaratTab] = useState<"syarat" | "larangan" | "regulasi">("syarat");
  const [syaratList, setSyaratList] = useState<string[]>(DEFAULT_SYARAT_KADES);
  const [laranganList, setLaranganList] = useState<string[]>(DEFAULT_LARANGAN_KADES);
  const [highlightJudul, setHighlightJudul] = useState("Masa Jabatan Kepala Desa 8 Tahun & Maksimal 2 Kali Masa Jabatan");
  const [highlightDeskripsi, setHighlightDeskripsi] = useState(
    "Masa jabatan Kepala Desa adalah 8 (delapan) tahun terhitung sejak tanggal pelantikan dan dapat menjabat paling banyak 2 (dua) kali masa jabatan, baik secara berturut-turut maupun tidak secara berturut-turut."
  );
  const [highlightCatatan, setHighlightCatatan] = useState(
    "Seseorang yang telah menjabat Kepala Desa sebanyak 2 (dua) kali masa jabatan tidak dapat mencalonkan diri kembali. Ketentuan periodisasi tersebut juga mencakup masa jabatan Kepala Desa antarwaktu berdasarkan UU 3/2024 dan PP 16/2026."
  );
  const [newSyaratText, setNewSyaratText] = useState("");
  const [newLaranganText, setNewLaranganText] = useState("");
  const [loadingSyarat, setLoadingSyarat] = useState(false);
  const [savingSyarat, setSavingSyarat] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    nomorUrut: number;
    namaLengkap: string;
    gelarDepan: string;
    gelarBelakang: string;
    tempatTanggalLahir: string;
    pendidikanTerakhir: string;
    pekerjaan: string;
    tagline: string;
    visi: string;
    misi: string[];
    programUnggulan: string[];
    fotoUrl: string;
    warnaTema: string;
    statusVerifikasi: string;
  }>({
    nomorUrut: 1,
    namaLengkap: "",
    gelarDepan: "",
    gelarBelakang: "",
    tempatTanggalLahir: "Kalisalak, ",
    pendidikanTerakhir: "S1 / Sarjana",
    pekerjaan: "Wiraswasta",
    tagline: "",
    visi: "",
    misi: [""],
    programUnggulan: [""],
    fotoUrl: "",
    warnaTema: "#1e3a8a",
    statusVerifikasi: "MEMENUHI_SYARAT",
  });

  const fetchCalon = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") : null;
      const res = await fetch("/api/admin/calon?refresh=true", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCalonList(json.data);
      } else {
        setCalonList([]);
      }
    } catch (err) {
      console.error("Gagal memuat calon:", err);
      toast.error("Gagal", "Tidak dapat memuat data calon dari database.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  const fetchSyaratConfig = useCallback(async () => {
    try {
      setLoadingSyarat(true);
      const res = await fetch("/api/config");
      const json = await res.json();
      if (json.success && json.data) {
        if (Array.isArray(json.data.syaratCalonList) && json.data.syaratCalonList.length > 0) {
          setSyaratList(json.data.syaratCalonList);
        }
        if (Array.isArray(json.data.laranganCalonList) && json.data.laranganCalonList.length > 0) {
          setLaranganList(json.data.laranganCalonList);
        }
        if (json.data.highlightMasaJabatanJudul) {
          setHighlightJudul(json.data.highlightMasaJabatanJudul);
        }
        if (json.data.highlightMasaJabatanDeskripsi) {
          setHighlightDeskripsi(json.data.highlightMasaJabatanDeskripsi);
        }
        if (json.data.highlightMasaJabatanCatatan) {
          setHighlightCatatan(json.data.highlightMasaJabatanCatatan);
        }
      }
    } catch (err) {
      console.warn("Gagal memuat konfigurasi syarat:", err);
    } finally {
      setLoadingSyarat(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (active) {
      fetchCalon();
      fetchSyaratConfig();
    }
    return () => {
      active = false;
    };
  }, [fetchCalon, fetchSyaratConfig]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCalon();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.warning("Ukuran Terlalu Besar", "Maksimal ukuran foto adalah 8MB.");
      return;
    }

    try {
      const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 800, quality: 0.88 });
      setFormData((prev) => ({ ...prev, fotoUrl: compressed }));
      toast.success("Foto Berhasil Dimuat", "Foto kandidat siap disimpan.");
    } catch {
      toast.error("Gagal", "Terjadi kesalahan saat memproses foto.");
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId("");
    const nextNomor = calonList.length > 0 ? Math.max(...calonList.map((c) => c.nomorUrut || 0)) + 1 : 1;
    setFormData({
      nomorUrut: nextNomor,
      namaLengkap: "",
      gelarDepan: "",
      gelarBelakang: "",
      tempatTanggalLahir: "Kalisalak, ",
      pendidikanTerakhir: "S1 / Sarjana",
      pekerjaan: "Wiraswasta",
      tagline: "",
      visi: "",
      misi: [""],
      programUnggulan: [""],
      fotoUrl: "",
      warnaTema: "#1e3a8a",
      statusVerifikasi: "MEMENUHI_SYARAT",
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (c: KandidatKades) => {
    setIsEditing(true);
    setCurrentId(c.id);
    setFormData({
      nomorUrut: c.nomorUrut || 1,
      namaLengkap: c.namaLengkap || "",
      gelarDepan: c.gelarDepan || "",
      gelarBelakang: c.gelarBelakang || "",
      tempatTanggalLahir: c.tempatTanggalLahir || "",
      pendidikanTerakhir: c.pendidikanTerakhir || "S1 / Sarjana",
      pekerjaan: c.pekerjaan || "Wiraswasta",
      tagline: c.tagline || "",
      visi: c.visi || "",
      misi: Array.isArray(c.misi) && c.misi.length > 0 ? c.misi : [""],
      programUnggulan: Array.isArray(c.programUnggulan) && c.programUnggulan.length > 0 ? c.programUnggulan : [""],
      fotoUrl: c.fotoUrl || "",
      warnaTema: c.warnaTema || "#1e3a8a",
      statusVerifikasi: c.statusVerifikasi || "MEMENUHI_SYARAT",
    });
    setShowFormModal(true);
  };

  // Misi handlers
  const handleAddMisi = () => {
    setFormData((prev) => ({ ...prev, misi: [...prev.misi, ""] }));
  };
  const handleMisiChange = (idx: number, val: string) => {
    setFormData((prev) => {
      const updated = [...prev.misi];
      updated[idx] = val;
      return { ...prev, misi: updated };
    });
  };
  const handleRemoveMisi = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      misi: prev.misi.filter((_, i) => i !== idx),
    }));
  };

  // Program Unggulan handlers
  const handleAddProgram = () => {
    setFormData((prev) => ({ ...prev, programUnggulan: [...prev.programUnggulan, ""] }));
  };
  const handleProgramChange = (idx: number, val: string) => {
    setFormData((prev) => {
      const updated = [...prev.programUnggulan];
      updated[idx] = val;
      return { ...prev, programUnggulan: updated };
    });
  };
  const handleRemoveProgram = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      programUnggulan: prev.programUnggulan.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.namaLengkap.trim()) {
      toast.warning("Nama Wajib Diisi", "Mohon isi nama lengkap calon Kepala Desa.");
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanMisi = formData.misi.map((m) => m.trim()).filter(Boolean);
      const cleanProgram = formData.programUnggulan.map((p) => p.trim()).filter(Boolean);

      const payload = {
        ...formData,
        misi: cleanMisi,
        programUnggulan: cleanProgram,
      };

      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") : null;
      const url = "/api/admin/calon";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(isEditing ? { id: currentId, ...payload, user: currentUser } : { ...payload, user: currentUser }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(isEditing ? "Calon Diperbarui" : "Calon Ditambahkan", json.message);
        setShowFormModal(false);
        fetchCalon();
      } else {
        toast.error("Gagal", json.message || "Terjadi kesalahan saat menyimpan.");
      }
    } catch {
      toast.error("Error Jaringan", "Tidak dapat terhubung ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (c: KandidatKades) => {
    const approved = await confirm({
      title: "Hapus Calon Kepala Desa?",
      message: `Apakah Anda yakin ingin menghapus Calon Nomor Urut ${c.nomorUrut} (${c.namaLengkap}) dari sistem dan website publik?`,
      confirmText: "Hapus Calon",
      cancelText: "Batal",
      variant: "danger",
    });

    if (!approved) return;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") : null;
      const res = await fetch(`/api/admin/calon?id=${encodeURIComponent(c.id)}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Calon Dihapus", json.message);
        fetchCalon();
      } else {
        toast.error("Gagal", json.message);
      }
    } catch {
      toast.error("Error", "Gagal menghapus calon.");
    }
  };

  // --- Handlers Pengaturan Syarat & Larangan (Sekretaris & Seksi Terkait) ---
  const handleOpenSyaratModal = () => {
    fetchSyaratConfig();
    setShowSyaratModal(true);
  };

  const handleAddSyarat = () => {
    if (!newSyaratText.trim()) {
      toast.warning("Teks Kosong", "Masukkan butir syarat terlebih dahulu.");
      return;
    }
    setSyaratList((prev) => [...prev, newSyaratText.trim()]);
    setNewSyaratText("");
    toast.success("Butir Ditambahkan", "Butir syarat baru berhasil dimasukkan.");
  };

  const handleRemoveSyarat = (index: number) => {
    setSyaratList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditSyarat = (index: number, val: string) => {
    setSyaratList((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleAddLarangan = () => {
    if (!newLaranganText.trim()) {
      toast.warning("Teks Kosong", "Masukkan kriteria larangan terlebih dahulu.");
      return;
    }
    setLaranganList((prev) => [...prev, newLaranganText.trim()]);
    setNewLaranganText("");
    toast.success("Kriteria Ditambahkan", "Kriteria larangan baru berhasil dimasukkan.");
  };

  const handleRemoveLarangan = (index: number) => {
    setLaranganList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditLarangan = (index: number, val: string) => {
    setLaranganList((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleResetSyaratDefault = async () => {
    const approved = await confirm({
      title: "Reset ke Standar UU 3/2024?",
      message: "Apakah Anda yakin ingin mengembalikan seluruh butir syarat dan larangan ke ketentuan standar UU Desa No. 3/2024 dan PP No. 16/2026?",
      confirmText: "Reset Standar",
      cancelText: "Batal",
      variant: "warning",
    });

    if (!approved) return;
    setSyaratList(DEFAULT_SYARAT_KADES);
    setLaranganList(DEFAULT_LARANGAN_KADES);
    setHighlightJudul("Masa Jabatan Kepala Desa 8 Tahun & Maksimal 2 Kali Masa Jabatan");
    setHighlightDeskripsi(
      "Masa jabatan Kepala Desa adalah 8 (delapan) tahun terhitung sejak tanggal pelantikan dan dapat menjabat paling banyak 2 (dua) kali masa jabatan, baik secara berturut-turut maupun tidak secara berturut-turut."
    );
    setHighlightCatatan(
      "Seseorang yang telah menjabat Kepala Desa sebanyak 2 (dua) kali masa jabatan tidak dapat mencalonkan diri kembali. Ketentuan periodisasi tersebut juga mencakup masa jabatan Kepala Desa antarwaktu berdasarkan UU 3/2024 dan PP 16/2026."
    );
    toast.info("Format Direset", "Data dikembalikan ke standar regulasi nasional.");
  };

  const handleSaveSyaratConfig = async () => {
    setSavingSyarat(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") : null;
      const res = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          data: {
            syaratCalonList: syaratList,
            laranganCalonList: laranganList,
            highlightMasaJabatanJudul: highlightJudul,
            highlightMasaJabatanDeskripsi: highlightDeskripsi,
            highlightMasaJabatanCatatan: highlightCatatan,
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Syarat & Larangan Disimpan", "Ketentuan calon kades di website publik berhasil diperbarui secara live.");
        setShowSyaratModal(false);
      } else {
        toast.error("Gagal Menyimpan", json.message || "Terjadi kesalahan saat memperbarui syarat.");
      }
    } catch {
      toast.error("Error Jaringan", "Tidak dapat terhubung ke server konfigurasi.");
    } finally {
      setSavingSyarat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <Card className="p-6 bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white border border-blue-900/60 shadow-lg rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="primary"
                className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border-amber-400/30 px-3 py-0.5 rounded-full"
              >
                Seksi 2 & 3: Penjaringan & Penetapan Calon
              </Badge>
              <span className="text-xs text-slate-400 font-medium">• Pilkades Kalisalak 2027</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Vote className="w-6 h-6 text-amber-400" />
              <span>Manajemen Calon & Pendaftar Kepala Desa</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-normal">
              Kelola nomor urut resmi, foto profil, rekam jejak, visi, misi, serta syarat & larangan calon Kepala Desa. Setiap data yang disimpan di sini otomatis tayang di halaman publik (`/calon` dan `/syarat-daftar-kades`).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-xs font-bold border-slate-700 bg-white/5 text-white hover:bg-white/15 rounded-2xl py-2 px-3 backdrop-blur-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>

            {isAuthorized && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSyaratModal}
                className="text-xs font-bold border-emerald-500/50 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 rounded-2xl py-2 px-3.5 shadow-sm"
              >
                <Scale className="w-3.5 h-3.5 mr-1.5 text-emerald-300" />
                <span>Atur Syarat & Larangan</span>
              </Button>
            )}

            <Link href="/syarat-daftar-kades" target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold border-indigo-400/40 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 rounded-2xl py-2 px-3"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-300" />
                <span>Lihat Syarat</span>
                <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
              </Button>
            </Link>

            <Link href="/calon" target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold border-blue-400/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 rounded-2xl py-2 px-3"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5 text-blue-300" />
                <span>Halaman Calon</span>
                <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
              </Button>
            </Link>

            {isAuthorized && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAdd}
                className="text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md rounded-2xl py-2 px-3.5"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                <span>Tambah Calon</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-white border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Calon Ditetapkan
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{calonList.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Maksimal 5 Calon (PP 16/2026)</div>
        </Card>

        <Card className="p-4 bg-blue-50/40 border-blue-200 shadow-2xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Status Website Publik
          </div>
          <div className="text-sm font-black text-blue-900 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{calonList.length > 0 ? "Tayang Aktif" : "Menunggu Calon"}</span>
          </div>
          <div className="text-[10px] text-blue-600 mt-0.5">Terkoneksi ke Halaman /calon</div>
        </Card>

        <Card className="p-4 bg-emerald-50/40 border-emerald-200 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Verifikasi Berkas
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {calonList.filter((c) => c.statusVerifikasi === "MEMENUHI_SYARAT").length}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Memenuhi Syarat Sah</div>
        </Card>

        <Card className="p-4 bg-purple-50/40 border-purple-200 shadow-2xs">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
            Penetapan Nomor Urut
          </div>
          <div className="text-sm font-black text-purple-900 mt-2">
            {calonList.length > 0 ? `Nomor Urut 01 – 0${calonList.length}` : "Belum Ada"}
          </div>
          <div className="text-[10px] text-purple-600 mt-0.5">Sesuai Pleno Pengundian</div>
        </Card>
      </div>

      {/* Candidate Grid Showcase in Admin */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-semibold text-slate-500">Memuat data calon dari database...</span>
        </div>
      ) : calonList.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center bg-white border-2 border-dashed border-slate-300 rounded-3xl space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Vote className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Belum Ada Calon Kepala Desa yang Didaftarkan
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Klik tombol &ldquo;Tambah Calon Kades&rdquo; untuk menginput nomor urut, foto, nama, visi-misi, dan program kerja agar langsung muncul di website publik.
            </p>
          </div>
          {isAuthorized && (
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAdd}
                className="text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Input Calon Pertama</span>
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calonList.map((c) => (
            <Card
              key={c.id}
              className="border border-slate-200/90 hover:border-blue-400 bg-white rounded-3xl shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Candidate Card Banner */}
                <div
                  className="p-5 text-white text-center relative overflow-hidden"
                  style={{ backgroundColor: c.warnaTema || "#1e3a8a" }}
                >
                  <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border border-white/30">
                    CALON RESMI
                  </div>

                  <div className="w-22 h-22 mx-auto my-2 rounded-2xl bg-white/15 border-3 border-white/40 flex items-center justify-center shadow-md overflow-hidden relative">
                    {c.fotoUrl ? (
                      <img
                        src={c.fotoUrl}
                        alt={c.namaLengkap}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-white" />
                    )}
                  </div>

                  <div className="inline-block bg-white text-slate-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-sm mb-1.5">
                    NOMOR URUT 0{c.nomorUrut}
                  </div>

                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-snug line-clamp-2">
                    {c.gelarDepan ? `${c.gelarDepan} ` : ""}
                    {c.namaLengkap}
                    {c.gelarBelakang ? `, ${c.gelarBelakang}` : ""}
                  </h3>

                  {c.tagline && (
                    <p className="text-[11px] text-white/90 italic mt-1 font-medium px-2 line-clamp-1">
                      &ldquo;{c.tagline}&rdquo;
                    </p>
                  )}
                </div>

                {/* Candidate Bio & Details */}
                <div className="p-5 space-y-3.5 text-xs text-slate-700">
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">TTL: <strong>{c.tempatTanggalLahir}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">Pendidikan: <strong>{c.pendidikanTerakhir}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Pekerjaan: <strong>{c.pekerjaan}</strong></span>
                    </div>
                  </div>

                  {/* Visi */}
                  {c.visi && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        Visi:
                      </span>
                      <p className="text-[11px] text-slate-800 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/70 leading-relaxed font-medium line-clamp-2">
                        {c.visi}
                      </p>
                    </div>
                  )}

                  {/* Misi & Program Counts */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>{Array.isArray(c.misi) ? `${c.misi.length} Butir Misi` : "0 Misi"}</span>
                    <span>•</span>
                    <span>{Array.isArray(c.programUnggulan) ? `${c.programUnggulan.length} Program Kerja` : "0 Program"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{c.statusVerifikasi || "Sah P2KD"}</span>
                </span>

                {isAuthorized && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      title="Edit Data Calon"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(c)}
                      title="Hapus Calon"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* --- MODAL FORM TAMBAH / EDIT CALON --- */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Vote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditing ? "Edit Profil Calon Kepala Desa" : "Pendaftaran & Penetapan Calon Kepala Desa"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Data yang diisi otomatis tampil di halaman utama dan halaman /calon website publik.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveForm} className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs flex-1">
              {/* Row 1: Nomor Urut & Warna Tema */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Urut Calon *
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.nomorUrut}
                    onChange={(e) => setFormData({ ...formData, nomorUrut: parseInt(e.target.value, 10) || 1 })}
                    className="font-bold text-slate-900 h-9"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Sesuai hasil pengundian pleno nomor urut</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Warna Tema Kartu Calon
                  </label>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, warnaTema: p.value })}
                        className={`w-7 h-7 rounded-xl ${p.bgClass} flex items-center justify-center border-2 transition-all ${
                          formData.warnaTema === p.value ? "border-amber-400 scale-110 shadow-sm" : "border-white"
                        }`}
                        title={p.name}
                      >
                        {formData.warnaTema === p.value && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={formData.warnaTema}
                      onChange={(e) => setFormData({ ...formData, warnaTema: e.target.value })}
                      className="w-7 h-7 rounded-lg border cursor-pointer ml-1"
                      title="Warna Kustom"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Nama Lengkap & Gelar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">Gelar Depan</label>
                  <Input
                    type="text"
                    placeholder="Contoh: H. / Dr."
                    value={formData.gelarDepan}
                    onChange={(e) => setFormData({ ...formData, gelarDepan: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                  <Input
                    type="text"
                    placeholder="Nama lengkap tanpa gelar"
                    value={formData.namaLengkap}
                    onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                    className="font-bold text-slate-900 h-9"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">Gelar Belakang</label>
                  <Input
                    type="text"
                    placeholder="Contoh: S.Pd / M.M."
                    value={formData.gelarBelakang}
                    onChange={(e) => setFormData({ ...formData, gelarBelakang: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Row 3: TTL, Pendidikan, Pekerjaan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tempat, Tanggal Lahir</label>
                  <Input
                    type="text"
                    placeholder="Kalisalak, 12 Mei 1985"
                    value={formData.tempatTanggalLahir}
                    onChange={(e) => setFormData({ ...formData, tempatTanggalLahir: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pendidikan Terakhir</label>
                  <Input
                    type="text"
                    placeholder="S1 Ilmu Pemerintahan"
                    value={formData.pendidikanTerakhir}
                    onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pekerjaan Saat Ini</label>
                  <Input
                    type="text"
                    placeholder="Wiraswasta / Tokoh Masyarakat"
                    value={formData.pekerjaan}
                    onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Row 4: Tagline Slogan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Slogan / Tagline Calon</label>
                <Input
                  type="text"
                  placeholder="Contoh: Kalisalak Maju, Bersatu, dan Sejahtera untuk Semua"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="h-9 italic"
                />
              </div>

              {/* Row 5: Foto Kandidat */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="block font-bold text-slate-700">Foto Resmi Calon Kepala Desa</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.fotoUrl ? (
                      <img src={formData.fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold cursor-pointer transition-colors text-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Foto Kandidat</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Foto otomatis dikompresi optimal. Disarankan foto portrait rasio 3:4.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 6: Visi Utama */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Visi Utama Calon</label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan visi utama kepemimpinan calon..."
                  value={formData.visi}
                  onChange={(e) => setFormData({ ...formData, visi: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Row 7: Misi Kerja Dinamis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">Butir-Butir Misi</label>
                  <button
                    type="button"
                    onClick={handleAddMisi}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Misi</span>
                  </button>
                </div>
                <div className="space-y-1.5">
                  {formData.misi.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <Input
                        type="text"
                        placeholder={`Misi ke-${idx + 1}`}
                        value={m}
                        onChange={(e) => handleMisiChange(idx, e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      {formData.misi.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMisi(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 8: Program Unggulan Dinamis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Program Kerja Prioritas / Unggulan</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddProgram}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Program</span>
                  </button>
                </div>
                <div className="space-y-1.5">
                  {formData.programUnggulan.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <Input
                        type="text"
                        placeholder={`Program unggulan ke-${idx + 1}`}
                        value={p}
                        onChange={(e) => handleProgramChange(idx, e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      {formData.programUnggulan.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProgram(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-xl text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      <span>Menyimpan ke DB...</span>
                    </>
                  ) : (
                    <span>{isEditing ? "Simpan Perubahan" : "Tetapkan & Publikasikan Calon"}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Syarat & Larangan Calon (Sekretaris & Seksi Terkait) */}
      {showSyaratModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-400/30">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" className="text-[10px] bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full">
                      P2KD Realtime Sync
                    </Badge>
                    <span className="text-xs text-slate-300 font-medium">Wewenang: Sekretaris & Seksi Terkait</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    Pengaturan Syarat & Larangan Pencalonan Kades
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSyaratModal(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-200 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveSyaratTab("syarat")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeSyaratTab === "syarat"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Persyaratan Calon ({syaratList.length} Butir)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSyaratTab("larangan")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeSyaratTab === "larangan"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Kriteria Larangan / TMS ({laranganList.length} Butir)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSyaratTab("regulasi")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeSyaratTab === "regulasi"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Highlight Regulasi (UU 3/2024 & PP 16/2026)</span>
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {loadingSyarat ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  <p className="text-xs font-bold">Memuat konfigurasi regulasi...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: PERSYARATAN CALON */}
                  {activeSyaratTab === "syarat" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Petunjuk Persyaratan:</strong> Setiap butir di bawah ini wajib dipenuhi oleh bakal calon Kepala Desa Kalisalak sesuai regulasi Pasal 33 UU 3/2024 dan Perda Kabupaten Tegal. Perubahan butir akan langsung aktif di halaman <code>/syarat-daftar-kades</code>.
                        </div>
                      </div>

                      {/* Add New Syarat Input */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tambah Butir Persyaratan Baru</span>
                        </label>
                        <div className="flex gap-2">
                          <textarea
                            rows={2}
                            value={newSyaratText}
                            onChange={(e) => setNewSyaratText(e.target.value)}
                            placeholder="Ketik butir persyaratan baru..."
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={handleAddSyarat}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 self-end rounded-xl px-4 py-2"
                          >
                            Tambah
                          </Button>
                        </div>
                      </div>

                      {/* List Syarat Existing */}
                      <div className="space-y-2.5">
                        <label className="text-xs font-bold text-slate-700">Daftar Butir Syarat Aktif ({syaratList.length}):</label>
                        {syaratList.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-colors shadow-2xs group"
                          >
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-1 shadow-xs">
                              {idx + 1}
                            </span>
                            <textarea
                              rows={2}
                              value={item}
                              onChange={(e) => handleEditSyarat(idx, e.target.value)}
                              className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50/50 group-hover:bg-white transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSyarat(idx)}
                              title="Hapus Butir"
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 mt-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: LARANGAN / TMS */}
                  {activeSyaratTab === "larangan" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Petunjuk Larangan:</strong> Kriteria di bawah menyatakan kondisi yang menyebabkan seorang bakal calon <strong>Tidak Memenuhi Syarat (TMS)</strong> / dilarang ditetapkan menjadi calon Kades.
                        </div>
                      </div>

                      {/* Add New Larangan Input */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-rose-600" />
                          <span>Tambah Kriteria Larangan / TMS Baru</span>
                        </label>
                        <div className="flex gap-2">
                          <textarea
                            rows={2}
                            value={newLaranganText}
                            onChange={(e) => setNewLaranganText(e.target.value)}
                            placeholder="Ketik kriteria larangan / TMS baru..."
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                          />
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={handleAddLarangan}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 self-end rounded-xl px-4 py-2"
                          >
                            Tambah
                          </Button>
                        </div>
                      </div>

                      {/* List Larangan Existing */}
                      <div className="space-y-2.5">
                        <label className="text-xs font-bold text-slate-700">Daftar Kriteria Larangan Aktif ({laranganList.length}):</label>
                        {laranganList.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-rose-100 hover:border-rose-300 transition-colors shadow-2xs group"
                          >
                            <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-1 shadow-xs">
                              {idx + 1}
                            </span>
                            <textarea
                              rows={2}
                              value={item}
                              onChange={(e) => handleEditLarangan(idx, e.target.value)}
                              className="w-full text-xs p-2 rounded-xl border border-rose-100 focus:outline-none focus:border-rose-500 bg-rose-50/20 group-hover:bg-white transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveLarangan(idx)}
                              title="Hapus Kriteria"
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 mt-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: HIGHLIGHT REGULASI & MASA JABATAN */}
                  {activeSyaratTab === "regulasi" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
                        <Award className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Ketentuan Banner Regulasi:</strong> Mengatur penjelasan masa jabatan 8 tahun dan maksimal 2 periode yang tampil di bagian atas halaman informasi syarat publik.
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Judul Banner Regulasi Masa Jabatan
                          </label>
                          <Input
                            type="text"
                            value={highlightJudul}
                            onChange={(e) => setHighlightJudul(e.target.value)}
                            className="text-xs h-9"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Deskripsi Ketentuan Masa Jabatan (8 Tahun 2 Periode)
                          </label>
                          <textarea
                            rows={3}
                            value={highlightDeskripsi}
                            onChange={(e) => setHighlightDeskripsi(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Catatan Penting / Disclaimer Hukum
                          </label>
                          <textarea
                            rows={3}
                            value={highlightCatatan}
                            onChange={(e) => setHighlightCatatan(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetSyaratDefault}
                className="text-xs font-bold text-amber-700 border-amber-300 bg-amber-50/50 hover:bg-amber-100 rounded-xl gap-1.5 w-full sm:w-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Standar UU 3/2024</span>
              </Button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSyaratModal(false)}
                  className="text-xs rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveSyaratConfig}
                  disabled={savingSyarat}
                  className="text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md gap-1.5"
                >
                  {savingSyarat ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke Portal Publik...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Syarat ke Website Publik</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
