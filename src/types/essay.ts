export interface EssayVideo {
  url: string;
  platform?: "local" | "bilibili" | "youtube";
  video_id?: string;
}

export interface EssayMusic {
  url: string;
  title?: string;
  author?: string;
  cover?: string;
  platform?: string;
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
  publish_time: string;
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
