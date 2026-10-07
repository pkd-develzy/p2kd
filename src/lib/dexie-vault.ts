import Dexie, { Table } from "dexie";
import { SyncStateRecord } from "./encrypted-local-db";

export interface DexieVaultItem {
  id: string;
  namespace: string;
  storeName: string;
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
  updatedAt: number;
}

export class P2KDVaultDexie extends Dexie {
  vault_records!: Table<DexieVaultItem, [string, string]>;
  sync_states!: Table<SyncStateRecord, string>;

  constructor() {
    super("p2kd_dexie_vault_v1");
    this.version(1).stores({
      vault_records: "[id+namespace], namespace, storeName, updatedAt",
      sync_states: "id, namespace, updatedAt",
    });
  }

  async wipeSessionVault(namespace?: string): Promise<void> {
    if (namespace) {
      await this.vault_records.where("namespace").equals(namespace).delete();
      await this.sync_states.where("namespace").equals(namespace).delete();
    } else {
      await this.vault_records.clear();
      await this.sync_states.clear();
    }
  }
}

export const dexieVault = typeof window !== "undefined" ? new P2KDVaultDexie() : (null as unknown as P2KDVaultDexie);
