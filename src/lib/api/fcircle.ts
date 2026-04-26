/**
 * 朋友圈 API 服务
 * 对接 anheyu-app 后端 /api/fcircle 相关接口
 */

import { apiClient } from "./client";
import type {
  FCircleMoment,
  FCircleMomentListResponse,
  GetMomentsParams,
  GetMomentsByLinkIDParams,
} from "@/types/fcircle";

export const fcircleApi = {
  /**
   * 获取朋友圈动态列表
   * GET /api/fcircle/moments
   */
  async getMoments(params: GetMomentsParams = {}): Promise<FCircleMomentListResponse> {
    const { page = 1, page_size = 20, link_id } = params;
    const queryParams = new URLSearchParams();
    queryParams.append("page", String(page));
    queryParams.append("page_size", String(page_size));
    if (link_id) {
      queryParams.append("link_id", String(link_id));
    }

    const response = await apiClient.get<FCircleMomentListResponse>(`/api/fcircle/moments?${queryParams.toString()}`);

    if (response.code === 200 && response.data) {
      return response.data;
    }

    throw new Error(response.message || "获取动态列表失败");
  },

  /**
   * 根据友链ID获取动态列表
   * GET /api/fcircle/links/:link_id/moments
   */
  async getMomentsByLinkID(linkId: number, params: GetMomentsByLinkIDParams = {}): Promise<FCircleMomentListResponse> {
    const { page = 1, page_size = 5 } = params;
    const queryParams = new URLSearchParams();
    queryParams.append("page", String(page));
    queryParams.append("page_size", String(page_size));

    const response = await apiClient.get<FCircleMomentListResponse>(
      `/api/fcircle/links/${linkId}/moments?${queryParams.toString()}`
    );

    if (response.code === 200 && response.data) {
      return response.data;
    }

    throw new Error(response.message || "获取友链动态列表失败");
  },

  /**
   * 获取单个动态详情
   * GET /api/fcircle/moments/:id
   */
  async getMomentByID(id: number): Promise<FCircleMoment> {
    const response = await apiClient.get<FCircleMoment>(`/api/fcircle/moments/${id}`);

    if (response.code === 200 && response.data) {
      return response.data;
    }

    throw new Error(response.message || "获取动态详情失败");
  },

  /**
   * 刷新动态（手动触发爬取）
   * POST /api/fcircle/moments/refresh
   */
  async refreshMoments(): Promise<void> {
    const response = await apiClient.post("/api/fcircle/moments/refresh");

    if (response.code !== 200) {
      throw new Error(response.message || "刷新动态失败");
    }
  },

  /**
   * 获取随机动态（钓鱼）
   * GET /api/fcircle/random-post
   */
  async getRandomPost(): Promise<FCircleMoment> {
    const response = await apiClient.get<FCircleMoment>("/api/fcircle/random-post");

    if (response.code === 200 && response.data) {
      return response.data;
    }

    throw new Error(response.message || "获取随机动态失败");
  },

  /**
   * 获取朋友圈统计数据
   * GET /api/fcircle/statistics
   */
  async getStatistics(): Promise<FCircleStatistics> {
    const response = await apiClient.get<FCircleStatistics>("/api/fcircle/statistics");

    if (response.code === 200 && response.data) {
      return response.data;
    }

    throw new Error(response.message || "获取统计数据失败");
  },
};