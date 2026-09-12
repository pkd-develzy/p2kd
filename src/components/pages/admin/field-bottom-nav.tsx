"use client";

import React from "react";
import {
  Sparkles,
  Users,
  UserCheck,
  FileSpreadsheet,
  BarChart3,
  Printer,
  Building2,
  QrCode,
  Camera,
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
  userRole = "PANTARLIH_LAPANGAN",
  userSeksi = "SEKSI_PEMILIH",
  assignedTps = "RW 01",
  onOpenScanner,
}) => {
  const isPps =
    userRole === "PETUGAS_TPS" ||
    userSeksi === "SEKSI_PUNGUT_HITUNG" ||
    assignedTps.toLowerCase().includes("meja");

  // 1. Pantarlih Navigation Tabs
  const pantarlihTabs = [
    { id: "coklit" as TabType, label: "Coklit RW", icon: Sparkles },
    { id: "pemilih" as TabType, label: "DPS RW", icon: Users },
    { id: "SCANNER", label: "Scan Stiker", icon: Camera, isCenterAction: true },
    { id: "dpt" as TabType, label: "DPT Sah", icon: UserCheck },
    { id: "export" as TabType, label: "Rekap RW", icon: FileSpreadsheet },
  ];

  // 2. PPS / KPPS Navigation Tabs
  const ppsTabs = [
    { id: "dpt" as TabType, label: "DPT RW", icon: UserCheck },
    { id: "export" as TabType, label: "Rekap RW", icon: FileSpreadsheet },
    { id: "SCANNER", label: "Scan C6", icon: QrCode, isCenterAction: true },
    { id: "print" as TabType, label: "Form C6", icon: Printer },
    { id: "tps" as TabType, label: "Wilayah RW", icon: Building2 },
  ];

  const currentTabs = isPps ? ppsTabs : pantarlihTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl shadow-2xl print:hidden">
      <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-around">
        {currentTabs.map((tab) => {
          const Icon = tab.icon;

          // Center Raised Action Button (Scan QR Camera)
          if (tab.isCenterAction) {
            return (
              <div key={tab.id} className="relative -top-5 flex flex-col items-center">
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="relative group p-4 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white shadow-xl shadow-emerald-600/40 border-3 border-slate-950 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Scan QR Code Kamera Belakang"
                >
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <Icon className="w-6 h-6 text-white" />
                </button>
                <span className="text-[9.5px] font-black text-emerald-400 mt-1 uppercase tracking-tight">
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
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "text-blue-400 font-black scale-105"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? "bg-blue-500/20 text-blue-300" : ""}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[9.5px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
