import { apiClient } from "./client";

const AI_TIMEOUT = 120000;

export const aiApi = {
  async generateSummary(content: string): Promise<string> {
    const response = await apiClient.post<{ summary: string }>("/api/admin/ai/summary", { content }, { timeout: AI_TIMEOUT });
    return response.data.summary;
  },

  async generateAISummary(content: string): Promise<string> {
    const response = await apiClient.post<{ summary: string }>("/api/admin/ai/ai-summary", { content }, { timeout: AI_TIMEOUT });
    return response.data.summary;
  },
};
