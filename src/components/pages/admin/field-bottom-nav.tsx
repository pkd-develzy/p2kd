"use client";

import React from "react";
import {
  ClipboardCheck,
  LayoutGrid,
  UserCheck,
  User,
} from "lucide-react";
import { TabType } from "./types";

interface FieldBottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  userRole?: string;
  userSeksi?: string;
  assignedTps?: string;
}

export const FieldBottomNav: React.FC<FieldBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  // Navigation Menus untuk Petugas Lapangan di Web Portal Administrasi:
  // 1. Pemutakhiran (Coklit Rekap)
  // 2. Data Pemilih (Calon DPS / DPSHP)
  // 3. Info APK Native (Aplikasi Coklit Android)
  // 4. DPT
  // 5. Akun
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
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-around">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
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
              <span className="text-[10px] tracking-tight mt-0.5 font-bold truncate max-w-16 text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
