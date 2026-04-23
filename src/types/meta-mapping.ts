export interface MetaMappingTemplate {
  id: number;
  created_at: string;
  updated_at: string;
  template_key: string;
  template_name: string;
  description: string;
  mapping_count: number;
}

export interface MetaMapping {
  id: number;
  created_at: string;
  updated_at: string;
  template_key: string;
  template_name: string;
  source_field: string;
  target_field: string;
  field_type: string;
  transform_rule: string;
  is_active: boolean;
  is_system: boolean;
  sort_order: number;
}

export interface CreateMetaMappingTemplateRequest {
  template_key: string;
  template_name: string;
  description?: string;
}

export interface UpdateMetaMappingTemplateRequest {
  template_name?: string;
  description?: string;
}

export interface CreateMetaMappingRequest {
  template_key: string;
  source_field: string;
  target_field: string;
  field_type: string;
  transform_rule?: string;
  sort_order?: number;
}

export interface UpdateMetaMappingRequest {
  source_field?: string;
  target_field?: string;
  field_type?: string;
  transform_rule?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface MetaMappingListByTemplateResponse {
  template_key: string;
  template_name: string;
  mappings: MetaMapping[];
}

// ===================================
//      容器映射相关类型
// ===================================

export interface ContainerMapping {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  target: string;
  params: string;
  system: string;
  is_active: boolean;
}

export interface CreateContainerMappingRequest {
  name: string;
  target: string;
  params?: string;
  system?: string;
}

export interface UpdateContainerMappingRequest {
  name?: string;
  target?: string;
  params?: string;
  system?: string;
  is_active?: boolean;
}
