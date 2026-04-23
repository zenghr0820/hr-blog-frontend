import { apiClient } from "./client";
import type { EssayListParams, EssayListResponse } from "@/types/essay";

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
};
