"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea } from "@heroui/react";
import type { MetaMappingTemplate, CreateMetaMappingTemplateRequest, UpdateMetaMappingTemplateRequest } from "@/types/meta-mapping";
import type { MetaMappingPageState } from "../_hooks/use-meta-mapping-page";

interface TemplateFormModalProps {
  cm: MetaMappingPageState;
}

export function TemplateFormModal({ cm }: TemplateFormModalProps) {
  const isEdit = !!cm.editTemplate;
  const [templateKey, setTemplateKey] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (cm.editTemplate) {
      setTemplateKey(cm.editTemplate.template_key);
      setTemplateName(cm.editTemplate.template_name);
      setDescription(cm.editTemplate.description || "");
    } else {
      setTemplateKey("");
      setTemplateName("");
      setDescription("");
    }
  }, [cm.editTemplate, cm.templateFormModal.isOpen]);

  const isValid = templateKey.trim() && templateName.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    if (isEdit) {
      const data: UpdateMetaMappingTemplateRequest = {
        template_name: templateName.trim(),
        description: description.trim() || undefined,
      };
      cm.handleSubmitTemplate(data);
    } else {
      const data: CreateMetaMappingTemplateRequest = {
        template_key: templateKey.trim(),
        template_name: templateName.trim(),
        description: description.trim() || undefined,
      };
      cm.handleSubmitTemplate(data);
    }
  };

  return (
    <Modal
      isOpen={cm.templateFormModal.isOpen}
      onOpenChange={cm.templateFormModal.onOpenChange}
      backdrop="blur"
      placement="center"
    >
      <ModalContent>
        {onClose => (
          <>
            <ModalHeader>{isEdit ? "编辑模版" : "新建模版"}</ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label="模版标识 (Key)"
                placeholder="例如: vuepress、hexo"
                value={templateKey}
                onValueChange={setTemplateKey}
                isDisabled={isEdit}
                description={isEdit ? "模版标识创建后不可修改" : "唯一标识，创建后不可修改"}
                isRequired
              />
              <Input
                label="模版名称"
                placeholder="例如: VuePress、Hexo"
                value={templateName}
                onValueChange={setTemplateName}
                isRequired
              />
              <Textarea
                label="描述"
                placeholder="模版描述（可选）"
                value={description}
                onValueChange={setDescription}
                minRows={2}
                maxRows={4}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={cm.createTemplateLoading || cm.updateTemplateLoading}>
                取消
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isDisabled={!isValid}
                isLoading={cm.createTemplateLoading || cm.updateTemplateLoading}
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
