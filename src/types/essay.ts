export type MusicServer = "netease" | "tencent" | "kugou" | "xiami" | "baidu" | "kuwo";
export type MusicType = "song" | "playlist" | "artist" | "album" | "search";
export type VideoPlatform = "local" | "bilibili" | "youtube";

export const MUSIC_SERVER_LABELS: Record<string, string> = {
  netease: "网易云音乐",
  tencent: "QQ音乐",
  kugou: "酷狗音乐",
  xiami: "虾米音乐",
  baidu: "百度音乐",
  kuwo: "酷我音乐",
};

export const MUSIC_TYPE_LABELS: Record<string, string> = {
  song: "单曲",
  playlist: "歌单",
  artist: "艺术家",
  album: "专辑",
  search: "搜索",
};

export const VIDEO_PLATFORM_LABELS: Record<string, string> = {
  bilibili: "哔哩哔哩",
  youtube: "YouTube",
  local: "本地",
};

export function getVideoIframeSrc(platform: string, videoId: string): string {
  switch (platform) {
    case "bilibili":
      return `//player.bilibili.com/player.html?isOutside=true&bvid=${videoId}&p=1&autoplay=0`;
    case "youtube":
      return `//www.youtube.com/embed/${videoId}?autoplay=0`;
    default:
      return "";
  }
}

export interface EssayVideo {
  url: string;
  platform?: VideoPlatform;
  video_id?: string;
}

export interface EssayMusic {
  server?: MusicServer;
  type?: MusicType;
  id?: string;
  url?: string;
  title?: string;
  author?: string;
  cover?: string;
  platform?: string;
  lrc?: string;
}

export interface EssayLink {
  url: string;
  title?: string;
  favicon?: string;
}

export interface EssayContent {
  text?: string;
  images?: string[];
  video?: EssayVideo;
  music?: EssayMusic;
  link?: EssayLink;
  location?: string;
  tags?: string;
}

export interface EssayItem {
  id: number;
  content: EssayContent;
  is_publish: boolean;
  publish_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface EssayListParams {
  page?: number;
  page_size?: number;
}

export interface EssayListResponse {
  list: EssayItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminEssayListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  is_publish?: boolean | "";
}

export interface CreateEssayRequest {
  content: EssayContent;
  is_publish: boolean;
  publish_time?: string | null;
}

export type UpdateEssayRequest = CreateEssayRequest;
