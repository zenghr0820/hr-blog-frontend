import { useState, useMemo, useCallback } from "react";
import { addToast } from "@heroui/react";
import { useFCircleMoments, useFCircleStatistics, useRefreshMoments } from "@/hooks/queries/use-fcircle";

export function useFCirclePage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const queryParams = useMemo(
    () => ({ page, page_size: pageSize }),
    [page, pageSize]
  );

  const { data, isLoading, isFetching } = useFCircleMoments(queryParams);
  const { data: statistics } = useFCircleStatistics();
  const refreshMoments = useRefreshMoments();

  const momentList = useMemo(() => data?.list ?? [], [data?.list]);
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const handleRefresh = useCallback(async () => {
    try {
      await refreshMoments.mutateAsync();
      addToast({ title: "刷新成功", description: "朋友圈动态已更新", color: "success", timeout: 2000 });
    } catch (error) {
      addToast({
        title: error instanceof Error ? error.message : "刷新失败",
        color: "danger",
        timeout: 3000,
      });
    }
  }, [refreshMoments]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    momentList,
    totalItems,
    totalPages,
    isLoading,
    isFetching,
    statistics,
    isRefreshing: refreshMoments.isPending,
    handleRefresh,
  };
}

export type FCirclePageState = ReturnType<typeof useFCirclePage>;
