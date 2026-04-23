"use client";

import { useCallback } from "react";
import { Chip, Button, Tooltip } from "@heroui/react";
import { Edit, Trash2, Image, Music, MapPin, Link2, Video } from "lucide-react";
import { formatDateTimeParts } from "@/utils/date";
import {
  MUSIC_SERVER_LABELS,
  MUSIC_TYPE_LABELS,
  VIDEO_PLATFORM_LABELS,
} from "@/types/essay";
import type { EssayItem } from "@/types/essay";

const TABLE_MUSIC_SERVER_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(MUSIC_SERVER_LABELS).map(([k, v]) => [k, v.replace("音乐", "")])
);

export const TABLE_COLUMNS = [
  { key: "content", label: "内容" },
  { key: "status", label: "状态" },
  { key: "time", label: "时间" },
  { key: "actions", label: "操作" },
];

interface UseEssayRenderCellOptions {
  onAction: (item: EssayItem, key: string) => void;
}

export function useEssayRenderCell({ onAction }: UseEssayRenderCellOptions) {
  return useCallback(
    (item: EssayItem, columnKey: React.Key) => {
      switch (columnKey) {
        case "content": {
          return (
            <div className="flex gap-3 items-center min-w-0 max-w-[400px]">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.content.text || "（无文字内容）"}</p>
                <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                  {item.content.images && item.content.images.length > 0 && (
                    <Chip
                      size="sm"
                      variant="flat"
                      color="secondary"
                      classNames={{
                        base: "h-5 px-1.5 gap-0.5",
                        content: "text-[11px] font-medium",
                      }}
                      startContent={<Image className="w-3 h-3" />}
                    >
                      {item.content.images.length}张图片
                    </Chip>
                  )}
                  {item.content.video && (
                    <Chip
                      size="sm"
                      variant="flat"
                      color="danger"
                      classNames={{
                        base: "h-5 px-1.5 gap-0.5",
                        content: "text-[11px] font-medium",
                      }}
                      startContent={<Video className="w-3 h-3" />}
                    >
                      {item.content.video.platform
                        ? VIDEO_PLATFORM_LABELS[item.content.video.platform] || item.content.video.platform
                        : "视频"}
                    </Chip>
                  )}
                  {item.content.music && (
                    <Chip
                      size="sm"
                      variant="flat"
                      color="success"
                      classNames={{
                        base: "h-5 px-1.5 gap-0.5",
                        content: "text-[11px] font-medium",
                      }}
                      startContent={<Music className="w-3 h-3" />}
                    >
                      {item.content.music.server
                        ? `${TABLE_MUSIC_SERVER_LABELS[item.content.music.server] || item.content.music.server}${item.content.music.type ? ` - ${MUSIC_TYPE_LABELS[item.content.music.type] || item.content.music.type}` : ""}`
                        : item.content.music.title || "音乐"}
                    </Chip>
                  )}
                  {item.content.link && (
                    <Chip
                      size="sm"
                      variant="flat"
                      color="primary"
                      classNames={{
                        base: "h-5 px-1.5 gap-0.5",
                        content: "text-[11px] font-medium",
                      }}
                      startContent={<Link2 className="w-3 h-3" />}
                    >
                      {item.content.link.title || "链接"}
                    </Chip>
                  )}
                  {item.content.location && (
                    <Chip
                      size="sm"
                      variant="flat"
                      color="warning"
                      classNames={{
                        base: "h-5 px-1.5 gap-0.5",
                        content: "text-[11px] font-medium",
                      }}
                      startContent={<MapPin className="w-3 h-3" />}
                    >
                      {item.content.location}
                    </Chip>
                  )}
                </div>
              </div>
            </div>
          );
        }
        case "status":
          return (
            <Chip size="sm" variant="flat" color={item.is_publish ? "success" : "default"}>
              {item.is_publish ? "已发布" : "草稿"}
            </Chip>
          );
        case "time": {
          const created = formatDateTimeParts(item.created_at);
          return (
            <div className="flex flex-col gap-1 text-xs">
              <div className="text-muted-foreground tabular-nums">
                <div>{created.date}</div>
                <div className="text-muted-foreground/60">{created.time}</div>
              </div>
            </div>
          );
        }
        case "actions":
          return (
            <div className="flex items-center justify-center gap-1">
              <Tooltip content="编辑" placement="top" size="sm">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  radius="full"
                  className="w-7 h-7 min-w-0 text-warning-600 bg-warning/10 hover:bg-warning/20"
                  onPress={() => onAction(item, "edit")}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
              <Tooltip content="删除" placement="top" size="sm" color="danger">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  radius="full"
                  className="w-7 h-7 min-w-0 text-danger bg-danger/10 hover:bg-danger/20"
                  onPress={() => onAction(item, "delete")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
            </div>
          );
        default:
          return null;
      }
    },
    [onAction]
  );
}
