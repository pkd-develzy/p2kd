"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { supabase, supabaseSeksi1, supabaseServer3 } from "@/lib/supabase";
import { getAutoTabungByRtRw } from "@/lib/kalisalak-wilayah";
import {
  fetchPemilihPaged,
  searchPemilih,
  clearDeviceSessionCache,
  invalidateVoterCache,
} from "@/lib/secure-device-cache";

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
  const isDeveloperUser = userParam.toLowerCase() === "develzy" || roleParam === "developer";
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

  // Dynamic user profile resolution
  let computedUserRole = isKetuaOrDev
    ? "SUPER_ADMIN"
    : isFieldOfficer
    ? "PETUGAS_TPS"
    : roleParam === "sekretaris"
    ? "SEKRETARIS"
    : roleParam === "bendahara"
    ? "BENDAHARA"
    : roleParam.toUpperCase();

  let computedUserSeksi: SeksiP2KDType = isKetuaOrDev
    ? "PIMPINAN"
    : isFieldOfficer
    ? "PANTARLIH_LAPANGAN"
    : (roleParam.toUpperCase() as SeksiP2KDType);

  let computedUserName = isKetuaOrDev
    ? (storedUser?.nama || "Khasanudin, S.Pd.SD")
    : isFieldOfficer
    ? `Petugas Lapangan (${assignedTps})`
    : (storedUser?.nama || "Panitia P2KD");

  let computedUserJabatan = isKetuaOrDev
    ? "Ketua P2KD / Superadmin"
    : isFieldOfficer
    ? `Pantarlih Lapangan (${assignedTps})`
    : "Anggota Tim Seksi P2KD";

  if (userParam === "develzy") {
    computedUserName = "Develzy (Developer)";
    computedUserJabatan = "System Architect & Technical Core Developer";
    computedUserRole = "SUPER_ADMIN";
  }

  // Specific role mapping
  if (roleParam === "seksi_pemilih" && !isFieldOfficer) {
    computedUserRole = "SEKSI_PEMILIH";
    computedUserSeksi = "SEKSI_PEMILIH";
    computedUserName = "M. Lu’lu Khulaludin, S.F.U";
    computedUserJabatan = "Koordinator Seksi Pendaftaran Pemilih";
  } else if (roleParam === "seksi_penjaringan") {
    computedUserRole = "SEKSI_PENJARINGAN";
    computedUserSeksi = "SEKSI_PENJARINGAN";
    computedUserName = "Hero Budiadi";
    computedUserJabatan = "Koordinator Seksi Penjaringan Balon";
  } else if (roleParam === "seksi_penyaringan") {
    computedUserRole = "SEKSI_PENYARINGAN";
    computedUserSeksi = "SEKSI_PENYARINGAN";
    computedUserName = "Urip";
    computedUserJabatan = "Koordinator Seksi Penyaringan & Seleksi";
  } else if (roleParam === "seksi_pemungutan") {
    computedUserRole = "SEKSI_PUNGUT_HITUNG";
    computedUserSeksi = "SEKSI_PUNGUT_HITUNG";
    computedUserName = "Wihadi";
    computedUserJabatan = "Koordinator Seksi Pemungutan Suara";
  } else if (roleParam === "seksi_logistik" || roleParam === "seksi_publikasi") {
    computedUserRole = "SEKSI_LOGISTIK_PUBLIKASI";
    computedUserSeksi = "SEKSI_LOGISTIK_PUBLIKASI";
    computedUserName = "Mohamad Khumaidi, S.Pd.I";
    computedUserJabatan = "Koordinator Seksi Perlengkapan & Publikasi";
  } else if (roleParam === "seksi_keamanan") {
    computedUserRole = "SEKSI_LOGISTIK_PUBLIKASI";
    computedUserSeksi = "SEKSI_LOGISTIK_PUBLIKASI";
    computedUserName = "Topik Santoso";
    computedUserJabatan = "Koordinator Seksi Keamanan & Ketertiban";
  } else if (roleParam === "sekretaris") {
    computedUserRole = "SEKRETARIS";
    computedUserSeksi = "PIMPINAN";
    computedUserName = "Mashady, M.H.";
    computedUserJabatan = "Sekretaris P2KD";
  } else if (roleParam === "bendahara") {
    computedUserRole = "BENDAHARA";
    computedUserSeksi = "PIMPINAN";
    computedUserName = "Ali Nurhakim, S.Pd";
    computedUserJabatan = "Bendahara P2KD";
  }

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

  const [activeTab, setActiveTab] = useState<TabType>(defaultInitialTab);
  const allowedFieldTabs: TabType[] = ["coklit", "pemilih", "dpt", "export", "print", "tps"];
  const voterDataTabs: TabType[] = ["pemilih", "dpt", "coklit", "petugas_dpt", "aduan", "lock", "export"];

  let effectiveActiveTab: TabType = activeTab;
  if (!canAccessVoterDataUI && voterDataTabs.includes(activeTab)) {
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
  const [anggotaList, setAnggotaList] = useState<AnggotaP2KD[]>(() => initialCache?.anggotaList || []);
  const [petugasCount, setPetugasCount] = useState<number>(() => initialCache?.petugasCount || 0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => initialCache?.auditLogs || []);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(() => initialCache?.dbStatus || null);
  const [isDptLocked, setIsDptLocked] = useState<boolean>(() => Boolean(initialCache?.isDptLocked));
  const [lockHashSignature, setLockHashSignature] = useState<string>(() => initialCache?.lockHashSignature || "");
  const [nomorBeritaAcara, setNomorBeritaAcara] = useState<string>(() => initialCache?.nomorBeritaAcara || "BA/01/P2KD-KLS/VIII/2026");

  // Filter States: Default strictly per RW (RW 01) to eliminate heavy 7,787 rows pileup in single load
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTpsFilter, setSelectedTpsFilter] = useState(() => {
    if (!isAdmin && assignedTps && assignedTps !== "SEMUA") return assignedTps;
    return "01";
  });
  const rwVotersCacheRef = React.useRef<Record<string, Voter[]>>({});
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("SEMUA");
  const [selectedAduanFilter, setSelectedAduanFilter] = useState("SEMUA");

  // Instant 0ms RW Filter Switch with Background Synchronization via Encrypted IndexedDB
  const handleSelectTpsFilter = useCallback(async (newTps: string) => {
    setSelectedTpsFilter(newTps);
    const effectiveNew = isAdmin ? newTps : assignedTps;
    if (canAccessVoterDataUI) {
      const userContext = { username: currentUser, role: computedUserRole, instansi: "p2kd_kalisalak" };
      const pagedRes = await fetchPemilihPaged(
        0,
        100,
        {
          tps: effectiveNew,
          statusAktif: selectedStatusFilter,
        },
        userContext
      );
      setVoters(pagedRes.data);
    }
  }, [isAdmin, assignedTps, selectedStatusFilter, canAccessVoterDataUI, currentUser, computedUserRole]);

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
  if (dbMatchedMember) {
    computedUserName = dbMatchedMember.namaLengkap;
    computedUserJabatan = dbMatchedMember.jabatan;
  }

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

  // Fetch all initial data manually when triggered
  const effectiveTps = isAdmin ? selectedTpsFilter : assignedTps;
  const fetchData = useCallback(async () => {
    try {
      const [
        resAduan,
        resTps,
        resAudit,
        resDb,
        resAnggota,
        resPetugas,
      ] = await Promise.all([
        fetch("/api/admin/aduan", { cache: "no-store" }),
        fetch("/api/admin/tps", { cache: "no-store" }),
        fetch("/api/admin/audit", { cache: "no-store" }),
        fetch("/api/admin/db-status", { cache: "no-store" }),
        fetch("/api/admin/anggota", { cache: "no-store" }),
        fetch("/api/admin/petugas-dpt", { cache: "no-store" }),
      ]);

      const [
        dataAduan,
        dataTps,
        dataAudit,
        dataDb,
        dataAnggota,
        dataPetugas,
      ] = await Promise.all([
        resAduan.json(),
        resTps.json(),
        resAudit.json(),
        resDb.json(),
        resAnggota.json(),
        resPetugas.json(),
      ]);

      if (resAduan.status === 401 || resTps.status === 401) {
        toast.error("Sesi Berakhir", "Sesi autentikasi Anda telah berakhir. Silakan masuk kembali.");
        router.push("/admin");
        return;
      }

      if (canAccessVoterDataUI) {
        const userContext = { username: currentUser, role: computedUserRole, instansi: "p2kd_kalisalak" };
        const pagedRes = await fetchPemilihPaged(
          0,
          100,
          {
            tps: effectiveTps,
            statusAktif: selectedStatusFilter,
          },
          userContext
        );
        setVoters(pagedRes.data);
      } else {
        setVoters([]);
      }
      if (dataAduan.success) setAduanList(dataAduan.data);
      if (dataTps.success) setTpsList(dataTps.data);
      if (dataAudit.success) setAuditLogs(dataAudit.data);
      if (dataAnggota.success) setAnggotaList(dataAnggota.data);
      if (dataPetugas?.success && Array.isArray(dataPetugas.data)) setPetugasCount(dataPetugas.data.length);
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
    effectiveTps,
    selectedStatusFilter,
    isAdmin,
    canAccessVoterDataUI,
    assignedTps,
    router,
    toast,
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
    [canAccessVoterDataUI, toast, setActiveTab]
  );

  // 1. Initial Load & Dynamic Filter Changes
  useEffect(() => {
    let isCancelled = false;
    const runFetch = async () => {
      if (!isCancelled) {
        await fetchData();
      }
    };
    runFetch();
    return () => {
      isCancelled = true;
    };
  }, [fetchData]);

  // 2. Realtime Background Sync (Supabase Realtime Channel + Smart Visibility-Aware Fallback Polling)
  useEffect(() => {
    // A. Supabase Realtime Postgres Changes Channel (All 3 isolated servers)
    const channelMain = supabase
      .channel("admin-dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        () => {
          void fetchData();
        }
      )
      .subscribe();

    const channelSeksi1 = supabaseSeksi1
      .channel("admin-seksi1-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        () => {
          void fetchData();
        }
      )
      .subscribe();

    const channelServer3 = supabaseServer3
      .channel("admin-server3-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        () => {
          void fetchData();
        }
      )
      .subscribe();

    // B. Smart Fallback Polling (Every 180s, ONLY when tab is active/visible)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void fetchData();
      }
    }, 180000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channelMain);
      supabaseSeksi1.removeChannel(channelSeksi1);
      supabaseServer3.removeChannel(channelServer3);
    };
  }, [fetchData]);

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
    isDptLocked,
    lockHashSignature,
    nomorBeritaAcara,
  ]);

  // 4. Server-Side Debounced Search via Encrypted Cache & PostgreSQL
  useEffect(() => {
    if (!canAccessVoterDataUI) return;
    const cleanSearch = searchTerm.trim();
    if (!cleanSearch) {
      void fetchData();
      return;
    }

    const timer = setTimeout(async () => {
      const userContext = { username: currentUser, role: computedUserRole, instansi: "p2kd_kalisalak" };
      const results = await searchPemilih(cleanSearch, { tps: effectiveTps }, userContext);
      setVoters(results);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, canAccessVoterDataUI, currentUser, computedUserRole, effectiveTps, fetchData]);

  // 5. Cross-Tab Synchronization Listener (BroadcastChannel: Logout & Invalidation)
  useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;

    try {
      const channel = new BroadcastChannel("p2kd_secure_vault_sync");
      channel.onmessage = (event) => {
        if (event.data?.type === "LOGOUT") {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user_data");
          localStorage.removeItem("p2kd_admin_dashboard_cache");
          sessionStorage.removeItem("admin_token");
          router.replace("/admin");
        } else if (event.data?.type === "CACHE_INVALIDATED") {
          void fetchData();
        }
      };

      return () => {
        channel.close();
      };
    } catch {
      // Ignored if restricted
    }
  }, [router, fetchData]);

  // Logout Handler: Wajib menggunakan blok finally untuk menjamin penghapusan cache terenkripsi & kunci
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // Abaikan kegagalan jaringan saat logout
    } finally {
      // 1. Hapus seluruh ciphertext & CryptoKey dari IndexedDB
      await clearDeviceSessionCache();

      // 2. Hapus token sesi dari browser
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user_data");
        localStorage.removeItem("p2kd_admin_dashboard_cache");
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
    setVoters((prev) => [optimisticVoter, ...prev]);
    const cacheKey = `${effectiveTps}_${selectedStatusFilter}`;
    if (rwVotersCacheRef.current[cacheKey]) {
      rwVotersCacheRef.current[cacheKey] = [optimisticVoter, ...rwVotersCacheRef.current[cacheKey]];
    }

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
          setVoters((prev) =>
            prev.map((v) => (v.id === tempId ? { ...v, id: realId } : v))
          );
          if (rwVotersCacheRef.current[cacheKey]) {
            rwVotersCacheRef.current[cacheKey] = rwVotersCacheRef.current[cacheKey].map((v) =>
              v.id === tempId ? { ...v, id: realId } : v
            );
          }
          await invalidateVoterCache({ username: currentUser, role: computedUserRole, instansi: "p2kd_kalisalak" });
        } else if (!result.success) {
          setVoters((prev) => prev.filter((v) => v.id !== tempId));
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

    // 1. Instant local state & cache update (< 1ms)
    setVoters((prev) =>
      prev.map((v) => (v.id === activeVoter.id ? updatedVoter : v))
    );
    const cacheKey = `${effectiveTps}_${selectedStatusFilter}`;
    if (rwVotersCacheRef.current[cacheKey]) {
      rwVotersCacheRef.current[cacheKey] = rwVotersCacheRef.current[cacheKey].map((v) =>
        v.id === activeVoter.id ? updatedVoter : v
      );
    }

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
        if (result.success) {
          await invalidateVoterCache({ username: currentUser, role: computedUserRole, instansi: "p2kd_kalisalak" });
        } else {
          setVoters((prev) =>
            prev.map((v) => (v.id === activeVoter.id ? previousVoter : v))
          );
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

    // 1. Instant optimistic state & cache update (< 1ms)
    setVoters((prev) =>
      prev.map((v) =>
        v.id === targetId
          ? {
              ...v,
              statusAktif: "TMS",
              alasanTms: alasan,
              coklitStatus: "TMS",
              coklitCatatan: catatan,
            }
          : v
      )
    );
    const cacheKey = `${effectiveTps}_${selectedStatusFilter}`;
    if (rwVotersCacheRef.current[cacheKey]) {
      rwVotersCacheRef.current[cacheKey] = rwVotersCacheRef.current[cacheKey].map((v) =>
        v.id === targetId
          ? {
              ...v,
              statusAktif: "TMS",
              alasanTms: alasan,
              coklitStatus: "TMS",
              coklitCatatan: catatan,
            }
          : v
      );
    }

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
        if (result.success) {
          await invalidateVoterCache({ username: currentUser, role: computedUserRole, instansi: "p2kd_kalisalak" });
        } else {
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

    // 1. Instant optimistic state update (< 1ms)
    setVoters((prev) =>
      prev.map((v) =>
        v.id === targetId
          ? { ...v, tps: tpsBaru, rt: rtBaru, rw: rwBaru }
          : v
      )
    );
    const cacheKey = `${effectiveTps}_${selectedStatusFilter}`;
    if (rwVotersCacheRef.current[cacheKey]) {
      rwVotersCacheRef.current[cacheKey] = rwVotersCacheRef.current[cacheKey].map((v) =>
        v.id === targetId ? { ...v, tps: tpsBaru, rt: rtBaru, rw: rwBaru } : v
      );
    }

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
        if (result.success) {
          await invalidateVoterCache({ username: currentUser, role: computedUserRole, instansi: "p2kd_kalisalak" });
        } else {
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
      // 1. Instant optimistic state update (< 1ms)
      setVoters((prev) => prev.filter((item) => item.id !== v.id));
      const cacheKey = `${effectiveTps}_${selectedStatusFilter}`;
      if (rwVotersCacheRef.current[cacheKey]) {
        rwVotersCacheRef.current[cacheKey] = rwVotersCacheRef.current[cacheKey].filter((item) => item.id !== v.id);
      }
      toast.success("Data Dihapus", `${v.namaLengkap} telah dihapus.`);

      // 2. Asynchronous background execution
      void (async () => {
        try {
          const res = await fetch(`/api/admin/pemilih/${v.id}?user=${encodeURIComponent(currentUser)}`, {
            method: "DELETE",
          });
          const result = await res.json();
          if (result.success) {
            await invalidateVoterCache({ username: currentUser, role: computedUserRole, instansi: "p2kd_kalisalak" });
          } else {
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
    // 1. Optimistic instant UI update in 0ms
    setVoters((prev) =>
      prev.map((v) => (ids.includes(v.id) ? { ...v, tahap: "DPT" } : v))
    );
    const cacheKey = `${effectiveTps}_${selectedStatusFilter}`;
    if (rwVotersCacheRef.current[cacheKey]) {
      rwVotersCacheRef.current[cacheKey] = rwVotersCacheRef.current[cacheKey].map((v) =>
        ids.includes(v.id) ? { ...v, tahap: "DPT" } : v
      );
    }

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
        if (result.success) {
          await invalidateVoterCache({ username: currentUser, role: computedUserRole, instansi: "p2kd_kalisalak" });
        } else {
          toast.error("Gagal Sinkronisasi DPT", result.message || "Tidak dapat memindahkan data di server.");
        }
      } catch (err) {
        console.error("Background promote error:", err);
      }
    })();
  };

  const handleRollbackToDps = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    // 1. Optimistic instant UI update in 0ms
    setVoters((prev) =>
      prev.map((v) => (ids.includes(v.id) ? { ...v, tahap: "DPS" } : v))
    );
    const cacheKey = `${effectiveTps}_${selectedStatusFilter}`;
    if (rwVotersCacheRef.current[cacheKey]) {
      rwVotersCacheRef.current[cacheKey] = rwVotersCacheRef.current[cacheKey].map((v) =>
        ids.includes(v.id) ? { ...v, tahap: "DPS" } : v
      );
    }

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
        if (result.success) {
          await invalidateVoterCache({ username: currentUser, role: computedUserRole, instansi: "p2kd_kalisalak" });
        } else {
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

    // 1. Instant Optimistic state & cache update (< 1ms)
    setVoters((prev) =>
      prev.map((v) => {
        if (v.id !== voterId) return v;
        return {
          ...v,
          coklitStatus: status,
          coklitTanggal: status === "BELUM_COKLIT" ? undefined : todayStr,
          coklitCatatan: catatan,
          coklitPetugas: status === "BELUM_COKLIT" ? undefined : currentUser,
          statusAktif: status === "TMS" ? "TMS" : "AKTIF",
          alasanTms: status === "TMS" ? catatan || "Dinyatakan TMS saat Coklit Lapangan" : undefined,
          tahap: status === "SESUAI" || status === "UBAH_DATA" ? "DPT" : v.tahap,
        };
      })
    );
    const cacheKey = `${effectiveTps}_${selectedStatusFilter}`;
    if (rwVotersCacheRef.current[cacheKey]) {
      rwVotersCacheRef.current[cacheKey] = rwVotersCacheRef.current[cacheKey].map((v) => {
        if (v.id !== voterId) return v;
        return {
          ...v,
          coklitStatus: status,
          coklitTanggal: status === "BELUM_COKLIT" ? undefined : todayStr,
          coklitCatatan: catatan,
          coklitPetugas: status === "BELUM_COKLIT" ? undefined : currentUser,
          statusAktif: status === "TMS" ? "TMS" : "AKTIF",
          alasanTms: status === "TMS" ? catatan || "Dinyatakan TMS saat Coklit Lapangan" : undefined,
          tahap: status === "SESUAI" || status === "UBAH_DATA" ? "DPT" : v.tahap,
        };
      });
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
        if (result.success) {
          await invalidateVoterCache({ username: currentUser, role: computedUserRole, instansi: "p2kd_kalisalak" });
        } else {
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
        userRole={computedUserRole}
        userSeksi={computedUserSeksi}
        userName={computedUserName}
        userJabatan={computedUserJabatan}
        assignedTps={assignedTps}
        onLogout={handleLogout}
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
                  namaTps: `TPS ${nextNum}`,
                  namaTabung: `Tabung RW ${nextNum}`,
                  lokasi: `Balai Pertemuan RW ${nextNum}, Desa Kalisalak`,
                  alamat: `Wilayah RW ${nextNum}, Desa Kalisalak`,
                  rt: "01, 02, 03",
                  rw: nextNum,
                  kuotaMaksimal: 700,
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

          {effectiveActiveTab === "audit" && (
            <TabAuditTrail auditLogs={auditLogs} />
          )}

          {effectiveActiveTab === "pengaturan_web" && (
            <TabPengaturanWeb currentUser={{ namaLengkap: computedUserName, role: computedUserRole }} />
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
    </div>
  );
};
