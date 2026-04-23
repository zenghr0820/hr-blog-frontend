import { useQuery, useMutation, useQueryClient, queryOptions, keepPreviousData } from "@tanstack/react-query";
import { essayApi } from "@/lib/api/essay";
import type {
  EssayListParams,
  AdminEssayListParams,
  CreateEssayRequest,
  UpdateEssayRequest,
} from "@/types/essay";

export const essayKeys = {
  all: ["essays"] as const,
  list: (params: EssayListParams) => [...essayKeys.all, "list", params] as const,
  adminList: (params: AdminEssayListParams) => [...essayKeys.all, "admin-list", params] as const,
};

export const essayListQueryOptions = (params: EssayListParams = {}) =>
  queryOptions({
    queryKey: essayKeys.list(params),
    queryFn: () => essayApi.getList(params),
    staleTime: 1000 * 60 * 5,
  });

export function useEssayList(params: EssayListParams = {}) {
  return useQuery(essayListQueryOptions(params));
}

export const adminEssayListQueryOptions = (params: AdminEssayListParams = {}) =>
  queryOptions({
    queryKey: essayKeys.adminList(params),
    queryFn: () => essayApi.getAdminList(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });

export function useAdminEssayList(params: AdminEssayListParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    ...adminEssayListQueryOptions(params),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateEssay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEssayRequest) => essayApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: essayKeys.all, refetchType: "all" });
    },
  });
}

export function useUpdateEssay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEssayRequest }) => essayApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: essayKeys.all, refetchType: "all" });
    },
  });
}

export function useDeleteEssay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => essayApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: essayKeys.all, refetchType: "all" });
    },
  });
}

export function useBatchDeleteEssay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => essayApi.batchDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: essayKeys.all, refetchType: "all" });
    },
  });
}
