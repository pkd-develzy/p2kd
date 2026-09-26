"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  UserCheck,
  Users,
  Search,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Download,
  Trash2,
  Phone,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  MapPin,
  PenTool,
  X,
  Check,
  FileSpreadsheet,
  MessageSquare,
  Edit3,
  Save,
  Info,
  Building2,
  Copy,
  Send,
} from "lucide-react";
import { MasterPetugasDpt, PetugasStatus } from "@/lib/data-store";
import { downloadPetugasPdf } from "@/lib/petugas-pdf-generator";
import { DAFTAR_RW_KALISALAK, DAFTAR_RT_KALISALAK, normalizeWilayahCode } from "@/lib/kalisalak-wilayah";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { Card, Badge, PaginationControl, ConfirmDialog } from "@/components/ui";
import * as XLSX from "xlsx";
import {
  getDefaultCatatanPanitia,
  generatePetugasWhatsAppMessage,
  TELEGRAM_GROUP_URL,
  TELEGRAM_PLAYSTORE_URL,
} from "@/lib/petugas-messages";

interface TabPetugasDptProps {
  isAdmin?: boolean;
  userRole?: string;
  userName?: string;
}

// In-memory client cache for instant 0ms tab switching
let globalCachedPetugasList: MasterPetugasDpt[] | null = null;

// Helper to normalize and format RW string to standard 'RW XX'
function formatRwValue(val: string | undefined | null): string {
  if (!val) return "RW 01";
  const digits = val.replace(/\D/g, "");
  if (!digits) return "RW 01";
  const num = parseInt(digits, 10);
  const formatted = num < 10 ? `0${num}` : `${num}`;
  return `RW ${formatted}`;
}

// Helper to extract 2-digit RW code ("01" - "13") from penugasan or domisili
export function getPetugasRwCode(item: MasterPetugasDpt): string {
  if (item.assignedWilayah) {
    const digits = item.assignedWilayah.replace(/\D/g, "");
    if (digits) {
      const num = parseInt(digits, 10);
      return num < 10 ? `0${num}` : `${num}`;
    }
  }
  const digits = (item.rw || "").replace(/\D/g, "");
  if (!digits) return "01";
  const num = parseInt(digits, 10);
  return num < 10 ? `0${num}` : `${num}`;
}

// Helper to read initial cache from memory or localStorage for instant 0ms load
const getInitialPetugasList = (): MasterPetugasDpt[] => {
  if (globalCachedPetugasList && globalCachedPetugasList.length > 0) {
    return globalCachedPetugasList;
  }
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("p2kd_petugas_dpt_cache");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          globalCachedPetugasList = parsed;
          return parsed;
        }
      }
    } catch {}
  }
  return [];
};

export const TabPetugasDpt: React.FC<TabPetugasDptProps> = ({
  isAdmin = true,
  userRole = "SUPER_ADMIN",
  userName = "Panitia P2KD",
}) => {
  const toast = useToast();
  const { confirm, isOpen: isConfirmOpen, options: confirmOptions, handleConfirm, handleCancel } = useConfirm();
  const [petugasList, setPetugasList] = useState<MasterPetugasDpt[]>(getInitialPetugasList);
  const [loading, setLoading] = useState(() => getInitialPetugasList().length === 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [rwFilter, setRwFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selected for Modal & Edit Mode
  const [selectedPetugas, setSelectedPetugas] = useState<MasterPetugasDpt | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState<PetugasStatus>("MENUNGGU_VERIFIKASI");
  const [editCatatan, setEditCatatan] = useState("");
  const [editWilayah, setEditWilayah] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Form Fields
  const [editFormData, setEditFormData] = useState({
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
    assignedWilayah: "RW 01",
    isCalonKades: false,
    keteranganCalonKades: "",
    isTimSukses: false,
    keteranganTimSukses: "",
    isKepentinganCalon: false,
    keteranganKepentingan: "",
  });

  // Format helper for timestamps
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

  // Fetch Petugas List on initial load (with instant cache first, background silent update)
  useEffect(() => {
    let isMounted = true;

    fetch("/api/admin/petugas-dpt")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && Array.isArray(json.data)) {
          globalCachedPetugasList = json.data;
          setPetugasList(json.data);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("p2kd_petugas_dpt_cache", JSON.stringify(json.data));
            } catch {}
          }
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil data petugas:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual refresh handler
  const fetchPetugasList = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/petugas-dpt?refresh=true");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        globalCachedPetugasList = json.data;
        setPetugasList(json.data);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("p2kd_petugas_dpt_cache", JSON.stringify(json.data));
          } catch {}
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data petugas:", err);
    } finally {
      setLoading(false);
    }
  };

  // View mode for RW Coverage Grid: "ALL" | "FILLED" | "EMPTY"
  const [rwViewMode, setRwViewMode] = useState<"ALL" | "FILLED" | "EMPTY">("ALL");

  // RW Coverage Metrics & Breakdown across all 13 RWs
  const rwCoverageData = useMemo(() => {
    return DAFTAR_RW_KALISALAK.map((rwObj) => {
      const rwCode = rwObj.value; // "01" - "13"
      const officers = petugasList.filter((p) => {
        const targetRw = getPetugasRwCode(p);
        return targetRw === rwCode;
      });

      const total = officers.length;
      const ditetapkan = officers.filter((p) => p.status === "DITETAPKAN").length;
      const lolos = officers.filter((p) => p.status === "LOLOS").length;
      const menunggu = officers.filter((p) => p.status === "MENUNGGU_VERIFIKASI").length;
      const klarifikasi = officers.filter((p) => p.status === "PERLU_KLARIFIKASI").length;
      const isFilled = total > 0;

      return {
        rwCode,
        rwLabel: rwObj.label,
        defaultTps: rwObj.defaultTps,
        officers,
        total,
        ditetapkan,
        lolos,
        menunggu,
        klarifikasi,
        isFilled,
      };
    });
  }, [petugasList]);

  const filledRwCount = useMemo(
    () => rwCoverageData.filter((r) => r.isFilled).length,
    [rwCoverageData]
  );
  const emptyRwCount = useMemo(
    () => rwCoverageData.filter((r) => !r.isFilled).length,
    [rwCoverageData]
  );
  const emptyRwList = useMemo(
    () => rwCoverageData.filter((r) => !r.isFilled),
    [rwCoverageData]
  );

  // Filtered List
  const filteredList = useMemo(() => {
    return petugasList.filter((item) => {
      const matchSearch =
        item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nik.includes(searchTerm) ||
        item.nomorRegistrasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomorWa.includes(searchTerm) ||
        item.dusun.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;

      const targetRw = getPetugasRwCode(item);
      const domisiliRw = normalizeWilayahCode(item.rw);
      const matchRw =
        rwFilter === "ALL" ||
        targetRw === rwFilter ||
        domisiliRw === rwFilter;

      return matchSearch && matchStatus && matchRw;
    });
  }, [petugasList, searchTerm, statusFilter, rwFilter]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIdx = (activePage - 1) * pageSize;
  const pagedList = filteredList.slice(startIdx, startIdx + pageSize);

  // Metrics Count
  const metrics = useMemo(() => {
    return {
      total: petugasList.length,
      menunggu: petugasList.filter((p) => p.status === "MENUNGGU_VERIFIKASI").length,
      klarifikasi: petugasList.filter((p) => p.status === "PERLU_KLARIFIKASI").length,
      lolos: petugasList.filter((p) => p.status === "LOLOS").length,
      ditetapkan: petugasList.filter((p) => p.status === "DITETAPKAN").length,
      tidakLolos: petugasList.filter((p) => p.status === "TIDAK_LOLOS").length,
    };
  }, [petugasList]);

  // Open Detail Modal
  const handleOpenDetail = (p: MasterPetugasDpt, startInEdit = false) => {
    const initialWilayah = formatRwValue(p.assignedWilayah || `RW ${p.rw}`);
    setSelectedPetugas(p);
    setIsEditMode(startInEdit);
    setEditStatus(p.status);
    setEditCatatan(p.catatanPanitia || "");
    setEditWilayah(initialWilayah);
    setEditFormData({
      namaLengkap: p.namaLengkap || "",
      nik: p.nik || "",
      noKk: p.noKk || "",
      tempatLahir: p.tempatLahir || "",
      tanggalLahir: p.tanggalLahir || "",
      jenisKelamin: p.jenisKelamin || "L",
      nomorWa: p.nomorWa || "",
      alamat: p.alamat || "",
      rt: p.rt || "01",
      rw: p.rw || "01",
      dusun: p.dusun || "Desa Kalisalak",
      assignedWilayah: initialWilayah,
      isCalonKades: Boolean(p.isCalonKades),
      keteranganCalonKades: p.keteranganCalonKades || "",
      isTimSukses: Boolean(p.isTimSukses),
      keteranganTimSukses: p.keteranganTimSukses || "",
      isKepentinganCalon: Boolean(p.isKepentinganCalon),
      keteranganKepentingan: p.keteranganKepentingan || "",
    });
    setFeedbackMsg(null);
  };

  // Close Modal
  const handleCloseDetail = () => {
    setSelectedPetugas(null);
    setIsEditMode(false);
    setFeedbackMsg(null);
  };

  // Save Verification / Full Edit
  const handleSaveVerification = async () => {
    if (!selectedPetugas) return;
    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      const payload = isEditMode
        ? {
            id: selectedPetugas.id,
            ...editFormData,
            status: editStatus,
            catatanPanitia: editCatatan.trim(),
            assignedWilayah: editFormData.assignedWilayah || editWilayah.trim(),
          }
        : {
            id: selectedPetugas.id,
            status: editStatus,
            catatanPanitia: editCatatan.trim(),
            assignedWilayah: editWilayah.trim(),
          };

      const res = await fetch("/api/admin/petugas-dpt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFeedbackMsg({ type: "error", text: json.message || "Gagal menyimpan data pendaftar." });
        setIsSaving(false);
        return;
      }

      // Update in local state
      setPetugasList((prev) =>
        prev.map((item) => (item.id === selectedPetugas.id ? json.data : item))
      );
      setSelectedPetugas(json.data);
      setIsEditMode(false);

      if (json.account?.isNew) {
        toast.success(
          "Akun Petugas Berhasil Dibuat!",
          `Username: '${json.account.username}' | Sandi: '${json.account.defaultPassword || "p2kd2026"}'. Masuk ke Struktur Anggota P2KD.`
        );
        setFeedbackMsg({
          type: "success",
          text: `Pendaftar ${json.data.namaLengkap} (${json.data.status}) telah otomatis dimasukkan ke Struktur Anggota P2KD & dibuatkan akun portal dengan username '${json.account.username}' (Sandi default: '${json.account.defaultPassword || "p2kd2026"}').`,
        });
      } else if (json.account) {
        toast.success("Berhasil Disimpan", `Data ${json.data.namaLengkap} diperbarui. Akun terhubung: ${json.account.username}`);
        setFeedbackMsg({
          type: "success",
          text: `Data ${json.data.namaLengkap} diperbarui. Terhubung dengan akun Anggota P2KD: '${json.account.username}'.`,
        });
      } else {
        setFeedbackMsg({
          type: "success",
          text: `Data pendaftar ${json.data.namaLengkap} berhasil disimpan ke database.`,
        });
        toast.success("Berhasil Disimpan", `Data ${json.data.namaLengkap} berhasil diperbarui.`);
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Terjadi kesalahan jaringan saat menyimpan data." });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Item
  const handleDelete = async (id: string, name: string) => {
    const approved = await confirm({
      title: "Hapus Pendaftar Petugas?",
      message: `Apakah Anda yakin ingin menghapus data pendaftar: ${name}? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: "Hapus Pendaftar",
      cancelText: "Batal",
      variant: "danger",
    });
    if (!approved) return;

    try {
      const res = await fetch(`/api/admin/petugas-dpt?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setPetugasList((prev) => prev.filter((p) => p.id !== id));
        if (selectedPetugas?.id === id) {
          handleCloseDetail();
        }
        toast.success("Data Dihapus", `Data pendaftar ${name} berhasil dihapus.`);
      } else {
        toast.error("Gagal Menghapus", json.message || "Gagal menghapus data.");
      }
    } catch {
      toast.error("Kesalahan Koneksi", "Terjadi kesalahan koneksi saat menghapus data.");
    }
  };

  // Status Badge UI
  const getStatusBadge = (status: PetugasStatus) => {
    switch (status) {
      case "MENUNGGU_VERIFIKASI":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Menunggu Verifikasi
          </span>
        );
      case "PERLU_KLARIFIKASI":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-900 border border-orange-300">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            Perlu Klarifikasi
          </span>
        );
      case "LOLOS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Lolos Seleksi
          </span>
        );
      case "DITETAPKAN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Ditetapkan
          </span>
        );
      case "TIDAK_LOLOS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            Tidak Lolos
          </span>
        );
      default:
        return <span className="text-xs font-bold text-slate-700">{status}</span>;
    }
  };

  // Generate WhatsApp Notification URL with personalized text
  const getWhatsAppNotificationUrl = (
    item: MasterPetugasDpt,
    customStatus?: PetugasStatus,
    customWilayah?: string,
    customCatatan?: string
  ) => {
    const waClean = item.nomorWa.replace(/\D/g, "");
    const waNumber = waClean.startsWith("0") ? `62${waClean.slice(1)}` : waClean;
    const status = customStatus || item.status;
    const assignedWilayah = customWilayah || item.assignedWilayah || formatRwValue(item.rw);
    const catatanPanitia = customCatatan !== undefined ? customCatatan : item.catatanPanitia;

    const pesan = generatePetugasWhatsAppMessage(status, {
      namaLengkap: item.namaLengkap,
      nomorRegistrasi: item.nomorRegistrasi,
      assignedWilayah,
      catatanPanitia,
    });

    return `https://wa.me/${waNumber}?text=${encodeURIComponent(pesan)}`;
  };

  const getWhatsAppNotificationText = (
    item: MasterPetugasDpt,
    customStatus?: PetugasStatus,
    customWilayah?: string,
    customCatatan?: string
  ) => {
    const status = customStatus || item.status;
    const assignedWilayah = customWilayah || item.assignedWilayah || formatRwValue(item.rw);
    const catatanPanitia = customCatatan !== undefined ? customCatatan : item.catatanPanitia;

    return generatePetugasWhatsAppMessage(status, {
      namaLengkap: item.namaLengkap,
      nomorRegistrasi: item.nomorRegistrasi,
      assignedWilayah,
      catatanPanitia,
    });
  };

  // Export filtered applicants list to Microsoft Excel (.xlsx)
  const exportToExcel = () => {
    if (filteredList.length === 0) {
      toast.error("Tidak Ada Data", "Tidak ada data pendaftar untuk diekspor.");
      return;
    }

    const headers = [
      "NO",
      "NO. REGISTRASI",
      "NAMA LENGKAP",
      "NIK",
      "NOMOR KK",
      "TEMPAT LAHIR",
      "TANGGAL LAHIR",
      "JENIS KELAMIN",
      "ALAMAT LENGKAP",
      "RT",
      "RW",
      "DESA",
      "NOMOR WHATSAPP",
      "STATUS VERIFIKASI",
      "WILAYAH TUGAS",
      "CALON KADES?",
      "TIM SUKSES?",
      "KEPENTINGAN CALON?",
      "CATATAN PANITIA",
      "TANGGAL REGISTRASI",
    ];

    const dataRows = filteredList.map((item, idx) => [
      idx + 1,
      item.nomorRegistrasi,
      item.namaLengkap.toUpperCase(),
      item.nik,
      item.noKk,
      item.tempatLahir,
      item.tanggalLahir,
      item.jenisKelamin === "L" ? "Laki-laki" : "Perempuan",
      item.alamat,
      item.rt,
      item.rw,
      "Desa Kalisalak",
      item.nomorWa,
      item.status,
      item.assignedWilayah || `RW ${item.rw}`,
      item.isCalonKades ? "Ya" : "Tidak",
      item.isTimSukses ? "Ya" : "Tidak",
      item.isKepentinganCalon ? "Ya" : "Tidak",
      item.catatanPanitia || "-",
      formatTanggalWaktu(item.tanggalPendaftaran),
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

    // Format column widths for Excel
    worksheet["!cols"] = [
      { wch: 6 },  // NO
      { wch: 22 }, // NO REGISTRASI
      { wch: 32 }, // NAMA LENGKAP
      { wch: 20 }, // NIK
      { wch: 20 }, // NOMOR KK
      { wch: 18 }, // TEMPAT LAHIR
      { wch: 14 }, // TGL LAHIR
      { wch: 14 }, // JENIS KELAMIN
      { wch: 35 }, // ALAMAT LENGKAP
      { wch: 6 },  // RT
      { wch: 6 },  // RW
      { wch: 16 }, // DESA
      { wch: 18 }, // NO WA
      { wch: 24 }, // STATUS VERIFIKASI
      { wch: 18 }, // WILAYAH TUGAS
      { wch: 14 }, // CALON KADES
      { wch: 14 }, // TIM SUKSES
      { wch: 20 }, // KEPENTINGAN CALON
      { wch: 40 }, // CATATAN PANITIA
      { wch: 22 }, // TANGGAL REGISTRASI
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Petugas Pantarlih");

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Rekap_Petugas_DPT_Kalisalak_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success("Ekspor Excel Berhasil", `Data ${filteredList.length} pendaftar berhasil diekspor ke file '${fileName}'.`);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <Card className="p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-900/60 shadow-lg rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="primary"
                className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border-blue-400/30 px-3 py-0.5 rounded-full"
              >
                Seksi 1: Pendaftaran Pemilih • Rekrutmen Pantarlih
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                • {petugasList.length} Total Pendaftar ({metrics.ditetapkan} Ditetapkan • {metrics.menunggu} Menunggu) • Operator: {userName} ({userRole})
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <UserCheck className="w-6 h-6 text-blue-400" />
              Pendaftaran & Verifikasi Petugas Pendataan DPT
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-normal">
              Rekrutmen resmi Pantarlih/Petugas Coklit Lapangan Pilkades Desa Kalisalak 2026/2027. Verifikasi berkas administrasi dan penetapan petugas pencocokan data pemilih.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={exportToExcel}
              disabled={filteredList.length === 0}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Unduh Rekap Data Petugas (Format Microsoft Excel .xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Ekspor Data (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={fetchPetugasList}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-blue-400 ${loading ? "animate-spin" : ""}`} />
              <span>Muat Ulang</span>
            </button>

            <a
              href="/daftarpantarlih"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Form Publik</span>
            </a>
          </div>
        </div>
      </Card>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card
          onClick={() => { setStatusFilter("ALL"); setCurrentPage(1); }}
          className={`p-4 bg-white border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer rounded-2xl space-y-2 ${
            statusFilter === "ALL" ? "ring-2 ring-blue-500/30 border-blue-400" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{metrics.total}</div>
            <span className="text-[10px] text-slate-500">Seluruh Berkas Masuk</span>
          </div>
        </Card>

        <Card
          onClick={() => { setStatusFilter("MENUNGGU_VERIFIKASI"); setCurrentPage(1); }}
          className={`p-4 bg-white border-amber-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer rounded-2xl space-y-2 ${
            statusFilter === "MENUNGGU_VERIFIKASI" ? "ring-2 ring-amber-500/30 border-amber-400 bg-amber-50/20" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Menunggu</span>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700">{metrics.menunggu}</div>
            <span className="text-[10px] text-amber-600">Perlu Verifikasi</span>
          </div>
        </Card>

        <Card
          onClick={() => { setStatusFilter("PERLU_KLARIFIKASI"); setCurrentPage(1); }}
          className={`p-4 bg-white border-orange-200 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer rounded-2xl space-y-2 ${
            statusFilter === "PERLU_KLARIFIKASI" ? "ring-2 ring-orange-500/30 border-orange-400 bg-orange-50/20" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Klarifikasi</span>
          </div>
          <div>
            <div className="text-2xl font-black text-orange-700">{metrics.klarifikasi}</div>
            <span className="text-[10px] text-orange-600">Indikasi Afiliasi</span>
          </div>
        </Card>

        <Card
          onClick={() => { setStatusFilter("LOLOS"); setCurrentPage(1); }}
          className={`p-4 bg-white border-blue-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer rounded-2xl space-y-2 ${
            statusFilter === "LOLOS" ? "ring-2 ring-blue-500/30 border-blue-400 bg-blue-50/20" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Lolos</span>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-700">{metrics.lolos}</div>
            <span className="text-[10px] text-blue-600">Administrasi Lengkap</span>
          </div>
        </Card>

        <Card
          onClick={() => { setStatusFilter("DITETAPKAN"); setCurrentPage(1); }}
          className={`p-4 bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer rounded-2xl space-y-2 col-span-2 sm:col-span-1 ${
            statusFilter === "DITETAPKAN" ? "ring-2 ring-emerald-500/30 border-emerald-400 bg-emerald-50/20" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Ditetapkan</span>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">{metrics.ditetapkan}</div>
            <span className="text-[10px] text-emerald-600">Siap Bimtek & Tugas</span>
          </div>
        </Card>
      </div>

      {/* Status Keterisian Petugas per Wilayah RW (13 RW Desa Kalisalak) */}
      <Card className="p-5 bg-white border-slate-200 shadow-xs rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                <Building2 className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Status Keterisian Petugas per Wilayah RW
              </h3>
              <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
                13 RW Desa Kalisalak
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Monitoring sebaran cakupan petugas Pantarlih DPT di setiap RW. Klik salah satu kotak RW untuk langsung memfilter daftar pendaftar di bawah.
            </p>
          </div>

          {/* Quick Filter Buttons / Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRwViewMode("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                rwViewMode === "ALL"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              <span>Semua RW</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  rwViewMode === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                13
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRwViewMode("FILLED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                rwViewMode === "FILLED"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sudah Ada Petugas</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  rwViewMode === "FILLED" ? "bg-white/20 text-white" : "bg-emerald-200 text-emerald-800"
                }`}
              >
                {filledRwCount} RW
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRwViewMode("EMPTY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                rwViewMode === "EMPTY"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Belum Ada Petugas</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  rwViewMode === "EMPTY" ? "bg-white/20 text-white" : "bg-rose-200 text-rose-800"
                }`}
              >
                {emptyRwCount} RW
              </span>
            </button>
          </div>
        </div>

        {/* Alert Banner if any RW is empty */}
        {emptyRwCount > 0 && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-rose-200 text-rose-800 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold">Kekurangan Petugas Lapangan: </span>
                <span>
                  Terdapat <strong>{emptyRwCount} Wilayah RW</strong> yang belum memiliki petugas pendataan Pantarlih, yaitu:{" "}
                  <strong className="text-rose-900 bg-rose-100 px-1.5 py-0.5 rounded">
                    {emptyRwList.map((r) => r.rwLabel).join(", ")}
                  </strong>
                  . Panitia dapat segera mengarahkan pendaftar baru atau melakukan penugasan wilayah silang.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setRwViewMode("EMPTY");
                if (emptyRwList.length > 0) {
                  setRwFilter(emptyRwList[0].rwCode);
                  setCurrentPage(1);
                }
              }}
              className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline shrink-0 cursor-pointer self-end sm:self-auto"
            >
              Filter RW Kosong ({emptyRwList.map((r) => r.rwLabel).join(", ")})
            </button>
          </div>
        )}

        {/* 13 RW Interactive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {rwCoverageData
            .filter((rwItem) => {
              if (rwViewMode === "FILLED") return rwItem.isFilled;
              if (rwViewMode === "EMPTY") return !rwItem.isFilled;
              return true;
            })
            .map((rwItem) => {
              const isSelected = rwFilter === rwItem.rwCode;
              return (
                <div
                  key={rwItem.rwCode}
                  onClick={() => {
                    // Toggle selection: if already selected, reset to ALL, else select this RW
                    if (isSelected) {
                      setRwFilter("ALL");
                    } else {
                      setRwFilter(rwItem.rwCode);
                      setCurrentPage(1);
                    }
                  }}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                    isSelected
                      ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/60 shadow-md transform -translate-y-0.5"
                      : rwItem.isFilled
                      ? "bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs"
                      : "bg-rose-50/40 border-rose-200 hover:border-rose-400 hover:bg-rose-50/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block leading-tight">
                        TPS {rwItem.defaultTps}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">
                        {rwItem.rwLabel}
                      </h4>
                    </div>

                    {rwItem.isFilled ? (
                      <span className="p-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0" title="Sudah ada petugas">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded-full bg-rose-100 text-rose-700 shrink-0" title="Belum ada petugas">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="mt-1">
                    {rwItem.isFilled ? (
                      <div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs font-black text-emerald-700">
                            {rwItem.total} Petugas
                          </span>
                          {rwItem.ditetapkan > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                              Ditetapkan
                            </span>
                          )}
                        </div>
                        <p
                          className="text-[10px] text-slate-700 font-semibold uppercase truncate mt-0.5 tracking-tight"
                          title={rwItem.officers.map((o) => o.namaLengkap.toUpperCase()).join(", ")}
                        >
                          {rwItem.officers.map((o) => o.namaLengkap.toUpperCase()).join(", ")}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                          Belum Ada Petugas
                        </span>
                        <p className="text-[9px] text-rose-500 font-medium mt-0.5">
                          0 Pendaftar
                        </p>
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-2 pt-1 border-t border-blue-200 flex items-center justify-between text-[10px] text-blue-700 font-bold">
                      <span>Aktif difilter</span>
                      <span>✕</span>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Selected RW quick filter indicator */}
        {rwFilter !== "ALL" && (
          <div className="flex flex-wrap items-center justify-between bg-blue-50 px-3.5 py-2.5 rounded-xl border border-blue-200 text-xs gap-2">
            <span className="text-blue-900 font-medium">
              Menampilkan filter data untuk: <strong>RW {rwFilter}</strong> ({
                rwCoverageData.find((r) => r.rwCode === rwFilter)?.total || 0
              } Petugas terdaftar
              {rwCoverageData.find((r) => r.rwCode === rwFilter)?.officers?.length ? (
                <>: <strong className="uppercase">{rwCoverageData.find((r) => r.rwCode === rwFilter)?.officers.map((o) => o.namaLengkap.toUpperCase()).join(", ")}</strong></>
              ) : null})
            </span>
            <button
              type="button"
              onClick={() => {
                setRwFilter("ALL");
                setCurrentPage(1);
              }}
              className="text-blue-700 font-bold hover:text-blue-900 underline cursor-pointer"
            >
              Reset Filter Wilayah (Tampilkan Semua)
            </button>
          </div>
        )}
      </Card>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-xs rounded-2xl space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama, NIK, No. Registrasi, atau RW..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
            <option value="PERLU_KLARIFIKASI">Perlu Klarifikasi</option>
            <option value="LOLOS">Lolos Seleksi</option>
            <option value="DITETAPKAN">Ditetapkan</option>
            <option value="TIDAK_LOLOS">Tidak Lolos</option>
          </select>

          {/* RW Filter with live coverage status */}
          <select
            value={rwFilter}
            onChange={(e) => {
              setRwFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">Semua Wilayah RW ({petugasList.length} Pendaftar)</option>
            {DAFTAR_RW_KALISALAK.map((rw) => {
              const cov = rwCoverageData.find((c) => c.rwCode === rw.value);
              const count = cov ? cov.total : 0;
              const statusTxt = count === 0 ? "⚠️ Belum Ada Petugas" : `${count} Petugas`;
              return (
                <option key={rw.value} value={rw.value}>
                  {rw.label} — {statusTxt}
                </option>
              );
            })}
          </select>
        </div>
      </Card>

      {/* Table of Applicants */}
      <Card className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center">No</th>
                <th className="py-3 px-3.5">No. Registrasi</th>
                <th className="py-3 px-3.5">Nama & NIK</th>
                <th className="py-3 px-3.5">Wilayah Tugas</th>
                <th className="py-3 px-3.5">Kontak WhatsApp</th>
                <th className="py-3 px-3.5 text-center">Uji Netralitas</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Memuat data pendaftar petugas DPT...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-800 text-sm">
                        {rwFilter !== "ALL"
                          ? `Belum Ada Petugas Terdaftar di Wilayah RW ${rwFilter}`
                          : "Tidak ada data pendaftar yang cocok dengan filter pencarian."}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {rwFilter !== "ALL"
                          ? `Wilayah RW ${rwFilter} belum memiliki pendaftar atau petugas yang ditugaskan. Panitia dapat membuka form pendaftaran publik atau menugaskan petugas secara silang.`
                          : "Coba sesuaikan kata kunci pencarian atau reset filter status."}
                      </p>
                      {rwFilter !== "ALL" && (
                        <div className="pt-2 flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRwFilter("ALL");
                              setCurrentPage(1);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-all cursor-pointer"
                          >
                            Tampilkan Semua RW
                          </button>
                          <a
                            href="/daftarpantarlih"
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Buka Form Pendaftaran</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pagedList.map((item, idx) => {
                  const hasConflict = item.isCalonKades || item.isTimSukses || item.isKepentinganCalon;
                  const waNumberClean = item.nomorWa.replace(/\D/g, "");
                  const waLink = waNumberClean.startsWith("0")
                    ? `https://wa.me/62${waNumberClean.slice(1)}`
                    : `https://wa.me/${waNumberClean}`;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                        {startIdx + idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-blue-900">
                        {item.nomorRegistrasi}
                      </td>
                      <td className="py-3 px-3.5">
                        <strong className="text-slate-900 block uppercase">{item.namaLengkap}</strong>
                        <span className="font-mono text-[11px] text-slate-400">{item.nik}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        {item.assignedWilayah ? (
                          <>
                            <span className="font-bold text-blue-700 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                              {item.assignedWilayah} (Tugas)
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Domisili: RW {item.rw} / RT {item.rt}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              RW {item.rw} / RT {item.rt}
                            </span>
                            <span className="text-[11px] text-slate-500 block">Desa Kalisalak</span>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-emerald-700 hover:text-emerald-900 font-medium"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {item.nomorWa}
                        </a>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {hasConflict ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Ada Catatan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Netral
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">{getStatusBadge(item.status)}</td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all"
                            title="Periksa Berkas & Verifikasi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item, true)}
                            className="p-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all"
                            title="Koreksi / Edit Data Pendaftar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <a
                            href={getWhatsAppNotificationUrl(item)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all"
                            title="Kirim Notifikasi Status via WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4 text-emerald-600" />
                          </a>

                          <button
                            type="button"
                            onClick={() => downloadPetugasPdf(item, "pernyataan")}
                            className="p-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
                            title="Unduh Surat Pernyataan PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, item.namaLengkap)}
                              className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredList.length > 0 && (
          <div className="p-4 border-t border-slate-100">
            <PaginationControl
              currentPage={activePage}
              totalItems={filteredList.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </Card>

      {/* DETAIL & VERIFICATION / EDIT MODAL */}
      {selectedPetugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isEditMode ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {isEditMode ? <Edit3 className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {isEditMode ? "Edit / Koreksi Data Pendaftar" : "Pemeriksaan Berkas"}:{" "}
                    {selectedPetugas.namaLengkap}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    <span>{selectedPetugas.nomorRegistrasi}</span>
                    <span>•</span>
                    <span>NIK: {isEditMode ? editFormData.nik : selectedPetugas.nik}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                    isEditMode
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  }`}
                  title={isEditMode ? "Beralih ke Tinjauan Berkas" : "Beralih ke Form Edit Data"}
                >
                  {isEditMode ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Mode Tinjauan</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit Data</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm flex-1">
              {/* Feedback alert */}
              {feedbackMsg && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                    feedbackMsg.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  {feedbackMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{feedbackMsg.text}</span>
                </div>
              )}

              {/* ===================== MODE EDIT DATA (ADMIN) ===================== */}
              {isEditMode ? (
                <div className="space-y-5">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Mode Koreksi Data Admin:</strong> Seluruh perubahan data (biodata, kontak, RT/RW, dan jawaban integritas) akan langsung diperbarui ke database Supabase dan tercatat pada audit log panitia.
                    </span>
                  </div>

                  {/* 1. Biodata Kependudukan */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
                      <UserCheck className="w-4 h-4 text-blue-600" /> 1. Data Kependudukan & Biodata
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Nama Lengkap:</label>
                        <input
                          type="text"
                          value={editFormData.namaLengkap}
                          onChange={(e) => setEditFormData({ ...editFormData, namaLengkap: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Nomor WhatsApp:</label>
                        <input
                          type="text"
                          value={editFormData.nomorWa}
                          onChange={(e) => setEditFormData({ ...editFormData, nomorWa: e.target.value.replace(/\D/g, "") })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">NIK (16 Digit):</label>
                        <input
                          type="text"
                          maxLength={16}
                          value={editFormData.nik}
                          onChange={(e) => setEditFormData({ ...editFormData, nik: e.target.value.replace(/\D/g, "") })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Nomor Kartu Keluarga (KK):</label>
                        <input
                          type="text"
                          maxLength={16}
                          value={editFormData.noKk}
                          onChange={(e) => setEditFormData({ ...editFormData, noKk: e.target.value.replace(/\D/g, "") })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Tempat Lahir:</label>
                        <input
                          type="text"
                          value={editFormData.tempatLahir}
                          onChange={(e) => setEditFormData({ ...editFormData, tempatLahir: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Tanggal Lahir:</label>
                        <input
                          type="date"
                          value={editFormData.tanggalLahir}
                          onChange={(e) => setEditFormData({ ...editFormData, tanggalLahir: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Jenis Kelamin:</label>
                        <select
                          value={editFormData.jenisKelamin}
                          onChange={(e) => setEditFormData({ ...editFormData, jenisKelamin: e.target.value as "L" | "P" })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-500 outline-none"
                        >
                          <option value="L">Laki-laki (L)</option>
                          <option value="P">Perempuan (P)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Wilayah Domisili:</label>
                        <input
                          type="text"
                          value={editFormData.dusun}
                          onChange={(e) => setEditFormData({ ...editFormData, dusun: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Alamat Lengkap (Jalan / Gang / RT / RW):</label>
                        <input
                          type="text"
                          value={editFormData.alamat}
                          onChange={(e) => setEditFormData({ ...editFormData, alamat: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Wilayah Domisili Kalisalak */}
                  <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
                      <MapPin className="w-4 h-4 text-blue-600" /> 2. Wilayah Domisili (RW & RT)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Pilihan Rukun Warga (RW):</label>
                        <select
                          value={editFormData.rw}
                          onChange={(e) => {
                            const newRw = e.target.value;
                            setEditFormData({
                              ...editFormData,
                              rw: newRw,
                              assignedWilayah: `RW ${newRw}`,
                            });
                            setEditWilayah(`RW ${newRw}`);
                          }}
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
                        <label className="text-[11px] font-bold text-slate-700">Pilihan Rukun Tetangga (RT):</label>
                        <select
                          value={editFormData.rt}
                          onChange={(e) => setEditFormData({ ...editFormData, rt: e.target.value })}
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

                  {/* 3. Uji Netralitas & Integritas */}
                  <div className="space-y-3 bg-amber-50/40 p-4 rounded-xl border border-amber-200">
                    <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-900">
                      <ShieldCheck className="w-4 h-4 text-amber-600" /> 3. Uji Integritas & Afiliasi Calon
                    </h4>

                    {/* Q1 */}
                    <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.isCalonKades}
                          onChange={(e) => setEditFormData({ ...editFormData, isCalonKades: e.target.checked })}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <span className="font-semibold text-slate-800">Pendaftar adalah Calon Kepala Desa</span>
                      </label>
                      {editFormData.isCalonKades && (
                        <input
                          type="text"
                          value={editFormData.keteranganCalonKades}
                          onChange={(e) => setEditFormData({ ...editFormData, keteranganCalonKades: e.target.value })}
                          placeholder="Keterangan pencalonan..."
                          className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-xs outline-none"
                        />
                      )}
                    </div>

                    {/* Q2 */}
                    <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.isTimSukses}
                          onChange={(e) => setEditFormData({ ...editFormData, isTimSukses: e.target.checked })}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <span className="font-semibold text-slate-800">Pendaftar adalah Tim Sukses / Relawan Calon</span>
                      </label>
                      {editFormData.isTimSukses && (
                        <input
                          type="text"
                          value={editFormData.keteranganTimSukses}
                          onChange={(e) => setEditFormData({ ...editFormData, keteranganTimSukses: e.target.value })}
                          placeholder="Keterangan tim sukses..."
                          className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-xs outline-none"
                        />
                      )}
                    </div>

                    {/* Q3 */}
                    <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.isKepentinganCalon}
                          onChange={(e) => setEditFormData({ ...editFormData, isKepentinganCalon: e.target.checked })}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <span className="font-semibold text-slate-800">Ada Hubungan Keluarga / Kepentingan dengan Calon</span>
                      </label>
                      {editFormData.isKepentinganCalon && (
                        <input
                          type="text"
                          value={editFormData.keteranganKepentingan}
                          onChange={(e) => setEditFormData({ ...editFormData, keteranganKepentingan: e.target.value })}
                          placeholder="Keterangan kepentingan/hubungan..."
                          className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-xs outline-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* 4. Keputusan & Penugasan Panitia */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
                      <FileCheck2 className="w-4 h-4 text-blue-600" /> 4. Keputusan & Penugasan Wilayah Panitia
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Status Pendaftar:</label>
                        <select
                          value={editStatus}
                          onChange={(e) => {
                            const newStatus = e.target.value as PetugasStatus;
                            setEditStatus(newStatus);
                            const currentTargetWilayah = editFormData.assignedWilayah || editWilayah || (selectedPetugas ? `RW ${selectedPetugas.rw}` : "RW 01");
                            setEditCatatan(getDefaultCatatanPanitia(newStatus, currentTargetWilayah));
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:border-blue-500 outline-none"
                        >
                          <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
                          <option value="PERLU_KLARIFIKASI">Perlu Klarifikasi</option>
                          <option value="LOLOS">Lolos Seleksi Administrasi</option>
                          <option value="DITETAPKAN">Ditetapkan Sebagai Petugas</option>
                          <option value="TIDAK_LOLOS">Tidak Lolos</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Penugasan Wilayah Kerja (RW):</label>
                        <select
                          value={formatRwValue(editWilayah)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditWilayah(val);
                            setEditFormData({ ...editFormData, assignedWilayah: val });
                            if (editStatus === "LOLOS" || editStatus === "DITETAPKAN") {
                              setEditCatatan(getDefaultCatatanPanitia(editStatus, val));
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:border-blue-500 outline-none"
                        >
                          {DAFTAR_RW_KALISALAK.map((rw) => (
                            <option key={rw.value} value={`RW ${rw.value}`}>
                              {rw.label} (Wilayah Tabung TPS {rw.defaultTps})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700">Catatan / Instruksi Panitia:</label>
                          <button
                            type="button"
                            onClick={() => {
                              const currentTargetWilayah = editFormData.assignedWilayah || editWilayah || (selectedPetugas ? `RW ${selectedPetugas.rw}` : "RW 01");
                              const note = getDefaultCatatanPanitia(editStatus, currentTargetWilayah);
                              setEditCatatan(note);
                              toast.info("Template Dimuat", "Catatan telah diisi dengan template resmi status ini.");
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                          >
                            Muat Ulang Template Catatan
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={editCatatan}
                          onChange={(e) => setEditCatatan(e.target.value)}
                          placeholder="Catatan resmi panitia untuk pendaftar..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ===================== MODE TINJAUAN BERKAS ===================== */
                <>
                  {/* 1. Biodata Table */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
                      <MapPin className="w-4 h-4" /> 1. Data Biodata & Domisili
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Nama Lengkap</span>
                        <strong className="text-slate-900 uppercase">{selectedPetugas.namaLengkap}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">NIK</span>
                        <span className="font-mono text-slate-900">{selectedPetugas.nik}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Nomor KK</span>
                        <span className="font-mono text-slate-900">{selectedPetugas.noKk}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Tempat, Tgl Lahir</span>
                        <span className="text-slate-900">
                          {selectedPetugas.tempatLahir}, {selectedPetugas.tanggalLahir}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Jenis Kelamin</span>
                        <span className="text-slate-900">
                          {selectedPetugas.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Nomor WhatsApp</span>
                        <span className="font-mono text-slate-900 font-semibold">{selectedPetugas.nomorWa}</span>
                      </div>
                      <div className="col-span-2 sm:col-span-3 pt-1 border-t border-slate-200">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Alamat Lengkap</span>
                        <span className="text-slate-900">
                          {selectedPetugas.alamat}, RT {selectedPetugas.rt} / RW {selectedPetugas.rw}, Desa Kalisalak
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Hasil Skrining Netralitas */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-900">
                      <ShieldCheck className="w-4 h-4 text-amber-600" /> 2. Hasil Uji Netralitas & Potensi Afiliasi
                    </h4>
                    <div className="space-y-2.5 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
                      {/* Q1 */}
                      <div className="p-2 rounded bg-white border border-amber-200/80">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">Calon Kepala Desa?</span>
                          <strong className={selectedPetugas.isCalonKades ? "text-rose-600 font-black" : "text-emerald-700"}>
                            {selectedPetugas.isCalonKades ? "YA" : "TIDAK"}
                          </strong>
                        </div>
                        {selectedPetugas.keteranganCalonKades && (
                          <div className="mt-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded border">
                            <em>Keterangan:</em> {selectedPetugas.keteranganCalonKades}
                          </div>
                        )}
                      </div>

                      {/* Q2 */}
                      <div className="p-2 rounded bg-white border border-amber-200/80">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">Tim Sukses / Relawan Calon?</span>
                          <strong className={selectedPetugas.isTimSukses ? "text-rose-600 font-black" : "text-emerald-700"}>
                            {selectedPetugas.isTimSukses ? "YA" : "TIDAK"}
                          </strong>
                        </div>
                        {selectedPetugas.keteranganTimSukses && (
                          <div className="mt-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded border">
                            <em>Keterangan:</em> {selectedPetugas.keteranganTimSukses}
                          </div>
                        )}
                      </div>

                      {/* Q3 */}
                      <div className="p-2 rounded bg-white border border-amber-200/80">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">Kepentingan / Hubungan dengan Calon?</span>
                          <strong className={selectedPetugas.isKepentinganCalon ? "text-rose-600 font-black" : "text-emerald-700"}>
                            {selectedPetugas.isKepentinganCalon ? "YA" : "TIDAK"}
                          </strong>
                        </div>
                        {selectedPetugas.keteranganKepentingan && (
                          <div className="mt-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded border">
                            <em>Keterangan:</em> {selectedPetugas.keteranganKepentingan}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Tanda Tangan Digital & Pernyataan */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-purple-900">
                      <PenTool className="w-4 h-4 text-purple-600" /> 3. Tanda Tangan Digital & Pernyataan
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-purple-50/40 p-3.5 rounded-xl border border-purple-200">
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-700 block">
                          Status Surat Pernyataan Netralitas:
                        </span>
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-white p-2 rounded-lg border border-purple-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Disetujui 8 Poin Pernyataan
                        </div>
                        <span className="text-[10px] text-slate-400 block pt-1">
                          Waktu Registrasi: {formatTanggalWaktu(selectedPetugas.tanggalPendaftaran)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-700 block">
                          Spesimen Tanda Tangan Layar HP:
                        </span>
                        <div className="bg-white p-2 rounded-lg border border-purple-200 flex items-center justify-center min-h-24">
                          {selectedPetugas.tandaTanganUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={selectedPetugas.tandaTanganUrl}
                              alt="Tanda Tangan Pendaftar"
                              className="max-h-20 max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-slate-400 italic">Tidak ada spesimen tanda tangan</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Form Tindakan Panitia (Verifikasi & Penetapan) */}
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
                      <FileCheck2 className="w-4 h-4 text-blue-600" /> 4. Keputusan & Tindakan Panitia P2KD
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Status Dropdown */}
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 text-xs">
                          Ubah Status Verifikasi:
                        </label>
                        <select
                          value={editStatus}
                          onChange={(e) => {
                            const newStatus = e.target.value as PetugasStatus;
                            setEditStatus(newStatus);
                            const currentTargetWilayah = editWilayah || `RW ${selectedPetugas.rw}`;
                            setEditCatatan(getDefaultCatatanPanitia(newStatus, currentTargetWilayah));
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:border-blue-500 outline-none"
                        >
                          <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
                          <option value="PERLU_KLARIFIKASI">Perlu Klarifikasi</option>
                          <option value="LOLOS">Lolos Seleksi Administrasi</option>
                          <option value="DITETAPKAN">Ditetapkan Sebagai Petugas</option>
                          <option value="TIDAK_LOLOS">Tidak Lolos</option>
                        </select>
                      </div>

                      {/* Wilayah Penugasan */}
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 text-xs">
                          Penugasan Wilayah Kerja (RW):
                        </label>
                        <select
                          value={formatRwValue(editWilayah)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditWilayah(val);
                            if (editStatus === "LOLOS" || editStatus === "DITETAPKAN") {
                              setEditCatatan(getDefaultCatatanPanitia(editStatus, val));
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-blue-500 outline-none font-bold text-slate-800"
                        >
                          {DAFTAR_RW_KALISALAK.map((rw) => (
                            <option key={rw.value} value={`RW ${rw.value}`}>
                              {rw.label} (Wilayah Tabung TPS {rw.defaultTps})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Catatan Panitia */}
                      <div className="space-y-1 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-700 text-xs">
                            Catatan / Instruksi Panitia (Dapat dilihat pendaftar saat cek status):
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const note = getDefaultCatatanPanitia(editStatus, editWilayah || `RW ${selectedPetugas.rw}`);
                              setEditCatatan(note);
                              toast.info("Template Dimuat", "Catatan telah diisi dengan template resmi status ini.");
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                          >
                            Muat Ulang Template Catatan
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={editCatatan}
                          onChange={(e) => setEditCatatan(e.target.value)}
                          placeholder="Catatan resmi panitia untuk pendaftar..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-xs"
                        />
                      </div>
                    </div>

                    {/* Status Info Guidance Box for Selected Status */}
                    {editStatus === "DITETAPKAN" && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <strong className="text-emerald-900 flex items-center gap-1.5 font-bold">
                            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                            Ditetapkan Sebagai Petugas Pantarlih ({formatRwValue(editWilayah)})
                          </strong>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                            Wajib Masuk Telegram
                          </span>
                        </div>
                        <p className="text-emerald-800 leading-relaxed">
                          Pendaftar resmi ditetapkan sebagai Pantarlih. Pesan notifikasi WA dan portal cek status mewajibkan pendaftar bergabung ke Grup Telegram Resmi Petugas untuk Bimtek dan koordinasi.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <a
                            href={TELEGRAM_GROUP_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Buka Grup Telegram</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(TELEGRAM_GROUP_URL);
                              toast.success("Tautan Disalin", "Tautan Grup Telegram berhasil disalin ke clipboard.");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Salin Tautan Grup</span>
                          </button>
                          <a
                            href={TELEGRAM_PLAYSTORE_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Unduh Telegram di Google Play Store"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>Unduh Telegram</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {editStatus === "LOLOS" && (
                      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1">
                        <strong className="text-blue-900 flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          Lolos Seleksi Administrasi — Calon Petugas Wilayah {formatRwValue(editWilayah)}
                        </strong>
                        <p className="text-blue-800 leading-relaxed">
                          Pendaftar dinyatakan memenuhi seluruh syarat administrasi dan surat pernyataan integritas. Diarahkan menunggu jadwal penetapan resmi dan Bimtek.
                        </p>
                      </div>
                    )}

                    {editStatus === "PERLU_KLARIFIKASI" && (
                      <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-xs space-y-1">
                        <strong className="text-orange-900 flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                          Perlu Klarifikasi Berkas & Integritas
                        </strong>
                        <p className="text-orange-800 leading-relaxed">
                          Pendaftar akan menerima instruksi untuk hadir langsung ke Sekretariat P2KD Balai Desa Kalisalak membawa dokumen identitas asli (KTP-el & KK).
                        </p>
                      </div>
                    )}

                    {editStatus === "TIDAK_LOLOS" && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                        <strong className="text-rose-900 flex items-center gap-1.5 font-bold">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          Tidak Lolos (Permohonan Maaf & Apresiasi Profesional)
                        </strong>
                        <p className="text-rose-800 leading-relaxed">
                          Pesan penolakan dirancang santun, profesional, menghargai partisipasi warga, serta menyampaikan permohonan maaf atas keterbatasan kuota wilayah.
                        </p>
                      </div>
                    )}

                    {editStatus === "MENUNGGU_VERIFIKASI" && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                        <strong className="text-amber-900 flex items-center gap-1.5 font-bold">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          Status Menunggu Verifikasi
                        </strong>
                        <p className="text-amber-800 leading-relaxed">
                          Berkas dalam antrean verifikasi administrasi dan uji netralitas oleh Panitia P2KD.
                        </p>
                      </div>
                    )}

                    {/* Preview Live Pesan WhatsApp */}
                    <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          Pratinjau Pesan WhatsApp ({selectedPetugas.nomorWa}):
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const txt = getWhatsAppNotificationText(selectedPetugas, editStatus, editWilayah, editCatatan);
                            navigator.clipboard.writeText(txt);
                            toast.success("Teks Disalin", "Format pesan WhatsApp berhasil disalin ke clipboard.");
                          }}
                          className="text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Salin Teks WA</span>
                        </button>
                      </div>
                      <pre className="text-[11px] font-sans text-slate-700 bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                        {getWhatsAppNotificationText(selectedPetugas, editStatus, editWilayah, editCatatan)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadPetugasPdf(selectedPetugas, "pernyataan")}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF Pernyataan
                </button>

                <button
                  type="button"
                  onClick={() => downloadPetugasPdf(selectedPetugas, "bukti")}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF Bukti
                </button>

                <a
                  href={getWhatsAppNotificationUrl(selectedPetugas, editStatus, editWilayah, editCatatan)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 flex items-center gap-1.5 transition-all"
                  title="Kirim Notifikasi Status via WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Kirim Notifikasi WA
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-all"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={handleSaveVerification}
                  disabled={isSaving}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-md disabled:opacity-50 transition-all ${
                    isEditMode
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : isEditMode ? (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Simpan Perubahan Data
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Simpan Keputusan Panitia
                    </>
                  )}
                </button>
              </div>
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
