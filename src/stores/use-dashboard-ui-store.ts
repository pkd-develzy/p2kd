import { create } from "zustand";
import { TabType } from "@/components/pages/admin/types";

interface DashboardUIState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  isScannerOpen: boolean;
  setScannerOpen: (open: boolean) => void;

  isAppLocked: boolean;
  setAppLocked: (locked: boolean) => void;

  isSyncModalOpen: boolean;
  setSyncModalOpen: (open: boolean) => void;

  isBackgroundSyncing: boolean;
  setBackgroundSyncing: (syncing: boolean) => void;

  searchTerm: string;
  setSearchTerm: (term: string) => void;

  selectedTpsFilter: string;
  setSelectedTpsFilter: (tps: string) => void;

  selectedStatusFilter: string;
  setSelectedStatusFilter: (status: string) => void;

  selectedAduanFilter: string;
  setSelectedAduanFilter: (filter: string) => void;

  currentCoklitTps: string;
  setCurrentCoklitTps: (tps: string) => void;
}

export const useDashboardUIStore = create<DashboardUIState>((set) => ({
  activeTab: "dashboard",
  setActiveTab: (tab) => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("p2kd_active_tab", tab);
      } catch {}
    }
    set({ activeTab: tab });
  },

  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  isScannerOpen: false,
  setScannerOpen: (open) => set({ isScannerOpen: open }),

  isAppLocked: false,
  setAppLocked: (locked) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("p2kd_app_locked", locked ? "true" : "false");
      } catch {}
    }
    set({ isAppLocked: locked });
  },

  isSyncModalOpen: false,
  setSyncModalOpen: (open) => set({ isSyncModalOpen: open }),

  isBackgroundSyncing: false,
  setBackgroundSyncing: (syncing) => set({ isBackgroundSyncing: syncing }),

  searchTerm: "",
  setSearchTerm: (term) => set({ searchTerm: term }),

  selectedTpsFilter: "SEMUA",
  setSelectedTpsFilter: (tps) => set({ selectedTpsFilter: tps }),

  selectedStatusFilter: "SEMUA",
  setSelectedStatusFilter: (status) => set({ selectedStatusFilter: status }),

  selectedAduanFilter: "SEMUA",
  setSelectedAduanFilter: (filter) => set({ selectedAduanFilter: filter }),

  currentCoklitTps: "SEMUA",
  setCurrentCoklitTps: (tps) => set({ currentCoklitTps: tps }),
}));
