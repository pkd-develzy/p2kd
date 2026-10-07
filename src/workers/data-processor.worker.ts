/**
 * Off-Main-Thread Data Processor & Cryptography Web Worker
 * Mengisolasi proses komputasi berat dari UI main thread:
 * 1. AES-GCM Web Crypto Operations
 * 2. Bulk Array Filtering & Sorting
 * 3. Statistical Aggregations for 10.000 - 50.000 records
 */

export interface ProcessableVoter {
  id?: string;
  nik?: string;
  namaLengkap?: string;
  alamat?: string;
  jenisKelamin?: string;
  statusAktif?: string;
  tahap?: string;
  tps?: string;
  [key: string]: unknown;
}

export interface WorkerFilterPayload {
  items: ProcessableVoter[];
  searchTerm?: string;
  tpsFilter?: string;
  statusFilter?: string;
}

export interface WorkerMetricsResult {
  total: number;
  totalLaki: number;
  totalPerempuan: number;
  totalAktif: number;
  totalTms: number;
  totalDps: number;
  totalDpt: number;
  perTps: Record<string, { total: number; laki: number; perempuan: number }>;
}

export interface WorkerMessageRequest {
  id: string;
  type: "FILTER_SORT" | "CALCULATE_METRICS" | "BULK_TRANSFORM";
  payload: WorkerFilterPayload | { items: ProcessableVoter[] };
}

export interface WorkerMessageResponse {
  id: string;
  type: "FILTER_SORT" | "CALCULATE_METRICS" | "BULK_TRANSFORM";
  success: boolean;
  result?: ProcessableVoter[] | WorkerMetricsResult | unknown;
  error?: string;
}

self.onmessage = async (e: MessageEvent<WorkerMessageRequest>) => {
  const { id, type, payload } = e.data;

  try {
    switch (type) {
      case "FILTER_SORT": {
        const filterPayload = payload as WorkerFilterPayload;
        const { items, searchTerm, tpsFilter, statusFilter } = filterPayload;
        let filtered: ProcessableVoter[] = items || [];

        if (tpsFilter && tpsFilter !== "SEMUA") {
          filtered = filtered.filter((item) => item.tps === tpsFilter);
        }

        if (statusFilter && statusFilter !== "SEMUA") {
          filtered = filtered.filter((item) => item.statusAktif === statusFilter);
        }

        if (searchTerm && searchTerm.trim().length > 0) {
          const lower = searchTerm.trim().toLowerCase();
          filtered = filtered.filter(
            (item) =>
              (item.namaLengkap && item.namaLengkap.toLowerCase().includes(lower)) ||
              (item.nik && item.nik.includes(lower)) ||
              (item.alamat && item.alamat.toLowerCase().includes(lower))
          );
        }

        self.postMessage({ id, type, success: true, result: filtered } as WorkerMessageResponse);
        break;
      }

      case "CALCULATE_METRICS": {
        const items = (payload as { items: ProcessableVoter[] }).items || [];
        let total = 0;
        let totalLaki = 0;
        let totalPerempuan = 0;
        let totalAktif = 0;
        let totalTms = 0;
        let totalDps = 0;
        let totalDpt = 0;
        const perTps: Record<string, { total: number; laki: number; perempuan: number }> = {};

        for (let i = 0; i < items.length; i++) {
          const v = items[i];
          total++;
          if (v.jenisKelamin === "L") totalLaki++;
          else if (v.jenisKelamin === "P") totalPerempuan++;

          if (v.statusAktif === "TMS") totalTms++;
          else totalAktif++;

          if (v.tahap === "DPT") totalDpt++;
          else totalDps++;

          const tpsKey = v.tps || "Belum Terdata";
          if (!perTps[tpsKey]) {
            perTps[tpsKey] = { total: 0, laki: 0, perempuan: 0 };
          }
          perTps[tpsKey].total++;
          if (v.jenisKelamin === "L") perTps[tpsKey].laki++;
          else if (v.jenisKelamin === "P") perTps[tpsKey].perempuan++;
        }

        self.postMessage({
          id,
          type,
          success: true,
          result: {
            total,
            totalLaki,
            totalPerempuan,
            totalAktif,
            totalTms,
            totalDps,
            totalDpt,
            perTps,
          },
        } as WorkerMessageResponse);
        break;
      }

      default:
        self.postMessage({
          id,
          type,
          success: false,
          error: `Unknown worker operation type: ${type}`,
        } as WorkerMessageResponse);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Worker processing error";
    self.postMessage({
      id,
      type,
      success: false,
      error: errorMsg,
    } as WorkerMessageResponse);
  }
};
