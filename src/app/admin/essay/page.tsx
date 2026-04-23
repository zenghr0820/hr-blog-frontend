"use client";

import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
} from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ShieldAlert, ChevronDown, MessageSquare } from "lucide-react";
import { adminContainerVariants, adminItemVariants } from "@/lib/motion";
import { PAGE_SIZES, ADMIN_EMPTY_TEXTS } from "@/lib/constants/admin";
import { useEssayPage } from "./_hooks/use-essay-page";
import { TABLE_COLUMNS, useEssayRenderCell } from "@/components/admin/essay/EssayTableColumns";
import { EssaySkeleton } from "@/components/admin/essay/EssaySkeleton";
import { EssayFilterBar } from "@/components/admin/essay/EssayFilterBar";
import EssayFormModal from "@/components/admin/essay/EssayFormModal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FloatingSelectionBar } from "@/components/admin/FloatingSelectionBar";
import { TableEmptyState } from "@/components/admin/TableEmptyState";

export default function EssayPage() {
  const es = useEssayPage();

  const renderCell = useEssayRenderCell({
    onAction: es.handleAction,
  });

  const bottomContent = (
    <div className="py-2 px-2 flex flex-wrap justify-between items-center gap-2">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-small text-muted-foreground whitespace-nowrap">共 {es.totalItems} 条说说</span>
        <span className="text-small text-muted-foreground/40">|</span>
        <Dropdown>
          <DropdownTrigger>
            <Button variant="light" size="sm" className="text-muted-foreground text-small h-7 min-w-0 gap-1 px-2">
              {es.pageSize}条/页
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="每页显示条数"
            selectedKeys={new Set([String(es.pageSize)])}
            selectionMode="single"
            onSelectionChange={keys => {
              const v = Array.from(keys)[0];
              if (v) {
                es.setPageSize(Number(v));
                es.setPage(1);
              }
            }}
          >
            {PAGE_SIZES.map(n => (
              <DropdownItem key={String(n)}>{n}条/页</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
        {es.selectedIds.size > 0 && (
          <>
            <span className="text-small text-muted-foreground/40">|</span>
            <span className="text-small text-primary font-medium whitespace-nowrap">已选 {es.selectedIds.size} 项</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={es.page}
          total={es.totalPages}
          onChange={es.setPage}
        />
        <div className="hidden sm:flex gap-1.5">
          <Button
            isDisabled={es.page <= 1}
            size="sm"
            variant="flat"
            onPress={() => es.setPage(p => Math.max(1, p - 1))}
          >
            上一页
          </Button>
          <Button
            isDisabled={es.page >= es.totalPages}
            size="sm"
            variant="flat"
            onPress={() => es.setPage(p => Math.min(es.totalPages, p + 1))}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );

  if (es.isLoading) {
    return <EssaySkeleton />;
  }

  return (
    <motion.div
      className="relative h-full flex flex-col overflow-hidden -m-4 lg:-m-8"
      variants={adminContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={adminItemVariants}
        className="flex-1 min-h-0 flex flex-col mx-6 mt-5 mb-2 bg-card border border-border/60 rounded-xl overflow-hidden"
      >
        <div className="shrink-0 px-5 pt-4 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">动态管理</h1>
              <p className="text-xs text-muted-foreground mt-1">管理说说动态，记录生活点滴</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                color="primary"
                startContent={<Plus className="w-3.5 h-3.5" />}
                onPress={es.handleNew}
                className="font-medium shadow-sm"
              >
                新增说说
              </Button>
            </div>
          </div>
        </div>

        <EssayFilterBar
          searchInput={es.searchInput}
          onSearchInputChange={es.setSearchInput}
          publishFilter={es.publishFilter}
          onPublishFilterChange={es.setPublishFilter}
          onReset={es.handleReset}
          onPageReset={() => es.setPage(1)}
        />

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Table
            isHeaderSticky
            aria-label="动态管理表格"
            selectionMode="multiple"
            color="default"
            checkboxesProps={{ color: "primary" }}
            selectedKeys={es.selectedIds}
            onSelectionChange={es.handleSelectionChange}
            bottomContent={bottomContent}
            bottomContentPlacement="outside"
            classNames={{
              base: "flex-1 min-h-0 flex flex-col",
              wrapper: "flex-1 min-h-0 px-3! py-0! shadow-none! rounded-none! border-none!",
              table: "border-separate border-spacing-y-1.5 -mt-1.5",
              thead: "[&>tr]:first:shadow-none! after:hidden!",
              th: "bg-[#F6F7FA] dark:bg-muted first:rounded-tl-lg! last:rounded-tr-lg!",
              tr: "rounded-xl!",
              td: "first:before:rounded-s-xl! last:before:rounded-e-xl!",
            }}
          >
            <TableHeader columns={TABLE_COLUMNS}>
              {column => (
                <TableColumn key={column.key} align={column.key === "actions" ? "center" : "start"}>
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={es.essayList}
              emptyContent={
                <TableEmptyState
                  icon={MessageSquare}
                  hasFilter={!!es.debouncedSearch || es.publishFilter !== ""}
                  filterEmptyText="没有匹配的说说"
                  emptyText="还没有说说"
                  emptyHint="点击「新增说说」发布第一条动态"
                  action={{
                    label: "新增说说",
                    onPress: es.handleNew,
                  }}
                />
              }
              isLoading={es.isFetching && !es.isLoading}
              loadingContent={<Spinner size="sm" label="加载中..." />}
            >
              {item => (
                <TableRow key={item.id}>{columnKey => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <AnimatePresence>
        {es.isSomeSelected && (
          <FloatingSelectionBar
            count={es.selectedIds.size}
            actions={[
              {
                key: "delete",
                label: "删除",
                icon: <Trash2 className="w-3.5 h-3.5" />,
                onClick: es.batchDeleteModal.onOpen,
                variant: "danger",
              },
            ]}
            onClear={() => es.setSelectedIds(new Set())}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={es.deleteModal.isOpen}
        onOpenChange={es.deleteModal.onOpenChange}
        title="删除说说"
        description={`确定要删除这条说说吗？此操作不可撤销。`}
        confirmText="删除"
        confirmColor="danger"
        icon={<ShieldAlert className="w-5 h-5 text-danger" />}
        iconBg="bg-danger-50"
        loading={es.deleteEssay.isPending}
        onConfirm={es.handleDeleteConfirm}
      />

      <ConfirmDialog
        isOpen={es.batchDeleteModal.isOpen}
        onOpenChange={es.batchDeleteModal.onOpenChange}
        title="批量删除"
        description={`确定要删除选中的 ${es.selectedIds.size} 条说说吗？此操作不可撤销。`}
        confirmText={`删除 ${es.selectedIds.size} 条`}
        confirmColor="danger"
        icon={<ShieldAlert className="w-5 h-5 text-danger" />}
        iconBg="bg-danger-50"
        loading={es.deleteEssay.isPending}
        onConfirm={es.handleBatchDeleteConfirm}
      />

      <EssayFormModal isOpen={es.formModal.isOpen} onClose={es.handleFormClose} editItem={es.editItem} />
    </motion.div>
  );
}
