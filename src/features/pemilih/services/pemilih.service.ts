import { Voter } from "@/components/pages/admin/types";

export interface FetchPemilihParams {
  page?: number;
  limit?: number;
  search?: string;
  tps?: string;
  status?: string;
  tahap?: string;
}

export interface PemilihPaginatedResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isRestricted?: boolean;
  assignedTps?: string;
  data: Voter[];
}

export const PemilihService = {
  async fetchPaginated(params: FetchPemilihParams): Promise<PemilihPaginatedResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.search?.trim()) query.set("search", params.search.trim());
    if (params.tps && params.tps !== "SEMUA") query.set("tps", params.tps);
    if (params.status && params.status !== "SEMUA") query.set("status", params.status);
    if (params.tahap && params.tahap !== "SEMUA") query.set("tahap", params.tahap);

    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const res = await fetch(`/api/admin/pemilih?${query.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Gagal memuat data pemilih");
    }

    return res.json();
  },

  async create(data: Partial<Voter>): Promise<{ success: boolean; data: Voter }> {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const res = await fetch("/api/admin/pemilih", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Gagal menambahkan pemilih");
    }

    return res.json();
  },

  async update(id: string, data: Partial<Voter>): Promise<{ success: boolean; data: Voter }> {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const res = await fetch(`/api/admin/pemilih`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ id, ...data }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Gagal memperbarui pemilih");
    }

    return res.json();
  },

  async fetchById(id: string, signal?: AbortSignal): Promise<Voter> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token")
        : null;
    const res = await fetch(`/api/admin/pemilih/${id}`, {
      signal,
      cache: "no-store",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Gagal memuat rincian data pemilih");
    }

    const json = await res.json();
    return json.data as Voter;
  },
};
