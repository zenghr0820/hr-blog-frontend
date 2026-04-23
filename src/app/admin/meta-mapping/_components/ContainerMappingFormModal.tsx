"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Autocomplete, AutocompleteItem, addToast } from "@heroui/react";
import type { ContainerMapping, CreateContainerMappingRequest, UpdateContainerMappingRequest } from "@/types/meta-mapping";
import type { MetaMappingPageState } from "@/app/admin/meta-mapping/_hooks/use-meta-mapping-page";

const TARGET_CONTAINERS = [
  { key: "tabs", label: "标签切换 (tabs)" },
  { key: "password-content", label: "密码保护 (password-content)" },
  { key: "paid-content", label: "付费内容 (paid-content)" },
  { key: "login-required", label: "登录可见 (login-required)" },
  { key: "folding", label: "折叠框 (folding)" },
  { key: "hidden", label: "隐藏内容 (hidden)" },
  { key: "btns", label: "按钮组 (btns)" },
  { key: "gallery", label: "图片画廊 (gallery)" },
  { key: "video-gallery", label: "视频画廊 (video-gallery)" },
  { key: "note", label: "注意提示 (note)" },
  { key: "tip", label: "提示 (tip)" },
  { key: "warning", label: "警告 (warning)" },
  { key: "danger", label: "危险 (danger)" },
];

interface ContainerMappingFormModalProps {
  cm: MetaMappingPageState;
}

export function ContainerMappingFormModal({ cm }: ContainerMappingFormModalProps) {
  const isEdit = cm.editContainerMapping !== null;
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [params, setParams] = useState("");
  const [system, setSystem] = useState("");

  useEffect(() => {
    if (cm.editContainerMapping) {
      setName(cm.editContainerMapping.name);
      setTarget(cm.editContainerMapping.target);
      setParams(cm.editContainerMapping.params);
      setSystem(cm.editContainerMapping.system);
    } else {
      setName("");
      setTarget("");
      setParams("");
      setSystem("");
    }
  }, [cm.editContainerMapping, cm.containerMappingFormModal.isOpen]);

  const handleSubmit = async () => {
    if (!name.trim() || !target.trim()) {
      addToast({ title: "别名和目标容器不能为空", color: "warning", timeout: 3000 });
      return;
    }
    try {
      if (isEdit) {
        const data: UpdateContainerMappingRequest = {
          name: name.trim(),
          target: target.trim(),
          params: params.trim(),
          system: system.trim(),
        };
        await cm.handleUpdateContainerMapping(cm.editContainerMapping!.id, data);
      } else {
        const data: CreateContainerMappingRequest = {
          name: name.trim(),
          target: target.trim(),
          params: params.trim(),
          system: system.trim(),
        };
        await cm.handleCreateContainerMapping(data);
      }
      cm.containerMappingFormModal.onClose();
    } catch (error) {
      addToast({
        title: error instanceof Error ? error.message : "操作失败",
        color: "danger",
        timeout: 3000,
      });
    }
  };

  return (
    <Modal
      isOpen={cm.containerMappingFormModal.isOpen}
      onOpenChange={cm.containerMappingFormModal.onOpenChange}
      backdrop="blur"
      placement="center"
    >
      <ModalContent>
        {onClose => (
          <>
            <ModalHeader>{isEdit ? "编辑容器映射" : "新增容器映射"}</ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label="容器别名"
                placeholder="例如: tip、hint"
                value={name}
                onValueChange={setName}
                description="Markdown 中 ::: 后面使用的名称"
              />

              <Autocomplete
                label="目标容器"
                placeholder="选择或输入目标容器名"
                selectedKey={TARGET_CONTAINERS.find(c => c.key === target)?.key || ""}
                onSelectionChange={key => {
                  if (key) setTarget(String(key));
                }}
                allowsCustomValue
                inputValue={target}
                onInputChange={setTarget}
                description="映射到的项目内置容器"
              >
                {TARGET_CONTAINERS.map(c => (
                  <AutocompleteItem key={c.key}>{c.label}</AutocompleteItem>
                ))}
              </Autocomplete>

              <Input
                label="默认参数"
                placeholder="例如: info"
                value={params}
                onValueChange={setParams}
                description="渲染时附加的默认参数"
              />

              <Input
                label="来源系统"
                placeholder="例如: vuepress、hexo"
                value={system}
                onValueChange={setSystem}
                description="标识此别名来源的博客系统"
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                取消
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isDisabled={!name.trim() || !target.trim()}
                isLoading={cm.createContainerMappingLoading || cm.updateContainerMappingLoading}
              >
                {isEdit ? "保存" : "创建"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
