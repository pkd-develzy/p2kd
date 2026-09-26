/**
 * Secure Device Cache using Web Crypto API & IndexedDB
 * 
 * Arsitektur:
 * - Storage: IndexedDB (Database: "p2kd_secure_vault")
 * - Enkripsi: AES-GCM 256-bit (Web Crypto API)
 * - Initialization Vector (IV): 12-byte random per-operasi / per-record
 * - Encryption Key: Non-extractable CryptoKey (extractable: false)
 * - Key Storage: Disimpan sebagai CryptoKey object (structured clone) di IndexedDB "_session_keys"
 * - Namespace: Berdasarkan identitas sesi (userId, role, instansi)
 * - Cross-Tab Sync: BroadcastChannel ("p2kd_secure_vault_sync")
 * - Cleanup: Pembersihan total ciphertext dan session key saat logout (dengan blok finally)
 */

import { Voter } from "@/components/pages/admin/types";

export interface SecureCacheRecord {
  compositeKey: string;
  namespace: string;
  cacheKey: string;
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
  timestamp: number;
  version: number;
}

export interface SessionKeyRecord {
  sessionId: string;
  namespace: string;
  key: CryptoKey;
  createdAt: number;
}

const DB_NAME = "p2kd_secure_vault";
const DB_VERSION = 1;
const STORE_RECORDS = "encrypted_records";
const STORE_KEYS = "session_keys";
const BROADCAST_CHANNEL_NAME = "p2kd_secure_vault_sync";
const CACHE_VERSION = 1;

// Logging Helper (Development only - sensitive data such as full NIK is strictly masked)
function devLog(action: string, detail?: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[SECURE-CACHE] ${action}${detail ? `: ${detail}` : ""}`);
  }
}

function maskKeyForLog(key: string): string {
  if (key.includes("nik:")) {
    const parts = key.split("nik:");
    const nik = parts[1] || "";
    return `nik:${nik.slice(0, 4)}********${nik.slice(-4)}`;
  }
  return key;
}

export class SecureDeviceCache {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  private static keyCache = new Map<string, CryptoKey>();
  private static broadcastChannel: BroadcastChannel | null = null;
  private static isInitialized = false;

  /**
   * Cek apakah lingkungan browser mendukung IndexedDB dan Web Crypto API
   */
  public static isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.crypto !== "undefined" &&
      typeof window.crypto.subtle !== "undefined" &&
      typeof window.indexedDB !== "undefined"
    );
  }

  /**
   * Buka atau inisialisasi IndexedDB
   */
  private static async getDb(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      throw new Error("Web Crypto API atau IndexedDB tidak didukung pada lingkungan ini.");
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_RECORDS)) {
          const recordStore = db.createObjectStore(STORE_RECORDS, { keyPath: "compositeKey" });
          recordStore.createIndex("by_namespace", "namespace", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_KEYS)) {
          db.createObjectStore(STORE_KEYS, { keyPath: "sessionId" });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        // Tangani jika database ditutup tiba-tiba
        db.onversionchange = () => {
          db.close();
          this.dbPromise = null;
        };
        this.initBroadcastChannel();
        resolve(db);
      };

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Inisialisasi BroadcastChannel untuk sinkronisasi antar-tab
   */
  private static initBroadcastChannel() {
    if (this.isInitialized || typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      return;
    }

    try {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.broadcastChannel.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.type) return;

        if (data.type === "LOGOUT") {
          devLog("SESSION CACHE CLEARED (Cross-Tab Broadcast)");
          this.keyCache.clear();
          // Hapus in-memory referensi
        } else if (data.type === "CACHE_INVALIDATED") {
          devLog("CACHE INVALIDATED (Cross-Tab Broadcast)", data.namespace);
          this.keyCache.delete(data.namespace);
        }
      };
      this.isInitialized = true;
    } catch {
      // Fallback jika browser membatasi BroadcastChannel
    }
  }

  /**
   * Bangun namespace unik berdasarkan identitas sesi pengguna (userId, role, instansi)
   */
  public static buildNamespace(user?: { username?: string; role?: string; instansi?: string }): string {
    const userId = (user?.username || "anon").toLowerCase().trim();
    const role = (user?.role || "guest").toLowerCase().trim();
    const instansi = (user?.instansi || "p2kd_kalisalak").toLowerCase().trim();
    return `pemilih-v${CACHE_VERSION}-user-${userId}-role-${role}-instansi-${instansi}`;
  }

  /**
   * Ambil atau generate non-extractable 256-bit AES-GCM CryptoKey untuk sesi aktif
   */
  private static async getOrCreateSessionKey(namespace: string): Promise<CryptoKey> {
    if (this.keyCache.has(namespace)) {
      return this.keyCache.get(namespace)!;
    }

    const db = await this.getDb();

    // 1. Coba baca CryptoKey yang tersimpan di IndexedDB
    const existing = await new Promise<SessionKeyRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_KEYS, "readonly");
      const store = tx.objectStore(STORE_KEYS);
      const req = store.get(namespace);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (existing && existing.key) {
      this.keyCache.set(namespace, existing.key);
      return existing.key;
    }

    // 2. Generate kunci baru jika belum ada: AES-GCM 256-bit, Non-extractable (extractable: false)
    const newKey = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      false, // non-extractable!
      ["encrypt", "decrypt"]
    );

    // 3. Simpan ke IndexedDB sebagai objek CryptoKey langsung (Structured Clone)
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_KEYS, "readwrite");
      const store = tx.objectStore(STORE_KEYS);
      const record: SessionKeyRecord = {
        sessionId: namespace,
        namespace,
        key: newKey,
        createdAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    this.keyCache.set(namespace, newKey);
    return newKey;
  }

  /**
   * Enkripsi dan simpan nilai ke IndexedDB (AES-GCM 256-bit + Random IV)
   */
  public static async set(namespace: string, key: string, value: unknown): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const sessionKey = await this.getOrCreateSessionKey(namespace);
      const db = await this.getDb();

      // Encode payload ke UTF-8 ArrayBuffer
      const jsonString = JSON.stringify(value);
      const encodedData = new TextEncoder().encode(jsonString);

      // Buat IV acak 12-byte (96-bit) unik per operasi enkripsi
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Eksekusi enkripsi AES-GCM 256-bit
      const ciphertext = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
        },
        sessionKey,
        encodedData
      );

      const compositeKey = `${namespace}:::${key}`;
      const record: SecureCacheRecord = {
        compositeKey,
        namespace,
        cacheKey: key,
        iv,
        ciphertext,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_RECORDS, "readwrite");
        const store = tx.objectStore(STORE_RECORDS);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      devLog("CACHE WRITE", maskKeyForLog(key));
    } catch (err) {
      console.warn("[SECURE-CACHE] Gagal mengenkripsi dan menyimpan data ke IndexedDB:", err);
    }
  }

  /**
   * Ambil dan dekripsi nilai dari IndexedDB
   */
  public static async get<T>(namespace: string, key: string): Promise<T | null> {
    if (!this.isSupported()) return null;

    try {
      const db = await this.getDb();
      const compositeKey = `${namespace}:::${key}`;

      const record = await new Promise<SecureCacheRecord | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_RECORDS, "readonly");
        const store = tx.objectStore(STORE_RECORDS);
        const req = store.get(compositeKey);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (!record || !record.ciphertext || !record.iv) {
        devLog("CACHE MISS", maskKeyForLog(key));
        return null;
      }

      // Ambil session CryptoKey untuk dekripsi
      const sessionKey = await this.getOrCreateSessionKey(namespace);

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: new Uint8Array(record.iv) as unknown as BufferSource,
        },
        sessionKey,
        record.ciphertext as unknown as BufferSource
      );

      const decodedString = new TextDecoder().decode(decrypted);
      const parsedData = JSON.parse(decodedString) as T;

      devLog("CACHE HIT", maskKeyForLog(key));
      return parsedData;
    } catch {
      devLog("CACHE MISS (Decryption Failed / Expired Key)", maskKeyForLog(key));
      return null;
    }
  }

  /**
   * Hapus single cache record
   */
  public static async delete(namespace: string, key: string): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const db = await this.getDb();
      const compositeKey = `${namespace}:::${key}`;

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_RECORDS, "readwrite");
        const store = tx.objectStore(STORE_RECORDS);
        const req = store.delete(compositeKey);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Invalidate seluruh data dalam namespace (misal saat data pemilih diubah)
   */
  public static async clearNamespace(namespace: string): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const db = await this.getDb();

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_RECORDS, "readwrite");
        const store = tx.objectStore(STORE_RECORDS);
        const index = store.index("by_namespace");
        const req = index.openCursor(IDBKeyRange.only(namespace));

        req.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        req.onerror = () => reject(req.error);
      });

      this.keyCache.delete(namespace);
      devLog("CACHE INVALIDATED", namespace);

      // Siarkan ke tab lain
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: "CACHE_INVALIDATED", namespace });
      }
    } catch (err) {
      console.warn("[SECURE-CACHE] Gagal membersihkan namespace:", err);
    }
  }

  /**
   * Logout Cleanup: Menghapus SELURUH ciphertext dan encryption key dari IndexedDB
   * Wajib dipanggil dalam blok finally saat logout pengguna.
   */
  public static async clearSession(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const db = await this.getDb();

      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_RECORDS, "readwrite");
          const store = tx.objectStore(STORE_RECORDS);
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        }),
        new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_KEYS, "readwrite");
          const store = tx.objectStore(STORE_KEYS);
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        }),
      ]);

      this.keyCache.clear();
      devLog("SESSION CACHE CLEARED");

      // Kirim event logout ke seluruh tab lain
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: "LOGOUT" });
      }
    } catch (err) {
      console.warn("[SECURE-CACHE] Gagal membersihkan session cache pada logout:", err);
    }
  }
}

// =====================================================================
// INTEGRATED VOTER DATA CLIENT SERVICE (LAZY LOADING & ENCRYPTED CACHE)
// =====================================================================

export interface PagedVotersResult {
  data: Voter[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Mengambil data pemilih secara paged (default 100 record, max 200 record).
 * Pola:
 * 1. Cek encrypted IndexedDB terlebih dahulu.
 * 2. Jika HIT dan berada dalam sesi login, kembalikan instan (0ms).
 * 3. Jika MISS, request ke endpoint API / Supabase.
 * 4. Hasil langsung dienkripsi dan disimpan ke IndexedDB.
 */
export async function fetchPemilihPaged(
  offset = 0,
  limit = 100,
  filter?: { tps?: string; statusAktif?: string; tahap?: string },
  userContext?: { username?: string; role?: string; instansi?: string }
): Promise<PagedVotersResult> {
  const safeLimit = Math.min(1000, Math.max(1, limit));
  const namespace = SecureDeviceCache.buildNamespace(userContext);
  const cacheKey = `paged:offset_${offset}:limit_${safeLimit}:tps_${filter?.tps || "ALL"}:status_${filter?.statusAktif || "ALL"}:tahap_${filter?.tahap || "ALL"}`;

  // 1. Cek Cache Perangkat Terenkripsi
  const cached = await SecureDeviceCache.get<PagedVotersResult>(namespace, cacheKey);
  if (cached && Array.isArray(cached.data)) {
    return cached;
  }

  // 2. Request ke Server / API
  devLog("SUPABASE REQUEST", `fetchPemilihPaged (offset=${offset}, limit=${safeLimit})`);
  const queryParams = new URLSearchParams({
    offset: String(offset),
    limit: String(safeLimit),
    ...(filter?.tps && filter.tps !== "SEMUA" ? { tps: filter.tps } : {}),
    ...(filter?.statusAktif && filter.statusAktif !== "SEMUA" ? { status: filter.statusAktif } : {}),
    ...(filter?.tahap && filter.tahap !== "SEMUA" ? { tahap: filter.tahap } : {}),
  });

  const res = await fetch(`/api/admin/pemilih?${queryParams.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Gagal memuat data pemilih (HTTP ${res.status})`);
  }

  const json = await res.json();
  const result: PagedVotersResult = {
    data: Array.isArray(json.data) ? json.data : [],
    total: typeof json.total === "number" ? json.total : 0,
    limit: safeLimit,
  };

  // 3. Simpan hasil terenkripsi ke IndexedDB
  await SecureDeviceCache.set(namespace, cacheKey, result);

  return result;
}

/**
 * Mencari data pemilih (search) dengan server-side lookup dan encrypted caching.
 */
export async function searchPemilih(
  query: string,
  options?: { tps?: string; limit?: number },
  userContext?: { username?: string; role?: string; instansi?: string }
): Promise<Voter[]> {
  const clean = query.trim();
  if (!clean) return [];

  const limit = Math.min(200, options?.limit || 100);
  const namespace = SecureDeviceCache.buildNamespace(userContext);
  const cacheKey = `search:${clean.toLowerCase()}:tps_${options?.tps || "ALL"}:limit_${limit}`;

  // 1. Cek Cache
  const cached = await SecureDeviceCache.get<Voter[]>(namespace, cacheKey);
  if (cached && Array.isArray(cached)) {
    return cached;
  }

  // 2. Query ke Server
  devLog("SUPABASE REQUEST", `searchPemilih (query="${clean.length === 16 ? maskKeyForLog(`nik:${clean}`) : clean}")`);
  const queryParams = new URLSearchParams({
    search: clean,
    limit: String(limit),
    ...(options?.tps && options.tps !== "SEMUA" ? { tps: options.tps } : {}),
  });

  const res = await fetch(`/api/admin/pemilih?${queryParams.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    return [];
  }

  const json = await res.json();
  const data: Voter[] = Array.isArray(json.data) ? json.data : [];

  // 3. Enkripsi dan simpan ke cache
  await SecureDeviceCache.set(namespace, cacheKey, data);

  return data;
}

/**
 * Pencarian tunggal NIK secara tepat (exact lookup)
 */
export async function findPemilihDirect(
  nik: string,
  userContext?: { username?: string; role?: string; instansi?: string }
): Promise<Voter | null> {
  const clean = String(nik || "").replace(/\D/g, "");
  if (clean.length !== 16) return null;

  const namespace = SecureDeviceCache.buildNamespace(userContext);
  const cacheKey = `direct_nik:${clean}`;

  // 1. Cek Cache
  const cached = await SecureDeviceCache.get<Voter>(namespace, cacheKey);
  if (cached && cached.nik) {
    return cached;
  }

  // 2. Request ke Server
  devLog("SUPABASE REQUEST", `findPemilihDirect (${maskKeyForLog(`nik:${clean}`)})`);
  const queryParams = new URLSearchParams({
    search: clean,
    limit: "1",
  });

  const res = await fetch(`/api/admin/pemilih?${queryParams.toString()}`, { cache: "no-store" });
  if (!res.ok) return null;

  const json = await res.json();
  const list: Voter[] = Array.isArray(json.data) ? json.data : [];
  const found = list.find((v) => v.nik === clean) || list[0] || null;

  if (found) {
    await SecureDeviceCache.set(namespace, cacheKey, found);
  }

  return found;
}

/**
 * Membersihkan seluruh cache sesi pada perangkat saat logout
 */
export async function clearDeviceSessionCache(): Promise<void> {
  await SecureDeviceCache.clearSession();
}

/**
 * Invalidate cache pemilih saat terjadi mutasi data
 */
export async function invalidateVoterCache(userContext?: { username?: string; role?: string; instansi?: string }): Promise<void> {
  const namespace = SecureDeviceCache.buildNamespace(userContext);
  await SecureDeviceCache.clearNamespace(namespace);
}
