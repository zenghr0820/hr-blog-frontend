import { apiClient } from "./client";
import type {
  MetaMappingTemplate,
  MetaMappingListByTemplateResponse,
  CreateMetaMappingTemplateRequest,
  UpdateMetaMappingTemplateRequest,
  CreateMetaMappingRequest,
  UpdateMetaMappingRequest,
  ContainerMapping,
  CreateContainerMappingRequest,
  UpdateContainerMappingRequest,
} from "@/types/meta-mapping";

export const metaMappingApi = {
  async listTemplates(): Promise<MetaMappingTemplate[]> {
    const response = await apiClient.get<MetaMappingTemplate[]>("/api/meta-mappings/templates");
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response.message || "获取模版列表失败");
  },

  async createTemplate(data: CreateMetaMappingTemplateRequest): Promise<MetaMappingTemplate> {
    const response = await apiClient.post<MetaMappingTemplate>("/api/meta-mappings/templates", data);
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response.message || "创建模版失败");
  },

  async updateTemplate(id: number, data: UpdateMetaMappingTemplateRequest): Promise<MetaMappingTemplate> {
    const response = await apiClient.put<MetaMappingTemplate>(`/api/meta-mappings/templates/${id}`, data);
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response.message || "更新模版失败");
  },

  async deleteTemplate(id: number): Promise<void> {
    const response = await apiClient.delete(`/api/meta-mappings/templates/${id}`);
    if (response.code !== 200) {
      throw new Error(response.message || "删除模版失败");
    }
  },

  async getMappingsByTemplateKey(templateKey: string): Promise<MetaMappingListByTemplateResponse> {
    const response = await apiClient.get<MetaMappingListByTemplateResponse>(
      `/api/meta-mappings/${templateKey}`
    );
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response.message || "获取映射字段失败");
  },

  async createMapping(data: CreateMetaMappingRequest): Promise<MetaMappingListByTemplateResponse> {
    const response = await apiClient.post<MetaMappingListByTemplateResponse>("/api/meta-mappings", data);
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response.message || "创建映射字段失败");
  },

  async updateMapping(id: number, data: UpdateMetaMappingRequest): Promise<MetaMappingListByTemplateResponse> {
    const response = await apiClient.put<MetaMappingListByTemplateResponse>(`/api/meta-mappings/${id}`, data);
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response.message || "更新映射字段失败");
  },

  async deleteMapping(id: number): Promise<void> {
    const response = await apiClient.delete(`/api/meta-mappings/${id}`);
    if (response.code !== 200) {
      throw new Error(response.message || "删除映射字段失败");
    }
  },

  async toggleMappingStatus(id: number): Promise<boolean> {
    const response = await apiClient.put<boolean>(`/api/meta-mappings/${id}/toggle`);
    if (response.code === 200 && response.data !== undefined) {
      return response.data;
    }
    throw new Error(response.message || "切换状态失败");
  },

  // ========== 容器映射 ==========

  async listContainerMappings(): Promise<ContainerMapping[]> {
    const response = await apiClient.get<ContainerMapping[]>("/api/container-mappings");
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response.message || "获取容器映射列表失败");
  },

  async getActiveContainerMappings(): Promise<ContainerMapping[]> {
    const response = await apiClient.get<ContainerMapping[]>("/api/container-mappings/active");
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response.message || "获取活跃容器映射失败");
  },

  async getPublicContainerMappings(): Promise<ContainerMapping[]> {
    const response = await apiClient.get<ContainerMapping[]>("/api/public/container-mappings");
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response.message || "获取容器映射失败");
  },

  async createContainerMapping(data: CreateContainerMappingRequest): Promise<ContainerMapping> {
    const response = await apiClient.post<ContainerMapping>("/api/container-mappings", data);
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response.message || "创建容器映射失败");
  },

  async updateContainerMapping(id: number, data: UpdateContainerMappingRequest): Promise<ContainerMapping> {
    const response = await apiClient.put<ContainerMapping>(`/api/container-mappings/${id}`, data);
    if (response.code === 200 && response.data) {
      return response.data;
    }
    throw new Error(response.message || "更新容器映射失败");
  },

  async deleteContainerMapping(id: number): Promise<void> {
    const response = await apiClient.delete(`/api/container-mappings/${id}`);
    if (response.code !== 200) {
      throw new Error(response.message || "删除容器映射失败");
    }
  },

  async toggleContainerMappingStatus(id: number): Promise<boolean> {
    const response = await apiClient.put<boolean>(`/api/container-mappings/${id}/toggle`);
    if (response.code === 200 && response.data !== undefined) {
      return response.data;
    }
    throw new Error(response.message || "切换状态失败");
  },
};
