"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { useSessionPresence } from "@/hooks/use-session-presence";
import { supabase, supabaseSeksi1, supabaseServer3 } from "@/lib/supabase";
import { EncryptedLocalDb } from "@/lib/encrypted-local-db";
import {
  LocalPemilihRepository,
  LocalTPSRepository,
  LocalAnggotaRepository,
  LocalAduanRepository,
} from "@/lib/local-repositories";
import { SyncEngine, SyncProgress } from "@/lib/sync-engine";
import { ModalSyncProgress } from "./modals/modal-sync-progress";
import { RefreshCw } from "lucide-react";

import {
  Voter,
  Aduan,
  TPSItem,
  AuditLog,
  DbStatus,
  TabType,
  AnggotaP2KD,
  SeksiP2KDType,
} from "./types";
import type { VoterStage } from "@/types/voter-stages";
import { PublicWebConfig, getAnggotaHierarchyRank } from "@/lib/data-store";

import { AdminSidebar } from "./sidebar";
import { AdminHeader } from "./header";

import dynamic from "next/dynamic";

import { TabDashboardOverview } from "./tabs/tab-dashboard-overview";
import { TabMasterPemilih } from "./tabs/tab-master-pemilih";
import { TabCoklitLapangan } from "./tabs/tab-coklit-lapangan";
import { TabMasterTPS } from "./tabs/tab-master-tps";
import { TabAduanWarga } from "./tabs/tab-aduan-warga";
import { TabFinalisasiDPT } from "./tabs/tab-finalisasi-dpt";
import { TabAnggotaP2KD } from "./tabs/tab-anggota-p2kd";
import { TabPengaturanWeb } from "./tabs/tab-pengaturan-web";
import { TabPetugasDpt } from "./tabs/tab-petugas-dpt";
import { TabCalonKades } from "./tabs/tab-calon-kades";
import { TabAkunPetugas } from "./tabs/tab-akun-petugas";

// Code-split heavy modules via next/dynamic to minimize initial bundle footprint
const TabPrintCenter = dynamic(
  () => import("./tabs/tab-print-center").then((m) => m.TabPrintCenter),
  { ssr: false, loading: () => <div className="p-8 text-center text-slate-400 text-sm font-semibold">Memuat Modul Cetak Dokumen...</div> }
);
const TabRekapEkspor = dynamic(
  () => import("./tabs/tab-rekap-ekspor").then((m) => m.TabRekapEkspor),
  { ssr: false, loading: () => <div className="p-8 text-center text-slate-400 text-sm font-semibold">Memuat Rekap Ekspor...</div> }
);
const TabAuditTrail = dynamic(
  () => import("./tabs/tab-audit-trail").then((m) => m.TabAuditTrail),
  { ssr: false, loading: () => <div className="p-8 text-center text-slate-400 text-sm font-semibold">Memuat Audit Trail...</div> }
);
const TabManajemenBerita = dynamic(
  () => import("./tabs/tab-manajemen-berita").then((m) => m.TabManajemenBerita),
  { ssr: false, loading: () => <div className="p-8 text-center text-slate-400 text-sm font-semibold">Memuat Manajemen Berita...</div> }
);
const FloatingQrVerifier = dynamic(
  () => import("./widgets/floating-qr-verifier").then((m) => m.FloatingQrVerifier),
  { ssr: false }
);

import { ModalTms } from "./modals/modal-tms";
import { ModalMutasi } from "./modals/modal-mutasi";
import { ModalTpsForm } from "./modals/modal-tps-form";
import { ModalForceChangePassword } from "./modals/modal-force-change-password";
import { FieldBottomNav } from "./field-bottom-nav";
import { AdminLockScreen } from "@/features/auth/components/admin-lock-screen";
import { performSecureLogout } from "@/features/auth/services/auth-cleanup.service";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/cache-query-client";
import { ModalVoterFormRHF } from "@/features/pemilih/components/modal-voter-form-rhf";
import { VoterFormValues } from "@/features/pemilih/schemas/voter.schema";
import { useDashboardUIStore } from "@/stores/use-dashboard-ui-store";

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [storedUser] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("admin_user_data");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // 1. Strict Session Authentication & RBAC Resolution
  const sessionRole = (storedUser?.role || "").toLowerCase().trim();
  const sessionUsername = (storedUser?.username || "").toLowerCase().trim();
  const roleParam = sessionRole || (searchParams.get("role") || "").toLowerCase().trim();
  const tpsParam = storedUser?.assignedTps || searchParams.get("tps") || "";
  const userParam = sessionUsername || searchParams.get("user") || "";

  const isDeveloperUser =
    sessionUsername === "develzy" ||
    sessionUsername === "developer" ||
    sessionRole === "developer" ||
    storedUser?.role?.toLowerCase() === "developer" ||
    storedUser?.username?.toLowerCase() === "develzy" ||
    storedUser?.username?.toLowerCase() === "developer";
  const isKetuaUser =
    sessionUsername === "admin_kalisalak" ||
    sessionUsername === "khasanudin" ||
    (Boolean(storedUser?.nama) && storedUser.nama.toLowerCase().includes("khasanudin")) ||
    (Boolean(storedUser?.jabatan) && storedUser.jabatan.toLowerCase().includes("ketua p2kd"));

  const isKetuaOrDev = isDeveloperUser || isKetuaUser;

  // Seksi 1: Koordinator Seksi Pendaftaran Pemilih / Koordinator Pantarlih (Universal access across all 13 RW)
  const isSeksiPemilihUser =
    !isKetuaOrDev &&
    (roleParam === "seksi_pemilih" ||
      roleParam === "seksi_1" ||
      roleParam === "seksi 1" ||
      roleParam === "koordinator_pantarlih" ||
      userParam.toLowerCase().includes("pemilih") ||
      userParam.toLowerCase().includes("khulal") ||
      userParam.toLowerCase().includes("lulu") ||
      storedUser?.username?.toLowerCase().includes("khulal") ||
      storedUser?.username?.toLowerCase().includes("lulu") ||
      storedUser?.nama?.toLowerCase().includes("khulal") ||
      storedUser?.nama?.toLowerCase().includes("lu’lu") ||
      storedUser?.nama?.toLowerCase().includes("lu'lu") ||
      storedUser?.nama?.toLowerCase().includes("lulu") ||
      storedUser?.jabatan?.toLowerCase().includes("pendaftaran pemilih") ||
      storedUser?.jabatan?.toLowerCase().includes("koordinator pantarlih") ||
      storedUser?.jabatan?.toLowerCase().includes("seksi 1") ||
      storedUser?.seksi === "SEKSI_PEMILIH" ||
      storedUser?.role === "SEKSI_PEMILIH");

  // Field officer (Pantarlih Lapangan RW 01 - RW 13 ONLY - strictly NOT Seksi 1 Coordinator)
  const isFieldOfficer =
    !isKetuaOrDev &&
    !isSeksiPemilihUser &&
    ((tpsParam !== "" && tpsParam !== "SEMUA") ||
      roleParam === "petugas" ||
      roleParam === "pantarlih" ||
      roleParam === "petugas_tps" ||
      roleParam === "pps" ||
      userParam.toLowerCase().includes("lapangan") ||
      userParam.toLowerCase().includes("pantarlih") ||
      userParam.toLowerCase().startsWith("pps") ||
      storedUser?.role === "PETUGAS_TPS" ||
      storedUser?.seksi === "PANTARLIH_LAPANGAN");

  // ONLY Developer, Ketua, Seksi 1, and Pantarlih are authorized to access voter data
  const canAccessVoterDataUI = isKetuaOrDev || isSeksiPemilihUser || isFieldOfficer;

  // Privileges: Developer, Ketua, and Seksi 1 Koordinator Pantarlih have universal jurisdiction across all 13 RWs
  const canManageAllWilayah = isKetuaOrDev || isSeksiPemilihUser;
  const isSuperAdmin = isKetuaOrDev;
  const isAdmin = isKetuaOrDev;
  const assignedTps = isSeksiPemilihUser ? "SEMUA" : (tpsParam || (isFieldOfficer ? "Tabung Pemilihan 01" : "SEMUA"));
  const currentUser = userParam || (isAdmin ? "admin_kalisalak" : isSeksiPemilihUser ? "khulal" : "petugas");
  const router = useRouter();
  const toast = useToast();
  const { confirm, isOpen: isConfirmOpen, options: confirmOptions, handleConfirm, handleCancel } = useConfirm();

  // Dynamic user profile resolution (Memoized to prevent React Compiler memoization bailouts)
  const resolvedProfile = React.useMemo(() => {
    let role = isKetuaOrDev
      ? "SUPER_ADMIN"
      : isFieldOfficer
      ? "PETUGAS_TPS"
      : roleParam === "sekretaris"
      ? "SEKRETARIS"
      : roleParam === "bendahara"
      ? "BENDAHARA"
      : roleParam.toUpperCase();

    let seksi: SeksiP2KDType = isKetuaOrDev
      ? "PIMPINAN"
      : isFieldOfficer
      ? "PANTARLIH_LAPANGAN"
      : (roleParam.toUpperCase() as SeksiP2KDType);

    let nama = isKetuaOrDev
      ? (storedUser?.nama || "Khasanudin, S.Pd.SD")
      : isFieldOfficer
      ? `Petugas Lapangan (${assignedTps})`
      : (storedUser?.nama || "Panitia P2KD");

    let jabatan = isKetuaOrDev
      ? "Ketua P2KD / Superadmin"
      : isFieldOfficer
      ? `Pantarlih Lapangan (${assignedTps})`
      : "Anggota Tim Seksi P2KD";

    if (isDeveloperUser || userParam.toLowerCase() === "develzy") {
      nama = storedUser?.nama || "Develzy (Developer)";
      jabatan = storedUser?.jabatan || "System Architect & Technical Core Developer";
      role = "DEVELOPER";
      seksi = "PIMPINAN";
    }

    // Specific role mapping
    if (roleParam === "seksi_pemilih" && !isFieldOfficer) {
      role = "SEKSI_PEMILIH";
      seksi = "SEKSI_PEMILIH";
      nama = "M. Lu’lu Khulaludin, S.F.U";
      jabatan = "Koordinator Seksi Pendaftaran Pemilih";
    } else if (roleParam === "seksi_penjaringan") {
      role = "SEKSI_PENJARINGAN";
      seksi = "SEKSI_PENJARINGAN";
      nama = "Hero Budiadi";
      jabatan = "Koordinator Seksi Penjaringan Balon";
    } else if (roleParam === "seksi_penyaringan") {
      role = "SEKSI_PENYARINGAN";
      seksi = "SEKSI_PENYARINGAN";
      nama = "Urip";
      jabatan = "Koordinator Seksi Penyaringan & Seleksi";
    } else if (roleParam === "seksi_pemungutan") {
      role = "SEKSI_PUNGUT_HITUNG";
      seksi = "SEKSI_PUNGUT_HITUNG";
      nama = "Wihadi";
      jabatan = "Koordinator Seksi Pemungutan Suara";
    } else if (roleParam === "seksi_logistik" || roleParam === "seksi_publikasi") {
      role = "SEKSI_LOGISTIK_PUBLIKASI";
      seksi = "SEKSI_LOGISTIK_PUBLIKASI";
      nama = "Mohamad Khumaidi, S.Pd.I";
      jabatan = "Koordinator Seksi Perlengkapan & Publikasi";
    } else if (roleParam === "seksi_keamanan") {
      role = "SEKSI_LOGISTIK_PUBLIKASI";
      seksi = "SEKSI_LOGISTIK_PUBLIKASI";
      nama = "Topik Santoso";
      jabatan = "Koordinator Seksi Keamanan & Ketertiban";
    } else if (roleParam === "sekretaris") {
      role = "SEKRETARIS";
      seksi = "PIMPINAN";
      nama = "Mashady, M.H.";
      jabatan = "Sekretaris P2KD";
    } else if (roleParam === "bendahara") {
      role = "BENDAHARA";
      seksi = "PIMPINAN";
      nama = "Ali Nurhakim, S.Pd";
      jabatan = "Bendahara P2KD";
    }

    return { role, seksi, nama, jabatan };
  }, [isKetuaOrDev, isDeveloperUser, isFieldOfficer, roleParam, userParam, storedUser, assignedTps]);

  const computedUserRole = resolvedProfile.role;
  const computedUserSeksi = resolvedProfile.seksi;

  // Navigation Initial Tab
  const defaultInitialTab: TabType = isFieldOfficer
    ? "coklit"
    : isSeksiPemilihUser
    ? "pemilih"
    : roleParam === "seksi_publikasi" || roleParam === "sekretaris"
    ? "berita"
    : roleParam === "seksi_penjaringan" || roleParam === "seksi_penyaringan"
    ? "calon"
    : "dashboard";

  const isDeveloper =
    isDeveloperUser ||
    userParam.toLowerCase() === "develzy" ||
    userParam.toLowerCase() === "developer" ||
    computedUserRole === "DEVELOPER" ||
    (storedUser?.role || "").toUpperCase() === "DEVELOPER";

  const isDeveloperRef = useRef(isDeveloper);
  useEffect(() => {
    isDeveloperRef.current = isDeveloper;
  }, [isDeveloper]);

  // Aktivasi presence & status online session perangkat di PostgreSQL
  useSessionPresence(currentUser);

  const handleLogoutRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const {
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setSidebarOpen,
    isScannerOpen,
    setScannerOpen,
    searchTerm,
    setSearchTerm,
    selectedTpsFilter,
    setSelectedTpsFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    selectedAduanFilter,
    setSelectedAduanFilter,
    currentCoklitTps,
    setCurrentCoklitTps,
  } = useDashboardUIStore();

  const setIsSidebarOpen = setSidebarOpen;
  const setIsScannerOpen = setScannerOpen;

  const allowedFieldTabs: TabType[] = ["coklit", "pemilih", "dpt", "akun"];
  const voterDataTabs: TabType[] = ["pemilih", "dpt", "coklit", "petugas_dpt", "aduan", "lock", "export"];

  let effectiveActiveTab: TabType = activeTab;
  if (effectiveActiveTab === "audit" && !isDeveloper) {
    effectiveActiveTab = "dashboard";
  } else if (!canAccessVoterDataUI && voterDataTabs.includes(activeTab)) {
    effectiveActiveTab = defaultInitialTab !== "pemilih" && defaultInitialTab !== "coklit" ? defaultInitialTab : "dashboard";
  } else if (isFieldOfficer && !allowedFieldTabs.includes(activeTab)) {
    effectiveActiveTab = "coklit";
  }

  const [isLoading, setIsLoading] = useState(false);

  // Instant Offline / Browser Restart Cache Loader
  const initialCache = React.useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("p2kd_admin_dashboard_cache");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Data States initialized with persistent cache - strictly sanitized if unauthorized!
  // CATATAN KEAMANAN: Data pemilih TIDAK disimpan di localStorage (plain text dilarang).
  // Data pemilih disimpan dan dibaca secara aman dari Encrypted IndexedDB (AES-GCM 256-bit).
  const [voters, setVoters] = useState<Voter[]>([]);
  const [aduanList, setAduanList] = useState<Aduan[]>(() => initialCache?.aduanList || []);
  const [tpsList, setTpsList] = useState<TPSItem[]>(() => initialCache?.tpsList || []);
  const [anggotaList, setAnggotaList] = useState<AnggotaP2KD[]>(() => {
    if (!initialCache?.anggotaList) return [];
    return [...initialCache.anggotaList].sort(
      (a, b) => getAnggotaHierarchyRank(a) - getAnggotaHierarchyRank(b)
    );
  });
  const [petugasCount, setPetugasCount] = useState<number>(() => initialCache?.petugasCount || 0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => initialCache?.auditLogs || []);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(() => initialCache?.dbStatus || null);
  const [webConfig, setWebConfig] = useState<PublicWebConfig | null>(() => initialCache?.webConfig || null);
  const [isDptLocked, setIsDptLocked] = useState<boolean>(() => Boolean(initialCache?.isDptLocked));
  const [lockHashSignature, setLockHashSignature] = useState<string>(() => initialCache?.lockHashSignature || "");
  const [nomorBeritaAcara, setNomorBeritaAcara] = useState<string>(() => initialCache?.nomorBeritaAcara || "");

  // User Security Context & Encrypted Namespace
  const userContext = React.useMemo(() => ({
    username: currentUser,
    role: computedUserRole,
    instansi: "p2kd_kalisalak",
    assignedTps: isFieldOfficer ? assignedTps : undefined,
  }), [currentUser, computedUserRole, isFieldOfficer, assignedTps]);

  const namespace = React.useMemo(() => {
    return EncryptedLocalDb.buildNamespace(userContext);
  }, [userContext]);

  // Initial Full Sync Modal & Progress States
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    stage: "Menghubungkan ke server...",
    detail: "Menyiapkan sistem keamanan & database lokal...",
    current: 0,
    total: 0,
    percent: 0,
    isComplete: false,
  });

  const runFullSync = useCallback(async (isBackground = false) => {
    if (!canAccessVoterDataUI) return;
    if (!isBackground) {
      setIsSyncModalOpen(true);
    }
    setIsBackgroundSyncing(true);

    const success = await SyncEngine.runInitialSync(userContext, (progress) => {
      setSyncProgress(progress);
      // Update in-memory voters progressively as batches download in the background
      if (progress.current > 0) {
        const partialVoters = LocalPemilihRepository.getAll();
        if (partialVoters.length > 0) {
          setVoters(partialVoters);
        }
      }
    });

    setIsBackgroundSyncing(false);

    if (success) {
      const allVoters = LocalPemilihRepository.getAll();
      setVoters(allVoters);
      if (LocalAnggotaRepository.isReady()) {
        setAnggotaList(LocalAnggotaRepository.getAll());
      }
      if (LocalTPSRepository.isReady()) {
        setTpsList(LocalTPSRepository.getAll());
      }
      if (LocalAduanRepository.isReady()) {
        setAduanList(LocalAduanRepository.getAll());
      }

      if (!isBackground) {
        setTimeout(() => {
          setIsSyncModalOpen(false);
        }, 800);
      }
      toast.success(
        "Sinkronisasi Selesai",
        `${allVoters.length.toLocaleString("id-ID")} seluruh data pemilih dan administrasi berhasil diunduh ke latar belakang.`
      );
    }
  }, [canAccessVoterDataUI, userContext, toast]);

  // --- Lock Screen & Quick Unlock State (Keamanan Layar Native) ---
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const isLocked = localStorage.getItem("p2kd_app_locked") === "true";
      if (isLocked) return true;

      const rawActive = localStorage.getItem("p2kd_last_activity");
      const lastActive = rawActive ? Number(rawActive) : 0;

      // Jika baru pertama kali dibuka atau timestamp kosong/invalid, jangan kunci! Inisialisasi waktu sekarang
      if (!lastActive || isNaN(lastActive) || lastActive <= 0) {
        localStorage.setItem("p2kd_last_activity", Date.now().toString());
        return false;
      }

      // Kunci HANYA jika waktu sekarang dikurangi waktu aktivitas terakhir benar-benar >= 30 menit
      if (Date.now() - lastActive >= 30 * 60 * 1000) {
        localStorage.setItem("p2kd_app_locked", "true");
        return true;
      }
      return false;
    }
    return false;
  });
  const handleLockScreen = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("p2kd_app_locked", "true");
    }
    setIsAppLocked(true);
  }, []);

  // --- 30-Minute Inactivity Auto-Lock Security (Proteksi Otomatis Sesi Inaktif) ---
  const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 Menit
  const lastActivityRef = React.useRef<number>(0);

  // Inactivity tracking & periodic check
  useEffect(() => {
    if (typeof window === "undefined") return;

    const now = Date.now();
    lastActivityRef.current = now;

    // Jika dashboard terbuka dalam kondisi TIDAK terkunci,
    // maka mount/reload halaman ini (seperti Ctrl+Shift+R) adalah aktivitas aktif yang sah dari user!
    const isCurrentlyLocked = localStorage.getItem("p2kd_app_locked") === "true";
    if (!isCurrentlyLocked) {
      localStorage.setItem("p2kd_last_activity", now.toString());
    }

    const recordActivity = () => {
      const currentTime = Date.now();
      // Throttle storage write to once every 5 seconds
      if (currentTime - lastActivityRef.current > 5000) {
        lastActivityRef.current = currentTime;
        if (localStorage.getItem("p2kd_app_locked") !== "true") {
          localStorage.setItem("p2kd_last_activity", currentTime.toString());
        }
      }
    };

    const verifyInactivity = () => {
      if (typeof window === "undefined") return;
      if (localStorage.getItem("p2kd_app_locked") === "true") return;

      const raw = localStorage.getItem("p2kd_last_activity");
      const lastActive = raw ? Number(raw) : lastActivityRef.current;

      // Jika data tidak valid atau 0, jangan kunci! Reset ke waktu sekarang
      if (!lastActive || isNaN(lastActive) || lastActive <= 0) {
        localStorage.setItem("p2kd_last_activity", Date.now().toString());
        lastActivityRef.current = Date.now();
        return;
      }

      if (Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
        handleLockScreen();
      }
    };

    // User interaction events to record activity
    const activityEvents = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, recordActivity, { passive: true });
    });

    // Check inactivity periodically every 15 seconds
    const intervalId = window.setInterval(verifyInactivity, 15000);

    // Check immediately when user switches back to this tab / app window
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        verifyInactivity();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    // Simpan timestamp aktivitas sebelum reload / unload jika tidak sedang terkunci
    const handleBeforeUnload = () => {
      if (localStorage.getItem("p2kd_app_locked") !== "true") {
        localStorage.setItem("p2kd_last_activity", Date.now().toString());
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, recordActivity);
      });
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [handleLockScreen, INACTIVITY_TIMEOUT_MS]);

  // --- PWA Native Gesture: Double Back / Double Swipe to Exit ---
  const lastBackPressRef = React.useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Trap back navigation in PWA
    window.history.pushState({ p2kd: "dashboard_root" }, "", window.location.href);

    const handlePopState = () => {
      const now = Date.now();
      if (now - lastBackPressRef.current < 2500) {
        toast.info("Keluar Aplikasi", "Menutup sesi dashboard P2KD...");
        window.history.back();
      } else {
        window.history.pushState({ p2kd: "dashboard_root" }, "", window.location.href);
        lastBackPressRef.current = now;
        toast.warning(
          "Geser / Tekan Sekali Lagi",
          "Geser layar atau tekan kembali sekali lagi untuk keluar dari aplikasi."
        );
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Touch edge-swipe detection
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1 && touchStartX < 40) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
        if (deltaX > 90 && deltaY < 60) {
          const now = Date.now();
          if (now - lastBackPressRef.current < 2500) {
            toast.info("Keluar Aplikasi", "Menutup sesi dashboard P2KD...");
            window.history.back();
          } else {
            lastBackPressRef.current = now;
            toast.warning(
              "Geser Sekali Lagi",
              "Geser layar sekali lagi untuk keluar dari aplikasi."
            );
          }
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [toast]);

  // Instant 0ms RW Filter Switch (Pure Local In-Memory Filtering)
  const handleSelectTpsFilter = useCallback((newTps: string) => {
    setSelectedTpsFilter(newTps);
  }, [setSelectedTpsFilter]);

  // Modal States
  const [showAddVoterModal, setShowAddVoterModal] = useState(false);
  const [showEditVoterModal, setShowEditVoterModal] = useState(false);
  const [showTmsModal, setShowTmsModal] = useState(false);
  const [showMutasiModal, setShowMutasiModal] = useState(false);
  const [showEditTpsModal, setShowEditTpsModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("force_change") === "true") return true;
        const stored = localStorage.getItem("admin_user_data");
        if (stored) {
          const parsed = JSON.parse(stored);
          return Boolean(parsed.mustChangePassword);
        }
      } catch {
        return false;
      }
    }
    return false;
  });
  const [isForcedChangePassword, setIsForcedChangePassword] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("force_change") === "true") return true;
        const stored = localStorage.getItem("admin_user_data");
        if (stored) {
          const parsed = JSON.parse(stored);
          return Boolean(parsed.mustChangePassword);
        }
      } catch {
        return false;
      }
    }
    return false;
  });

  // Active Target for Modals
  const [activeVoter, setActiveVoter] = useState<Voter | null>(null);
  const [selectedVoterId, setSelectedVoterId] = useState<string | null>(null);
  const [activeTps, setActiveTps] = useState<TPSItem | null>(null);

  // Dynamic lookup from loaded database member list
  const dbMatchedMember = anggotaList.find(
    (a) => a.username.toLowerCase() === currentUser.toLowerCase()
  );
  const computedUserName = dbMatchedMember?.namaLengkap || resolvedProfile.nama;
  const computedUserJabatan = dbMatchedMember?.jabatan || resolvedProfile.jabatan;

  // Floating QR Verifier is STRICTLY ONLY for PETUGAS_TPS (PPS / KPPS RW)
  const isPetugasTpsOnly =
    !isAdmin &&
    !isSuperAdmin &&
    userParam.toLowerCase() !== "develzy" &&
    (computedUserRole === "PETUGAS_TPS" ||
      dbMatchedMember?.role === "PETUGAS_TPS" ||
      userParam.toLowerCase().startsWith("pps") ||
      roleParam.toLowerCase() === "petugas_tps" ||
      roleParam.toLowerCase() === "pps");

  // Fetch dashboard metadata manually when triggered
  const fetchData = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token")
          : null;
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const safeJson = async (res: Response) => {
        if (!res.ok) return { success: false };
        try {
          return await res.json();
        } catch {
          return { success: false };
        }
      };

      const [
        resAduan,
        resTps,
        resAudit,
        resDb,
        resAnggota,
        resConfig,
      ] = await Promise.all([
        fetch("/api/admin/aduan", { cache: "no-store", headers: authHeaders }),
        fetch("/api/admin/tps", { cache: "no-store", headers: authHeaders }),
        fetch("/api/admin/audit", { cache: "no-store", headers: authHeaders }),
        fetch("/api/admin/db-status", { cache: "no-store", headers: authHeaders }),
        fetch("/api/admin/anggota?refresh=true", { cache: "no-store", headers: authHeaders }),
        fetch("/api/config", { cache: "no-store" }),
      ]);

      const [
        dataAduan,
        dataTps,
        dataAudit,
        dataDb,
        dataAnggota,
        dataConfig,
      ] = await Promise.all([
        safeJson(resAduan),
        safeJson(resTps),
        safeJson(resAudit),
        safeJson(resDb),
        safeJson(resAnggota),
        safeJson(resConfig),
      ]);

      if (dataConfig.success && dataConfig.data) {
        setWebConfig(dataConfig.data);
      }

      const isCompletelyUnauthorized =
        !token ||
        (resAduan.status === 401 && resTps.status === 401 && resAnggota.status === 401);

      if (isCompletelyUnauthorized) {
        toast.error("Sesi Berakhir", "Sesi autentikasi Anda telah berakhir. Silakan masuk kembali.");
        router.push("/admin");
        return;
      }

      // Selalu prioritaskan pembacaan data pemilih dari Local Repositories terenkripsi
      if (canAccessVoterDataUI) {
        if (LocalPemilihRepository.isReady()) {
          setVoters(LocalPemilihRepository.getAll());
        }
      } else {
        setVoters([]);
      }

      if (dataAduan.success && Array.isArray(dataAduan.data)) {
        setAduanList(dataAduan.data);
        void LocalAduanRepository.setAll(dataAduan.data, namespace);
      }
      if (dataTps.success && Array.isArray(dataTps.data)) {
        setTpsList(dataTps.data);
        void LocalTPSRepository.setAll(dataTps.data, namespace);
      }
      if (dataAudit.success) setAuditLogs(dataAudit.data);
      if (dataAnggota.success && Array.isArray(dataAnggota.data)) {
        const sorted = [...dataAnggota.data].sort(
          (a, b) => getAnggotaHierarchyRank(a) - getAnggotaHierarchyRank(b)
        );
        setAnggotaList(sorted);
        void LocalAnggotaRepository.setAll(sorted, namespace);
      }
      if (dataDb.success && dataDb.data) {
        setDbStatus(dataDb.data);
        const resolvedPetugasCount =
          dataDb.data.cloudStats?.petugasCount ??
          dataDb.data.localStats?.totalPetugas;
        if (typeof resolvedPetugasCount === "number") {
          setPetugasCount(resolvedPetugasCount);
        }
        if (dataDb.data.tahapan) {
          setIsDptLocked(dataDb.data.tahapan.isDptLocked);
          if (dataDb.data.tahapan.lockHashSignature) {
            setLockHashSignature(dataDb.data.tahapan.lockHashSignature);
          }
          if (dataDb.data.tahapan.nomorBeritaAcara) {
            setNomorBeritaAcara(dataDb.data.tahapan.nomorBeritaAcara);
          }
        }
      }
    } catch {
      // Handled gracefully
    } finally {
      setIsLoading(false);
    }
  }, [
    canAccessVoterDataUI,
    router,
    toast,
    namespace,
    setVoters,
    setAduanList,
    setTpsList,
    setAuditLogs,
    setAnggotaList,
    setDbStatus,
    setIsDptLocked,
    setLockHashSignature,
    setNomorBeritaAcara,
    setIsLoading,
  ]);

  const handleNavigateTab = useCallback(
    (tab: TabType) => {
      if (tab === "audit" && !isDeveloper) {
        toast.error(
          "Akses Ditolak",
          "Log Aktivitas dan Audit Trail hanya dapat diakses oleh Developer Sistem."
        );
        return;
      }
      const voterTabs: TabType[] = ["pemilih", "dpt", "coklit", "petugas_dpt", "aduan", "lock", "export"];
      if (!canAccessVoterDataUI && voterTabs.includes(tab)) {
        toast.error(
          "Akses Ditolak",
          "Data kependudukan dan pemilih hanya dapat diakses oleh Developer, Ketua P2KD, Seksi 1, dan Petugas Pantarlih wilayah binaan."
        );
        return;
      }
      setActiveTab(tab);
    },
    [canAccessVoterDataUI, isDeveloper, toast, setActiveTab]
  );

  // 1. Initial Load: Prioritas baca dari Encrypted Local DB (0ms), jika kosong lakukan Full Initial Sync
  useEffect(() => {
    let isCancelled = false;
    const initializeLocalData = async () => {
      if (!canAccessVoterDataUI) {
        await fetchData();
        return;
      }

      try {
        const localCount = await LocalPemilihRepository.loadFromLocalDb(namespace);
        if (!isCancelled && localCount > 0) {
          // Data lokal terenkripsi ditemukan! Muat langsung ke memori (0ms)
          setVoters(LocalPemilihRepository.getAll());
          await fetchData();

          // Jalankan background incremental sync secara senyap (hanya record yang berubah)
          void SyncEngine.runIncrementalSync(userContext).then((hasChanges) => {
            if (hasChanges && !isCancelled) {
              setVoters(LocalPemilihRepository.getAll());
            }
          });
          return;
        }
      } catch (err) {
        console.warn("Gagal memuat dari EncryptedLocalDb:", err);
      }

      // Jika belum ada data lokal (login pertama kali), wajib memblokir layar dengan modal popup progres besar!
      // Latar belakang hanya ketika data sudah diunduh seluruhnya!
      if (!isCancelled) {
        await fetchData();
        void runFullSync(false); // isBackground = false: BLOCKING MODAL BESAR!
      }
    };

    void initializeLocalData();
    return () => {
      isCancelled = true;
    };
  }, [canAccessVoterDataUI, namespace, userContext, fetchData, runFullSync]);

  // 2. Realtime Background Sync (Supabase Realtime Channel + Smart Visibility-Aware Fallback Polling)
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handleRemoteChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (canAccessVoterDataUI) {
          void SyncEngine.runIncrementalSync(userContext).then((hasChanges) => {
            if (hasChanges) {
              setVoters(LocalPemilihRepository.getAll());
            }
          });
        }
        void fetchData();
      }, 1500);
    };

    // A. Supabase Realtime Postgres Changes Channel (All 3 isolated servers)
    const channelMain = supabase
      .channel("admin-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public" }, handleRemoteChange)
      .subscribe();

    const channelSeksi1 = supabaseSeksi1
      .channel("admin-seksi1-realtime")
      .on("postgres_changes", { event: "*", schema: "public" }, handleRemoteChange)
      .subscribe();

    const channelServer3 = supabaseServer3
      .channel("admin-server3-realtime")
      .on("postgres_changes", { event: "*", schema: "public" }, handleRemoteChange)
      .subscribe();

    // B. Dedicated Instant Realtime Stream for Audit Logs on Server 3 (0ms Delay - Developer Only Stream)
    const channelAuditInstant = supabaseServer3
      .channel("admin-audit-instant-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        (payload) => {
          interface AuditLogRow {
            id: string;
            created_at?: string;
            user_name?: string;
            role?: string;
            aksi?: string;
            entity?: string;
            target?: string;
            detail?: string;
            ip_address?: string;
          }
          const row = payload.new as unknown as AuditLogRow;
          if (!row || !row.id) return;
          const newLog: AuditLog = {
            id: row.id,
            waktu:
              new Date(row.created_at || Date.now()).toLocaleString("id-ID", {
                timeZone: "Asia/Jakarta",
                day: "numeric",
                month: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              }).replace(/\./g, ":") + " WIB",
            user: row.user_name || "Sistem",
            role: row.role || "SYSTEM",
            aksi: row.aksi || "UNKNOWN",
            entity: row.entity || "SISTEM",
            target: row.target || "",
            detail: row.detail || "",
            ipAddress: row.ip_address || "127.0.0.1",
            device: "Workstation Terminal",
            browser: "Live WebSocket Stream",
            userAgent: "P2KD-Realtime/1.0",
            signature: `SIG-${row.id.substring(0, 8)}`,
            kategori: row.entity || "SISTEM",
            severity: row.aksi?.includes("DELETE") ? "CRITICAL" : row.aksi?.includes("UPDATE") ? "WARNING" : "INFO",
          };
          setAuditLogs((prev) => {
            if (prev.some((l) => l.id === newLog.id)) return prev;
            return [newLog, ...prev];
          });

          // Invalidate active session immediately across all devices if global revocation event received
          if (row.aksi === "REVOKE_ALL_SESSIONS") {
            if (!isDeveloperRef.current) {
              toast.error(
                "Sesi Berakhir",
                "Sesi login Anda telah dicabut oleh Developer Pusat. Mengalihkan..."
              );
              setTimeout(() => {
                if (handleLogoutRef.current) {
                  void handleLogoutRef.current();
                } else {
                  router.replace("/admin?revoked=1");
                }
              }, 1200);
            }
          }
        }
      )
      .subscribe();

    // C. Smart Fallback Polling (Every 180s, ONLY when tab is active/visible)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        handleRemoteChange();
      }
    }, 180000);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      clearInterval(interval);
      supabase.removeChannel(channelMain);
      supabaseSeksi1.removeChannel(channelSeksi1);
      supabaseServer3.removeChannel(channelServer3);
      supabaseServer3.removeChannel(channelAuditInstant);
    };
  }, [canAccessVoterDataUI, userContext, fetchData, toast, router]);

  // Dedicated fast 10s auto-refresh polling when viewing Audit Trail (Ensures 100% Realtime WIB updates)
  useEffect(() => {
    if (effectiveActiveTab !== "audit" || !isDeveloper) return;

    const pollAudit = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        try {
          const token = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token");
          const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await fetch("/api/admin/audit", { cache: "no-store", headers: authHeaders });
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setAuditLogs(json.data);
          }
        } catch {
          // Handled gracefully in background
        }
      }
    };

    const auditPollInterval = setInterval(pollAudit, 10000);
    return () => clearInterval(auditPollInterval);
  }, [effectiveActiveTab, isDeveloper]);

  // 3. Auto-persist Non-Sensitive Dashboard Data to LocalStorage (Instant 0ms on Browser Restart / Refresh)
  // PERHATIAN: Data pemilih SENSITIF TIDAK disimpan di localStorage (menggunakan IndexedDB terenkripsi).
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "p2kd_admin_dashboard_cache",
          JSON.stringify({
            aduanList: canAccessVoterDataUI ? aduanList : [],
            tpsList,
            anggotaList,
            auditLogs: isAdmin ? auditLogs : [],
            dbStatus,
            webConfig,
            isDptLocked,
            lockHashSignature,
            nomorBeritaAcara,
            savedAt: Date.now(),
          })
        );
      } catch (err) {
        console.warn("Gagal menyimpan cache offline:", err);
      }
    }
  }, [
    canAccessVoterDataUI,
    isAdmin,
    aduanList,
    tpsList,
    anggotaList,
    auditLogs,
    dbStatus,
    webConfig,
    isDptLocked,
    lockHashSignature,
    nomorBeritaAcara,
  ]);

  // 4. Multi-Tab Session Broadcast Listener (Instant Cross-Tab Logout)
  useEffect(() => {
    const unsub = EncryptedLocalDb.onLogoutBroadcast(() => {
      LocalPemilihRepository.clear();
      LocalTPSRepository.clear();
      LocalAnggotaRepository.clear();
      LocalAduanRepository.clear();
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user_data");
        localStorage.removeItem("p2kd_admin_dashboard_cache");
        localStorage.removeItem("p2kd_petugas_dpt_cache");
        localStorage.removeItem("p2kd_calon_kades_cache");
        localStorage.removeItem("p2kd_berita_cache");
        sessionStorage.removeItem("admin_token");
      }
      toast.info("Sesi Berakhir", "Sesi telah keluar dari tab lain.");
      router.replace("/admin");
    });
    return unsub;
  }, [router, toast]);

  // Logout Handler: Menggunakan auth cleanup service yang menjamin penghapusan cache terenkripsi & kunci
  const handleLogout = async () => {
    await performSecureLogout();
    toast.info("Sesi Berakhir", "Anda telah keluar dari Portal Petugas.");
    router.replace("/admin");
  };

  useEffect(() => {
    handleLogoutRef.current = handleLogout;
  });

  // --- CRUD HANDLERS (OPTIMISTIC & ASYNCHRONOUS BACKGROUND SYNC) ---
  const handleSaveNewVoter = (values: VoterFormValues) => {
    const tempId = `temp_${Date.now()}`;
    const maskedNik = `${values.nik.slice(0, 1)}*************${values.nik.slice(-2)}`;
    const maskedKk = values.kk ? `${values.kk.slice(0, 1)}*************${values.kk.slice(-2)}` : "";

    const optimisticVoter: Voter = {
      id: tempId,
      nik: values.nik,
      nikMasked: maskedNik,
      kk: values.kk || "",
      kkMasked: maskedKk,
      namaLengkap: values.namaLengkap.trim().toUpperCase(),
      tempatLahir: values.tempatLahir.trim().toUpperCase(),
      tanggalLahir: values.tanggalLahir,
      jenisKelamin: values.jenisKelamin,
      statusPerkawinan: values.statusPerkawinan,
      alamat: values.alamat.trim().toUpperCase(),
      rt: values.rt || "01",
      rw: values.rw || "01",
      desa: "Kalisalak",
      kecamatan: "Margasari",
      tps: values.tps || `TPS ${values.rw || "01"}`,
      statusAktif: values.statusAktif || "AKTIF",
      alasanTms: values.alasanTms || "",
      tahap: (values.tahap as "CALON_DPS" | "DPS" | "DPSHP" | "DPT" | "DPTB") || "CALON_DPS",
      updatedAt: new Date().toISOString(),
    };

    // 1. Instant optimistic state & cache update (< 1ms)
    void LocalPemilihRepository.upsert(optimisticVoter, namespace);
    setVoters(LocalPemilihRepository.getAll());

    // 2. Immediately close modal & provide instant feedback
    setShowAddVoterModal(false);
    toast.success("Pemilih Ditambahkan", `Data ${values.namaLengkap} berhasil diproses.`);

    // 3. Asynchronous background execution (zero UI delay)
    void (async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token")
            : null;
        const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch("/api/admin/pemilih", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ ...values, user: currentUser }),
        });
        const result = await res.json();
        if (result.success && result.data?.id) {
          const realId = result.data.id;
          const finalizedVoter = { ...optimisticVoter, id: realId };
          void LocalPemilihRepository.delete(tempId, namespace);
          void LocalPemilihRepository.upsert(finalizedVoter, namespace);
          setVoters(LocalPemilihRepository.getAll());
        } else if (!result.success) {
          void LocalPemilihRepository.delete(tempId, namespace);
          setVoters(LocalPemilihRepository.getAll());
          toast.error("Gagal Menyimpan di Server", result.message || "Data dibatalkan.");
        }
      } catch (err) {
        console.error("Background save voter error:", err);
      }
    })();
  };

  const handleOpenEditVoter = (v: Voter) => {
    setSelectedVoterId(v.id);
    setActiveVoter(v);
    setShowEditVoterModal(true);
  };

  const handleCloseVoterModal = () => {
    setShowAddVoterModal(false);
    setShowEditVoterModal(false);
    setSelectedVoterId(null);
    setActiveVoter(null);
  };

  const handleSaveEditVoter = (values: VoterFormValues) => {
    const targetId = selectedVoterId || activeVoter?.id;
    if (!targetId || !activeVoter) return;

    const previousVoter = activeVoter;
    const updatedVoter: Voter = {
      ...activeVoter,
      id: targetId,
      nik: values.nik,
      kk: values.kk || "",
      namaLengkap: values.namaLengkap.trim().toUpperCase(),
      tempatLahir: values.tempatLahir.trim().toUpperCase(),
      tanggalLahir: values.tanggalLahir,
      jenisKelamin: values.jenisKelamin,
      statusPerkawinan: values.statusPerkawinan,
      alamat: values.alamat.trim().toUpperCase(),
      rt: values.rt,
      rw: values.rw,
      tps: values.tps,
      statusAktif: values.statusAktif || "AKTIF",
      alasanTms: values.alasanTms || "",
      updatedAt: new Date().toISOString(),
    };

    // 1. Instant local state & repository update (< 1ms)
    void LocalPemilihRepository.upsert(updatedVoter, namespace);
    setVoters(LocalPemilihRepository.getAll());

    // 2. Optimistically update TanStack Query cache for this specific record
    queryClient.setQueryData(queryKeys.pemilihDetail(targetId), updatedVoter);

    // 3. Immediately close modal & reset active selection
    handleCloseVoterModal();
    toast.success("Data Diperbarui", `Perubahan data ${values.namaLengkap} berhasil disimpan.`);

    // 4. Asynchronous background execution (zero UI delay)
    void (async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token")
            : null;
        const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`/api/admin/pemilih/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            ...values,
            user: currentUser,
            alasan: "Koreksi Data Manual Petugas",
          }),
        });
        const result = await res.json();
        if (!result.success) {
          void LocalPemilihRepository.upsert(previousVoter, namespace);
          setVoters(LocalPemilihRepository.getAll());
          queryClient.setQueryData(queryKeys.pemilihDetail(targetId), previousVoter);
          toast.error("Gagal Update di Server", result.message || "Data dikembalikan.");
        } else {
          // Revalidate cache for this specific voter and lists
          queryClient.invalidateQueries({ queryKey: queryKeys.pemilihDetail(targetId) });
          queryClient.invalidateQueries({
            predicate: (query) => query.queryKey.includes("pemilih"),
          });
        }
      } catch (err) {
        console.error("Background edit voter error:", err);
      }
    })();
  };

  const handleOpenTms = (v: Voter) => {
    setActiveVoter(v);
    setShowTmsModal(true);
  };

  const handleConfirmTms = (alasan: string, catatan: string) => {
    if (!activeVoter) return;
    const targetId = activeVoter.id;
    const voterName = activeVoter.namaLengkap;

    const updatedVoter: Voter = {
      ...activeVoter,
      statusAktif: "TMS",
      alasanTms: alasan,
      coklitStatus: "TMS",
      coklitCatatan: catatan,
    };

    // 1. Instant optimistic state & repository update (< 1ms)
    void LocalPemilihRepository.upsert(updatedVoter, namespace);
    setVoters(LocalPemilihRepository.getAll());

    // 2. Immediately close modal & show feedback
    setShowTmsModal(false);
    toast.warning("Status Diubah Menjadi TMS", `${voterName} ditandai TMS (${alasan}).`);

    // 3. Asynchronous background execution
    void (async () => {
      try {
        const queryParam = catatan ? `&catatan=${encodeURIComponent(catatan)}` : "";
        const res = await fetch(
          `/api/admin/pemilih/${targetId}?mode=tms&alasan=${encodeURIComponent(alasan)}&user=${encodeURIComponent(currentUser)}${queryParam}`,
          { method: "DELETE" }
        );
        const result = await res.json();
        if (!result.success) {
          void LocalPemilihRepository.upsert(activeVoter, namespace);
          setVoters(LocalPemilihRepository.getAll());
          toast.error("Gagal di Server", "Tidak dapat memproses status TMS.");
        }
      } catch (err) {
        console.error("Background TMS error:", err);
      }
    })();
  };

  const handleOpenMutasi = (v: Voter) => {
    setActiveVoter(v);
    setShowMutasiModal(true);
  };

  const handleConfirmMutasi = (tpsBaru: string, rtBaru: string, rwBaru: string) => {
    if (!activeVoter) return;
    const targetId = activeVoter.id;
    const voterName = activeVoter.namaLengkap;

    const updatedVoter: Voter = {
      ...activeVoter,
      tps: tpsBaru,
      rt: rtBaru,
      rw: rwBaru,
    };

    // 1. Instant optimistic state & repository update (< 1ms)
    void LocalPemilihRepository.upsert(updatedVoter, namespace);
    setVoters(LocalPemilihRepository.getAll());

    // 2. Immediately close modal & show feedback
    setShowMutasiModal(false);
    toast.success("Mutasi Berhasil", `${voterName} dipindahkan ke ${tpsBaru}.`);

    // 3. Asynchronous background execution
    void (async () => {
      try {
        const res = await fetch(`/api/admin/pemilih/${targetId}/mutasi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tpsBaru, rtBaru, rwBaru, user: currentUser }),
        });
        const result = await res.json();
        if (!result.success) {
          void LocalPemilihRepository.upsert(activeVoter, namespace);
          setVoters(LocalPemilihRepository.getAll());
          toast.error("Gagal Mutasi di Server", "Tidak dapat memproses mutasi Tabung.");
        }
      } catch (err) {
        console.error("Background mutasi error:", err);
      }
    })();
  };

  const handleDeleteVoter = async (v: Voter) => {
    const approved = await confirm({
      title: `Hapus Pemilih ${v.namaLengkap}?`,
      message: `Apakah Anda yakin ingin menghapus data pemilih NIK ${v.nikMasked} secara permanen dari master data? Aksi ini akan dicatat dalam audit trail.`,
      confirmText: "Hapus Permanen",
      cancelText: "Batal",
      variant: "danger",
    });

    if (approved) {
      // 1. Instant optimistic state & repository update (< 1ms)
      void LocalPemilihRepository.delete(v.id, namespace);
      setVoters(LocalPemilihRepository.getAll());
      toast.success("Data Dihapus", `${v.namaLengkap} telah dihapus.`);

      // 2. Asynchronous background execution
      void (async () => {
        try {
          const res = await fetch(`/api/admin/pemilih/${v.id}?user=${encodeURIComponent(currentUser)}`, {
            method: "DELETE",
          });
          const result = await res.json();
          if (!result.success) {
            void LocalPemilihRepository.upsert(v, namespace);
            setVoters(LocalPemilihRepository.getAll());
            toast.error("Gagal Hapus di Server", "Tidak dapat menghapus data.");
          }
        } catch (err) {
          console.error("Background delete voter error:", err);
        }
      })();
    }
  };

  // --- PROMOSI / ROLLBACK PEMILIH SESUAI ALUR TAHAPAN RESMI ---
  const handlePromoteToDpt = (ids: string[], explicitTarget?: VoterStage) => {
    if (!ids || ids.length === 0) return;
    const allLocal = LocalPemilihRepository.getAll();
    const targetVoters = allLocal.filter((v) => ids.includes(v.id));
    if (targetVoters.length === 0) return;

    // Tentukan target tahap secara valid sesuai aturan
    const firstStage = targetVoters[0].tahap || "CALON_DPS";
    let targetTahap: VoterStage = explicitTarget || "DPS";

    if (!explicitTarget) {
      if (firstStage === "CALON_DPS") {
        targetTahap = "DPS";
      } else if (firstStage === "DPS") {
        targetTahap = "DPSHP";
      } else if (firstStage === "DPSHP") {
        targetTahap = "DPT";
      }
    }

    const updatedList = targetVoters.map((v) => ({ ...v, tahap: targetTahap }));
    void LocalPemilihRepository.upsertBatch(updatedList, namespace);
    setVoters(LocalPemilihRepository.getAll());

    toast.success(`Transisi ke ${targetTahap}`, `${ids.length} pemilih berhasil diajukan ke tahap ${targetTahap}.`);

    // Asynchronous background sync via stage-transition API
    void (async () => {
      try {
        const res = await fetch("/api/admin/pemilih/stage-transition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids,
            targetTahap,
            alasan: `Penetapan status ${targetTahap} melalui konsol admin`,
          }),
        });
        const result = await res.json();
        if (!result.success) {
          toast.error("Gagal Transisi Tahap di Server", result.message || "Tidak dapat memindahkan data di server.");
          // Revert optimistic update
          void LocalPemilihRepository.upsertBatch(targetVoters, namespace);
          setVoters(LocalPemilihRepository.getAll());
        }
      } catch (err) {
        console.error("Background promote error:", err);
      }
    })();
  };

  const handleRollbackToDps = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const allLocal = LocalPemilihRepository.getAll();
    const targetVoters = allLocal.filter((v) => ids.includes(v.id));
    if (targetVoters.length === 0) return;

    const firstStage = targetVoters[0].tahap || "DPT";
    let targetTahap: VoterStage = "DPSHP";

    if (firstStage === "DPT") {
      targetTahap = "DPSHP";
    } else if (firstStage === "DPSHP") {
      targetTahap = "DPS";
    } else if (firstStage === "DPS") {
      targetTahap = "CALON_DPS";
    }

    const updatedList = targetVoters.map((v) => ({ ...v, tahap: targetTahap }));
    void LocalPemilihRepository.upsertBatch(updatedList, namespace);
    setVoters(LocalPemilihRepository.getAll());

    toast.warning(`Rollback ke ${targetTahap}`, `${ids.length} pemilih dikembalikan ke ${targetTahap}.`);

    // Asynchronous background sync via stage-transition API
    void (async () => {
      try {
        const res = await fetch("/api/admin/pemilih/stage-transition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids,
            targetTahap,
            alasan: `Rollback status ke ${targetTahap} melalui konsol admin`,
          }),
        });
        const result = await res.json();
        if (!result.success) {
          toast.error("Gagal Rollback di Server", result.message || "Tidak dapat mengembalikan data.");
          // Revert optimistic update
          void LocalPemilihRepository.upsertBatch(targetVoters, namespace);
          setVoters(LocalPemilihRepository.getAll());
        }
      } catch (err) {
        console.error("Background rollback error:", err);
      }
    })();
  };

  // --- ADUAN RESOLUTION (INSTANT OPTIMISTIC UI & BACKGROUND SYNC) ---
  const handleApproveAduan = (a: Aduan) => {
    const targetKey = a.id || a.nomorAduan;
    // 1. Instant Optimistic UI Update (< 1ms)
    setAduanList((prev) =>
      prev.map((item) =>
        item.id === targetKey || item.nomorAduan === a.nomorAduan
          ? {
              ...item,
              status: "DISETUJUI",
              catatanPetugas: "Disetujui oleh Petugas P2KD & Data Master Terkait Telah Diperbarui.",
              tanggalDisetujui: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
            }
          : item
      )
    );
    toast.success("Aduan Disetujui", `Tiket ${a.nomorAduan} disetujui & data diselaraskan.`);

    // 2. Asynchronous background sync
    void (async () => {
      try {
        const res = await fetch("/api/admin/aduan", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: targetKey,
            status: "DISETUJUI",
            catatan: "Disetujui oleh Petugas P2KD & Data Master Terkait Telah Diperbarui.",
            user: currentUser,
            autoUpdateMaster: true,
          }),
        });
        const result = await res.json();
        if (!result.success) {
          toast.error("Gagal", result.message || "Tidak dapat memproses aduan di server.");
        }
      } catch (err) {
        console.error("Background approve aduan error:", err);
      }
    })();
  };

  const handleRejectAduan = (a: Aduan) => {
    const targetKey = a.id || a.nomorAduan;
    // 1. Instant Optimistic UI Update (< 1ms)
    setAduanList((prev) =>
      prev.map((item) =>
        item.id === targetKey || item.nomorAduan === a.nomorAduan
          ? {
              ...item,
              status: "DITOLAK",
              catatanPetugas: "Data atau bukti pendukung tidak memenuhi syarat administrasi.",
            }
          : item
      )
    );
    toast.warning("Aduan Ditolak", `Tiket ${a.nomorAduan} telah ditolak.`);

    // 2. Asynchronous background sync
    void (async () => {
      try {
        const res = await fetch("/api/admin/aduan", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: targetKey,
            status: "DITOLAK",
            catatan: "Data atau bukti pendukung tidak memenuhi syarat administrasi.",
            user: currentUser,
            autoUpdateMaster: false,
          }),
        });
        const result = await res.json();
        if (!result.success) {
          toast.error("Gagal", result.message || "Tidak dapat memproses penolakan aduan di server.");
        }
      } catch (err) {
        console.error("Background reject aduan error:", err);
      }
    })();
  };

  const handleDeleteAduan = (a: Aduan) => {
    const targetKey = a.id || a.nomorAduan;
    // 1. Instant Optimistic UI Update (< 1ms)
    setAduanList((prev) =>
      prev.filter((item) => item.id !== targetKey && item.nomorAduan !== a.nomorAduan)
    );
    toast.success("Laporan Dihapus", `Laporan aduan ${a.nomorAduan} berhasil dihapus.`);

    // 2. Asynchronous background sync
    void (async () => {
      try {
        const res = await fetch(`/api/admin/aduan?id=${encodeURIComponent(targetKey)}`, {
          method: "DELETE",
        });
        const result = await res.json();
        if (!result.success) {
          toast.error("Gagal Menghapus", result.message || "Tidak dapat menghapus aduan di server.");
        }
      } catch (err) {
        console.error("Background delete aduan error:", err);
      }
    })();
  };

  // --- COKLIT HANDLER (INSTANT FEEDBACK & BACKGROUND SYNC) ---
  const handleUpdateCoklitStatus = (
    voterId: string,
    status: "SESUAI" | "UBAH_DATA" | "TMS" | "BELUM_COKLIT",
    catatan?: string
  ) => {
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Instant Optimistic state & repository update (< 1ms)
    const target = LocalPemilihRepository.getAll().find((v) => v.id === voterId);
    if (target) {
      const updatedTarget: Voter = {
        ...target,
        coklitStatus: status,
        coklitTanggal: status === "BELUM_COKLIT" ? undefined : todayStr,
        coklitCatatan: catatan,
        coklitPetugas: status === "BELUM_COKLIT" ? undefined : currentUser,
        statusAktif: status === "TMS" ? "TMS" : "AKTIF",
        alasanTms: status === "TMS" ? catatan || "Dinyatakan TMS saat Coklit Lapangan" : undefined,
        tahap: status === "SESUAI" || status === "UBAH_DATA" ? "DPT" : target.tahap,
      };
      void LocalPemilihRepository.upsert(updatedTarget, namespace);
      setVoters(LocalPemilihRepository.getAll());
    }

    // 2. Immediate user feedback (0ms wait)
    toast.success("Coklit Tercatat", "Status berhasil diperbarui.");

    // 3. Asynchronous background execution
    void (async () => {
      try {
        const res = await fetch("/api/admin/coklit", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            voterId,
            status,
            catatan,
            user: currentUser,
          }),
        });
        const result = await res.json();
        if (!result.success) {
          toast.error("Gagal Sinkronisasi Coklit", result.message);
        }
      } catch (err) {
        console.error("Background coklit sync error:", err);
      }
    })();
  };

  // --- DPT LOCK ---
  const handleLockDpt = async () => {
    if (isDptLocked) {
      toast.warning("DPT Sudah Terkunci", "DPT final telah berstatus terkunci.");
      return;
    }

    const approved = await confirm({
      title: "Konfirmasi Penguncian DPT Pilkades Final",
      message: `PERINGATAN: Aksi ini akan mengesahkan Berita Acara Pleno DPT Pilkades Kalisalak (${voters.filter((v) => v.statusAktif === "AKTIF").length} Pemilih Aktif). Seluruh data akan dikunci dengan Segel Kriptografi SHA-256.`,
      confirmText: "Kunci DPT Sekarang",
      cancelText: "Batal",
      variant: "danger",
    });

    if (approved) {
      try {
        const res = await fetch("/api/admin/dpt/lock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "LOCK",
            nomorBeritaAcara,
            user: currentUser,
          }),
        });
        const result = await res.json();
        if (result.success) {
          setIsDptLocked(true);
          setLockHashSignature(result.data.lockHashSignature);
          toast.success(
            "DPT Berhasil Dikunci Secara Permanen",
            "Berita Acara Pleno DPT Pilkades Kalisalak telah disegel secara kriptografis."
          );
          fetchData();
        }
      } catch {
        toast.error("Gagal", "Tidak dapat mengunci DPT.");
      }
    }
  };

  const handleUnlockDpt = async () => {
    const approved = await confirm({
      title: "Buka Kunci DPT (Darurat)",
      message: "PERINGATAN: Membuka kunci DPT hanya diizinkan untuk perbaikan darurat keputusan pleno dan akan dicatat dalam audit trail resmi. Lanjutkan?",
      confirmText: "Buka Kunci DPT",
      cancelText: "Batal",
      variant: "danger",
    });

    if (approved) {
      try {
        const res = await fetch("/api/admin/dpt/lock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "UNLOCK",
            alasan: "Perbaikan darurat hasil pleno",
            user: currentUser,
          }),
        });
        const result = await res.json();
        if (result.success) {
          setIsDptLocked(false);
          toast.warning("DPT Dibuka Kembali", "Status DPT kembali ke mode DRAFT untuk perbaikan.");
          fetchData();
        }
      } catch {
        toast.error("Gagal", "Tidak dapat membuka kunci DPT.");
      }
    }
  };

  const handleDeleteTps = async (tps: TPSItem) => {
    const namaLabel = (tps.namaTabung || tps.namaTps).replace(/TPS/gi, "Tabung");
    const approved = await confirm({
      title: `Hapus ${namaLabel}?`,
      message: `Apakah Anda yakin ingin menghapus ${namaLabel} (${tps.lokasi})? Tindakan ini hanya diizinkan jika tidak ada pemilih aktif yang terdaftar pada Tabung ini.`,
      confirmText: "Hapus Tabung",
      cancelText: "Batal",
      variant: "danger",
    });

    if (approved) {
      // 1. Instant optimistic removal (< 1ms)
      setTpsList((prev) => prev.filter((item) => item.id !== tps.id));
      toast.success("Tabung Dihapus", `${namaLabel} berhasil dihapus.`);

      // 2. Asynchronous background deletion
      void (async () => {
        try {
          const res = await fetch(`/api/admin/tps?id=${tps.id}&user=${encodeURIComponent(currentUser)}`, {
            method: "DELETE",
          });
          const result = await res.json();
          if (!result.success) {
            toast.error("Gagal Menghapus Tabung di Server", result.message?.replace(/TPS/gi, "Tabung"));
            fetchData();
          }
        } catch {
          // Handled gracefully in background
        }
      })();
    }
  };

  const handleDeleteAnggota = useCallback(
    async (agt: AnggotaP2KD): Promise<boolean> => {
      // 1. Instant Optimistic UI Update (0ms) - completely eliminates any buffering / reappearing
      const previousList = anggotaList;
      const filtered = anggotaList.filter((a) => a.id !== agt.id);
      setAnggotaList(filtered);

      // 2. Instant Local Storage & Encrypted IndexedDB removal
      void LocalAnggotaRepository.delete(agt.id, namespace);
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("p2kd_admin_dashboard_cache");
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.anggotaList = filtered;
            localStorage.setItem("p2kd_admin_dashboard_cache", JSON.stringify(parsed));
          }
        } catch {}
      }

      // 3. Background delete to server database
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token")
            : null;
        const res = await fetch(
          `/api/admin/anggota?id=${encodeURIComponent(agt.id)}&user=${encodeURIComponent(currentUser)}`,
          {
            method: "DELETE",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        const json = await res.json();
        if (!json.success) {
          // Rollback if server rejected
          setAnggotaList(previousList);
          void LocalAnggotaRepository.setAll(previousList, namespace);
          toast.error("Gagal Menghapus", json.message || "Gagal menghapus data di server.");
          return false;
        }
        toast.success("Anggota Dihapus", json.message || `Akun ${agt.namaLengkap} berhasil dihapus.`);
        return true;
      } catch {
        setAnggotaList(previousList);
        void LocalAnggotaRepository.setAll(previousList, namespace);
        toast.error("Kesalahan Jaringan", "Gagal menghubungi server database.");
        return false;
      }
    },
    [anggotaList, namespace, currentUser, toast]
  );

  // --- STATS COMPUTATION ---
  const totalAktif = voters.filter((v) => v.statusAktif === "AKTIF").length;
  const totalAduanMenunggu = aduanList.filter((a) => a.status === "MENUNGGU").length;

  return (
    <div className="min-h-screen flex bg-slate-100/90 text-slate-900 w-full max-w-full overflow-x-clip">
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        options={confirmOptions}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* 1. Professional Admin Sidebar (Non-Field Officers Only: Field Officers use Native Bottom Bar) */}
      {!isFieldOfficer && (
        <AdminSidebar
          activeTab={effectiveActiveTab}
          setActiveTab={handleNavigateTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          voterCount={
            dbStatus?.cloudStats?.pemilihCount ??
            dbStatus?.localStats?.totalDps ??
            dbStatus?.localStats?.totalPemilih ??
            voters.length
          }
          dptCount={dbStatus?.localStats?.totalDpt ?? 0}
          tpsCount={dbStatus?.localStats?.totalTps ?? tpsList.length}
          aduanPendingCount={dbStatus?.localStats?.totalAduan ?? totalAduanMenunggu ?? 0}
          isDptLocked={isDptLocked}
          auditCount={dbStatus?.localStats?.totalAudit ?? auditLogs.length}
          anggotaCount={dbStatus?.cloudStats?.anggotaCount ?? dbStatus?.localStats?.totalAnggota ?? anggotaList.length}
          petugasCount={dbStatus?.cloudStats?.petugasCount ?? dbStatus?.localStats?.totalPetugas ?? petugasCount ?? 0}
          dbStatus={dbStatus}
          isAdmin={isAdmin}
          isDeveloper={isDeveloper}
          userRole={computedUserRole}
          userSeksi={computedUserSeksi}
          userName={computedUserName}
          userJabatan={computedUserJabatan}
          assignedTps={assignedTps}
          onLogout={handleLogout}
          onLockScreen={handleLockScreen}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-clip ${isFieldOfficer ? "lg:pl-0" : "lg:pl-72"}`}>
        {/* 2. Top Header */}
        <AdminHeader
          activeTab={effectiveActiveTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onRefresh={() => fetchData()}
          isLoading={isLoading}
          dbStatus={dbStatus}
          isAdmin={isAdmin}
          isFieldOfficer={isFieldOfficer}
          assignedTps={assignedTps}
          isDptLocked={isDptLocked}
          userName={computedUserName}
          userFoto={dbMatchedMember?.fotoUrl}
          onOpenChangePassword={() => {
            setIsForcedChangePassword(false);
            setShowChangePasswordModal(true);
          }}
        />

        {/* 3. Main Dashboard Body */}
        <main className={`flex-1 max-w-7xl w-full min-w-0 mx-auto px-3 sm:px-4 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6 ${isFieldOfficer ? "pb-40 sm:pb-48" : "pb-12 sm:pb-16"}`}>
          {/* Active Tab Views */}
          {effectiveActiveTab === "dashboard" && (
            <TabDashboardOverview
              voters={voters}
              tpsList={tpsList}
              aduanList={aduanList}
              petugasDptCount={petugasCount}
              isDptLocked={isDptLocked}
              onNavigateTab={handleNavigateTab}
              currentUser={{
                namaLengkap: computedUserName,
                role: computedUserRole,
                jabatan: computedUserJabatan,
              }}
              dbStatus={dbStatus}
              webConfig={webConfig}
            />
          )}

          {effectiveActiveTab === "petugas_dpt" && canAccessVoterDataUI && (
            <TabPetugasDpt
              isAdmin={canManageAllWilayah}
              userRole={computedUserRole}
              userName={computedUserName}
            />
          )}

          {effectiveActiveTab === "anggota" && (
            <TabAnggotaP2KD
              anggotaList={anggotaList}
              tpsList={tpsList}
              isAdmin={isAdmin}
              userRole={computedUserRole}
              userSeksi={computedUserSeksi}
              currentUser={currentUser}
              onRefresh={() => fetchData()}
              onDeleteAnggota={handleDeleteAnggota}
              isDeveloper={isDeveloper}
            />
          )}

          {effectiveActiveTab === "coklit" && canAccessVoterDataUI && (
            <TabCoklitLapangan
              voters={voters}
              tpsList={tpsList}
              currentTps={currentCoklitTps}
              setCurrentTps={(tps) => {
                setCurrentCoklitTps(tps);
                handleSelectTpsFilter(tps);
              }}
              isAdmin={canManageAllWilayah}
              onUpdateCoklitStatus={handleUpdateCoklitStatus}
              onOpenEditVoter={handleOpenEditVoter}
              onOpenAddVoter={() => {
                setActiveVoter(null);
                setSelectedVoterId(null);
                setShowAddVoterModal(true);
              }}
              onOpenTms={handleOpenTms}
            />
          )}

          {effectiveActiveTab === "pemilih" && canAccessVoterDataUI && (
            <TabMasterPemilih
              mode="DPS"
              voters={voters}
              tpsList={tpsList}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedTpsFilter={selectedTpsFilter}
              setSelectedTpsFilter={handleSelectTpsFilter}
              selectedStatusFilter={selectedStatusFilter}
              setSelectedStatusFilter={setSelectedStatusFilter}
              isAdmin={canManageAllWilayah}
              assignedTps={assignedTps}
              dbStatus={dbStatus}
              onOpenAddVoter={() => {
                setActiveVoter(null);
                setSelectedVoterId(null);
                setShowAddVoterModal(true);
              }}
              onOpenEditVoter={handleOpenEditVoter}
              onOpenMutasi={handleOpenMutasi}
              onOpenTms={handleOpenTms}
              onDeleteVoter={handleDeleteVoter}
              onPromoteToDpt={handlePromoteToDpt}
            />
          )}

          {effectiveActiveTab === "dpt" && canAccessVoterDataUI && (
            <TabMasterPemilih
              mode="DPT"
              voters={voters}
              tpsList={tpsList}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedTpsFilter={selectedTpsFilter}
              setSelectedTpsFilter={handleSelectTpsFilter}
              selectedStatusFilter={selectedStatusFilter}
              setSelectedStatusFilter={setSelectedStatusFilter}
              isAdmin={canManageAllWilayah}
              assignedTps={assignedTps}
              dbStatus={dbStatus}
              onOpenAddVoter={() => {
                setActiveVoter(null);
                setSelectedVoterId(null);
                setShowAddVoterModal(true);
              }}
              onOpenEditVoter={handleOpenEditVoter}
              onOpenMutasi={handleOpenMutasi}
              onOpenTms={handleOpenTms}
              onDeleteVoter={handleDeleteVoter}
              onRollbackToDps={handleRollbackToDps}
            />
          )}



          {effectiveActiveTab === "tps" && (
            <TabMasterTPS
              tpsList={tpsList}
              voters={voters}
              dbStatus={dbStatus}
              onOpenAddTps={() => {
                const nextNum = String(tpsList.length + 1).padStart(2, "0");
                setActiveTps({
                  id: "",
                  kodeTps: `TABUNG-${nextNum}`,
                  nomorTps: nextNum,
                  namaTps: `Wilayah RW ${nextNum}`,
                  namaTabung: `Tabung RW ${nextNum}`,
                  lokasi: "Lapangan Desa Kalisalak",
                  alamat: "Desa Kalisalak, Kec. Margasari, Kab. Tegal",
                  rt: "RT 01, RT 02, RT 03",
                  rw: nextNum,
                  kuotaMaksimal: 850,
                  status: "AKTIF",
                });
                setShowEditTpsModal(true);
              }}
              onOpenEditTps={(t) => {
                setActiveTps(t);
                setShowEditTpsModal(true);
              }}
              onDeleteTps={handleDeleteTps}
            />
          )}

          {effectiveActiveTab === "aduan" && canAccessVoterDataUI && (
            <TabAduanWarga
              aduanList={aduanList}
              selectedAduanFilter={selectedAduanFilter}
              setSelectedAduanFilter={setSelectedAduanFilter}
              onApproveAduan={handleApproveAduan}
              onRejectAduan={handleRejectAduan}
              onDeleteAduan={handleDeleteAduan}
            />
          )}

          {effectiveActiveTab === "print" && (
            <TabPrintCenter
              voters={voters}
              tpsList={tpsList}
              nomorBeritaAcara={nomorBeritaAcara}
              isDptLocked={isDptLocked}
              lockHashSignature={lockHashSignature}
              isAdmin={canManageAllWilayah}
              assignedTps={assignedTps}
              anggotaList={anggotaList}
            />
          )}

          {effectiveActiveTab === "lock" && canAccessVoterDataUI && (
            <TabFinalisasiDPT
              isDptLocked={isDptLocked}
              lockHashSignature={lockHashSignature}
              nomorBeritaAcara={nomorBeritaAcara}
              setNomorBeritaAcara={setNomorBeritaAcara}
              totalAktif={totalAktif}
              voters={voters}
              tpsList={tpsList}
              dbStatus={dbStatus}
              onLockDpt={handleLockDpt}
              onUnlockDpt={handleUnlockDpt}
              onNavigatePrint={() => setActiveTab("print")}
            />
          )}

          {effectiveActiveTab === "export" && canAccessVoterDataUI && (
            <TabRekapEkspor tpsList={tpsList} voters={voters} dbStatus={dbStatus} />
          )}

          {effectiveActiveTab === "audit" && isDeveloper && (
            <TabAuditTrail
              auditLogs={auditLogs}
              onRefresh={fetchData}
              isLoading={isLoading}
            />
          )}

          {effectiveActiveTab === "pengaturan_web" && (
            <TabPengaturanWeb
              currentUser={{ namaLengkap: computedUserName, role: computedUserRole }}
              onConfigSaved={(updated) => setWebConfig(updated)}
            />
          )}

          {effectiveActiveTab === "calon" && (
            <TabCalonKades
              isAdmin={isAdmin}
              userRole={computedUserRole}
              userSeksi={computedUserSeksi}
              currentUser={computedUserName}
              onRefresh={fetchData}
            />
          )}

          {effectiveActiveTab === "berita" && (
            <TabManajemenBerita
              currentUser={computedUserName}
              isSekretaris={roleParam === "sekretaris" || userParam.toLowerCase().includes("sekretaris")}
              isSeksiPublikasi={roleParam === "seksi_publikasi" || roleParam === "seksi_logistik" || computedUserSeksi === "SEKSI_LOGISTIK_PUBLIKASI"}
              isAdmin={isAdmin}
            />
          )}

          {effectiveActiveTab === "akun" && (
            <TabAkunPetugas
              userName={computedUserName}
              userRole={computedUserRole}
              userSeksi={computedUserSeksi}
              userJabatan={computedUserJabatan}
              assignedTps={assignedTps}
              anggotaList={anggotaList}
              onLogout={handleLogout}
              onRefresh={() => fetchData()}
            />
          )}
        </main>
      </div>

      {/* --- MODALS --- */}
      <ModalVoterFormRHF
        key={showEditVoterModal ? `edit-${selectedVoterId}` : "add-voter"}
        isOpen={showAddVoterModal || showEditVoterModal}
        isEdit={showEditVoterModal}
        selectedId={showEditVoterModal ? selectedVoterId : null}
        initialValues={
          showEditVoterModal && activeVoter
            ? {
                nik: activeVoter.nik,
                kk: activeVoter.kk || "",
                namaLengkap: activeVoter.namaLengkap,
                tempatLahir: activeVoter.tempatLahir,
                tanggalLahir: activeVoter.tanggalLahir,
                jenisKelamin: activeVoter.jenisKelamin,
                statusPerkawinan: activeVoter.statusPerkawinan,
                alamat: activeVoter.alamat,
                rt: activeVoter.rt || "01",
                rw: activeVoter.rw || "01",
                tps: activeVoter.tps,
                statusAktif: activeVoter.statusAktif === "TMS" ? "TMS" : "AKTIF",
                alasanTms: activeVoter.alasanTms || "",
              }
            : undefined
        }
        tpsList={tpsList}
        isFieldOfficer={isFieldOfficer}
        officerAssignedTps={assignedTps}
        onClose={handleCloseVoterModal}
        onSubmit={showAddVoterModal ? handleSaveNewVoter : handleSaveEditVoter}
      />

      <ModalTms
        isOpen={showTmsModal}
        activeVoter={activeVoter}
        onClose={() => setShowTmsModal(false)}
        onConfirmTms={handleConfirmTms}
      />

      <ModalMutasi
        isOpen={showMutasiModal}
        activeVoter={activeVoter}
        tpsList={tpsList}
        onClose={() => setShowMutasiModal(false)}
        onConfirmMutasi={handleConfirmMutasi}
      />

      <ModalTpsForm
        isOpen={showEditTpsModal}
        activeTps={activeTps}
        setActiveTps={setActiveTps}
        onClose={() => setShowEditTpsModal(false)}
        onSubmit={async (e: React.FormEvent) => {
          e.preventDefault();
          if (!activeTps) return;
          try {
            const isNew = !activeTps.id;
            const url = "/api/admin/tps";
            const method = isNew ? "POST" : "PUT";
            const res = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...activeTps, user: currentUser }),
            });
            const result = await res.json();
            if (result.success) {
              toast.success("Tabung Tersimpan", "Pengaturan master Tabung berhasil diperbarui.");
              setShowEditTpsModal(false);
              fetchData();
            }
          } catch {
            toast.error("Gagal", "Tidak dapat menyimpan Tabung.");
          }
        }}
      />

      <ModalForceChangePassword
        isOpen={showChangePasswordModal}
        isForced={isForcedChangePassword}
        username={userParam || currentUser || "admin_kalisalak"}
        namaLengkap={computedUserName}
        onSuccess={() => {
          setShowChangePasswordModal(false);
          setIsForcedChangePassword(false);
        }}
        onClose={() => {
          if (!isForcedChangePassword) {
            setShowChangePasswordModal(false);
          }
        }}
      />

      <ModalSyncProgress
        isOpen={isSyncModalOpen}
        progress={syncProgress}
        onRetry={() => runFullSync(false)}
        onClose={() => setIsSyncModalOpen(false)}
      />

      {/* Floating Background Sync Status Pill (Non-blocking, smooth UI) */}
      {isBackgroundSyncing && (
        <div className="fixed bottom-6 right-6 z-40 bg-slate-950/95 text-white border border-blue-500/40 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 max-w-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          </div>
          <div className="flex flex-col text-left pr-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-wide text-blue-300 uppercase">
                Sinkronisasi Latar Belakang
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200">
                {syncProgress.percent}%
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {syncProgress.detail || syncProgress.stage}
            </p>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className="bg-linear-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${syncProgress.percent}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer shrink-0"
          >
            Detail
          </button>
        </div>
      )}

      {/* 4. Native Mobile Bottom Navigation Bar for Field Officers */}
      {isFieldOfficer && (
        <FieldBottomNav
          activeTab={effectiveActiveTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          userRole={computedUserRole}
          userSeksi={computedUserSeksi}
          assignedTps={assignedTps}
          onOpenScanner={() => setIsScannerOpen(true)}
        />
      )}

      {/* 5. Live Rear Camera QR Verifier Modal (Form C6 / Stiker Coklit) */}
      {(isPetugasTpsOnly || isFieldOfficer) && (
        <FloatingQrVerifier
          assignedMeja={assignedTps}
          userName={computedUserName}
          isOpenControlled={isScannerOpen}
          onCloseControlled={() => setIsScannerOpen(false)}
          showFloatingTrigger={!isFieldOfficer && isPetugasTpsOnly}
        />
      )}

      {/* 6. Quick Unlock Screen (Native-like App Lock) */}
      {isAppLocked && (
        <AdminLockScreen
          userName={computedUserName}
          userJabatan={computedUserJabatan}
          username={userParam}
          fotoUrl={dbMatchedMember?.fotoUrl}
          onUnlockSuccess={() => {
            setIsAppLocked(false);
            const now = Date.now();
            lastActivityRef.current = now;
          }}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};
