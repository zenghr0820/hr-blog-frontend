"use client";

import { Sidebar } from "@/components/home";
import { ArchiveListNew } from "./ArchiveListNew";
import { useUiStore } from "@/store/ui-store";

interface ArchivePageContentProps {
  year?: number;
  month?: number;
  page?: number;
}

export function ArchivePageContent({ year, month, page }: ArchivePageContentProps) {
  const isSidebarVisible = useUiStore(state => state.isSidebarVisible);

  return (
    <div className="archive-page-content">
      <div className="content-inner">
        <div className="main-content">
          <ArchiveListNew year={year} month={month} page={page} />
        </div>
        {/* 右侧侧边栏 */}
        {isSidebarVisible && <Sidebar />}
      </div>
    </div>
  );
}
