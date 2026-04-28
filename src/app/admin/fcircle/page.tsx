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
  Chip,
} from "@heroui/react";
import { motion } from "framer-motion";
import { RefreshCw, Globe, FileText, Clock } from "lucide-react";
import { adminContainerVariants, adminItemVariants } from "@/lib/motion";
import { PAGE_SIZES } from "@/lib/constants/admin";
import { useFCirclePage } from "./_hooks/use-fcircle-page";
import { TABLE_COLUMNS, useFCircleRenderCell } from "@/components/admin/fcircle/FCircleTableColumns";
import { FCircleSkeleton } from "@/components/admin/fcircle/FCircleSkeleton";
import { TableEmptyState } from "@/components/admin/TableEmptyState";
import { formatDateTimeParts } from "@/utils/date";

export default function FCirclePage() {
  const fc = useFCirclePage();
  const renderCell = useFCircleRenderCell();

  const bottomContent = (
    <div className="py-2 px-2 flex flex-wrap justify-between items-center gap-2">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-small text-muted-foreground whitespace-nowrap">共 {fc.totalItems} 条动态</span>
        <span className="text-small text-muted-foreground/40">|</span>
        <Dropdown>
          <DropdownTrigger>
            <Button variant="light" size="sm" className="text-muted-foreground text-small h-7 min-w-0 gap-1 px-2">
              {fc.pageSize}条/页
              <span className="text-xs">▼</span>
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="每页显示条数"
            selectedKeys={new Set([String(fc.pageSize)])}
            selectionMode="single"
            onSelectionChange={keys => {
              const v = Array.from(keys)[0];
              if (v) {
                fc.setPageSize(Number(v));
                fc.setPage(1);
              }
            }}
          >
            {PAGE_SIZES.map(n => (
              <DropdownItem key={String(n)}>{n}条/页</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
      <div className="flex items-center gap-2">
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={fc.page}
          total={fc.totalPages}
          onChange={fc.setPage}
        />
        <div className="hidden sm:flex gap-1.5">
          <Button
            isDisabled={fc.page <= 1}
            size="sm"
            variant="flat"
            onPress={() => fc.setPage(p => Math.max(1, p - 1))}
          >
            上一页
          </Button>
          <Button
            isDisabled={fc.page >= fc.totalPages}
            size="sm"
            variant="flat"
            onPress={() => fc.setPage(p => Math.min(fc.totalPages, p + 1))}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );

  if (fc.isLoading) {
    return <FCircleSkeleton />;
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
              <h1 className="text-lg font-semibold tracking-tight text-foreground">朋友圈管理</h1>
              <p className="text-xs text-muted-foreground mt-1">查看和管理朋友圈动态数据</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<RefreshCw className={`w-3.5 h-3.5 ${fc.isRefreshing ? "animate-spin" : ""}`} />}
                onPress={fc.handleRefresh}
                isLoading={fc.isRefreshing}
                isDisabled={fc.isRefreshing}
                className="font-medium"
              >
                {fc.isRefreshing ? "刷新中..." : "刷新动态"}
              </Button>
            </div>
          </div>
        </div>

        {fc.statistics && (
          <div className="shrink-0 px-5 pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <Chip
                size="sm"
                variant="flat"
                color="primary"
                startContent={<Globe className="w-3 h-3" />}
                classNames={{ base: "h-7 px-2.5 gap-1", content: "text-xs font-medium" }}
              >
                友链 {fc.statistics.total_links}
              </Chip>
              <Chip
                size="sm"
                variant="flat"
                color="success"
                startContent={<Globe className="w-3 h-3" />}
                classNames={{ base: "h-7 px-2.5 gap-1", content: "text-xs font-medium" }}
              >
                活跃 {fc.statistics.active_links}
              </Chip>
              <Chip
                size="sm"
                variant="flat"
                color="secondary"
                startContent={<FileText className="w-3 h-3" />}
                classNames={{ base: "h-7 px-2.5 gap-1", content: "text-xs font-medium" }}
              >
                文章 {fc.statistics.total_articles}
              </Chip>
              {fc.statistics.last_updated_at && (
                <Chip
                  size="sm"
                  variant="flat"
                  color="default"
                  startContent={<Clock className="w-3 h-3" />}
                  classNames={{ base: "h-7 px-2.5 gap-1", content: "text-xs font-medium" }}
                >
                  更新于 {formatDateTimeParts(fc.statistics.last_updated_at).date}
                </Chip>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Table
            isHeaderSticky
            aria-label="朋友圈动态表格"
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
                <TableColumn key={column.key}>
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={fc.momentList}
              emptyContent={
                <TableEmptyState
                  icon={Globe}
                  hasFilter={false}
                  filterEmptyText="没有匹配的动态"
                  emptyText="还没有朋友圈动态"
                  emptyHint="点击「刷新动态」拉取最新数据"
                />
              }
              isLoading={fc.isFetching && !fc.isLoading}
              loadingContent={<Spinner size="sm" label="加载中..." />}
            >
              {item => (
                <TableRow key={item.id}>{columnKey => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </motion.div>
  );
}
