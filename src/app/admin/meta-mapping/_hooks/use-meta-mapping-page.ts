import { useState, useCallback, useMemo } from "react";
import { addToast, useDisclosure } from "@heroui/react";
import {
  useTemplates,
  useMappings,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useCreateMapping,
  useUpdateMapping,
  useDeleteMapping,
  useToggleMappingStatus,
  useContainerMappings,
  useCreateContainerMapping,
  useUpdateContainerMapping,
  useDeleteContainerMapping,
  useToggleContainerMappingStatus,
} from "@/hooks/queries/use-meta-mapping";
import type {
  MetaMappingTemplate,
  MetaMapping,
  CreateMetaMappingTemplateRequest,
  UpdateMetaMappingTemplateRequest,
  CreateMetaMappingRequest,
  UpdateMetaMappingRequest,
  ContainerMapping,
  CreateContainerMappingRequest,
  UpdateContainerMappingRequest,
} from "@/types/meta-mapping";

export function useMetaMappingPage() {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [mappingTemplateKey, setMappingTemplateKey] = useState<string>("");
  const [editTemplate, setEditTemplate] = useState<MetaMappingTemplate | null>(null);
  const [editMapping, setEditMapping] = useState<MetaMapping | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "template" | "mapping";
    item: MetaMappingTemplate | MetaMapping;
    templateKey?: string;
  } | null>(null);

  const templateFormModal = useDisclosure();
  const mappingFormModal = useDisclosure();
  const deleteModal = useDisclosure();
  const containerMappingFormModal = useDisclosure();

  const [editContainerMapping, setEditContainerMapping] = useState<ContainerMapping | null>(null);
  const [containerDeleteTarget, setContainerDeleteTarget] = useState<ContainerMapping | null>(null);

  const { data: templates = [], isLoading: templatesLoading } = useTemplates();

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const createMapping = useCreateMapping();
  const updateMapping = useUpdateMapping();
  const deleteMapping = useDeleteMapping();
  const toggleMappingStatus = useToggleMappingStatus();

  const { data: containerMappings = [], isLoading: containerMappingsLoading } = useContainerMappings();
  const createContainerMapping = useCreateContainerMapping();
  const updateContainerMapping = useUpdateContainerMapping();
  const deleteContainerMapping = useDeleteContainerMapping();
  const toggleContainerMappingStatus = useToggleContainerMappingStatus();

  const mappingsCache = useMemo(() => {
    const cache: Record<string, MetaMapping[]> = {};
    return cache;
  }, []);

  const useExpandedMappings = (templateKey: string) => {
    return useMappings(templateKey, { enabled: expandedKeys.has(templateKey) });
  };

  const handleToggleExpand = useCallback((templateKey: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(templateKey)) {
        next.delete(templateKey);
      } else {
        next.add(templateKey);
      }
      return next;
    });
  }, []);

  const handleOpenCreateTemplate = useCallback(() => {
    setEditTemplate(null);
    templateFormModal.onOpen();
  }, [templateFormModal]);

  const handleOpenEditTemplate = useCallback(
    (template: MetaMappingTemplate) => {
      setEditTemplate(template);
      templateFormModal.onOpen();
    },
    [templateFormModal]
  );

  const handleSubmitTemplate = useCallback(
    async (data: CreateMetaMappingTemplateRequest | UpdateMetaMappingTemplateRequest) => {
      try {
        if (editTemplate) {
          await updateTemplate.mutateAsync({ id: editTemplate.id, data: data as UpdateMetaMappingTemplateRequest });
          addToast({ title: "模版更新成功", color: "success", timeout: 3000 });
        } else {
          await createTemplate.mutateAsync(data as CreateMetaMappingTemplateRequest);
          addToast({ title: "模版创建成功", color: "success", timeout: 3000 });
        }
        templateFormModal.onClose();
      } catch (error) {
        addToast({
          title: error instanceof Error ? error.message : "操作失败",
          color: "danger",
          timeout: 3000,
        });
      }
    },
    [editTemplate, createTemplate, updateTemplate, templateFormModal]
  );

  const handleOpenCreateMapping = useCallback(
    (templateKey: string) => {
      setMappingTemplateKey(templateKey);
      setEditMapping(null);
      mappingFormModal.onOpen();
    },
    [mappingFormModal]
  );

  const handleOpenEditMapping = useCallback(
    (mapping: MetaMapping) => {
      setMappingTemplateKey(mapping.template_key);
      setEditMapping(mapping);
      mappingFormModal.onOpen();
    },
    [mappingFormModal]
  );

  const handleSubmitMapping = useCallback(
    async (data: CreateMetaMappingRequest | UpdateMetaMappingRequest) => {
      try {
        if (editMapping) {
          await updateMapping.mutateAsync({ id: editMapping.id, data: data as UpdateMetaMappingRequest });
          addToast({ title: "映射字段更新成功", color: "success", timeout: 3000 });
        } else {
          await createMapping.mutateAsync({
            ...(data as CreateMetaMappingRequest),
            template_key: mappingTemplateKey,
          });
          addToast({ title: "映射字段创建成功", color: "success", timeout: 3000 });
        }
        mappingFormModal.onClose();
      } catch (error) {
        addToast({
          title: error instanceof Error ? error.message : "操作失败",
          color: "danger",
          timeout: 3000,
        });
      }
    },
    [editMapping, mappingTemplateKey, createMapping, updateMapping, mappingFormModal]
  );

  const handleDeleteClick = useCallback(
    (type: "template" | "mapping", item: MetaMappingTemplate | MetaMapping, templateKey?: string) => {
      setDeleteTarget({ type, item, templateKey });
      deleteModal.onOpen();
    },
    [deleteModal]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "template") {
        await deleteTemplate.mutateAsync(deleteTarget.item.id);
        setExpandedKeys(prev => {
          const next = new Set(prev);
          next.delete((deleteTarget.item as MetaMappingTemplate).template_key);
          return next;
        });
        addToast({ title: "模版已删除", color: "success", timeout: 3000 });
      } else {
        await deleteMapping.mutateAsync({
          id: deleteTarget.item.id,
          templateKey: deleteTarget.templateKey!,
        });
        addToast({ title: "映射字段已删除", color: "success", timeout: 3000 });
      }
    } catch (error) {
      addToast({
        title: error instanceof Error ? error.message : "删除失败",
        color: "danger",
        timeout: 3000,
      });
    }
    deleteModal.onClose();
    setDeleteTarget(null);
  }, [deleteTarget, deleteTemplate, deleteMapping, deleteModal]);

  const handleToggleStatus = useCallback(
    async (mapping: MetaMapping) => {
      try {
        await toggleMappingStatus.mutateAsync({
          id: mapping.id,
          templateKey: mapping.template_key,
        });
        addToast({
          title: mapping.is_active ? "已禁用" : "已启用",
          color: "success",
          timeout: 3000,
        });
      } catch (error) {
        addToast({
          title: error instanceof Error ? error.message : "操作失败",
          color: "danger",
          timeout: 3000,
        });
      }
    },
    [toggleMappingStatus]
  );

  const handleOpenCreateContainerMapping = useCallback(() => {
    setEditContainerMapping(null);
    containerMappingFormModal.onOpen();
  }, [containerMappingFormModal]);

  const handleOpenEditContainerMapping = useCallback(
    (mapping: ContainerMapping) => {
      setEditContainerMapping(mapping);
      containerMappingFormModal.onOpen();
    },
    [containerMappingFormModal]
  );

  const handleCreateContainerMapping = useCallback(
    async (data: CreateContainerMappingRequest) => {
      await createContainerMapping.mutateAsync(data);
      addToast({ title: "创建成功", color: "success", timeout: 3000 });
    },
    [createContainerMapping]
  );

  const handleUpdateContainerMapping = useCallback(
    async (id: number, data: UpdateContainerMappingRequest) => {
      await updateContainerMapping.mutateAsync({ id, data });
      addToast({ title: "更新成功", color: "success", timeout: 3000 });
    },
    [updateContainerMapping]
  );

  const handleDeleteContainerMappingClick = useCallback(
    (mapping: ContainerMapping) => {
      setContainerDeleteTarget(mapping);
      deleteModal.onOpen();
    },
    [deleteModal]
  );

  const handleDeleteContainerMappingConfirm = useCallback(async () => {
    if (!containerDeleteTarget) return;
    try {
      await deleteContainerMapping.mutateAsync(containerDeleteTarget.id);
      addToast({ title: "删除成功", color: "success", timeout: 3000 });
      deleteModal.onClose();
      setContainerDeleteTarget(null);
    } catch (error) {
      addToast({
        title: error instanceof Error ? error.message : "删除失败",
        color: "danger",
        timeout: 3000,
      });
    }
  }, [containerDeleteTarget, deleteContainerMapping, deleteModal]);

  const handleToggleContainerMappingStatus = useCallback(
    async (mapping: ContainerMapping) => {
      try {
        await toggleContainerMappingStatus.mutateAsync(mapping.id);
        addToast({
          title: mapping.is_active ? "已禁用" : "已启用",
          color: "success",
          timeout: 3000,
        });
      } catch (error) {
        addToast({
          title: error instanceof Error ? error.message : "操作失败",
          color: "danger",
          timeout: 3000,
        });
      }
    },
    [toggleContainerMappingStatus]
  );

  return {
    templates,
    templatesLoading,
    expandedKeys,
    editTemplate,
    editMapping,
    mappingTemplateKey,
    deleteTarget,
    templateFormModal,
    mappingFormModal,
    deleteModal,
    useExpandedMappings,
    handleToggleExpand,
    handleOpenCreateTemplate,
    handleOpenEditTemplate,
    handleSubmitTemplate,
    handleOpenCreateMapping,
    handleOpenEditMapping,
    handleSubmitMapping,
    handleDeleteClick,
    handleDeleteConfirm,
    handleToggleStatus,
    createTemplateLoading: createTemplate.isPending,
    updateTemplateLoading: updateTemplate.isPending,
    deleteLoading: deleteTemplate.isPending || deleteMapping.isPending,
    createMappingLoading: createMapping.isPending,
    updateMappingLoading: updateMapping.isPending,

    containerMappings,
    containerMappingsLoading,
    editContainerMapping,
    containerDeleteTarget,
    containerMappingFormModal,
    handleOpenCreateContainerMapping,
    handleOpenEditContainerMapping,
    handleCreateContainerMapping,
    handleUpdateContainerMapping,
    handleDeleteContainerMappingClick,
    handleDeleteContainerMappingConfirm,
    handleToggleContainerMappingStatus,
    createContainerMappingLoading: createContainerMapping.isPending,
    updateContainerMappingLoading: updateContainerMapping.isPending,
    deleteContainerMappingLoading: deleteContainerMapping.isPending,
  };
}

export type MetaMappingPageState = ReturnType<typeof useMetaMappingPage>;
