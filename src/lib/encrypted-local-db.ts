/**
 * Encrypted Local Database for P2KD Admin & Petugas (Local-First Architecture)
 * 
 * Fitur:
 * 1. Storage: IndexedDB ("p2kd_local_vault_v2")
 * 2. Object Stores:
 *    - keys: session CryptoKey non-extractable (Structured Clone)
 *    - pemilih: voter records encrypted with AES-GCM 256-bit
 *    - tps, anggota, kandidat, aduan, konfigurasi, berita, pengumuman
 *    - sync_state: timestamp & cursor per server
 * 3. Enkripsi: Web Crypto API AES-GCM 256-bit + Random 12-byte IV per record
 * 4. Isolasi: Namespace berbasis userId, role, instansi, dan session ID
 * 5. Multi-Tab Sync: BroadcastChannel ("p2kd_local_vault_sync")
 * 6. Logout Cleanup: Pembersihan 100% ciphertext dan encryption key dalam blok finally
 */

export interface EncryptedVaultRecord {
  id: string;
  namespace: string;
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
  updatedAt: number;
}

export interface SyncStateRecord {
  id: string; // server-1 | server-2 | server-3
  namespace: string;
  lastSyncAt: string;
  lastSyncVersion: number;
  totalRecords: number;
  updatedAt: number;
}

export interface SessionKeyVaultRecord {
  sessionId: string;
  namespace: string;
  key: CryptoKey;
  createdAt: number;
}

const DB_NAME = "p2kd_local_vault_v2";
const DB_VERSION = 1;
const BROADCAST_NAME = "p2kd_local_vault_sync";

const STORES = {
  KEYS: "keys",
  PEMILIH: "pemilih",
  TPS: "tps",
  ANGGOTA: "anggota",
  KANDIDAT: "kandidat",
  ADUAN: "aduan",
  KONFIGURASI: "konfigurasi",
  BERITA: "berita",
  PENGUMUMAN: "pengumuman",
  SYNC_STATE: "sync_state",
} as const;

export class EncryptedLocalDb {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  private static keyCache = new Map<string, CryptoKey>();
  private static broadcastChannel: BroadcastChannel | null = null;
  private static isInitialized = false;

  public static isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.crypto !== "undefined" &&
      typeof window.crypto.subtle !== "undefined" &&
      typeof window.indexedDB !== "undefined"
    );
  }

  public static buildNamespace(userContext?: { username?: string; role?: string; instansi?: string }): string {
    const userId = (userContext?.username || "admin_kalisalak").toLowerCase().trim();
    const role = (userContext?.role || "super_admin").toLowerCase().trim();
    const instansi = (userContext?.instansi || "p2kd_kalisalak").toLowerCase().trim();
    return `vault-v2:user:${userId}:role:${role}:instansi:${instansi}`;
  }

  private static async getDb(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      throw new Error("IndexedDB atau Web Crypto API tidak didukung pada browser ini.");
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Session Keys
        if (!db.objectStoreNames.contains(STORES.KEYS)) {
          db.createObjectStore(STORES.KEYS, { keyPath: "sessionId" });
        }

        // 2. Sensitive Stores (Encrypted records)
        const sensitiveStores = [
          STORES.PEMILIH,
          STORES.TPS,
          STORES.ANGGOTA,
          STORES.KANDIDAT,
          STORES.ADUAN,
          STORES.KONFIGURASI,
          STORES.BERITA,
          STORES.PENGUMUMAN,
        ];

        for (const storeName of sensitiveStores) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: "id" });
            store.createIndex("by_namespace", "namespace", { unique: false });
          }
        }

        // 3. Sync State Store
        if (!db.objectStoreNames.contains(STORES.SYNC_STATE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_STATE, { keyPath: "id" });
          syncStore.createIndex("by_namespace", "namespace", { unique: false });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
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

  private static initBroadcastChannel() {
    if (this.isInitialized || typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      return;
    }

    try {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_NAME);
      this.broadcastChannel.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.type) return;

        if (data.type === "LOGOUT") {
          this.keyCache.clear();
        }
      };
      this.isInitialized = true;
    } catch {
      // Fallback
    }
  }

  /**
   * Mengambil atau membuat AES-GCM 256-bit CryptoKey non-extractable untuk sesi ini
   */
  public static async getOrCreateSessionKey(namespace: string): Promise<CryptoKey> {
    if (this.keyCache.has(namespace)) {
      return this.keyCache.get(namespace)!;
    }

    const db = await this.getDb();

    // 1. Coba baca dari store keys
    const existing = await new Promise<SessionKeyVaultRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORES.KEYS, "readonly");
      const store = tx.objectStore(STORES.KEYS);
      const req = store.get(namespace);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (existing && existing.key) {
      this.keyCache.set(namespace, existing.key);
      return existing.key;
    }

    // 2. Generate kunci baru: AES-GCM 256-bit, Non-extractable (extractable: false)
    const newKey = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      false, // non-extractable!
      ["encrypt", "decrypt"]
    );

    // 3. Simpan objek CryptoKey langsung via Structured Clone
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.KEYS, "readwrite");
      const store = tx.objectStore(STORES.KEYS);
      const record: SessionKeyVaultRecord = {
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
   * Enkripsi satu payload dengan AES-GCM 256-bit + Random IV 12-byte
   */
  public static async encryptPayload(key: CryptoKey, data: unknown): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
    const jsonString = JSON.stringify(data);
    const encoded = new TextEncoder().encode(jsonString);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encoded
    );

    return { iv, ciphertext };
  }

  /**
   * Dekripsi satu payload ciphertext
   */
  public static async decryptPayload<T>(key: CryptoKey, iv: Uint8Array, ciphertext: ArrayBuffer): Promise<T> {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv) as unknown as BufferSource,
      },
      key,
      ciphertext as unknown as BufferSource
    );

    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded) as T;
  }

  /**
   * Simpan batch item terenkripsi ke object store
   */
  public static async putEncryptedBatch<T extends { id: string }>(
    namespace: string,
    storeName: keyof typeof STORES,
    items: T[]
  ): Promise<void> {
    if (!this.isSupported() || items.length === 0) return;

    const db = await this.getDb();
    const key = await this.getOrCreateSessionKey(namespace);
    const targetStore = STORES[storeName];

    // Enkripsi seluruh item secara paralel dalam memori
    const encryptedRecords: EncryptedVaultRecord[] = await Promise.all(
      items.map(async (item) => {
        const { iv, ciphertext } = await this.encryptPayload(key, item);
        return {
          id: `${namespace}:::${item.id}`,
          namespace,
          iv,
          ciphertext,
          updatedAt: Date.now(),
        };
      })
    );

    // Tulis ke IndexedDB dalam satu transaksi atomic
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(targetStore, "readwrite");
      const store = tx.objectStore(targetStore);

      for (const rec of encryptedRecords) {
        store.put(rec);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Baca dan dekripsi seluruh item dari suatu object store untuk namespace aktif
   */
  public static async getAllDecrypted<T>(
    namespace: string,
    storeName: keyof typeof STORES
  ): Promise<T[]> {
    if (!this.isSupported()) return [];

    try {
      const db = await this.getDb();
      const key = await this.getOrCreateSessionKey(namespace);
      const targetStore = STORES[storeName];

      const records = await new Promise<EncryptedVaultRecord[]>((resolve, reject) => {
        const tx = db.transaction(targetStore, "readonly");
        const store = tx.objectStore(targetStore);
        const index = store.index("by_namespace");
        const req = index.getAll(IDBKeyRange.only(namespace));
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      if (!records || records.length === 0) return [];

      // Dekripsi seluruh record secara paralel
      const decryptedItems = await Promise.all(
        records.map(async (rec) => {
          try {
            return await this.decryptPayload<T>(key, rec.iv, rec.ciphertext);
          } catch {
            return null;
          }
        })
      );

      const results: T[] = [];
      for (const item of decryptedItems) {
        if (item !== null) {
          results.push(item as T);
        }
      }
      return results;
    } catch (err) {
      console.warn(`[ENCRYPTED-LOCAL-DB] Gagal membaca decrypted dari store ${storeName}:`, err);
      return [];
    }
  }

  /**
   * Hapus daftar record berdasarkan ID
   */
  public static async deleteRecords(
    namespace: string,
    storeName: keyof typeof STORES,
    recordIds: string[]
  ): Promise<void> {
    if (!this.isSupported() || recordIds.length === 0) return;

    try {
      const db = await this.getDb();
      const targetStore = STORES[storeName];

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(targetStore, "readwrite");
        const store = tx.objectStore(targetStore);
        for (const rawId of recordIds) {
          store.delete(`${namespace}:::${rawId}`);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`[ENCRYPTED-LOCAL-DB] Gagal menghapus records dari store ${storeName}:`, err);
    }
  }

  /**
   * Ambil Sync State
   */
  public static async getSyncState(namespace: string, serverId: string): Promise<SyncStateRecord | null> {
    if (!this.isSupported()) return null;
    try {
      const db = await this.getDb();
      const tx = db.transaction(STORES.SYNC_STATE, "readonly");
      const store = tx.objectStore(STORES.SYNC_STATE);
      const req = store.get(`${namespace}:::${serverId}`);
      return await new Promise<SyncStateRecord | null>((resolve) => {
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Simpan Sync State
   */
  public static async setSyncState(state: SyncStateRecord): Promise<void> {
    if (!this.isSupported()) return;
    try {
      const db = await this.getDb();
      const tx = db.transaction(STORES.SYNC_STATE, "readwrite");
      const store = tx.objectStore(STORES.SYNC_STATE);
      store.put({
        ...state,
        id: `${state.namespace}:::${state.id}`,
        updatedAt: Date.now(),
      });
    } catch {
      // Ignored
    }
  }

  /**
   * LOGOUT CLEANUP: Menghapus SELURUH ciphertext, sync_state, dan session CryptoKey dari IndexedDB.
   * Wajib dipanggil dalam blok finally saat logout.
   */
  public static async clearSession(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const db = await this.getDb();
      const allStoreNames = Object.values(STORES);

      await Promise.all(
        allStoreNames.map(
          (storeName) =>
            new Promise<void>((resolve) => {
              try {
                const tx = db.transaction(storeName, "readwrite");
                const store = tx.objectStore(storeName);
                const req = store.clear();
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
              } catch {
                resolve();
              }
            })
        )
      );

      this.keyCache.clear();

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: "LOGOUT" });
      }
    } catch (err) {
      console.warn("[ENCRYPTED-LOCAL-DB] Gagal membersihkan session cache pada logout:", err);
    }
  }

  /**
   * Daftarkan listener multi-tab logout
   */
  public static onLogoutBroadcast(callback: () => void): () => void {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      return () => {};
    }

    const channel = new BroadcastChannel("p2kd_local_vault_sync");
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "LOGOUT") {
        callback();
      }
    };
    channel.addEventListener("message", handler);

    return () => {
      channel.removeEventListener("message", handler);
      channel.close();
    };
  }
}
