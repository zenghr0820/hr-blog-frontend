"use client";

import { useCallback } from "react";
import { Chip, Tooltip, Button, Link as HeroLink } from "@heroui/react";
import { ExternalLink } from "lucide-react";
import { formatDateTimeParts, formatRelativeTime } from "@/utils/date";
import type { FCircleMoment } from "@/types/fcircle";

export const TABLE_COLUMNS = [
  { key: "author", label: "作者" },
  { key: "title", label: "文章标题" },
  { key: "published_at", label: "发布时间" },
  { key: "fetched_at", label: "抓取时间" },
];

export function useFCircleRenderCell() {
  return useCallback((item: FCircleMoment, columnKey: React.Key) => {
    switch (columnKey) {
      case "author": {
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            {item.link?.logo ? (
              <img
                src={item.link.logo}
                alt={item.link.name}
                className="w-8 h-8 rounded-full object-cover shrink-0 bg-muted/30"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {item.link?.name?.charAt(0) ?? "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{item.link?.name ?? "未知"}</p>
              {item.link?.url && (
                <Tooltip content={item.link.url} placement="bottom" size="sm">
                  <p className="text-xs text-muted-foreground/60 truncate max-w-[160px]">{item.link.url}</p>
                </Tooltip>
              )}
            </div>
          </div>
        );
      }
      case "title": {
        return (
          <div className="flex items-center gap-2 min-w-0 max-w-[360px]">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{item.post_title || "（无标题）"}</p>
              {item.post_summary && (
                <p className="text-xs text-muted-foreground/60 truncate mt-0.5">{item.post_summary}</p>
              )}
            </div>
            {item.post_url && (
              <Tooltip content="查看原文" placement="top" size="sm">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  radius="full"
                  className="w-7 h-7 min-w-0 text-primary/60 hover:text-primary shrink-0"
                  onPress={() => window.open(item.post_url, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
            )}
          </div>
        );
      }
      case "published_at": {
        if (!item.published_at) {
          return <span className="text-xs text-muted-foreground/40">未知</span>;
        }
        const parts = formatDateTimeParts(item.published_at);
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <div className="text-muted-foreground tabular-nums">{parts.date}</div>
            <div className="text-muted-foreground/60 tabular-nums">{parts.time}</div>
          </div>
        );
      }
      case "fetched_at": {
        if (!item.fetched_at) {
          return <span className="text-xs text-muted-foreground/40">未知</span>;
        }
        return (
          <Tooltip content={formatDateTimeParts(item.fetched_at).date + " " + formatDateTimeParts(item.fetched_at).time} placement="top" size="sm">
            <Chip size="sm" variant="flat" classNames={{ base: "h-5 px-1.5", content: "text-[11px]" }}>
              {formatRelativeTime(item.fetched_at)}
            </Chip>
          </Tooltip>
        );
      }
      default:
        return null;
    }
  }, []);
}
