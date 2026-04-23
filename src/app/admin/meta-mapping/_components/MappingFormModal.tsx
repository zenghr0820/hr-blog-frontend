"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
  Textarea,
} from "@heroui/react";
import type { CreateMetaMappingRequest, UpdateMetaMappingRequest, MetaMapping } from "@/types/meta-mapping";
import type { MetaMappingPageState } from "../_hooks/use-meta-mapping-page";

const FIELD_TYPES = [
  { key: "string", label: "字符串 (String)" },
  { key: "boolean", label: "布尔值 (Boolean)" },
  { key: "date", label: "日期 (Date)" },
  { key: "array", label: "数组 (Array)" },
  { key: "number", label: "数字 (Number)" },
  { key: "object", label: "对象 (Object)" },
];

const TARGET_FIELDS = [
  { key: "Title", label: "标题 (Title)" },
  { key: "Abbrlink", label: "别名/永久链接 (Abbrlink)" },
  { key: "Summaries", label: "摘要 (Summaries)" },
  { key: "CoverURL", label: "封面 (CoverURL)" },
  { key: "Categories", label: "分类 (Categories)" },
  { key: "Tags", label: "标签 (Tags)" },
  { key: "CreatedAt", label: "发布时间 (CreatedAt)" },
  { key: "UpdatedAt", label: "更新时间 (UpdatedAt)" },
  { key: "Status", label: "状态 (Status)" },
  { key: "PinSort", label: "是否置顶 (PinSort)" },
  { key: "HomeSort", label: "是否精选 (HomeSort)" },
  { key: "IPLocation", label: "发布地点 (IPLocation)" },
  { key: "TopImgURL", label: "顶部图 (TopImgURL)" },
  { key: "Keywords", label: "关键词 (Keywords)" },
  { key: "Copyright", label: "版权 (Copyright)" },
  { key: "IsReprint", label: "是否转载 (IsReprint)" },
  { key: "CopyrightAuthor", label: "版权作者 (CopyrightAuthor)" },
  { key: "CopyrightAuthorHref", label: "版权作者链接 (CopyrightAuthorHref)" },
  { key: "CopyrightURL", label: "版权来源链接 (CopyrightURL)" },
  { key: "PrimaryColor", label: "主色调 (PrimaryColor)" },
  { key: "IsPrimaryColorManual", label: "主色调手动设置 (IsPrimaryColorManual)" },
  { key: "ShowOnHome", label: "首页显示 (ShowOnHome)" },
  { key: "ScheduledAt", label: "定时发布 (ScheduledAt)" },
  { key: "IsDoc", label: "文档模式 (IsDoc)" },
  { key: "DocSort", label: "文档排序 (DocSort)" },
];

interface MappingFormModalProps {
  cm: MetaMappingPageState;
}

export function MappingFormModal({ cm }: MappingFormModalProps) {
  const isEdit = !!cm.editMapping;
  const [sourceField, setSourceField] = useState("");
  const [targetField, setTargetField] = useState("");
  const [fieldType, setFieldType] = useState("string");
  const [transformRule, setTransformRule] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  useEffect(() => {
    if (cm.editMapping) {
      setSourceField(cm.editMapping.source_field);
      setTargetField(cm.editMapping.target_field);
      setFieldType(cm.editMapping.field_type);
      setTransformRule(cm.editMapping.transform_rule || "");
      setSortOrder(String(cm.editMapping.sort_order));
    } else {
      setSourceField("");
      setTargetField("");
      setFieldType("string");
      setTransformRule("");
      setSortOrder("0");
    }
  }, [cm.editMapping, cm.mappingFormModal.isOpen]);

  const isValid = sourceField.trim() && targetField.trim() && fieldType;

  const handleSubmit = () => {
    if (!isValid) return;
    if (isEdit) {
      const data: UpdateMetaMappingRequest = {
        source_field: sourceField.trim(),
        target_field: targetField.trim(),
        field_type: fieldType,
        transform_rule: transformRule.trim() || undefined,
        sort_order: parseInt(sortOrder) || 0,
      };
      cm.handleSubmitMapping(data);
    } else {
      const data: CreateMetaMappingRequest = {
        template_key: cm.mappingTemplateKey,
        source_field: sourceField.trim(),
        target_field: targetField.trim(),
        field_type: fieldType,
        transform_rule: transformRule.trim() || undefined,
        sort_order: parseInt(sortOrder) || 0,
      };
      cm.handleSubmitMapping(data);
    }
  };

  return (
    <Modal
      isOpen={cm.mappingFormModal.isOpen}
      onOpenChange={cm.mappingFormModal.onOpenChange}
      backdrop="blur"
      placement="center"
      size="lg"
    >
      <ModalContent>
        {onClose => (
          <>
            <ModalHeader>{isEdit ? "编辑映射字段" : "新建映射字段"}</ModalHeader>
            <ModalBody className="gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="源字段名"
                  placeholder="meta 中的 key"
                  value={sourceField}
                  onValueChange={setSourceField}
                  isRequired
                />
                <Autocomplete
                  label="目标字段名"
                  placeholder="选择或输入字段名"
                  variant="bordered"
                  isRequired
                  allowsCustomValue
                  selectedKey={TARGET_FIELDS.find(f => f.key === targetField) ? targetField : undefined}
                  inputValue={targetField}
                  onInputChange={setTargetField}
                  onSelectionChange={key => {
                    if (key) setTargetField(key as string);
                  }}
                >
                  {TARGET_FIELDS.map(f => (
                    <AutocompleteItem key={f.key} textValue={f.label}>
                      {f.label}
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="字段类型"
                  selectedKeys={[fieldType]}
                  onSelectionChange={keys => {
                    const selected = Array.from(keys)[0] as string;
                    if (selected) setFieldType(selected);
                  }}
                  isRequired
                >
                  {FIELD_TYPES.map(ft => (
                    <SelectItem key={ft.key}>{ft.label}</SelectItem>
                  ))}
                </Select>
                <Input
                  label="排序"
                  type="number"
                  value={sortOrder}
                  onValueChange={setSortOrder}
                  description="数值越小越靠前"
                />
              </div>
              <Textarea
                label="转换规则 (JSON)"
                placeholder='例如: {"format": "date", "pattern": "yyyy-MM-dd"}'
                value={transformRule}
                onValueChange={setTransformRule}
                minRows={2}
                maxRows={4}
                description="可选，JSON 格式的转换规则"
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={cm.createMappingLoading || cm.updateMappingLoading}>
                取消
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isDisabled={!isValid}
                isLoading={cm.createMappingLoading || cm.updateMappingLoading}
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
