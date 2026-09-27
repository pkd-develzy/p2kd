/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { supabase, supabaseSeksi1, supabaseServer3 } from "@/lib/supabase";
import { getAutoTabungByRtRw } from "@/lib/kalisalak-wilayah";
import { clearDeviceSessionCache } from "@/lib/secure-device-cache";
import { EncryptedLocalDb } from "@/lib/encrypted-local-db";
import {
  LocalPemilihRepository,
  LocalTPSRepository,
  LocalAnggotaRepository,
  LocalAduanRepository,
} from "@/lib/local-repositories";
import { SyncEngine, SyncProgress } from "@/lib/sync-engine";
import { ModalSyncProgress } from "./modals/modal-sync-progress";
import { RefreshCw, Lock, KeyRound, Eye, EyeOff, ArrowRight, LogOut } from "lucide-react";

import {
  Voter,
  Aduan,
  TPSItem,
  AuditLog,
  DbStatus,
  VoterFormData,
  TabType,
  AnggotaP2KD,
  SeksiP2KDType,
} from "./types";
import { PublicWebConfig, getAnggotaHierarchyRank } from "@/lib/data-store";

import { AdminSidebar } from "./sidebar";
import { AdminHeader } from "./header";

import { TabDashboardOverview } from "./tabs/tab-dashboard-overview";
import { TabMasterPemilih } from "./tabs/tab-master-pemilih";
import { TabCoklitLapangan } from "./tabs/tab-coklit-lapangan";
import { TabMasterTPS } from "./tabs/tab-master-tps";
import { TabAduanWarga } from "./tabs/tab-aduan-warga";
import { TabPrintCenter } from "./tabs/tab-print-center";
import { TabFinalisasiDPT } from "./tabs/tab-finalisasi-dpt";
import { TabRekapEkspor } from "./tabs/tab-rekap-ekspor";
import { TabAuditTrail } from "./tabs/tab-audit-trail";
import { TabAnggotaP2KD } from "./tabs/tab-anggota-p2kd";
import { TabPengaturanWeb } from "./tabs/tab-pengaturan-web";
import { TabPetugasDpt } from "./tabs/tab-petugas-dpt";
import { TabManajemenBerita } from "./tabs/tab-manajemen-berita";
import { TabCalonKades } from "./tabs/tab-calon-kades";

import { ModalVoterForm } from "./modals/modal-voter-form";
import { ModalTms } from "./modals/modal-tms";
import { ModalMutasi } from "./modals/modal-mutasi";
import { ModalTpsForm } from "./modals/modal-tps-form";
import { ModalForceChangePassword } from "./modals/modal-force-change-password";
import { FloatingQrVerifier } from "./widgets/floating-qr-verifier";
import { FieldBottomNav } from "./field-bottom-nav";
import { CloudflareTurnstileShield, TurnstileShieldHandle } from "@/components/ui/cloudflare-turnstile-shield";

export const AdminDashboard: React.FC = () => {
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

  const roleParam = (searchParams.get("role") || storedUser?.role || "").toLowerCase().trim();
  const tpsParam = searchParams.get("tps") || storedUser?.assignedTps || "";
  const userParam = searchParams.get("user") || storedUser?.username || "";

  // 1. Strict RBAC Resolution: Developer, Ketua P2KD, Seksi 1, and Pantarlih
  const isDeveloperUser =
    userParam.toLowerCase() === "develzy" ||
    userParam.toLowerCase() === "developer" ||
    roleParam === "developer" ||
    storedUser?.role?.toLowerCase() === "developer" ||
    storedUser?.username?.toLowerCase() === "develzy" ||
    storedUser?.username?.toLowerCase() === "developer";
  const isKetuaUser =
    userParam.toLowerCase() === "admin_kalisalak" ||
    userParam.toLowerCase() === "khasanudin" ||
    (Boolean(storedUser?.nama) && storedUser.nama.toLowerCase().includes("khasanudin")) ||
    (Boolean(storedUser?.jabatan) && storedUser.jabatan.toLowerCase().includes("ketua p2kd"));

  const isKetuaOrDev = isDeveloperUser || isKetuaUser;

  // Field officer (Pantarlih / PPS)
  const isFieldOfficer =
    (tpsParam !== "" && tpsParam !== "SEMUA") ||
    roleParam === "petugas" ||
    roleParam === "pantarlih" ||
    roleParam === "petugas_tps" ||
    roleParam === "pps" ||
    userParam.toLowerCase().includes("lapangan") ||
    userParam.toLowerCase().includes("pantarlih") ||
    userParam.toLowerCase().startsWith("pps") ||
    storedUser?.role === "PETUGAS_TPS" ||
    storedUser?.seksi === "PANTARLIH_LAPANGAN";

  const isSeksiPemilihUser =
    !isFieldOfficer &&
    (roleParam === "seksi_pemilih" ||
      userParam.toLowerCase().includes("pemilih") ||
      storedUser?.seksi === "SEKSI_PEMILIH" ||
      storedUser?.role === "SEKSI_PEMILIH");

  // ONLY Developer, Ketua, Seksi 1, and Pantarlih are authorized to access voter data
  const canAccessVoterDataUI = isKetuaOrDev || isSeksiPemilihUser || isFieldOfficer;

  // Super Admin privilege is strictly restricted to Developer and Ketua P2KD
  const isSuperAdmin = isKetuaOrDev;
  const isAdmin = isKetuaOrDev;
  const assignedTps = tpsParam || (isFieldOfficer ? "Tabung Pemilihan 01" : "SEMUA");
  const currentUser = userParam || (isAdmin ? "admin_kalisalak" : "petugas");
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

  const [activeTab, setActiveTab] = useState<TabType>(defaultInitialTab);
  const allowedFieldTabs: TabType[] = ["coklit", "pemilih", "dpt", "export", "print", "tps"];
  const voterDataTabs: TabType[] = ["pemilih", "dpt", "coklit", "petugas_dpt", "aduan", "lock", "export"];

  let effectiveActiveTab: TabType = activeTab;
  if (effectiveActiveTab === "audit" && !isDeveloper) {
    effectiveActiveTab = "dashboard";
  } else if (!canAccessVoterDataUI && voterDataTabs.includes(activeTab)) {
    effectiveActiveTab = defaultInitialTab !== "pemilih" && defaultInitialTab !== "coklit" ? defaultInitialTab : "dashboard";
  } else if (isFieldOfficer && !allowedFieldTabs.includes(activeTab)) {
    effectiveActiveTab = "coklit";
  }

  const [currentCoklitTps, setCurrentCoklitTps] = useState(assignedTps);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
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
  const [nomorBeritaAcara, setNomorBeritaAcara] = useState<string>(() => initialCache?.nomorBeritaAcara || "BA/01/P2KD-KLS/VIII/2026");

  // Filter States: Default strictly per RW (RW 01)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTpsFilter, setSelectedTpsFilter] = useState(() => {
    if (!isAdmin && assignedTps && assignedTps !== "SEMUA") return assignedTps;
    return "01";
  });
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("SEMUA");
  const [selectedAduanFilter, setSelectedAduanFilter] = useState("SEMUA");

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
    total: 7787,
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
  const [unlockPassword, setUnlockPassword] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [unlockTurnstileToken, setUnlockTurnstileToken] = useState<string>("");
  const unlockTurnstileRef = React.useRef<TurnstileShieldHandle>(null);

  const handleLockScreen = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("p2kd_app_locked", "true");
    }
    setIsAppLocked(true);
    setUnlockPassword("");
    setUnlockTurnstileToken("");
    unlockTurnstileRef.current?.reset();
  }, []);

  const handleQuickUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockPassword.trim()) {
      toast.warning("Kata Sandi Wajib", "Silakan masukkan kata sandi akun Anda.");
      return;
    }

    if (!unlockTurnstileToken) {
      toast.warning("Verifikasi Keamanan", "Silakan selesaikan centang verifikasi Cloudflare Turnstile.");
      return;
    }

    setIsUnlocking(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userParam,
          password: unlockPassword.trim(),
          turnstileToken: unlockTurnstileToken,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAppLocked(false);
        setUnlockPassword("");
        setUnlockTurnstileToken("");
        if (typeof window !== "undefined") {
          localStorage.removeItem("p2kd_app_locked");
          const now = Date.now();
          localStorage.setItem("p2kd_last_activity", now.toString());
          lastActivityRef.current = now;
          if (data.data?.token) {
            localStorage.setItem("admin_token", data.data.token);
            sessionStorage.setItem("admin_token", data.data.token);
          }
        }
        toast.success("Kunci Terbuka", "Selamat datang kembali di dashboard.");
      } else {
        toast.error("Gagal Buka Kunci", data.message || "Kata sandi salah.");
        unlockTurnstileRef.current?.reset();
        setUnlockTurnstileToken("");
      }
    } catch {
      toast.error("Gagal", "Tidak dapat terhubung ke server.");
      unlockTurnstileRef.current?.reset();
      setUnlockTurnstileToken("");
    } finally {
      setIsUnlocking(false);
    }
  };

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
  }, []);

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

  // Form State for Add / Edit Voter
  const [voterForm, setVoterForm] = useState<VoterFormData>({
    nik: "",
    kk: "",
    namaLengkap: "",
    tempatLahir: "",
    tanggalLahir: "",
    jenisKelamin: "L",
    statusPerkawinan: "S",
    alamat: "",
    rt: "",
    rw: "",
    tps: "",
    statusAktif: "AKTIF",
    alasanTms: "",
  });

  // Fetch dashboard metadata manually when triggered
  const fetchData = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token")
          : null;
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [
        resAduan,
        resTps,
        resAudit,
        resDb,
        resAnggota,
        resPetugas,
        resConfig,
      ] = await Promise.all([
        fetch("/api/admin/aduan", { cache: "no-store", headers: authHeaders }),
        fetch("/api/admin/tps", { cache: "no-store", headers: authHeaders }),
        fetch("/api/admin/audit", { cache: "no-store", headers: authHeaders }),
        fetch("/api/admin/db-status", { cache: "no-store", headers: authHeaders }),
        fetch("/api/admin/anggota?refresh=true", { cache: "no-store", headers: authHeaders }),
        fetch("/api/admin/petugas-dpt", { cache: "no-store", headers: authHeaders }),
        fetch("/api/config", { cache: "no-store" }),
      ]);

      const [
        dataAduan,
        dataTps,
        dataAudit,
        dataDb,
        dataAnggota,
        dataPetugas,
        dataConfig,
      ] = await Promise.all([
        resAduan.json(),
        resTps.json(),
        resAudit.json(),
        resDb.json(),
        resAnggota.json(),
        resPetugas.json(),
        resConfig.json(),
      ]);

      if (dataConfig.success && dataConfig.data) {
        setWebConfig(dataConfig.data);
      }

      if (resAduan.status === 401 || resTps.status === 401 || resAnggota.status === 401) {
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
      if (dataPetugas?.success && Array.isArray(dataPetugas.data)) {
        setPetugasCount(dataPetugas.data.length);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("p2kd_petugas_dpt_cache", JSON.stringify(dataPetugas.data));
          } catch {}
        }
      }
      if (dataDb.success) {
        setDbStatus(dataDb.data);
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
    const handleRemoteChange = () => {
      if (canAccessVoterDataUI) {
        void SyncEngine.runIncrementalSync(userContext).then((hasChanges) => {
          if (hasChanges) {
            setVoters(LocalPemilihRepository.getAll());
          }
        });
      }
      void fetchData();
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
      clearInterval(interval);
      supabase.removeChannel(channelMain);
      supabaseSeksi1.removeChannel(channelSeksi1);
      supabaseServer3.removeChannel(channelServer3);
      supabaseServer3.removeChannel(channelAuditInstant);
    };
  }, [canAccessVoterDataUI, userContext, fetchData]);

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

  // Logout Handler: Wajib menggunakan blok finally untuk menjamin penghapusan cache terenkripsi & kunci
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // Abaikan kegagalan jaringan saat logout
    } finally {
      // 1. Hapus seluruh ciphertext, sync_state, & session encryption key dari IndexedDB
      await EncryptedLocalDb.clearSession();
      await clearDeviceSessionCache();

      // 2. Bersihkan seluruh in-memory local repositories
      LocalPemilihRepository.clear();
      LocalTPSRepository.clear();
      LocalAnggotaRepository.clear();
      LocalAduanRepository.clear();

      // 3. Hapus token sesi, remembered account, dan cache modul dari browser (Logout penuh mewajibkan username & kata sandi)
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user_data");
        localStorage.removeItem("p2kd_admin_dashboard_cache");
        localStorage.removeItem("p2kd_petugas_dpt_cache");
        localStorage.removeItem("p2kd_calon_kades_cache");
        localStorage.removeItem("p2kd_berita_cache");
        localStorage.removeItem("p2kd_remembered_account");
        localStorage.removeItem("p2kd_app_locked");
        localStorage.removeItem("p2kd_last_activity");
        sessionStorage.removeItem("admin_token");
      }

      toast.info("Sesi Berakhir", "Anda telah keluar dari Portal Petugas.");
      router.replace("/admin");
    }
  };

  // --- CRUD HANDLERS (OPTIMISTIC & ASYNCHRONOUS BACKGROUND SYNC) ---
  const handleSaveNewVoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (voterForm.nik.length !== 16) {
      toast.error("Validasi Gagal", "NIK harus berjumlah 16 digit angka.");
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const maskedNik = `${voterForm.nik.slice(0, 1)}*************${voterForm.nik.slice(-2)}`;
    const maskedKk = voterForm.kk ? `${voterForm.kk.slice(0, 1)}*************${voterForm.kk.slice(-2)}` : "";

    const optimisticVoter: Voter = {
      id: tempId,
      nik: voterForm.nik,
      nikMasked: maskedNik,
      kk: voterForm.kk,
      kkMasked: maskedKk,
      namaLengkap: voterForm.namaLengkap.trim().toUpperCase(),
      tempatLahir: voterForm.tempatLahir.trim().toUpperCase(),
      tanggalLahir: voterForm.tanggalLahir,
      jenisKelamin: voterForm.jenisKelamin,
      statusPerkawinan: voterForm.statusPerkawinan,
      alamat: voterForm.alamat.trim().toUpperCase(),
      rt: voterForm.rt || "01",
      rw: voterForm.rw || "01",
      desa: "Kalisalak",
      kecamatan: "Margasari",
      tps: voterForm.tps || `TPS ${voterForm.rw || "01"}`,
      statusAktif: voterForm.statusAktif || "AKTIF",
      alasanTms: voterForm.alasanTms || "",
      tahap: "DPS",
      updatedAt: new Date().toISOString(),
    };

    // 1. Instant optimistic state & cache update (< 1ms)
    // 1. Optimistic state & repository update (< 1ms)
    void LocalPemilihRepository.upsert(optimisticVoter, namespace);
    setVoters(LocalPemilihRepository.getAll());

    // 2. Immediately close modal & provide instant feedback
    setShowAddVoterModal(false);
    toast.success("Pemilih Ditambahkan", `Data ${voterForm.namaLengkap} berhasil diproses.`);

    // 3. Asynchronous background execution (zero UI delay)
    void (async () => {
      try {
        const res = await fetch("/api/admin/pemilih", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...voterForm, user: currentUser }),
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
    setActiveVoter(v);
    const autoTps = getAutoTabungByRtRw(v.rw, v.rt, tpsList);
    setVoterForm({
      nik: v.nik,
      kk: v.kk || "",
      namaLengkap: v.namaLengkap,
      tempatLahir: v.tempatLahir,
      tanggalLahir: v.tanggalLahir,
      jenisKelamin: v.jenisKelamin,
      statusPerkawinan: v.statusPerkawinan,
      alamat: v.alamat,
      rt: v.rt || "01",
      rw: v.rw || "01",
      tps: autoTps || v.tps,
      statusAktif: v.statusAktif === "TMS" ? "TMS" : "AKTIF",
      alasanTms: v.alasanTms || "",
    });
    setShowEditVoterModal(true);
  };

  const handleSaveEditVoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVoter) return;

    const previousVoter = activeVoter;
    const updatedVoter: Voter = {
      ...activeVoter,
      nik: voterForm.nik,
      kk: voterForm.kk,
      namaLengkap: voterForm.namaLengkap.trim().toUpperCase(),
      tempatLahir: voterForm.tempatLahir.trim().toUpperCase(),
      tanggalLahir: voterForm.tanggalLahir,
      jenisKelamin: voterForm.jenisKelamin,
      statusPerkawinan: voterForm.statusPerkawinan,
      alamat: voterForm.alamat.trim().toUpperCase(),
      rt: voterForm.rt,
      rw: voterForm.rw,
      tps: voterForm.tps,
      statusAktif: voterForm.statusAktif || "AKTIF",
      alasanTms: voterForm.alasanTms || "",
      updatedAt: new Date().toISOString(),
    };

    // 1. Instant local state & repository update (< 1ms)
    void LocalPemilihRepository.upsert(updatedVoter, namespace);
    setVoters(LocalPemilihRepository.getAll());

    // 2. Immediately close modal & show success toast
    setShowEditVoterModal(false);
    toast.success("Data Diperbarui", `Perubahan data ${voterForm.namaLengkap} berhasil disimpan.`);

    // 3. Asynchronous background execution (zero UI delay)
    void (async () => {
      try {
        const res = await fetch(`/api/admin/pemilih/${activeVoter.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...voterForm,
            user: currentUser,
            alasan: "Koreksi Data Manual Petugas",
          }),
        });
        const result = await res.json();
        if (!result.success) {
          void LocalPemilihRepository.upsert(previousVoter, namespace);
          setVoters(LocalPemilihRepository.getAll());
          toast.error("Gagal Update di Server", result.message || "Data dikembalikan.");
        }
      } catch (err) {
        console.error("Background update voter error:", err);
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

  // --- PROMOSI / ROLLBACK PEMILIH DPS <-> DPT (OPTIMISTIC NON-BLOCKING) ---
  const handlePromoteToDpt = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const targetVoters = LocalPemilihRepository.getAll().filter((v) => ids.includes(v.id));
    const updatedList = targetVoters.map((v) => ({ ...v, tahap: "DPT" as const }));
    void LocalPemilihRepository.upsertBatch(updatedList, namespace);
    setVoters(LocalPemilihRepository.getAll());

    toast.success("Verifikasi Masuk DPT", `${ids.length} data pemilih langsung dipindahkan ke DPT.`);

    // 2. Asynchronous background sync
    void (async () => {
      try {
        const res = await fetch("/api/admin/pemilih/promosi-dpt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, targetTahap: "DPT", user: currentUser }),
        });
        const result = await res.json();
        if (!result.success) {
          toast.error("Gagal Sinkronisasi DPT", result.message || "Tidak dapat memindahkan data di server.");
        }
      } catch (err) {
        console.error("Background promote error:", err);
      }
    })();
  };

  const handleRollbackToDps = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const targetVoters = LocalPemilihRepository.getAll().filter((v) => ids.includes(v.id));
    const updatedList = targetVoters.map((v) => ({ ...v, tahap: "DPS" as const }));
    void LocalPemilihRepository.upsertBatch(updatedList, namespace);
    setVoters(LocalPemilihRepository.getAll());

    toast.warning("Dikembalikan ke DPS", `${ids.length} data pemilih dikembalikan ke DPS.`);

    // 2. Asynchronous background sync
    void (async () => {
      try {
        const res = await fetch("/api/admin/pemilih/promosi-dpt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, targetTahap: "DPS", user: currentUser }),
        });
        const result = await res.json();
        if (!result.success) {
          toast.error("Gagal Rollback di Server", result.message || "Tidak dapat mengembalikan data.");
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
    <div className="min-h-screen flex bg-slate-100/90 text-slate-900">
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        options={confirmOptions}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* 1. Professional Admin Sidebar */}
      <AdminSidebar
        activeTab={effectiveActiveTab}
        setActiveTab={handleNavigateTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        voterCount={
          dbStatus?.cloudStats?.pemilihCount ??
          dbStatus?.localStats?.totalDps ??
          dbStatus?.localStats?.totalPemilih ??
          7787
        }
        dptCount={dbStatus?.localStats?.totalDpt ?? 0}
        tpsCount={dbStatus?.localStats?.totalTps ?? tpsList.length ?? 13}
        aduanPendingCount={dbStatus?.localStats?.totalAduan ?? totalAduanMenunggu ?? 0}
        isDptLocked={isDptLocked}
        auditCount={dbStatus?.localStats?.totalAudit ?? auditLogs.length ?? 144}
        anggotaCount={dbStatus?.cloudStats?.anggotaCount ?? dbStatus?.localStats?.totalAnggota ?? anggotaList.length ?? 10}
        petugasCount={dbStatus?.cloudStats?.petugasCount ?? dbStatus?.localStats?.totalPetugas ?? petugasCount ?? 14}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* 2. Top Header */}
        <AdminHeader
          activeTab={effectiveActiveTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onRefresh={() => fetchData()}
          isLoading={isLoading}
          dbStatus={dbStatus}
          isAdmin={isAdmin}
          assignedTps={assignedTps}
          isDptLocked={isDptLocked}
          onOpenChangePassword={() => {
            setIsForcedChangePassword(false);
            setShowChangePasswordModal(true);
          }}
        />

        {/* 3. Main Dashboard Body */}
        <main className={`flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6 ${isFieldOfficer ? "pb-28" : ""}`}>
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
              isAdmin={isAdmin}
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
              isAdmin={isAdmin}
              onUpdateCoklitStatus={handleUpdateCoklitStatus}
              onOpenEditVoter={handleOpenEditVoter}
              onOpenAddVoter={() => {
                const autoTps = getAutoTabungByRtRw("01", "01", tpsList);
                setVoterForm({
                  nik: "",
                  kk: "",
                  namaLengkap: "",
                  tempatLahir: "",
                  tanggalLahir: "",
                  jenisKelamin: "L",
                  statusPerkawinan: "S",
                  alamat: "",
                  rt: "01",
                  rw: "01",
                  tps: autoTps,
                  statusAktif: "AKTIF",
                  alasanTms: "",
                });
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
              isAdmin={isAdmin}
              assignedTps={assignedTps}
              onOpenAddVoter={() => {
                const autoTps = getAutoTabungByRtRw("01", "01", tpsList);
                setVoterForm({
                  nik: "",
                  kk: "",
                  namaLengkap: "",
                  tempatLahir: "",
                  tanggalLahir: "",
                  jenisKelamin: "L",
                  statusPerkawinan: "S",
                  alamat: "",
                  rt: "01",
                  rw: "01",
                  tps: autoTps,
                  statusAktif: "AKTIF",
                  alasanTms: "",
                });
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
              isAdmin={isAdmin}
              assignedTps={assignedTps}
              onOpenAddVoter={() => {
                const autoTps = getAutoTabungByRtRw("01", "01", tpsList);
                setVoterForm({
                  nik: "",
                  kk: "",
                  namaLengkap: "",
                  tempatLahir: "",
                  tanggalLahir: "",
                  jenisKelamin: "L",
                  statusPerkawinan: "S",
                  alamat: "",
                  rt: "01",
                  rw: "01",
                  tps: autoTps,
                  statusAktif: "AKTIF",
                  alasanTms: "",
                });
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
              isAdmin={isAdmin}
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
              onLockDpt={handleLockDpt}
              onUnlockDpt={handleUnlockDpt}
              onNavigatePrint={() => setActiveTab("print")}
            />
          )}

          {effectiveActiveTab === "export" && canAccessVoterDataUI && (
            <TabRekapEkspor tpsList={tpsList} voters={voters} />
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
        </main>
      </div>

      {/* --- MODALS --- */}
      <ModalVoterForm
        isOpen={showAddVoterModal || showEditVoterModal}
        isEdit={showEditVoterModal}
        voterForm={voterForm}
        setVoterForm={setVoterForm}
        tpsList={tpsList}
        onClose={() => {
          setShowAddVoterModal(false);
          setShowEditVoterModal(false);
        }}
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
        onSubmit={async (e) => {
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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900/95 border border-white/15 p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* User Identity Avatar */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl">
                  {dbMatchedMember?.fotoUrl ? (
                    <img
                      src={dbMatchedMember.fotoUrl}
                      alt={computedUserName}
                      className="w-full h-full rounded-[14px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white font-black text-xl">
                      {computedUserName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-500 text-slate-950 shadow-md">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-black text-white">{computedUserName}</h3>
                <p className="text-xs text-blue-300 font-medium">{computedUserJabatan}</p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className="inline-block text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                    @{userParam}
                  </span>
                  <span className="inline-block text-[10px] text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    🔒 Terkunci (Inaktif 30m)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Unlock Form */}
            <form onSubmit={handleQuickUnlock} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider">
                  KATA SANDI AKUN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showUnlockPassword ? "text" : "password"}
                    autoFocus
                    required
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full h-11 pl-10 pr-11 text-xs font-bold rounded-xl bg-slate-100/95 text-slate-950 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title={showUnlockPassword ? "Sembunyikan" : "Tampilkan"}
                  >
                    {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Cloudflare Turnstile Bot Protection */}
              <div className="pt-1">
                <CloudflareTurnstileShield
                  ref={unlockTurnstileRef}
                  action="login"
                  isVerified={Boolean(unlockTurnstileToken)}
                  onVerify={(token) => setUnlockTurnstileToken(token)}
                  label="Verifikasi Akses Layar Kunci • Turnstile"
                />
              </div>

              <button
                type="submit"
                disabled={isUnlocking || !unlockTurnstileToken}
                className="w-full h-11 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUnlocking ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Buka Kunci Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-center text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors pt-2 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Akun Sepenuhnya (Logout)</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
