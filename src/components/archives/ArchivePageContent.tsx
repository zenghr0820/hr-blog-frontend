"use client";

import { Sidebar } from "@/components/home";
import { ArchiveListNew } from "./ArchiveListNew";

interface ArchivePageContentProps {
  year?: number;
  month?: number;
  page?: number;
}

export function ArchivePageContent({ year, month, page }: ArchivePageContentProps) {
  return (
    <div className="archive-page-content">
      <div className="content-inner">
        <div className="main-content">
          <ArchiveListNew year={year} month={month} page={page} />
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
