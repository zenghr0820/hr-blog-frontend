import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { metaMappingApi } from "@/lib/api/meta-mapping";
import type {
  CreateMetaMappingTemplateRequest,
  UpdateMetaMappingTemplateRequest,
  CreateMetaMappingRequest,
  UpdateMetaMappingRequest,
  CreateContainerMappingRequest,
  UpdateContainerMappingRequest,
} from "@/types/meta-mapping";

export const metaMappingKeys = {
  all: ["meta-mapping"] as const,
  templates: () => [...metaMappingKeys.all, "templates"] as const,
  mappings: (templateKey: string) => [...metaMappingKeys.all, "mappings", templateKey] as const,
};

export const templatesQueryOptions = () =>
  queryOptions({
    queryKey: metaMappingKeys.templates(),
    queryFn: () => metaMappingApi.listTemplates(),
    staleTime: 1000 * 60 * 2,
  });

export const mappingsQueryOptions = (templateKey: string) =>
  queryOptions({
    queryKey: metaMappingKeys.mappings(templateKey),
    queryFn: () => metaMappingApi.getMappingsByTemplateKey(templateKey),
    enabled: !!templateKey,
    staleTime: 1000 * 60 * 2,
  });

export function useTemplates() {
  return useQuery(templatesQueryOptions());
}

export function useMappings(templateKey: string, options?: { enabled?: boolean }) {
  return useQuery({
    ...mappingsQueryOptions(templateKey),
    enabled: options?.enabled ?? !!templateKey,
  });
}

// ========== 容器映射 Hooks ==========

export const containerMappingKeys = {
  all: ["container-mapping"] as const,
  list: () => [...containerMappingKeys.all, "list"] as const,
  active: () => [...containerMappingKeys.all, "active"] as const,
};

export function useContainerMappings() {
  return useQuery({
    queryKey: containerMappingKeys.list(),
    queryFn: () => metaMappingApi.listContainerMappings(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useActiveContainerMappings() {
  return useQuery({
    queryKey: containerMappingKeys.active(),
    queryFn: () => metaMappingApi.getActiveContainerMappings(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateContainerMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContainerMappingRequest) => metaMappingApi.createContainerMapping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: containerMappingKeys.all });
    },
  });
}

export function useUpdateContainerMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContainerMappingRequest }) =>
      metaMappingApi.updateContainerMapping(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: containerMappingKeys.all });
    },
  });
}

export function useDeleteContainerMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => metaMappingApi.deleteContainerMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: containerMappingKeys.all });
    },
  });
}

export function useToggleContainerMappingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => metaMappingApi.toggleContainerMappingStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: containerMappingKeys.all });
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMetaMappingTemplateRequest) => metaMappingApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metaMappingKeys.templates() });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMetaMappingTemplateRequest }) =>
      metaMappingApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metaMappingKeys.templates() });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => metaMappingApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metaMappingKeys.templates() });
    },
  });
}

export function useCreateMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMetaMappingRequest) => metaMappingApi.createMapping(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: metaMappingKeys.mappings(variables.template_key) });
      queryClient.invalidateQueries({ queryKey: metaMappingKeys.templates() });
    },
  });
}

export function useUpdateMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMetaMappingRequest }) =>
      metaMappingApi.updateMapping(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metaMappingKeys.all });
    },
  });
}

export function useDeleteMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateKey }: { id: number; templateKey: string }) =>
      metaMappingApi.deleteMapping(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: metaMappingKeys.mappings(variables.templateKey) });
      queryClient.invalidateQueries({ queryKey: metaMappingKeys.templates() });
    },
  });
}

export function useToggleMappingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateKey }: { id: number; templateKey: string }) =>
      metaMappingApi.toggleMappingStatus(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: metaMappingKeys.mappings(variables.templateKey) });
    },
  });
}
