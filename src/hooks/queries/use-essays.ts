import { useQuery, queryOptions } from "@tanstack/react-query";
import { essayApi } from "@/lib/api/essay";
import type { EssayListParams } from "@/types/essay";

export const essayKeys = {
  all: ["essays"] as const,
  list: (params: EssayListParams) => [...essayKeys.all, "list", params] as const,
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
