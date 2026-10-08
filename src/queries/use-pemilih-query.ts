import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { PemilihService, FetchPemilihParams } from "@/features/pemilih/services/pemilih.service";
import { Voter } from "@/components/pages/admin/types";
import { queryKeys } from "@/lib/cache-query-client";
import { useEffect, useMemo } from "react";

export function usePemilihQuery(params: FetchPemilihParams, enabled = true, userScope = "admin") {
  const queryClient = useQueryClient();
  const page = params.page || 1;
  const limit = params.limit || 50;

  const filter = useMemo(
    () => ({
      search: params.search,
      tps: params.tps,
      status: params.status,
      tahap: params.tahap,
    }),
    [params.search, params.tps, params.status, params.tahap]
  );

  const key = queryKeys.pemilihList(userScope, page, limit, filter);

  const query = useQuery({
    queryKey: key,
    queryFn: () => PemilihService.fetchPaginated(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000, // 2 menit data page aman dari refetch berulang
    gcTime: 30 * 60 * 1000,
    enabled,
  });

  // SMART PREFETCH: Jika page N berhasil diambil, prefetch page N + 1 secara diam-diam di background
  useEffect(() => {
    if (query.data && page < query.data.totalPages) {
      const nextPage = page + 1;
      const nextParams = { ...params, page: nextPage };
      const nextKey = queryKeys.pemilihList(userScope, nextPage, limit, filter);

      queryClient.prefetchQuery({
        queryKey: nextKey,
        queryFn: () => PemilihService.fetchPaginated(nextParams),
        staleTime: 2 * 60 * 1000,
      });
    }
  }, [query.data, page, limit, filter, params, userScope, queryClient]);

  return query;
}

export function usePemilihDetailQuery(selectedId?: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.pemilihDetail(selectedId || ""),
    queryFn: ({ signal }) => PemilihService.fetchById(selectedId!, signal),
    enabled: Boolean(selectedId && enabled),
    staleTime: 5 * 60 * 1000, // 5 menit data spesifik per record ID aman dalam cache
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useCreatePemilihMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Voter>) => PemilihService.create(data),
    onSuccess: () => {
      // Hanya batalkan cache daftar pemilih dan stats tanpa reload seluruh aplikasi
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key.includes("pemilih") || key.includes("stats");
        },
      });
    },
  });
}

export function useUpdatePemilihMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Voter> }) => PemilihService.update(id, data),
    onSuccess: (_result, variables) => {
      // 1. Invalidate statistik pemilih (otomatis di-update trigger DB)
      queryClient.invalidateQueries({ queryKey: queryKeys.stats() });

      // 2. Invalidate spesifik detail jika ada
      queryClient.invalidateQueries({ queryKey: queryKeys.pemilihDetail(variables.id) });

      // 3. Invalidate query daftar pemilih
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("pemilih") && query.queryKey.includes("list"),
      });
    },
  });
}
