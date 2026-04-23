import { apiClient } from "./client";
import type {
  EssayListParams,
  EssayListResponse,
  AdminEssayListParams,
  EssayItem,
  CreateEssayRequest,
  UpdateEssayRequest,
} from "@/types/essay";

export const essayApi = {
  async getList(params: EssayListParams = {}): Promise<EssayListResponse> {
    const { page = 1, page_size = 10 } = params;
    const queryParams = new URLSearchParams();
    queryParams.append("page", String(page));
    queryParams.append("pageSize", String(page_size));

    const response = await apiClient.get<EssayListResponse>(`/api/public/essays?${queryParams.toString()}`);

    if (response.code === 200 && response.data) {
      return response.data;
    }

    throw new Error(response.message || "获取即刻列表失败");
  },

  async getAdminList(params: AdminEssayListParams = {}): Promise<EssayListResponse> {
    const { page = 1, pageSize = 10, keyword, is_publish } = params;
    const queryParams = new URLSearchParams();
    queryParams.append("page", String(page));
    queryParams.append("pageSize", String(pageSize));
    if (keyword) queryParams.append("keyword", keyword);
    if (is_publish !== "" && is_publish !== undefined) queryParams.append("is_publish", String(is_publish));

    const response = await apiClient.get<EssayListResponse>(`/api/moments?${queryParams.toString()}`);

    if (response.code === 200 && response.data) {
      return response.data;
    }

    throw new Error(response.message || "获取说说列表失败");
  },

  async create(data: CreateEssayRequest): Promise<EssayItem> {
    const response = await apiClient.post<EssayItem>("/api/moments", data);

    if (response.code >= 200 && response.code < 300 && response.data) {
      return response.data;
    }

    throw new Error(response.message || "创建说说失败");
  },

  async update(id: number, data: UpdateEssayRequest): Promise<EssayItem> {
    const response = await apiClient.put<EssayItem>(`/api/moments/${id}`, data);

    if (response.code === 200 && response.data) {
      return response.data;
    }

    throw new Error(response.message || "更新说说失败");
  },

  async delete(id: number): Promise<void> {
    const response = await apiClient.delete(`/api/moments/${id}`);
    if (response.code < 200 || response.code >= 300) {
      throw new Error(response.message || "删除说说失败");
    }
  },

  async batchDelete(ids: number[]): Promise<void> {
    const response = await apiClient.delete("/api/moments/batch", { data: { ids } });
    if (response.code < 200 || response.code >= 300) {
      throw new Error(response.message || "批量删除失败");
    }
  },
};
