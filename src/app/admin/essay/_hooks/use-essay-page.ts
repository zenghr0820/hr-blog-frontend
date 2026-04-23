import { useState, useMemo, useCallback } from "react";
import { addToast, useDisclosure } from "@heroui/react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAdminEssayList, useDeleteEssay, useBatchDeleteEssay } from "@/hooks/queries/use-essays";
import type { EssayItem, AdminEssayListParams } from "@/types/essay";

export function useEssayPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [publishFilter, setPublishFilter] = useState<boolean | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [editItem, setEditItem] = useState<EssayItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EssayItem | null>(null);

  const formModal = useDisclosure();
  const deleteModal = useDisclosure();
  const batchDeleteModal = useDisclosure();

  const queryParams: AdminEssayListParams = useMemo(
    () => ({
      page,
      pageSize,
      keyword: debouncedSearch || undefined,
      is_publish: publishFilter === "" ? undefined : publishFilter,
    }),
    [page, pageSize, debouncedSearch, publishFilter]
  );

  const { data, isLoading, isFetching } = useAdminEssayList(queryParams);
  const essayList = useMemo(() => data?.list ?? [], [data?.list]);
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const deleteEssay = useDeleteEssay();
  const batchDeleteEssay = useBatchDeleteEssay();

  const isSomeSelected = selectedIds.size > 0;

  const handleSelectionChange = useCallback(
    (keys: "all" | Set<React.Key>) => {
      if (keys === "all") {
        setSelectedIds(new Set(essayList.map(e => String(e.id))));
      } else {
        setSelectedIds(keys as Set<string>);
      }
    },
    [essayList]
  );

  const handleNew = useCallback(() => {
    setEditItem(null);
    formModal.onOpen();
  }, [formModal]);

  const handleEdit = useCallback(
    (item: EssayItem) => {
      setEditItem(item);
      formModal.onOpen();
    },
    [formModal]
  );

  const handleFormClose = useCallback(() => {
    formModal.onClose();
    setEditItem(null);
  }, [formModal]);

  const handleDeleteClick = useCallback(
    (item: EssayItem) => {
      setDeleteTarget(item);
      deleteModal.onOpen();
    },
    [deleteModal]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteEssay.mutateAsync(deleteTarget.id);
      addToast({ title: "删除成功", color: "success", timeout: 2000 });
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(String(deleteTarget.id));
        return next;
      });
    } catch (error) {
      addToast({
        title: error instanceof Error ? error.message : "删除失败",
        color: "danger",
        timeout: 3000,
      });
    }
    deleteModal.onClose();
    setDeleteTarget(null);
  }, [deleteTarget, deleteEssay, deleteModal]);

  const handleBatchDeleteConfirm = useCallback(async () => {
    const ids = Array.from(selectedIds).map(Number);
    if (ids.length === 0) return;
    try {
      await batchDeleteEssay.mutateAsync(ids);
      addToast({ title: `已删除 ${ids.length} 条说说`, color: "success", timeout: 3000 });
      setSelectedIds(new Set());
    } catch (error) {
      addToast({
        title: error instanceof Error ? error.message : "批量删除失败",
        color: "danger",
        timeout: 3000,
      });
    }
    batchDeleteModal.onClose();
  }, [selectedIds, batchDeleteEssay, batchDeleteModal]);

  const handleAction = useCallback(
    (item: EssayItem, key: string) => {
      switch (key) {
        case "edit":
          handleEdit(item);
          break;
        case "delete":
          handleDeleteClick(item);
          break;
      }
    },
    [handleEdit, handleDeleteClick]
  );

  const handleReset = useCallback(() => {
    setSearchInput("");
    setPublishFilter("");
    setPage(1);
  }, []);

  return {
    searchInput,
    setSearchInput,
    debouncedSearch,
    publishFilter,
    setPublishFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    handleReset,

    essayList,
    totalItems,
    totalPages,
    isLoading,
    isFetching,

    selectedIds,
    setSelectedIds,
    isSomeSelected,
    handleSelectionChange,

    editItem,
    handleNew,
    handleEdit,
    handleFormClose,
    formModal,

    deleteTarget,
    deleteModal,
    batchDeleteModal,
    deleteEssay,
    handleDeleteConfirm,
    handleBatchDeleteConfirm,

    handleAction,
  };
}

export type EssayPageState = ReturnType<typeof useEssayPage>;
