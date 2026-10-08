import { QueryClient } from "@tanstack/react-query";
import { dexieVault } from "./dexie-vault";
import { EncryptedLocalDb } from "./encrypted-local-db";
import { clearDeviceSessionCache } from "./secure-device-cache";

export const CACHE_VERSION = "v2_2026_10";

/**
 * Factory query key yang konsisten dan ternormalisasi.
 * Parameter kosong/tidak terdefinisi dihilangkan agar request serupa tidak menghasilkan query key ganda.
 */
export const queryKeys = {
  all: ["p2kd", CACHE_VERSION] as const,

  stats: (scope = "main") => [...queryKeys.all, "stats", scope] as const,

  user: (userId = "current") => [...queryKeys.all, "user", userId] as const,

  sessions: (username = "all") => [...queryKeys.all, "sessions", username] as const,

  config: () => [...queryKeys.all, "config"] as const,

  tpsList: () => [...queryKeys.all, "tabung_wilayah"] as const,

  /**
   * Normalizes filter parameters to guarantee identical query keys
   */
  pemilihList: (userScope: string, page: number, limit: number, filter: Record<string, unknown> = {}) => {
    const cleanFilter: Record<string, unknown> = {};
    Object.keys(filter)
      .sort()
      .forEach((k) => {
        const val = filter[k];
        if (val !== undefined && val !== null && val !== "" && val !== "SEMUA") {
          cleanFilter[k] = val;
        }
      });
    return [
      ...queryKeys.all,
      "pemilih",
      "list",
      userScope || "public",
      { page, limit, filter: cleanFilter },
    ] as const;
  },

  pemilihDetail: (id: string) => ["pemilih-detail", id] as const,
};

/**
 * Inisialisasi QueryClient dengan aturan caching berlapis
 */
export function createIntelligentQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 menit data dianggap segar (fresh)
        gcTime: 60 * 60 * 1000, // 1 jam disimpan di memory cache
        refetchOnWindowFocus: false, // Jangan request ulang hanya karena pindah tab browser
        refetchOnReconnect: "always", // Validasi otomatis saat jaringan pulih
        retry: 1, // Batasi retry agar tidak membanjiri server saat offline
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

/**
 * PEMBERSIHAN TOTAL CACHE SAAT LOGOUT:
 * Menghapus cache TanStack Query, IndexedDB Dexie vault, session keys, dan memori
 */
export async function wipeAllSessionCaches(
  queryClient?: QueryClient | null,
  sessionId?: string
): Promise<void> {
  // 1. Batalkan semua query aktif & bersihkan memori TanStack Query
  if (queryClient) {
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
    } catch {}
  }

  // 2. Bersihkan IndexedDB Dexie & Encrypted Vault
  try {
    if (typeof window !== "undefined" && dexieVault) {
      await dexieVault.wipeSessionVault();
    }
    await EncryptedLocalDb.clearSession();
    await clearDeviceSessionCache();
  } catch (err) {
    console.warn("[CACHE-WIPE] Dexie / IndexedDB wipe notice:", err);
  }

  // 3. Notifikasi backend untuk menutup sesi di PostgreSQL
  if (sessionId) {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch {}
  }

  // 4. Bersihkan token & storage yang tersisa di browser
  if (typeof window !== "undefined") {
    try {
      const keys = [
        "admin_token",
        "admin_user_data",
        "p2kd_session_id",
        "p2kd_device_id",
        "p2kd_admin_dashboard_cache",
        "p2kd_active_tab",
        "p2kd_last_activity",
      ];
      keys.forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    } catch {}
  }
}
