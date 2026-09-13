/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button, Input, Badge, PaginationControl } from "@/components/ui";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  KeyRound,
  Printer,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Copy,
  Check,
  X,
  Building2,
  Sparkles,
  QrCode,
  ShieldAlert,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
  Award,
  Upload,
  Camera,
} from "lucide-react";
import { AnggotaP2KD, SeksiP2KDType, TPSItem } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/ui/dialog";
import { compressImage } from "@/lib/image-compressor";

interface TabAnggotaP2KDProps {
  anggotaList: AnggotaP2KD[];
  tpsList?: TPSItem[];
  isAdmin: boolean;
  userRole?: string;
  userSeksi?: SeksiP2KDType;
  currentUser: string;
  onRefresh: () => void;
}

export const TabAnggotaP2KD: React.FC<TabAnggotaP2KDProps> = ({
  anggotaList,
  tpsList = [],
  isAdmin,
  userRole = "SUPER_ADMIN",
  userSeksi = "PIMPINAN",
  currentUser,
  onRefresh,
}) => {
  const toast = useToast();
  const { confirm, isOpen: isConfirmOpen, options: confirmOptions, handleConfirm, handleCancel } = useConfirm();
  const isSuperAdminUser = isAdmin || userRole === "SUPER_ADMIN" || userSeksi === "PIMPINAN";
  const userSectionCode = !isSuperAdminUser && userSeksi ? userSeksi : null;
  const canManage = isSuperAdminUser || Boolean(userSectionCode);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeksiFilter, setSelectedSeksiFilter] = useState<string>(
    userSectionCode ? userSectionCode : "SEMUA"
  );
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("SEMUA");

  // Modal State for Add/Edit
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const defaultSeksi: SeksiP2KDType = userSectionCode ? userSectionCode : "SEKSI_PEMILIH";
  const [dynamicSkP2kd, setDynamicSkP2kd] = useState("Keputusan BPD Desa Kalisalak No. 04/BPD-KLS/VII/2026");

  React.useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.skP2KD) {
          setDynamicSkP2kd(j.data.skP2KD);
        }
      })
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState<{
    namaLengkap: string;
    nik: string;
    jabatan: string;
    seksi: SeksiP2KDType;
    seksiLabel: string;
    username: string;
    customPassword?: string;
    role: string;
    kontakWa: string;
    alamatDusun: string;
    assignedTps: string;
    status: "AKTIF" | "NONAKTIF";
    skPenetapan: string;
    fotoUrl?: string;
  }>({
    namaLengkap: "",
    nik: "",
    jabatan: "",
    seksi: defaultSeksi,
    seksiLabel: "Seksi 1: Pendaftaran Pemilih",
    username: "",
    customPassword: "",
    role: defaultSeksi,
    kontakWa: "",
    alamatDusun: "",
    assignedTps: "SEMUA",
    status: "AKTIF",
    skPenetapan: dynamicSkP2kd,
    fotoUrl: "",
  });

  // Modal State for ID Card Print
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [selectedAnggotaForCard, setSelectedAnggotaForCard] = useState<AnggotaP2KD | null>(null);

  // Modal State for Credentials Management
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [selectedAnggotaForCreds, setSelectedAnggotaForCreds] = useState<AnggotaP2KD | null>(null);
  const [customNewPass, setCustomNewPass] = useState("");
  const [showPassText, setShowPassText] = useState(false);
  const [isResettingPass, setIsResettingPass] = useState(false);

  // Copy state helper
  const [copiedUser, setCopiedUser] = useState<string | null>(null);

  const allSeksiOptions: Array<{ value: SeksiP2KDType; label: string; role: string }> = [
    { value: "PIMPINAN", label: "Pimpinan P2KD (Ketua/Sekretaris/Bendahara)", role: "SUPER_ADMIN" },
    { value: "SEKSI_PEMILIH", label: "Seksi 1: Pendaftaran Pemilih", role: "seksi_pemilih" },
    { value: "SEKSI_PENJARINGAN", label: "Seksi 2: Penjaringan Balon", role: "seksi_penjaringan" },
    { value: "SEKSI_PENYARINGAN", label: "Seksi 3: Penyaringan & Seleksi", role: "seksi_penyaringan" },
    { value: "SEKSI_PUNGUT_HITUNG", label: "Seksi 4: Pemungutan & Penghitungan", role: "seksi_pemungutan" },
    { value: "SEKSI_LOGISTIK_PUBLIKASI", label: "Seksi 5: Perlengkapan & Publikasi", role: "seksi_logistik" },
    { value: "PANTARLIH_LAPANGAN", label: "Koordinator / Petugas Lapangan Wilayah RW", role: "petugas" },
  ];

  const seksiOptions = isSuperAdminUser
    ? allSeksiOptions
    : allSeksiOptions.filter((s) => s.value === userSectionCode || (userSectionCode === "SEKSI_PEMILIH" && s.value === "PANTARLIH_LAPANGAN"));

  // Filtering
  const filteredAnggota = anggotaList.filter((agt) => {
    if (userSectionCode) {
      if (userSectionCode === "SEKSI_PEMILIH") {
        if (agt.seksi !== "SEKSI_PEMILIH" && agt.seksi !== "PANTARLIH_LAPANGAN") return false;
      } else {
        if (agt.seksi !== userSectionCode) return false;
      }
    }

    if (selectedSeksiFilter !== "SEMUA") {
      if (agt.seksi !== selectedSeksiFilter && agt.role !== selectedSeksiFilter) return false;
    }

    if (selectedStatusFilter !== "SEMUA") {
      if (agt.status !== selectedStatusFilter) return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = agt.namaLengkap.toLowerCase().includes(q);
      const matchNik = agt.nik.toLowerCase().includes(q);
      const matchUser = agt.username.toLowerCase().includes(q);
      const matchJabatan = agt.jabatan.toLowerCase().includes(q);
      const matchTps = agt.assignedTps ? agt.assignedTps.toLowerCase().includes(q) : false;
      if (!matchName && !matchNik && !matchUser && !matchJabatan && !matchTps) return false;
    }

    return true;
  });

  const totalAnggota = filteredAnggota.length;
  const countPimpinan = anggotaList.filter((a) => a.seksi === "PIMPINAN").length;
  const countKoordinator = anggotaList.filter((a) => a.seksi.startsWith("SEKSI_")).length;
  const countPantarlih = anggotaList.filter((a) => a.seksi === "PANTARLIH_LAPANGAN").length;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const startIdx = (currentPage - 1) * pageSize;
  const pagedAnggota = filteredAnggota.slice(startIdx, startIdx + pageSize);

  const generateAutoPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let rand = "";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `KLS-${rand}`;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.warning("Ukuran Foto Terlalu Besar", "Maksimal ukuran foto adalah 8MB.");
      return;
    }

    try {
      const compressed = await compressImage(file, { maxWidth: 480, maxHeight: 640, quality: 0.85 });
      setFormData((prev) => ({ ...prev, fotoUrl: compressed }));
      toast.success("Foto Berhasil Dimuat", "Foto profil telah dioptimalkan dan siap disimpan.");
    } catch {
      toast.error("Gagal Memproses Foto", "Terjadi kesalahan saat memproses gambar.");
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId("");
    const generatedPass = generateAutoPassword();
    setFormData({
      namaLengkap: "",
      nik: "",
      jabatan: userSectionCode ? `Anggota ${allSeksiOptions.find(s => s.value === userSectionCode)?.label}` : "",
      seksi: defaultSeksi,
      seksiLabel: allSeksiOptions.find((s) => s.value === defaultSeksi)?.label || "Seksi 1: Pendaftaran Pemilih",
      username: "",
      customPassword: generatedPass,
      role: allSeksiOptions.find((s) => s.value === defaultSeksi)?.role || "seksi_pemilih",
      kontakWa: "",
      alamatDusun: "",
      assignedTps: "SEMUA",
      status: "AKTIF",
      skPenetapan: dynamicSkP2kd,
      fotoUrl: "",
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (agt: AnggotaP2KD) => {
    setIsEditing(true);
    setCurrentId(agt.id);
    setFormData({
      namaLengkap: agt.namaLengkap,
      nik: agt.nik,
      jabatan: agt.jabatan,
      seksi: agt.seksi,
      seksiLabel: agt.seksiLabel,
      username: agt.username,
      customPassword: "",
      role: agt.role,
      kontakWa: agt.kontakWa,
      alamatDusun: agt.alamatDusun,
      assignedTps: agt.assignedTps || "SEMUA",
      status: agt.status,
      skPenetapan: agt.skPenetapan,
      fotoUrl: agt.fotoUrl || "",
    });
    setShowFormModal(true);
  };

  const handleNameChange = (name: string) => {
    const updated = { ...formData, namaLengkap: name };
    if (!isEditing && !formData.username) {
      const cleanName = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 10);
      if (cleanName) {
        updated.username = `${cleanName}_${formData.seksi.toLowerCase().slice(0, 6)}`;
      }
    }
    setFormData(updated);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.namaLengkap.trim() || !formData.jabatan.trim() || !formData.username.trim()) {
      toast.warning("Form Belum Lengkap", "Nama lengkap, jabatan, dan username wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = "/api/admin/anggota";
      const method = isEditing ? "PUT" : "POST";
      const payload = isEditing
        ? { id: currentId, ...formData, user: currentUser }
        : { ...formData, user: currentUser };

      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") : null;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          isEditing ? "Perubahan Disimpan" : "Anggota Ditambahkan",
          json.message
        );
        setShowFormModal(false);
        onRefresh();
      } else {
        toast.error("Gagal", json.message || "Terjadi kesalahan saat menyimpan data.");
      }
    } catch {
      toast.error("Gagal Jaringan", "Tidak dapat terhubung ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCredsModal = (agt: AnggotaP2KD) => {
    setSelectedAnggotaForCreds(agt);
    setCustomNewPass(agt.seksi === "PANTARLIH_LAPANGAN" ? "pantarlih123" : "p2kd2026");
    setShowCredsModal(true);
  };

  const handleDirectPasswordChange = async () => {
    if (!selectedAnggotaForCreds || !customNewPass.trim()) return;

    setIsResettingPass(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") : null;
      const res = await fetch("/api/admin/anggota", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: selectedAnggotaForCreds.id,
          action: "update_password",
          newPassword: customNewPass,
          user: currentUser,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Sandi Diperbarui", `Kata sandi akun ${selectedAnggotaForCreds.username} berhasil diubah.`);
      } else {
        toast.error("Gagal", json.message);
      }
    } catch {
      toast.error("Error", "Gagal memperbarui kata sandi.");
    } finally {
      setIsResettingPass(false);
    }
  };

  const handleDelete = async (agt: AnggotaP2KD) => {
    const approved = await confirm({
      title: "Hapus Anggota P2KD?",
      message: `Apakah Anda yakin ingin menghapus ${agt.namaLengkap} (${agt.jabatan}) dari sistem P2KD?`,
      confirmText: "Hapus Anggota",
      cancelText: "Batal",
      variant: "danger",
    });

    if (!approved) {
      return;
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") : null;
      const res = await fetch(`/api/admin/anggota?id=${encodeURIComponent(agt.id)}&user=${encodeURIComponent(currentUser)}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Anggota Dihapus", json.message);
        onRefresh();
      } else {
        toast.error("Gagal", json.message);
      }
    } catch {
      toast.error("Error", "Gagal menghapus anggota.");
    }
  };

  const getWaInvitationText = (agt: AnggotaP2KD, pass?: string) => {
    const passwordUsed = pass || (agt.seksi === "PANTARLIH_LAPANGAN" ? "pantarlih123" : "p2kd2026");
    return `*AKUN RESMI PANITIA P2KD DESA KALISALAK 2026*\n\nYth. Bpk/Ibu *${agt.namaLengkap}*\nJabatan: *${agt.jabatan}*\nSeksi: *${agt.seksiLabel}*\nPenugasan: *${agt.assignedTps || "Semua Wilayah Desa"}*\n\nBerikut kredensial login portal administrasi Pilkades:\n🌐 *Link Portal*: http://localhost:3000/admin\n👤 *Username*: \`${agt.username}\`\n🔑 *Kata Sandi*: \`${passwordUsed}\`\n\n_Mohon jaga kerahasiaan kredensial ini sesuai pakta integritas panitia._`;
  };

  const handleCopyCredentials = (agt: AnggotaP2KD) => {
    const credText = getWaInvitationText(agt);
    navigator.clipboard.writeText(credText);
    setCopiedUser(agt.id);
    toast.success("Tersalin", `Format undangan & kredensial untuk ${agt.namaLengkap} telah disalin.`);
    setTimeout(() => setCopiedUser(null), 3000);
  };

  const handleSendWhatsApp = (agt: AnggotaP2KD, pass?: string) => {
    const cleanPhone = agt.kontakWa.replace(/^0/, "62").replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(getWaInvitationText(agt, pass));
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`, "_blank");
  };

  const getSeksiColor = (seksi: SeksiP2KDType) => {
    switch (seksi) {
      case "PIMPINAN":
        return "bg-blue-500/10 text-blue-700 border-blue-500/30";
      case "SEKSI_PEMILIH":
        return "bg-amber-500/10 text-amber-700 border-amber-500/30";
      case "SEKSI_PENJARINGAN":
        return "bg-indigo-500/10 text-indigo-700 border-indigo-500/30";
      case "SEKSI_PENYARINGAN":
        return "bg-purple-500/10 text-purple-700 border-purple-500/30";
      case "SEKSI_PUNGUT_HITUNG":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
      case "SEKSI_LOGISTIK_PUBLIKASI":
        return "bg-cyan-500/10 text-cyan-700 border-cyan-500/30";
      case "PANTARLIH_LAPANGAN":
        return "bg-rose-500/10 text-rose-700 border-rose-500/30";
      default:
        return "bg-slate-500/10 text-slate-700 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-5">
      {/* Hero Header */}
      <Card className="p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-900/60 shadow-lg rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="primary"
                className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border-blue-400/30 px-3 py-0.5 rounded-full"
              >
                Struktur Kepanitiaan P2KD
              </Badge>
              <span className="text-xs text-slate-400 font-medium">• {dynamicSkP2kd}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-blue-400" />
              {userSectionCode
                ? `Manajemen Anggota & Akun ${allSeksiOptions.find(s => s.value === userSectionCode)?.label || ""}`
                : "Struktur Anggota P2KD & Kredensial Akun"}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-normal">
              Kelola struktur kepanitiaan Pilkades Kalisalak (Pimpinan, 5 Koordinator Seksi, serta Petugas KPPS/Pantarlih), cetak ID Card, dan kelola kata sandi akun panitia.
            </p>
          </div>

          {canManage && (
            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAdd}
                className="text-xs font-bold bg-blue-600 hover:bg-blue-500 shadow-md rounded-2xl py-2.5 px-4"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Tambah Anggota Seksi / Petugas
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-white border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {userSectionCode ? "Anggota Tim Seksi" : "Total Seluruh Panitia"}
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalAnggota}</div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={dynamicSkP2kd}>
            {dynamicSkP2kd}
          </div>
        </Card>

        <Card className="p-3.5 border-blue-200 bg-blue-50/30 shadow-sm">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Pimpinan P2KD
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1">{countPimpinan}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Ketua, Sekretaris, Bendahara</div>
        </Card>

        <Card className="p-3.5 border-amber-200 bg-amber-50/30 shadow-sm">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            Koordinator 5 Seksi
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{countKoordinator}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">5 Divisi Bidang Tugas</div>
        </Card>

        <Card className="p-3.5 border-emerald-200 bg-emerald-50/30 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Pantarlih Lapangan
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{countPantarlih}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">
            {tpsList.length > 0 ? `${tpsList.length} TPS Terdaftar` : "Belum Ada Master TPS"}
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama anggota, NIK, username, jabatan, atau TPS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedSeksiFilter}
              onChange={(e) => setSelectedSeksiFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none"
            >
              {isSuperAdminUser ? (
                <>
                  <option value="SEMUA">Semua Seksi & Jabatan</option>
                  <option value="PIMPINAN">Pimpinan P2KD</option>
                  <option value="SEKSI_PEMILIH">Seksi 1: Pendaftaran Pemilih</option>
                  <option value="SEKSI_PENJARINGAN">Seksi 2: Penjaringan Balon</option>
                  <option value="SEKSI_PENYARINGAN">Seksi 3: Penyaringan & Uji Kompetensi</option>
                  <option value="SEKSI_PUNGUT_HITUNG">Seksi 4: Pemungutan Suara</option>
                  <option value="SEKSI_LOGISTIK_PUBLIKASI">Seksi 5: Perlengkapan & Publikasi</option>
                  <option value="PANTARLIH_LAPANGAN">Pantarlih Lapangan TPS 1–7</option>
                </>
              ) : userSectionCode === "SEKSI_PEMILIH" ? (
                <>
                  <option value="SEMUA">Semua Tim Seksi 1</option>
                  <option value="SEKSI_PEMILIH">Seksi 1: Pendaftaran Pemilih</option>
                  <option value="PANTARLIH_LAPANGAN">Pantarlih Lapangan TPS 1–7</option>
                </>
              ) : (
                <option value={userSectionCode || "SEMUA"}>
                  {allSeksiOptions.find((s) => s.value === userSectionCode)?.label || "Seksi Saya"}
                </option>
              )}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="AKTIF">Status Aktif</option>
              <option value="NONAKTIF">Nonaktif</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Anggota List Table */}
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Profil & Identitas</th>
                <th className="py-3 px-4">Jabatan & Seksi</th>
                <th className="py-3 px-4">Kredensial Login</th>
                <th className="py-3 px-4">Kontak & Penugasan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi & Kredensial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAnggota.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data anggota sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                pagedAnggota.map((agt, idx) => (
                  <tr key={agt.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 font-medium">
                      {startIdx + idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {agt.fotoUrl ? (
                          <img
                            src={agt.fotoUrl}
                            alt={agt.namaLengkap}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {agt.namaLengkap[0]}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                            <span>{agt.namaLengkap}</span>
                            {agt.seksi === "PIMPINAN" && (
                              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            NIK: {agt.nik}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            SK: {agt.skPenetapan}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{agt.jabatan}</div>
                      <div className="mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSeksiColor(
                            agt.seksi
                          )}`}
                        >
                          {agt.seksiLabel}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <code className="px-2 py-0.5 rounded-lg bg-slate-100 font-mono text-[11px] font-bold text-slate-800 border border-slate-200">
                          {agt.username}
                        </code>
                        <button
                          onClick={() => handleCopyCredentials(agt)}
                          title="Salin Format WhatsApp Undangan Akun"
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-slate-100 transition-colors"
                        >
                          {copiedUser === agt.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Role: {agt.role}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="text-slate-800 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <a
                          href={`https://wa.me/62${agt.kontakWa.replace(/^0/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:underline font-medium"
                        >
                          {agt.kontakWa}
                        </a>
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{agt.alamatDusun}</span>
                      </div>
                      {agt.assignedTps && (
                        <div className="text-blue-700 font-bold text-[10px] flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-blue-500" />
                          Wilayah: {agt.assignedTps}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          agt.status === "AKTIF"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {agt.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {/* Kelola Kredensial Akun Button */}
                        <button
                          onClick={() => handleOpenCredsModal(agt)}
                          title="Kelola Kredensial & Kirim WA"
                          className="p-1.5 rounded-lg border border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Cetak ID Card */}
                        <button
                          onClick={() => {
                            setSelectedAnggotaForCard(agt);
                            setShowIdCardModal(true);
                          }}
                          title="Cetak ID Card Panitia Resmi"
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-blue-700 transition-colors shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {canManage && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(agt)}
                              title="Edit Data Anggota"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors shadow-2xs"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDelete(agt)}
                              title="Hapus Anggota"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <PaginationControl
            currentPage={currentPage}
            totalItems={filteredAnggota.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
          />
        </div>
      </Card>

      {/* --- MODAL FORM TAMBAH / EDIT ANGGOTA --- */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditing ? "Edit Data Anggota Seksi / Petugas" : "Pendaftaran Anggota Seksi / Petugas Pleno / Pantarlih"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Isi lengkap data identitas, penugasan seksi, dan kredensial akses petugas pembantu pleno/lapangan.
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

            {/* Scrollable Form Body */}
            <form id="anggotaForm" onSubmit={handleSaveForm} className="overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: KHASANUDIN, S.Pd.SD"
                  value={formData.namaLengkap}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIK (16 Digit)
                  </label>
                  <Input
                    type="text"
                    maxLength={16}
                    placeholder="332801..."
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Aktif
                  </label>
                  <Input
                    type="text"
                    placeholder="081234567890"
                    value={formData.kontakWa}
                    onChange={(e) => setFormData({ ...formData, kontakWa: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Divisi / Seksi P2KD *
                  </label>
                  <select
                    value={formData.seksi}
                    onChange={(e) => {
                      const selectedVal = e.target.value as SeksiP2KDType;
                      const matched = seksiOptions.find((s) => s.value === selectedVal);
                      setFormData({
                        ...formData,
                        seksi: selectedVal,
                        seksiLabel: matched ? matched.label : selectedVal,
                        role: matched ? matched.role : "SEKSI_PEMILIH",
                      });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {seksiOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan Resmi *
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: Koordinator Seksi Pendaftaran"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Username Login *
                  </label>
                  <Input
                    type="text"
                    placeholder="seksi_pemilih atau petugas_tps01"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Penugasan Koordinator Wilayah RW
                  </label>
                  <select
                    value={formData.assignedTps}
                    onChange={(e) => setFormData({ ...formData, assignedTps: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="SEMUA">Semua Wilayah Desa (Pimpinan / Seksi)</option>
                    {Array.from({ length: 13 }, (_, i) => {
                      const no = String(i + 1).padStart(2, "0");
                      return (
                        <option key={`rw-${no}`} value={`RW ${no}`}>
                          Koordinator Lapangan Wilayah RW {no} (RT 01, 02, 03)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {!isEditing && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      Kata Sandi Awal Akun
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, customPassword: generateAutoPassword() })}
                      className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Acak Sandi Kuat
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={formData.customPassword || ""}
                    onChange={(e) => setFormData({ ...formData, customPassword: e.target.value })}
                    placeholder="p2kd2026"
                  />
                </div>
              )}

              {/* Photo Upload & Preview */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Foto Resmi Panitia (Untuk Kartu ID & Database)
                </label>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  {formData.fotoUrl ? (
                    <div className="relative group shrink-0">
                      <img
                        src={formData.fotoUrl}
                        alt="Preview Foto"
                        className="w-16 h-20 rounded-lg object-cover border-2 border-blue-500 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, fotoUrl: "" })}
                        className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 text-white text-[10px] shadow hover:bg-rose-700"
                        title="Hapus Foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-20 rounded-lg border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <Camera className="w-6 h-6 text-slate-300" />
                      <span className="text-[9px] mt-1 font-semibold">Pas Foto 3x4</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <div className="text-[11px] text-slate-600">
                      Unggah pas foto resmi (format JPG/PNG/WEBP, maks 2MB). Foto akan tampil di Kartu Tanda Pengenal Panitia (ID Card).
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer text-xs font-bold shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{formData.fotoUrl ? "Ganti Foto Profil" : "Pilih Foto / Kamera"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Domisili (RT / RW / Desa Kalisalak)
                </label>
                <Input
                  type="text"
                  placeholder="RT 01/RW 01, Desa Kalisalak"
                  value={formData.alamatDusun}
                  onChange={(e) => setFormData({ ...formData, alamatDusun: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor SK Penetapan
                  </label>
                  <Input
                    type="text"
                    value={formData.skPenetapan}
                    onChange={(e) => setFormData({ ...formData, skPenetapan: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Keaktifan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "AKTIF" | "NONAKTIF" })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="NONAKTIF">NONAKTIF</option>
                  </select>
                </div>
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-slate-50/80">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFormModal(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                form="anggotaForm"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                className="font-bold px-4 shadow-md shadow-blue-600/20"
              >
                {isEditing ? "Simpan Perubahan" : "Simpan & Terbitkan Akun"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL KELOLA KREDENSIAL AKUN & KIRIM WA --- */}
      {showCredsModal && selectedAnggotaForCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Kredensial Akun Petugas
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedAnggotaForCreds.namaLengkap} ({selectedAnggotaForCreds.jabatan})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCredsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Credential Details Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Username Login:</span>
                <code className="px-2 py-0.5 rounded bg-white font-mono font-bold text-blue-700 border border-slate-200">
                  {selectedAnggotaForCreds.username}
                </code>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Hak Akses Role:</span>
                <span className="font-bold text-slate-800">{selectedAnggotaForCreds.role}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Penugasan:</span>
                <span className="font-bold text-slate-800">
                  {selectedAnggotaForCreds.assignedTps || "Semua Desa"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Ubah / Set Kata Sandi Baru:
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type={showPassText ? "text" : "password"}
                      value={customNewPass}
                      onChange={(e) => setCustomNewPass(e.target.value)}
                      className="w-full h-8 px-2.5 pr-8 text-xs rounded-lg border border-slate-300 font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Masukkan kata sandi..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassText(!showPassText)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomNewPass(generateAutoPassword())}
                    title="Generate Sandi Acak"
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={isResettingPass}
                    onClick={handleDirectPasswordChange}
                    className="text-xs h-8 px-2.5 font-bold"
                  >
                    Simpan Sandi
                  </Button>
                </div>
              </div>
            </div>

            {/* WhatsApp Ready Message Preview */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Format Pesan WhatsApp Resmi:
              </label>
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 font-mono text-[10px] whitespace-pre-wrap leading-relaxed">
                {getWaInvitationText(selectedAnggotaForCreds, customNewPass)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyCredentials(selectedAnggotaForCreds)}
                className="text-xs font-semibold"
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                Salin Pesan
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSendWhatsApp(selectedAnggotaForCreds, customNewPass)}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Kirim via WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CETAK ID CARD PANITIA P2KD --- */}
      {showIdCardModal && selectedAnggotaForCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Kartu Tanda Pengenal Panitia (ID Card)
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Format Standar P2KD Desa Kalisalak
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIdCardModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Official ID Card Preview */}
            <div className="p-4 rounded-2xl bg-linear-to-br from-slate-900 via-slate-900 to-blue-950 text-white shadow-xl border border-slate-800 space-y-3.5 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-blue-400 font-extrabold">
                    PANITIA PEMILIHAN KEPALA DESA (P2KD)
                  </div>
                  <div className="text-xs font-black tracking-tight text-white">
                    DESA KALISALAK 2027-2035
                  </div>
                </div>
                <Badge variant="primary" className="text-[8px] py-0 font-mono">
                  RESMI
                </Badge>
              </div>

              {/* Card Body */}
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-20 rounded-xl bg-slate-800 border-2 border-blue-400/50 flex flex-col items-center justify-center text-center p-0.5 shrink-0 overflow-hidden shadow-sm">
                  {selectedAnggotaForCard.fotoUrl ? (
                    <img
                      src={selectedAnggotaForCard.fotoUrl}
                      alt={selectedAnggotaForCard.namaLengkap}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        {selectedAnggotaForCard.namaLengkap[0]}
                      </div>
                      <span className="text-[7px] text-slate-400 mt-1 uppercase font-bold">FOTO RESMI</span>
                    </>
                  )}
                </div>

                <div className="space-y-0.5 overflow-hidden">
                  <div className="text-xs font-black text-white truncate">
                    {selectedAnggotaForCard.namaLengkap}
                  </div>
                  <div className="text-[10px] font-bold text-blue-300">
                    {selectedAnggotaForCard.jabatan}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    NIK: {selectedAnggotaForCard.nik}
                  </div>
                  <div className="text-[9px] text-slate-300 font-medium pt-0.5">
                    {selectedAnggotaForCard.seksiLabel}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
                <div>
                  <div>Wilayah: <strong className="text-white">{selectedAnggotaForCard.assignedTps || "Semua Desa"}</strong></div>
                  <div>SK: {selectedAnggotaForCard.skPenetapan}</div>
                </div>
                <div className="p-1 rounded-lg bg-white text-slate-900">
                  <QrCode className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Sah dengan stempel hologram digital P2KD</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.print();
                }}
                className="font-bold shadow-md"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak Kartu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        options={confirmOptions}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};
