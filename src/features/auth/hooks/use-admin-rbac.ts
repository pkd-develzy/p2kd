import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SeksiP2KDType, TabType } from "@/components/pages/admin/types";

export interface AdminStoredUser {
  nama?: string;
  username?: string;
  role?: string;
  jabatan?: string;
  seksi?: string;
  assignedTps?: string;
}

export function useAdminRbac() {
  const searchParams = useSearchParams();

  const [storedUser] = useState<AdminStoredUser | null>(() => {
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

  // 1. Strict RBAC Resolution
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
    (Boolean(storedUser?.nama) && storedUser!.nama!.toLowerCase().includes("khasanudin")) ||
    (Boolean(storedUser?.jabatan) && storedUser!.jabatan!.toLowerCase().includes("ketua p2kd"));

  const isKetuaOrDev = isDeveloperUser || isKetuaUser;

  // Seksi 1: Koordinator Seksi Pendaftaran Pemilih / Koordinator Pantarlih
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

  // Field officer (Pantarlih Lapangan RW 01 - RW 13 ONLY)
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

  const canAccessVoterDataUI = isKetuaOrDev || isSeksiPemilihUser || isFieldOfficer;
  const canManageAllWilayah = isKetuaOrDev || isSeksiPemilihUser;
  const isSuperAdmin = isKetuaOrDev;
  const isAdmin = isKetuaOrDev;
  const assignedTps = isSeksiPemilihUser ? "SEMUA" : (tpsParam || (isFieldOfficer ? "Tabung Pemilihan 01" : "SEMUA"));
  const currentUser = userParam || (isAdmin ? "admin_kalisalak" : isSeksiPemilihUser ? "khulal" : "petugas");

  // Dynamic profile resolution
  const resolvedProfile = useMemo(() => {
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
    resolvedProfile.role === "DEVELOPER" ||
    (storedUser?.role || "").toUpperCase() === "DEVELOPER";

  return {
    storedUser,
    roleParam,
    tpsParam,
    userParam,
    isDeveloperUser,
    isKetuaUser,
    isKetuaOrDev,
    isSeksiPemilihUser,
    isFieldOfficer,
    canAccessVoterDataUI,
    canManageAllWilayah,
    isSuperAdmin,
    isAdmin,
    assignedTps,
    currentUser,
    resolvedProfile,
    defaultInitialTab,
    isDeveloper,
  };
}
