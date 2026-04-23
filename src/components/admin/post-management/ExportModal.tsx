"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Select, SelectItem, Input, addToast } from "@heroui/react";
import { Download } from "lucide-react";
import type { useExportArticlesMarkdown } from "@/hooks/queries/use-post-management";
import { useTemplates } from "@/hooks/queries/use-meta-mapping";

interface ExportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: Set<string>;
  onExport: ReturnType<typeof useExportArticlesMarkdown>;
}

const TEMPLATE_OPTIONS = [
  { key: "", label: "不写入元数据" },
  { key: "default", label: "默认映射" },
];

export function ExportModal({ isOpen, onOpenChange, selectedIds, onExport }: ExportModalProps) {
  const [templateKey, setTemplateKey] = useState("");
  const [basePath, setBasePath] = useState("");

  const { data: templates = [] } = useTemplates();

  const handleExport = async () => {
    if (selectedIds.size === 0) {
      addToast({ title: "请先选择要导出的文章", color: "warning", timeout: 3000 });
      return;
    }

    try {
      await onExport.mutateAsync({
        article_ids: Array.from(selectedIds),
        template_key: templateKey || undefined,
        base_path: basePath.trim() || undefined,
      });
      addToast({ title: `已导出 ${selectedIds.size} 篇文章`, color: "success", timeout: 3000 });
      onOpenChange(false);
    } catch (error) {
      addToast({ title: error instanceof Error ? error.message : "导出失败", color: "danger", timeout: 3000 });
    }
  };

  const handleClose = () => {
    setTemplateKey("");
    setBasePath("");
    onOpenChange(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" placement="center">
      <ModalContent>
        {onClose => (
          <>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary-50">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span>导出文章</span>
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">
                    已选择 {selectedIds.size} 篇文章，导出为 Markdown ZIP 包
                  </p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="gap-4">
              <Select
                label="元数据映射"
                placeholder="选择元数据写入方式"
                selectedKeys={templateKey !== undefined ? new Set([templateKey]) : new Set<string>()}
                onSelectionChange={keys => {
                  if (keys === "all") return;
                  const selected = Array.from(keys)[0];
                  setTemplateKey(selected ? String(selected) : "");
                }}
                renderValue={() => {
                  if (templateKey === "") return "不写入元数据";
                  if (templateKey === "default") return "默认映射";
                  const t = templates.find(item => item.template_key === templateKey);
                  return t ? `${t.template_name} (${t.template_key})` : templateKey;
                }}
                description="选择如何写入 Markdown 的 frontmatter 元数据"
              >
                {[
                  ...TEMPLATE_OPTIONS,
                  ...templates.map(t => ({ key: t.template_key, label: `${t.template_name} (${t.template_key})` })),
                ].map(opt => (
                  <SelectItem key={opt.key}>{opt.label}</SelectItem>
                ))}
              </Select>

              <Input
                label="文件路径"
                placeholder="例如: content/posts"
                value={basePath}
                onValueChange={setBasePath}
                description="导出文件在 ZIP 包内的存放路径，留空则放在根目录"
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={onExport.isPending}>
                取消
              </Button>
              <Button
                color="primary"
                onPress={handleExport}
                isDisabled={selectedIds.size === 0}
                isLoading={onExport.isPending}
              >
                开始导出
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
