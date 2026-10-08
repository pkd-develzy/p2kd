import { EncryptedLocalDb } from "@/lib/encrypted-local-db";
import { clearDeviceSessionCache } from "@/lib/secure-device-cache";
import {
  LocalPemilihRepository,
  LocalTPSRepository,
  LocalAnggotaRepository,
  LocalAduanRepository,
} from "@/lib/local-repositories";

export async function performSecureLogout(): Promise<void> {
  let sessionId: string | undefined;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("admin_user_data");
      sessionId = raw ? JSON.parse(raw).sessionId : localStorage.getItem("p2kd_session_id") || undefined;
    } catch {}
  }

  try {
    const { wipeAllSessionCaches } = await import("@/lib/cache-query-client");
    await wipeAllSessionCaches(null, sessionId);
  } catch {
    // Fallback if dynamic import fails
  }

  try {
    await fetch("/api/admin/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  } catch {
    // Ignore network error during logout
  } finally {
    // 1. Clear IndexedDB ciphertext, sync_state, keys, and Dexie vault
    try {
      await EncryptedLocalDb.clearSession();
      await clearDeviceSessionCache();
      if (typeof window !== "undefined") {
        const { dexieVault } = await import("@/lib/dexie-vault");
        if (dexieVault) {
          await dexieVault.wipeSessionVault();
        }
      }
    } catch {}

    // 2. Clear in-memory local repositories
    LocalPemilihRepository.clear();
    LocalTPSRepository.clear();
    LocalAnggotaRepository.clear();
    LocalAduanRepository.clear();

    // 3. Clear session tokens and cache from browser storage
    if (typeof window !== "undefined") {
      try {
        const keysToRemove = [
          "admin_token",
          "admin_user_data",
          "p2kd_admin_dashboard_cache",
          "p2kd_petugas_dpt_cache",
          "p2kd_calon_kades_cache",
          "p2kd_berita_cache",
          "p2kd_remembered_account",
          "p2kd_app_locked",
          "p2kd_last_activity",
          "p2kd_active_tab",
        ];
        keysToRemove.forEach((k) => {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        });
      } catch {}
    }
  }
}
