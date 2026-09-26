/**
 * Sync Engine for Authenticated P2KD Users
 * 
 * Mengatur:
 * 1. Initial Full Sync saat login pertama (batch 1.000 record dengan progress bar informatif).
 * 2. Background Incremental Sync (hanya mengunduh data yang berubah/dihapus via sync cursor).
 * 3. Integrasi otomatis ke EncryptedLocalDb dan LocalRepositories.
 */

import { Voter, TPSItem, AnggotaP2KD, Aduan } from "@/components/pages/admin/types";
import { EncryptedLocalDb } from "./encrypted-local-db";
import {
  LocalPemilihRepository,
  LocalTPSRepository,
  LocalAnggotaRepository,
  LocalAduanRepository,
} from "./local-repositories";

export interface SyncProgress {
  stage: string;
  detail?: string;
  current: number;
  total: number;
  percent: number;
  isComplete: boolean;
  error?: string;
}

export class SyncEngine {
  private static isSyncing = false;
  private static lastSyncTimestamp: string | null = null;

  public static isRunning(): boolean {
    return this.isSyncing;
  }

  /**
   * Menjalankan Initial Full Sync (Diunduh per batch 1.000 record agar tidak memicu memory spike)
   */
  public static async runInitialSync(
    userContext: { username?: string; role?: string; instansi?: string },
    onProgress?: (progress: SyncProgress) => void
  ): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;

    const namespace = EncryptedLocalDb.buildNamespace(userContext);

    try {
      // 1. Inisialisasi Kunci Sesi Kriptografi
      onProgress?.({
        stage: "Menyiapkan sistem keamanan & database lokal...",
        detail: "Membuat session encryption key non-extractable (AES-GCM 256-bit)...",
        current: 0,
        total: 100,
        percent: 5,
        isComplete: false,
      });

      await EncryptedLocalDb.getOrCreateSessionKey(namespace);

      // 2. Unduh Metadata (TPS, Anggota, Aduan, Berita, dll)
      onProgress?.({
        stage: "Mengunduh master wilayah & struktur kepanitian...",
        detail: "Sinkronisasi TPS, Anggota P2KD, dan Konfigurasi...",
        current: 10,
        total: 100,
        percent: 15,
        isComplete: false,
      });

      const metaRes = await fetch("/api/admin/sync?type=meta", { cache: "no-store" });
      if (metaRes.ok) {
        const metaJson = await metaRes.json();
        if (metaJson.success && metaJson.data) {
          const { tpsList, anggotaList, aduanList, beritaList, pengumumanList, kandidatList } = metaJson.data;

          if (Array.isArray(tpsList)) await LocalTPSRepository.setAll(tpsList as TPSItem[], namespace);
          if (Array.isArray(anggotaList)) await LocalAnggotaRepository.setAll(anggotaList as AnggotaP2KD[], namespace);
          if (Array.isArray(aduanList)) await LocalAduanRepository.setAll(aduanList as Aduan[], namespace);

          if (Array.isArray(beritaList)) await EncryptedLocalDb.putEncryptedBatch(namespace, "BERITA", beritaList);
          if (Array.isArray(pengumumanList)) await EncryptedLocalDb.putEncryptedBatch(namespace, "PENGUMUMAN", pengumumanList);
          if (Array.isArray(kandidatList)) await EncryptedLocalDb.putEncryptedBatch(namespace, "KANDIDAT", kandidatList);
        }
      }

      // 3. Unduh Dataset Pemilih secara Tersegmentasi (Batch 1.000 record per request)
      let batch = 0;
      let hasMore = true;
      let totalVoters = 7787;
      let loadedVoters: Voter[] = [];
      let latestServerTimestamp = new Date().toISOString();

      while (hasMore) {
        const res = await fetch(`/api/admin/sync?type=initial&batch=${batch}&limit=1000`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Gagal mengunduh batch data pemilih ke-${batch + 1} (HTTP ${res.status})`);
        }

        const json = await res.json();
        if (!json.success || !Array.isArray(json.data)) {
          throw new Error(json.message || "Format data batch tidak valid.");
        }

        totalVoters = typeof json.total === "number" ? json.total : totalVoters;
        hasMore = Boolean(json.hasMore);
        latestServerTimestamp = json.serverTimestamp || latestServerTimestamp;

        const currentBatchData: Voter[] = json.data;
        loadedVoters = loadedVoters.concat(currentBatchData);

        // Langsung simpan batch terenkripsi ke IndexedDB
        await EncryptedLocalDb.putEncryptedBatch(namespace, "PEMILIH", currentBatchData);

        const currentCount = loadedVoters.length;
        const voterProgressPercent = 15 + Math.round((currentCount / Math.max(1, totalVoters)) * 80);

        onProgress?.({
          stage: "Mengunduh & mengenkripsi data pemilih...",
          detail: `${currentCount.toLocaleString("id-ID")} dari ${totalVoters.toLocaleString("id-ID")} data pemilih tersimpan aman`,
          current: currentCount,
          total: totalVoters,
          percent: Math.min(95, voterProgressPercent),
          isComplete: false,
        });

        batch += 1;
      }

      // 4. Inisialisasi in-memory repository untuk navigasi kilat (0ms)
      await LocalPemilihRepository.loadFromLocalDb(namespace);

      // 5. Simpan Sync Cursor State
      this.lastSyncTimestamp = latestServerTimestamp;
      await EncryptedLocalDb.setSyncState({
        id: "server-1",
        namespace,
        lastSyncAt: latestServerTimestamp,
        lastSyncVersion: 1,
        totalRecords: loadedVoters.length,
        updatedAt: Date.now(),
      });

      onProgress?.({
        stage: "Sinkronisasi selesai!",
        detail: `Seluruh ${loadedVoters.length.toLocaleString("id-ID")} data pemilih siap digunakan secara lokal`,
        current: totalVoters,
        total: totalVoters,
        percent: 100,
        isComplete: true,
      });

      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat sinkronisasi.";
      console.error("[SYNC-ENGINE] Initial sync error:", err);
      onProgress?.({
        stage: "Sinkronisasi gagal",
        detail: errMsg,
        current: 0,
        total: 100,
        percent: 0,
        isComplete: false,
        error: errMsg,
      });
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Menjalankan Background Incremental Sync (Hanya data yang berubah / dihapus)
   */
  public static async runIncrementalSync(
    userContext: { username?: string; role?: string; instansi?: string }
  ): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;

    const namespace = EncryptedLocalDb.buildNamespace(userContext);

    try {
      const syncState = await EncryptedLocalDb.getSyncState(namespace, "server-1");
      const since = syncState?.lastSyncAt || this.lastSyncTimestamp || new Date(Date.now() - 3600000).toISOString();

      const res = await fetch(`/api/admin/sync?type=incremental&since=${encodeURIComponent(since)}`, {
        cache: "no-store",
      });

      if (!res.ok) return false;

      const json = await res.json();
      if (!json.success) return false;

      const { updated, deletedIds, serverTimestamp } = json;

      // 1. Terapkan pembaruan record
      if (Array.isArray(updated) && updated.length > 0) {
        await LocalPemilihRepository.upsertBatch(updated, namespace);
      }

      // 2. Terapkan penghapusan record
      if (Array.isArray(deletedIds) && deletedIds.length > 0) {
        for (const id of deletedIds) {
          await LocalPemilihRepository.delete(id, namespace);
        }
      }

      // 3. Perbarui cursor sync
      this.lastSyncTimestamp = serverTimestamp;
      await EncryptedLocalDb.setSyncState({
        id: "server-1",
        namespace,
        lastSyncAt: serverTimestamp,
        lastSyncVersion: (syncState?.lastSyncVersion || 1) + 1,
        totalRecords: LocalPemilihRepository.getCount(),
        updatedAt: Date.now(),
      });

      return true;
    } catch (err) {
      console.warn("[SYNC-ENGINE] Incremental sync error:", err);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }
}
