"use client";

import { Input, Button, Select, SelectItem } from "@heroui/react";
import { Search, RotateCcw } from "lucide-react";

interface EssayFilterBarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  publishFilter: boolean | "";
  onPublishFilterChange: (value: boolean | "") => void;
  onReset: () => void;
  onPageReset: () => void;
}

const publishOptions = [
  { key: "", label: "全部" },
  { key: "true", label: "已发布" },
  { key: "false", label: "未发布" },
];

export function EssayFilterBar({
  searchInput,
  onSearchInputChange,
  publishFilter,
  onPublishFilterChange,
  onReset,
  onPageReset,
}: EssayFilterBarProps) {
  return (
    <div className="shrink-0 px-5 pb-3">
      <div className="flex items-center gap-3">
        <Input
          size="sm"
          isClearable
          className="w-full sm:max-w-[300px]"
          placeholder="搜索说说内容..."
          startContent={<Search className="w-3.5 h-3.5 text-muted-foreground" />}
          value={searchInput}
          onValueChange={v => {
            onSearchInputChange(v);
            onPageReset();
          }}
          onClear={() => {
            onSearchInputChange("");
            onPageReset();
          }}
          classNames={{
            inputWrapper:
              "h-8 min-h-8 bg-card shadow-none! [border:var(--style-border)] data-[hover=true]:bg-card dark:data-[hover=true]:bg-muted/30! group-data-[focus=true]:bg-card dark:group-data-[focus=true]:bg-muted/30! group-data-[focus=true]:[border:var(--style-border-hover)] transition-all duration-200",
          }}
        />
        <Select
          size="sm"
          selectedKeys={publishFilter === "" ? new Set([""]) : new Set([String(publishFilter)])}
          onSelectionChange={keys => {
            const v = Array.from(keys)[0] as string;
            if (v === "" || v === undefined) {
              onPublishFilterChange("");
            } else {
              onPublishFilterChange(v === "true");
            }
            onPageReset();
          }}
          className="w-28"
          classNames={{
            trigger:
              "h-8 min-h-8 bg-card shadow-none! [border:var(--style-border)] data-[hover=true]:bg-card dark:data-[hover=true]:bg-muted/30! data-[focus=true]:bg-card dark:data-[focus=true]:bg-muted/30! data-[focus=true]:[border:var(--style-border-hover)] transition-all duration-200",
          }}
        >
          {publishOptions.map(opt => (
            <SelectItem key={opt.key}>{opt.label}</SelectItem>
          ))}
        </Select>
        <div className="ml-auto">
          <Button
            size="sm"
            variant="flat"
            startContent={<RotateCcw className="w-3.5 h-3.5" />}
            onPress={onReset}
            isDisabled={!searchInput && publishFilter === ""}
            className="text-foreground/70"
          >
            重置
          </Button>
        </div>
      </div>
    </div>
  );
}
