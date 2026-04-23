import { apiClient } from "./client";

export interface VideoParseResult {
  platform: string;
  video_id: string;
}

export interface LinkMetadata {
  url: string;
  title: string;
  description: string;
  favicon: string;
}

export interface MusicParseResult {
  server: string;
  type: string;
  id: string;
  title: string;
  author: string;
  url: string;
  pic: string;
  lrc: string;
}

export const toolsApi = {
  async parseVideo(url: string): Promise<VideoParseResult> {
    const response = await apiClient.post<VideoParseResult>("/api/tools/parse-video", { url });

    if (response.code >= 200 && response.code < 300 && response.data) {
      return response.data;
    }

    throw new Error(response.message || "视频解析失败");
  },

  async fetchLinkMetadata(url: string): Promise<LinkMetadata> {
    const response = await apiClient.post<LinkMetadata>("/api/tools/fetch-link-metadata", { url });

    if (response.code >= 200 && response.code < 300 && response.data) {
      return response.data;
    }

    throw new Error(response.message || "链接解析失败");
  },

  async parseMusic(server: string, type: string, id: string): Promise<MusicParseResult> {
    const response = await apiClient.post<MusicParseResult>("/api/tools/parse-music", {
      server,
      type,
      id,
    });

    if (response.code >= 200 && response.code < 300 && response.data) {
      return response.data;
    }

    throw new Error(response.message || "音乐解析失败");
  },
};
