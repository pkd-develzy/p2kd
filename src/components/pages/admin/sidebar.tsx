"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  AlertTriangle,
  Lock,
  FileSpreadsheet,
  History,
  ShieldCheck,
  UserCheck,
  LogOut,
  X,
  Database,
  ExternalLink,
  Sparkles,
  Printer,
  Shield,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/ui";
import { TabType, DbStatus, SeksiP2KDType } from "./types";
import Link from "next/link";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isOpen: boolean;
  onClose: () => void;
  voterCount: number;
  dptCount?: number;
  tpsCount: number;
  aduanPendingCount: number;
  isDptLocked: boolean;
  auditCount: number;
  anggotaCount?: number;
  petugasCount?: number;
  dbStatus: DbStatus | null;
  isAdmin: boolean;
  userRole?: string; // SUPER_ADMIN, SEKSI_PEMILIH, SEKSI_PENJARINGAN, SEKSI_PENYARINGAN, SEKSI_PUNGUT_HITUNG, SEKSI_LOGISTIK_PUBLIKASI, PETUGAS_TPS
  userSeksi?: SeksiP2KDType;
  userName?: string;
  userJabatan?: string;
  assignedTps?: string;
  onLogout: () => void;
  onSwitchRoleDemo?: (role: string, tps?: string) => void;
}

export const AdminSidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  voterCount,
  dptCount = 0,
  tpsCount,
  aduanPendingCount,
  isDptLocked,
  auditCount,
  anggotaCount = 15,
  petugasCount = 0,
  dbStatus,
  isAdmin,
  userRole = "SUPER_ADMIN",
  userSeksi = "PIMPINAN",
  userName = "Petugas P2KD",
  userJabatan = "Panitia P2KD",
  assignedTps = "SEMUA",
  onLogout,
}) => {
  // Clear, cohesive, logical menu structure based on Pilkades tahapan
  const menuGroups = [
    {
      title: "IKHTISAR UTAMA",
      icon: LayoutDashboard,
      color: "text-blue-400",
      allowedRoles: ["SUPER_ADMIN", "SEKSI_PEMILIH", "SEKSI_PENJARINGAN", "SEKSI_PENYARINGAN", "SEKSI_PUNGUT_HITUNG", "SEKSI_LOGISTIK_PUBLIKASI"],
      items: [
        {
          id: "dashboard" as TabType,
          label: "Dashboard Ringkasan Utama",
          icon: LayoutDashboard,
          badge: "Pusat Rekap",
          badgeColor: "bg-blue-600 text-white font-bold",
          allowedRoles: ["SUPER_ADMIN", "SEKSI_PEMILIH", "SEKSI_PENJARINGAN", "SEKSI_PENYARINGAN", "SEKSI_PUNGUT_HITUNG", "SEKSI_LOGISTIK_PUBLIKASI"],
        },
      ],
    },
    {
      title: "1. DATA PEMILIH & COKLIT",
      icon: Users,
      color: "text-amber-400",
      allowedRoles: ["SUPER_ADMIN", "SEKSI_PEMILIH", "PETUGAS_TPS", "PANTARLIH_LAPANGAN"],
      items: [
        {
          id: "pemilih" as TabType,
          label: "1.1 Daftar Pemilih Sementara (DPS)",
          icon: Users,
          badge: (voterCount - (dptCount || 0)).toString(),
          badgeColor: "bg-amber-900/80 text-amber-200 border-amber-600/70",
          allowedRoles: ["SUPER_ADMIN", "SEKSI_PEMILIH", "PETUGAS_TPS", "PANTARLIH_LAPANGAN"],
        },
        {
          id: "dpt" as TabType,
          label: "1.2 Daftar Pemilih Tetap (DPT)",
          icon: UserCheck,
          badge: (dptCount || 0).toString(),
          badgeColor: (dptCount || 0) > 0 ? "bg-emerald-900/80 text-emerald-200 border-emerald-600/70 font-bold" : "bg-slate-800 text-slate-400 border-slate-700",
          allowedRoles: ["SUPER_ADMIN", "SEKSI_PEMILIH", "PETUGAS_TPS", "PANTARLIH_LAPANGAN"],
        },
        {
          id: "coklit" as TabType,
          label: "1.3 Coklit Lapangan (Koordinator RW)",
          icon: Sparkles,
          badge: "Coklit",
          badgeColor: "bg-amber-400 text-slate-950 font-black border-amber-300 animate-pulse",
          allowedRoles: ["SUPER_ADMIN", "SEKSI_PEMILIH", "PETUGAS_TPS", "PANTARLIH_LAPANGAN"],
        },
        {
          id: "petugas_dpt" as TabType,
          label: "Petugas Pendataan DPT",
          icon: UserCheck,
          badge: petugasCount > 0 ? `${petugasCount} Berkas` : "Rekrutmen",
          badgeColor: petugasCount > 0 ? "bg-blue-600 text-white font-bold" : "bg-slate-800 text-slate-400 border-slate-700",
          allowedRoles: ["SUPER_ADMIN", "SEKSI_PEMILIH", "SEKSI_PENJARINGAN", "SEKSI_PENYARINGAN"],
        },
        {
          id: "aduan" as TabType,
          label: "Aduan & Masukan Warga",
          icon: AlertTriangle,
          badge: aduanPendingCount > 0 ? `${aduanPendingCount} Baru` : "0",
          badgeColor:
            aduanPendingCount > 0
              ? "bg-amber-500 text-white font-bold animate-pulse"
              : "bg-slate-800 text-slate-300 border-slate-700",
          allowedRoles: ["SUPER_ADMIN", "SEKSI_PEMILIH"],
        },
        {
          id: "lock" as TabType,
          label: "Penetapan & Segel DPT Pleno",
          icon: Lock,
          badge: isDptLocked ? "Terkunci" : "Draft",
          badgeColor: isDptLocked
            ? "bg-rose-900/80 text-rose-200 border-rose-600/80"
            : "bg-amber-900/80 text-amber-200 border-amber-600/80",
          allowedRoles: ["SUPER_ADMIN", "SEKSI_PEMILIH"],
        },
        {
          id: "export" as TabType,
          label: "Buku Induk & Rekapitulasi",
          icon: FileSpreadsheet,
          badge: ".XLSX",
          badgeColor: "bg-emerald-900/80 text-emerald-200 border-emerald-600/70 font-bold",
          allowedRoles: ["SUPER_ADMIN", "SEKSI_PEMILIH"],
        },
      ],
    },
    {
      title: "2. WILAYAH RW & LOGISTIK",
      icon: Building2,
      color: "text-emerald-400",
      allowedRoles: ["SUPER_ADMIN", "SEKSI_PUNGUT_HITUNG", "SEKSI_LOGISTIK_PUBLIKASI", "PETUGAS_TPS", "PANTARLIH_LAPANGAN"],
      items: [
        {
          id: "tps" as TabType,
          label: "13 Meja Pendaftaran & Wilayah RW",
          icon: Building2,
          badge: `${tpsCount} Wilayah RW`,
          badgeColor: "bg-emerald-900/80 text-emerald-200 border-emerald-600/70",
          allowedRoles: ["SUPER_ADMIN", "SEKSI_PUNGUT_HITUNG", "SEKSI_LOGISTIK_PUBLIKASI"],
        },
        {
          id: "print" as TabType,
          label: "Pusat Cetak Dokumen & C6",
          icon: Printer,
          badge: "C6 & ID",
          badgeColor: "bg-cyan-900/80 text-cyan-200 border-cyan-600/70 font-bold",
          allowedRoles: ["SUPER_ADMIN", "SEKSI_LOGISTIK_PUBLIKASI", "PETUGAS_TPS", "PANTARLIH_LAPANGAN"],
        },
      ],
    },
    {
      title: "3. KEPANITIAAN & KEAMANAN",
      icon: Shield,
      color: "text-blue-400",
      allowedRoles: [
        "SUPER_ADMIN",
        "SEKSI_PEMILIH",
        "SEKSI_PENJARINGAN",
        "SEKSI_PENYARINGAN",
        "SEKSI_PUNGUT_HITUNG",
        "SEKSI_LOGISTIK_PUBLIKASI",
      ],
      items: [
        {
          id: "pengaturan_web" as TabType,
          label: "Pengaturan Website Publik",
          icon: Globe,
          badge: "Live",
          badgeColor: "bg-blue-600 text-white font-bold",
          allowedRoles: ["SUPER_ADMIN"],
        },
        {
          id: "anggota" as TabType,
          label: "Struktur Anggota & Akun P2KD",
          icon: Users,
          badge: `${anggotaCount} Panitia`,
          badgeColor: "bg-blue-900/80 text-blue-200 border-blue-600/70",
          allowedRoles: [
            "SUPER_ADMIN",
            "SEKSI_PEMILIH",
            "SEKSI_PENJARINGAN",
            "SEKSI_PENYARINGAN",
            "SEKSI_PUNGUT_HITUNG",
            "SEKSI_LOGISTIK_PUBLIKASI",
          ],
        },
        {
          id: "audit" as TabType,
          label: "Audit Trail & Log Aktivitas",
          icon: History,
          badge: `${auditCount} Log`,
          badgeColor: "bg-slate-800 text-slate-200 border-slate-700",
          allowedRoles: ["SUPER_ADMIN"],
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <Logo size="sm" showText subtitle="P2KD Kalisalak Dashboard" theme="dark" />
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Pill with Role-Based Badge */}
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/90 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  isAdmin
                    ? "bg-blue-600/30 border border-blue-400/50 text-blue-300 shadow-xs"
                    : userRole === "PETUGAS_TPS"
                    ? "bg-emerald-600/30 border border-emerald-400/50 text-emerald-300"
                    : "bg-indigo-600/30 border border-indigo-400/50 text-indigo-300"
                }`}
              >
                {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-white block truncate">
                  {userName}
                </span>
                <span className="text-[11px] text-slate-300 font-medium block truncate">
                  {userJabatan}
                </span>
              </div>
            </div>

            <span
              className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0 border ${
                isAdmin
                  ? "bg-blue-900/80 text-blue-200 border-blue-600/70"
                  : userRole === "PETUGAS_TPS"
                  ? "bg-emerald-900/80 text-emerald-200 border-emerald-600/70"
                  : "bg-indigo-900/80 text-indigo-200 border-indigo-600/70"
              }`}
            >
              {isAdmin ? "SUPERADMIN" : userRole === "PETUGAS_TPS" ? assignedTps : "SEKSI"}
            </span>
          </div>

          {/* Role Status Tagline */}
          <div className="text-[10px] text-slate-200 font-medium bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="truncate">
              {isAdmin
                ? "👁️ Mode Pimpinan: Semua Seksi Aktif"
                : userRole === "PETUGAS_TPS"
                ? `📍 Operasional Khusus ${assignedTps}`
                : `📋 Mode Khusus ${userJabatan}`}
            </span>
          </div>
        </div>

        {/* Navigation Menu with Section RBAC Protection */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {menuGroups.map((group, gIdx) => {
            // Check if group is allowed for current role
            const isGroupAllowed =
              isAdmin || group.allowedRoles.includes(userRole) || group.allowedRoles.includes(userSeksi);

            if (!isGroupAllowed) return null;

            // Filter items within group
            const visibleItems = group.items.filter((item) => {
              if (isAdmin) return true;
              return item.allowedRoles.includes(userRole) || item.allowedRoles.includes(userSeksi);
            });

            if (visibleItems.length === 0) return null;

            const GroupIcon = group.icon;

            return (
              <div key={gIdx} className="space-y-1.5">
                <div className="px-2.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                  <GroupIcon className={`w-3.5 h-3.5 ${group.color}`} />
                  <span>{group.title}</span>
                </div>

                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                          isActive
                            ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 font-bold border border-blue-400/40"
                            : "text-slate-200 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                              isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full border shrink-0 font-bold ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Database & System Info Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/90 space-y-2.5">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5 text-[10px]">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Status Database:
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus?.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
            </div>
            <div className="font-bold text-white text-xs">
              {dbStatus?.connected ? "Database Server Terpusat P2KD" : "Sistem Basis Data Server"}
            </div>
            {dbStatus?.latencyMs && (
              <div className="text-[9px] text-emerald-400 font-mono font-medium">
                Respon Server: {dbStatus.latencyMs}ms • Realtime Aktif
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className="flex-1">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Portal Publik</span>
              </button>
            </Link>

            <button
              onClick={onLogout}
              title="Keluar dari Akun"
              className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-200 hover:text-white border border-rose-700/60 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
