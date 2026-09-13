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
} from "lucide-react";
import { MasterPetugasDpt, PetugasStatus } from "@/lib/data-store";
import { downloadPetugasPdf } from "@/lib/petugas-pdf-generator";
import { DAFTAR_RW_KALISALAK } from "@/lib/kalisalak-wilayah";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { Card, Badge, PaginationControl, ConfirmDialog } from "@/components/ui";

interface TabPetugasDptProps {
  isAdmin?: boolean;
  userRole?: string;
  userName?: string;
}

export const TabPetugasDpt: React.FC<TabPetugasDptProps> = ({
  isAdmin = true,
  userRole = "SUPER_ADMIN",
  userName = "Panitia P2KD",
}) => {
  const toast = useToast();
  const { confirm, isOpen: isConfirmOpen, options: confirmOptions, handleConfirm, handleCancel } = useConfirm();
  const [petugasList, setPetugasList] = useState<MasterPetugasDpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [rwFilter, setRwFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selected for Modal
  const [selectedPetugas, setSelectedPetugas] = useState<MasterPetugasDpt | null>(null);
  const [editStatus, setEditStatus] = useState<PetugasStatus>("MENUNGGU_VERIFIKASI");
  const [editCatatan, setEditCatatan] = useState("");
  const [editWilayah, setEditWilayah] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch Petugas List on initial load
  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/petugas-dpt")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          if (json.success && Array.isArray(json.data)) {
            setPetugasList(json.data);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil data petugas:", err);
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
      const res = await fetch("/api/admin/petugas-dpt");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPetugasList(json.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data petugas:", err);
    } finally {
      setLoading(false);
    }
  };

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
      const matchRw = rwFilter === "ALL" || item.rw === rwFilter;

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
  const handleOpenDetail = (p: MasterPetugasDpt) => {
    setSelectedPetugas(p);
    setEditStatus(p.status);
    setEditCatatan(p.catatanPanitia || "");
    setEditWilayah(p.assignedWilayah || `RW ${p.rw}`);
    setFeedbackMsg(null);
  };

  // Close Modal
  const handleCloseDetail = () => {
    setSelectedPetugas(null);
    setFeedbackMsg(null);
  };

  // Save Verification
  const handleSaveVerification = async () => {
    if (!selectedPetugas) return;
    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/admin/petugas-dpt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPetugas.id,
          status: editStatus,
          catatanPanitia: editCatatan.trim(),
          assignedWilayah: editWilayah.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFeedbackMsg({ type: "error", text: json.message || "Gagal menyimpan verifikasi." });
        setIsSaving(false);
        return;
      }

      // Update in local state
      setPetugasList((prev) =>
        prev.map((item) => (item.id === selectedPetugas.id ? json.data : item))
      );
      setSelectedPetugas(json.data);
      setFeedbackMsg({
        type: "success",
        text: `Status berhasil diperbarui menjadi ${json.data.status}. Log audit telah dicatat.`,
      });
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
  const getWhatsAppNotificationUrl = (item: MasterPetugasDpt) => {
    const waClean = item.nomorWa.replace(/\D/g, "");
    const waNumber = waClean.startsWith("0") ? `62${waClean.slice(1)}` : waClean;

    let pesan = "";
    switch (item.status) {
      case "LOLOS":
        pesan = `Halo Sdr/i *${item.namaLengkap}*,\n\nPanitia Pemilihan Kepala Desa (P2KD) Kalisalak 2026/2027 menginformasikan bahwa berkas pendaftaran Petugas Pendataan DPT Anda (No. Reg: *${item.nomorRegistrasi}*) dinyatakan *LOLOS VERIFIKASI ADMINISTRASI*.\n\nCatatan Panitia: ${item.catatanPanitia || "Berkas telah diverifikasi memenuhi syarat."}\nWilayah Penugasan: ${item.assignedWilayah || "RW " + item.rw}\n\nJadwal bimbingan teknis (Bimtek) akan diumumkan segera. Mohon pantau status resmi Anda di:\nhttps://p2kdkalisalak.develzy.my.id/daftarpantarlih\n\nTerima kasih.\n_Panitia P2KD Desa Kalisalak_`;
        break;
      case "DITETAPKAN":
        pesan = `Selamat Sdr/i *${item.namaLengkap}*!\n\nAnda telah resmi *DITETAPKAN* sebagai Petugas Pendataan DPT (Pantarlih) Pilkades Kalisalak 2026/2027 untuk wilayah penugasan: *${item.assignedWilayah || "RW " + item.rw}*.\n\nNo. Registrasi: *${item.nomorRegistrasi}*\nCatatan Panitia: ${item.catatanPanitia || "Selamat bertugas menjaga hak pilih warga."}\n\nSilakan unduh dokumen berkas resmi Anda di:\nhttps://p2kdkalisalak.develzy.my.id/daftarpantarlih\n\n_Panitia P2KD Desa Kalisalak_`;
        break;
      case "PERLU_KLARIFIKASI":
        pesan = `Yth. Sdr/i *${item.namaLengkap}*,\n\nPanitia P2KD Desa Kalisalak mengundang Anda untuk memberikan klarifikasi berkas pendaftaran Petugas Pendataan DPT (No. Reg: *${item.nomorRegistrasi}*).\n\nCatatan Panitia: ${item.catatanPanitia || "Mohon konfirmasi terkait data pendaftaran Anda."}\n\nSilakan segera menghubungi Sekretariat P2KD di Balai Desa Kalisalak.\n\nTerima kasih.\n_Panitia P2KD Desa Kalisalak_`;
        break;
      case "TIDAK_LOLOS":
        pesan = `Yth. Sdr/i *${item.namaLengkap}*,\n\nTerima kasih atas partisipasi Anda dalam pendaftaran Petugas Pendataan DPT Pilkades Kalisalak (No. Reg: *${item.nomorRegistrasi}*). Berdasarkan verifikasi berkas, Anda dinyatakan *belum memenuhi syarat* untuk tahapan kali ini.\n\nCatatan: ${item.catatanPanitia || "-"}\n\nTerima kasih atas kepedulian Anda terhadap suksesnya Pilkades Kalisalak.\n_Panitia P2KD Desa Kalisalak_`;
        break;
      default:
        pesan = `Halo Sdr/i *${item.namaLengkap}*,\n\nBerkas pendaftaran Petugas Pendataan DPT Pilkades Kalisalak Anda (No. Reg: *${item.nomorRegistrasi}*) telah kami terima dan saat ini berstatus: *MENUNGGU VERIFIKASI*.\n\nPantau status pendaftaran secara berkala di:\nhttps://p2kdkalisalak.develzy.my.id/daftarpantarlih\n\nTerima kasih.\n_Panitia P2KD Desa Kalisalak_`;
    }

    return `https://wa.me/${waNumber}?text=${encodeURIComponent(pesan)}`;
  };

  // Export filtered applicants list to CSV (Excel-ready UTF-8)
  const exportToCsv = () => {
    if (filteredList.length === 0) return;

    const headers = [
      "No",
      "No. Registrasi",
      "Nama Lengkap",
      "NIK",
      "Nomor KK",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Jenis Kelamin",
      "Alamat",
      "RT",
      "RW",
      "Desa",
      "Nomor WhatsApp",
      "Status",
      "Wilayah Penugasan",
      "Calon Kades?",
      "Tim Sukses?",
      "Kepentingan Calon?",
      "Catatan Panitia",
      "Tanggal Pendaftaran",
    ];

    const rows = filteredList.map((item, idx) => [
      idx + 1,
      item.nomorRegistrasi,
      `"${item.namaLengkap.replace(/"/g, '""')}"`,
      `'${item.nik}`,
      `'${item.noKk}`,
      `"${item.tempatLahir.replace(/"/g, '""')}"`,
      item.tanggalLahir,
      item.jenisKelamin === "L" ? "Laki-laki" : "Perempuan",
      `"${item.alamat.replace(/"/g, '""')}"`,
      item.rt,
      item.rw,
      "Desa Kalisalak",
      `'${item.nomorWa}`,
      item.status,
      item.assignedWilayah || `RW ${item.rw}`,
      item.isCalonKades ? "Ya" : "Tidak",
      item.isTimSukses ? "Ya" : "Tidak",
      item.isKepentinganCalon ? "Ya" : "Tidak",
      `"${(item.catatanPanitia || "-").replace(/"/g, '""')}"`,
      item.tanggalPendaftaran,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Petugas_DPT_Kalisalak_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
                Perekrutan & Seleksi Pantarlih
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
              onClick={exportToCsv}
              disabled={filteredList.length === 0}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Unduh Rekap Data Petugas (Format Excel / CSV)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Ekspor Data (.csv)</span>
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
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:border-blue-500 transition-all"
          >
            <option value="ALL">Semua Status</option>
            <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
            <option value="PERLU_KLARIFIKASI">Perlu Klarifikasi</option>
            <option value="LOLOS">Lolos Seleksi</option>
            <option value="DITETAPKAN">Ditetapkan</option>
            <option value="TIDAK_LOLOS">Tidak Lolos</option>
          </select>

          {/* RW Filter */}
          <select
            value={rwFilter}
            onChange={(e) => {
              setRwFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:border-blue-500 transition-all"
          >
            <option value="ALL">Semua Wilayah RW</option>
            {DAFTAR_RW_KALISALAK.map((rw) => (
              <option key={rw.value} value={rw.value}>
                {rw.label}
              </option>
            ))}
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
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada data pendaftar yang cocok dengan filter.
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
                        <strong className="text-slate-900 block">{item.namaLengkap}</strong>
                        <span className="font-mono text-[11px] text-slate-400">{item.nik}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-semibold text-slate-800 block">
                          RW {item.rw} / RT {item.rt}
                        </span>
                        <span className="text-[11px] text-slate-500">Desa Kalisalak</span>
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

      {/* DETAIL & VERIFICATION MODAL */}
      {selectedPetugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pemeriksaan Berkas: {selectedPetugas.namaLengkap}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    <span>{selectedPetugas.nomorRegistrasi}</span>
                    <span>•</span>
                    <span>NIK: {selectedPetugas.nik}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm flex-1">
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

              {/* 1. Biodata Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
                  <MapPin className="w-4 h-4" /> 1. Data Biodata & Domisili
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Nama Lengkap</span>
                    <strong className="text-slate-900">{selectedPetugas.namaLengkap}</strong>
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
                      Waktu Registrasi: {selectedPetugas.tanggalPendaftaran}
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
                      onChange={(e) => setEditStatus(e.target.value as PetugasStatus)}
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
                    <input
                      type="text"
                      value={editWilayah}
                      onChange={(e) => setEditWilayah(e.target.value)}
                      placeholder="Contoh: RW 02"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none font-semibold text-slate-800"
                    />
                  </div>

                  {/* Catatan Panitia */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700 text-xs">
                      Catatan / Instruksi Panitia (Dapat dilihat pendaftar saat cek status):
                    </label>
                    <textarea
                      rows={2}
                      value={editCatatan}
                      onChange={(e) => setEditCatatan(e.target.value)}
                      placeholder="Contoh: Berkas telah diverifikasi sah. Silakan hadir Bimtek hari Sabtu pkl 09.00 di Balai Desa."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-xs"
                    />
                  </div>
                </div>
              </div>
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
                  href={getWhatsAppNotificationUrl(selectedPetugas)}
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
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Simpan Keputusan & Log Audit
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
