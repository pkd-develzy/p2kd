/**
 * Local Data Repositories for Authenticated P2KD Users
 * 
 * Konsep:
 * - Menyimpan dataset aktif dalam in-memory cache terdekripsi selama sesi login berjalan.
 * - Seluruh mutasi langsung disimpan secara terenkripsi (AES-GCM 256-bit) ke IndexedDB.
 * - Navigasi antar menu, pencarian, dan pemfilteran berjalan 100% instan (< 1ms) dari repository ini.
 */

import { Voter, TPSItem, AnggotaP2KD, Aduan } from "@/components/pages/admin/types";
import { EncryptedLocalDb } from "./encrypted-local-db";
import { sortVotersByKk } from "./print-models-export";

export class LocalPemilihRepository {
  private static votersMap = new Map<string, Voter>();
  private static isLoaded = false;
  private static currentNamespace = "";

  public static isReady(): boolean {
    return this.isLoaded && this.votersMap.size > 0;
  }

  public static getCount(): number {
    return this.votersMap.size;
  }

  /**
   * Muat seluruh data pemilih terenkripsi dari IndexedDB ke memori sesi
   */
  public static async loadFromLocalDb(namespace: string): Promise<number> {
    this.currentNamespace = namespace;
    const decryptedList = await EncryptedLocalDb.getAllDecrypted<Voter>(namespace, "PEMILIH");

    this.votersMap.clear();
    for (const v of decryptedList) {
      this.votersMap.set(v.id, v);
    }

    this.isLoaded = true;
    return this.votersMap.size;
  }

  /**
   * Set seluruh dataset pemilih dan simpan secara batch terenkripsi ke IndexedDB
   */
  public static async setAll(voters: Voter[], namespace: string): Promise<void> {
    this.currentNamespace = namespace;
    this.votersMap.clear();

    for (const v of voters) {
      this.votersMap.set(v.id, v);
    }
    this.isLoaded = true;

    // Simpan terenkripsi ke IndexedDB
    await EncryptedLocalDb.putEncryptedBatch(namespace, "PEMILIH", voters);
  }

  /**
   * Tambah atau perbarui batch pemilih (misal hasil dari batch sync)
   */
  public static async upsertBatch(voters: Voter[], namespace: string): Promise<void> {
    this.currentNamespace = namespace;
    for (const v of voters) {
      this.votersMap.set(v.id, v);
    }
    this.isLoaded = true;

    // Simpan terenkripsi ke IndexedDB
    await EncryptedLocalDb.putEncryptedBatch(namespace, "PEMILIH", voters);
  }

  /**
   * Ambil seluruh dataset pemilih lokal (seluruh 7.787 data)
   */
  public static getAll(): Voter[] {
    return Array.from(this.votersMap.values());
  }

  /**
   * Ambil data pemilih khusus RW tertentu (diurutkan berdasarkan No. KK)
   */
  public static getByRw(rwCode: string): Voter[] {
    const cleanRw = rwCode.replace(/\D/g, "");
    const formatted = cleanRw.length === 1 ? `0${cleanRw}` : cleanRw;

    const list = Array.from(this.votersMap.values()).filter((v) => {
      const vRw = (v.rw || "").replace(/\D/g, "");
      const matchRw = vRw === formatted || vRw === cleanRw;
      const matchTps = v.tps && (v.tps.includes(formatted) || v.tps.includes(`RW ${formatted}`));
      return matchRw || matchTps;
    });

    return sortVotersByKk(list);
  }

  /**
   * Pencarian data lokal kilat (< 1ms) tanpa request ke server
   */
  public static search(
    query: string,
    filter?: { tps?: string; statusAktif?: string; tahap?: string }
  ): Voter[] {
    let list = Array.from(this.votersMap.values());

    // 1. Filter Tahap (DPS vs DPT)
    if (filter?.tahap && filter.tahap !== "SEMUA") {
      list = list.filter((v) => v.tahap === filter.tahap);
    }

    // 2. Filter Status Aktif
    if (filter?.statusAktif && filter.statusAktif !== "SEMUA") {
      list = list.filter((v) => v.statusAktif === filter.statusAktif);
    }

    // 3. Filter Wilayah RW / TPS
    if (filter?.tps && filter.tps !== "SEMUA") {
      const rwTarget = filter.tps.replace(/\D/g, "");
      const formattedRw = rwTarget.length === 1 ? `0${rwTarget}` : rwTarget;

      list = list.filter((v) => {
        const vRw = (v.rw || "").replace(/\D/g, "");
        const matchRw = vRw === formattedRw || vRw === rwTarget;
        const matchTps = v.tps && (v.tps.includes(formattedRw) || v.tps.toLowerCase().includes(filter.tps!.toLowerCase()));
        return matchRw || matchTps;
      });
    }

    // 4. Pencarian kata kunci
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((v) => {
        const matchName = v.namaLengkap.toLowerCase().includes(q);
        const matchNik = v.nik.includes(q);
        const matchKk = v.kk ? v.kk.includes(q) : false;
        const matchAlamat = v.alamat ? v.alamat.toLowerCase().includes(q) : false;
        const matchRt = v.rt ? `rt ${v.rt}`.includes(q) || v.rt.includes(q) : false;
        const matchRw = v.rw ? `rw ${v.rw}`.includes(q) || v.rw.includes(q) : false;
        return matchName || matchNik || matchKk || matchAlamat || matchRt || matchRw;
      });
    }

    return list;
  }

  /**
   * Tambah atau edit 1 pemilih secara optimistik
   */
  public static async upsert(voter: Voter, namespace?: string): Promise<void> {
    const ns = namespace || this.currentNamespace;
    this.votersMap.set(voter.id, voter);
    if (ns) {
      await EncryptedLocalDb.putEncryptedBatch(ns, "PEMILIH", [voter]);
    }
  }

  /**
   * Hapus pemilih secara lokal dan di IndexedDB
   */
  public static async delete(id: string, namespace?: string): Promise<void> {
    const ns = namespace || this.currentNamespace;
    this.votersMap.delete(id);
    if (ns) {
      await EncryptedLocalDb.deleteRecords(ns, "PEMILIH", [id]);
    }
  }

  /**
   * Bersihkan in-memory repository (misal saat logout)
   */
  public static clear(): void {
    this.votersMap.clear();
    this.isLoaded = false;
    this.currentNamespace = "";
  }
}

export class LocalTPSRepository {
  private static tpsList: TPSItem[] = [];

  public static async loadFromLocalDb(namespace: string): Promise<TPSItem[]> {
    this.tpsList = await EncryptedLocalDb.getAllDecrypted<TPSItem>(namespace, "TPS");
    return this.tpsList;
  }

  public static async setAll(list: TPSItem[], namespace: string): Promise<void> {
    this.tpsList = list;
    await EncryptedLocalDb.putEncryptedBatch(namespace, "TPS", list);
  }

  public static getAll(): TPSItem[] {
    return this.tpsList;
  }

  public static clear(): void {
    this.tpsList = [];
  }
}

export class LocalAnggotaRepository {
  private static anggotaList: AnggotaP2KD[] = [];

  public static async loadFromLocalDb(namespace: string): Promise<AnggotaP2KD[]> {
    this.anggotaList = await EncryptedLocalDb.getAllDecrypted<AnggotaP2KD>(namespace, "ANGGOTA");
    return this.anggotaList;
  }

  public static async setAll(list: AnggotaP2KD[], namespace: string): Promise<void> {
    this.anggotaList = list;
    await EncryptedLocalDb.putEncryptedBatch(namespace, "ANGGOTA", list);
  }

  public static getAll(): AnggotaP2KD[] {
    return this.anggotaList;
  }

  public static clear(): void {
    this.anggotaList = [];
  }
}

export class LocalAduanRepository {
  private static aduanList: Aduan[] = [];

  public static async loadFromLocalDb(namespace: string): Promise<Aduan[]> {
    this.aduanList = await EncryptedLocalDb.getAllDecrypted<Aduan>(namespace, "ADUAN");
    return this.aduanList;
  }

  public static async setAll(list: Aduan[], namespace: string): Promise<void> {
    this.aduanList = list;
    await EncryptedLocalDb.putEncryptedBatch(namespace, "ADUAN", list);
  }

  public static getAll(): Aduan[] {
    return this.aduanList;
  }

  public static clear(): void {
    this.aduanList = [];
  }
}
