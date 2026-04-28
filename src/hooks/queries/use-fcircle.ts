import { useQuery, useMutation, useQueryClient, queryOptions, keepPreviousData } from "@tanstack/react-query";
import { fcircleApi } from "@/lib/api/fcircle";
import type { GetMomentsParams } from "@/types/fcircle";

export const fcircleKeys = {
  all: ["fcircle"] as const,
  moments: () => [...fcircleKeys.all, "moments"] as const,
  momentsList: (params: GetMomentsParams) => [...fcircleKeys.moments(), params] as const,
  statistics: () => [...fcircleKeys.all, "statistics"] as const,
};

export const fcircleMomentsQueryOptions = (params: GetMomentsParams = {}) =>
  queryOptions({
    queryKey: fcircleKeys.momentsList(params),
    queryFn: () => fcircleApi.getMoments(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });

export const fcircleStatisticsQueryOptions = () =>
  queryOptions({
    queryKey: fcircleKeys.statistics(),
    queryFn: () => fcircleApi.getStatistics(),
    staleTime: 1000 * 60 * 5,
  });

export function useFCircleMoments(params: GetMomentsParams = {}) {
  return useQuery(fcircleMomentsQueryOptions(params));
}

export function useFCircleStatistics() {
  return useQuery(fcircleStatisticsQueryOptions());
}

export function useRefreshMoments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fcircleApi.refreshMoments(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fcircleKeys.moments(), refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: fcircleKeys.statistics(), refetchType: "all" });
    },
  });
}
