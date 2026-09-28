"use client";

import React from "react";
import {
  ClipboardCheck,
  LayoutGrid,
  UserCheck,
  Camera,
  User,
} from "lucide-react";
import { TabType } from "./types";

interface FieldBottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  userRole?: string;
  userSeksi?: string;
  assignedTps?: string;
  onOpenScanner: () => void;
}

export const FieldBottomNav: React.FC<FieldBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenScanner,
}) => {
  // 5 Native Navigation Menus for Petugas Pantarlih / Lapangan:
  // 1. Pemutakhiran (Coklit)
  // 2. Data Pemilih (Grid: Calon DPS - DPS - DPSHP - DPSHP Akhir)
  // 3. Camera (Langsung aktif kamera belakang)
  // 4. DPT
  // 5. Akun (Informasi Akun, Ganti Foto, Ganti Password, Logout)
  const navTabs = [
    {
      id: "coklit" as TabType,
      label: "Pemutakhiran",
      icon: ClipboardCheck,
    },
    {
      id: "pemilih" as TabType,
      label: "Calon DPS",
      icon: LayoutGrid,
    },
    {
      id: "camera",
      label: "Kamera",
      icon: Camera,
      isCenterAction: true,
    },
    {
      id: "dpt" as TabType,
      label: "DPT",
      icon: UserCheck,
    },
    {
      id: "akun" as TabType,
      label: "Akun",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl shadow-2xl print:hidden safe-area-bottom">
      <div className="max-w-lg mx-auto px-2 py-1.5 flex items-center justify-around">
        {navTabs.map((tab) => {
          const Icon = tab.icon;

          // 3. Center Raised Action Button (Scan QR Camera Belakang)
          if (tab.isCenterAction) {
            return (
              <div key={tab.id} className="relative -top-5 flex flex-col items-center">
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="relative group p-3.5 sm:p-4 rounded-full bg-linear-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white shadow-xl shadow-emerald-600/40 border-3 border-slate-950 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Aktifkan Kamera Belakang Scan QR C6 & Stiker"
                >
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <Icon className="w-6 h-6 text-white" />
                </button>
                <span className="text-[10px] font-black text-emerald-400 mt-1 uppercase tracking-tight">
                  {tab.label}
                </span>
              </div>
            );
          }

          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id as TabType)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "text-blue-400 font-black scale-105"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? "bg-blue-500/20 text-blue-400" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-bold truncate max-w-[65px] text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
