import {
  WorkerMessageResponse,
  ProcessableVoter,
  WorkerFilterPayload,
  WorkerMetricsResult,
} from "@/workers/data-processor.worker";

interface PendingCallback<T> {
  resolve: (val: T) => void;
  reject: (err: Error) => void;
}

export class WorkerBridge {
  private static worker: Worker | null = null;
  private static pendingCallbacks = new Map<string, PendingCallback<unknown>>();

  private static getWorker(): Worker | null {
    if (typeof window === "undefined") return null;

    if (!this.worker) {
      try {
        this.worker = new Worker(new URL("../workers/data-processor.worker.ts", import.meta.url));
        this.worker.onmessage = (e: MessageEvent<WorkerMessageResponse>) => {
          const { id, success, result, error } = e.data;
          const handler = this.pendingCallbacks.get(id);
          if (handler) {
            this.pendingCallbacks.delete(id);
            if (success) {
              handler.resolve(result);
            } else {
              handler.reject(new Error(error || "Worker error"));
            }
          }
        };
        this.worker.onerror = (err) => {
          console.error("Worker error:", err);
        };
      } catch (err) {
        console.warn("Failed to initialize Web Worker, falling back to main thread:", err);
        return null;
      }
    }
    return this.worker;
  }

  public static async filterSort(payload: WorkerFilterPayload): Promise<ProcessableVoter[]> {
    const worker = this.getWorker();
    if (!worker) {
      // Fallback on main thread if Web Worker is not supported in environment
      let filtered = payload.items || [];
      if (payload.tpsFilter && payload.tpsFilter !== "SEMUA") {
        filtered = filtered.filter((i) => i.tps === payload.tpsFilter);
      }
      if (payload.statusFilter && payload.statusFilter !== "SEMUA") {
        filtered = filtered.filter((i) => i.statusAktif === payload.statusFilter);
      }
      if (payload.searchTerm) {
        const lower = payload.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (i) =>
            (i.namaLengkap && i.namaLengkap.toLowerCase().includes(lower)) ||
            (i.nik && i.nik.includes(lower))
        );
      }
      return filtered;
    }

    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return new Promise<ProcessableVoter[]>((resolve, reject) => {
      this.pendingCallbacks.set(id, {
        resolve: resolve as (val: unknown) => void,
        reject,
      });
      worker.postMessage({ id, type: "FILTER_SORT", payload });
    });
  }

  public static async calculateMetrics(items: ProcessableVoter[]): Promise<WorkerMetricsResult> {
    const worker = this.getWorker();
    if (!worker) {
      // Inline fallback
      return {
        total: items.length,
        totalLaki: items.filter((i) => i.jenisKelamin === "L").length,
        totalPerempuan: items.filter((i) => i.jenisKelamin === "P").length,
        totalAktif: items.filter((i) => i.statusAktif !== "TMS").length,
        totalTms: items.filter((i) => i.statusAktif === "TMS").length,
        totalDps: items.filter((i) => i.tahap !== "DPT").length,
        totalDpt: items.filter((i) => i.tahap === "DPT").length,
        perTps: {},
      };
    }

    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return new Promise<WorkerMetricsResult>((resolve, reject) => {
      this.pendingCallbacks.set(id, {
        resolve: resolve as (val: unknown) => void,
        reject,
      });
      worker.postMessage({ id, type: "CALCULATE_METRICS", payload: { items } });
    });
  }

  public static terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingCallbacks.clear();
    }
  }
}
