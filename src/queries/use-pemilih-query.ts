import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { PemilihService, FetchPemilihParams } from "@/features/pemilih/services/pemilih.service";
import { Voter } from "@/components/pages/admin/types";

export const PEMILIH_QUERY_KEY = ["pemilih"] as const;

export function usePemilihQuery(params: FetchPemilihParams, enabled = true) {
  return useQuery({
    queryKey: [...PEMILIH_QUERY_KEY, params],
    queryFn: () => PemilihService.fetchPaginated(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useCreatePemilihMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Voter>) => PemilihService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEMILIH_QUERY_KEY });
    },
  });
}

export function useUpdatePemilihMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Voter> }) => PemilihService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEMILIH_QUERY_KEY });
    },
  });
}
