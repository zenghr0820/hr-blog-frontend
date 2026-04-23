"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Select, SelectItem, Chip, addToast } from "@heroui/react";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { useImportArticles } from "@/hooks/queries/use-post-management";
import type { ImportArticlesResult } from "@/types/post-management";
import { useTemplates } from "@/hooks/queries/use-meta-mapping";
import { useDocSeriesList } from "@/hooks/queries/use-doc-series";

interface ImportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: ReturnType<typeof useImportArticles>;
}

export function ImportModal({ isOpen, onOpenChange, onImport }: ImportModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [templateKey, setTemplateKey] = useState("");
  const [docSeriesId, setDocSeriesId] = useState("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: templates = [] } = useTemplates();
  const { data: docSeriesData } = useDocSeriesList({ pageSize: 100 });
  const docSeriesList = docSeriesData?.list ?? [];

  const isSupportedFile = (nextFile: File) => {
    const lowerCaseName = nextFile.name.toLowerCase();
    return lowerCaseName.endsWith(".json") || lowerCaseName.endsWith(".zip") || lowerCaseName.endsWith(".md");
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const valid: File[] = [];
    const existingNames = new Set(files.map(f => f.name));

    for (const f of Array.from(newFiles)) {
      if (!isSupportedFile(f)) {
        addToast({ title: `${f.name} 不支持，仅支持 JSON、ZIP 或 MD 文件`, color: "warning", timeout: 3000 });
        continue;
      }
      if (existingNames.has(f.name)) {
        continue;
      }
      valid.push(f);
      existingNames.add(f.name);
    }

    if (valid.length > 0) {
      setFiles(prev => [...prev, ...valid]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      addFiles(event.target.files);
    }
    event.target.value = "";
  };

  const handleDragEnter = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files?.length) {
      addFiles(event.dataTransfer.files);
    }
  };

  const handleImport = async () => {
    if (files.length === 0) {
      addToast({ title: "请选择文件", color: "warning", timeout: 3000 });
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: files.length });

    const merged: ImportArticlesResult = {
      total_count: 0,
      success_count: 0,
      skipped_count: 0,
      failed_count: 0,
      errors: [],
      created_ids: [],
    };

    for (let i = 0; i < files.length; i++) {
      setImportProgress({ current: i + 1, total: files.length });
      try {
        const result = await onImport.mutateAsync({
          file: files[i],
          template_key: templateKey || undefined,
          doc_series_id: docSeriesId || undefined,
        });
        merged.total_count += result.total_count;
        merged.success_count += result.success_count;
        merged.skipped_count += result.skipped_count;
        merged.failed_count += result.failed_count;
        if (result.errors) merged.errors.push(...result.errors);
        if (result.created_ids) merged.created_ids!.push(...result.created_ids);
      } catch (error) {
        merged.total_count += 1;
        merged.failed_count += 1;
        merged.errors.push(`${files[i].name}: ${error instanceof Error ? error.message : "导入失败"}`);
      }
    }

    const msg =
      merged.failed_count > 0
        ? `导入完成：成功 ${merged.success_count} 篇，跳过 ${merged.skipped_count} 篇，失败 ${merged.failed_count} 篇`
        : `导入完成：成功 ${merged.success_count} 篇，跳过 ${merged.skipped_count} 篇`;
    addToast({
      title: msg,
      color: merged.failed_count > 0 ? "warning" : "success",
      timeout: 5000,
    });

    setFiles([]);
    setTemplateKey("");
    setDocSeriesId("");
    setImporting(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (importing) return;
    setFiles([]);
    setTemplateKey("");
    setDocSeriesId("");
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
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span>导入文章</span>
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">支持 JSON、ZIP 或 Markdown 格式，可多选文件</p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="gap-4">
              <Select
                label="映射模版"
                placeholder="选择映射模版（可选）"
                selectedKeys={templateKey ? new Set([templateKey]) : new Set<string>()}
                onSelectionChange={keys => {
                  if (keys === "all") return;
                  const selected = Array.from(keys)[0];
                  setTemplateKey(selected ? String(selected) : "");
                }}
                renderValue={() => {
                  const t = templates.find(item => item.template_key === templateKey);
                  return t ? `${t.template_name} (${t.template_key})` : null;
                }}
                description="导入 MD 文件时，按模版映射 frontmatter 字段到文章字段"
                isDisabled={importing}
              >
                {templates.map(t => (
                  <SelectItem key={t.template_key}>{t.template_name} ({t.template_key})</SelectItem>
                ))}
              </Select>

              <Select
                label="文档系列"
                placeholder="选择文档系列（可选）"
                selectedKeys={docSeriesId ? new Set([docSeriesId]) : new Set<string>()}
                onSelectionChange={keys => {
                  if (keys === "all") return;
                  const selected = Array.from(keys)[0];
                  setDocSeriesId(selected ? String(selected) : "");
                }}
                renderValue={() => {
                  const s = docSeriesList.find(item => item.id === docSeriesId);
                  return s ? s.name : null;
                }}
                description="选择后，导入的文章将标记为文档模式并归属该系列"
                isDisabled={docSeriesList.length === 0 || importing}
              >
                {docSeriesList.map(s => (
                  <SelectItem key={s.id}>{s.name}</SelectItem>
                ))}
              </Select>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.zip,.md"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                disabled={importing}
                className={cn(
                  "w-full border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer",
                  isDragging
                    ? "border-primary bg-primary-50/40 ring-2 ring-primary/25"
                    : "",
                  files.length > 0
                    ? "border-primary/50 bg-primary-50/30"
                    : "border-border/60 hover:border-primary/30 hover:bg-muted/30",
                  importing && "opacity-60 cursor-not-allowed"
                )}
              >
                {files.length > 0 ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-primary-100">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium">
                      已选择 {files.length} 个文件
                      {importing && ` (导入中 ${importProgress.current}/${importProgress.total})`}
                    </span>
                    <span className="text-xs text-muted-foreground">点击继续添加文件</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="p-2.5 rounded-xl bg-muted">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">{isDragging ? "释放鼠标上传文件" : "拖拽文件到此处，或点击选择文件"}</span>
                    <span className="text-xs text-muted-foreground/40">JSON / ZIP / MD（支持多选）</span>
                  </div>
                )}
              </button>

              {files.length > 0 && (
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {files.map((f, idx) => (
                    <div key={`${f.name}-${idx}`} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{f.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
                      {!importing && (
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="p-0.5 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={importing}>
                取消
              </Button>
              <Button color="primary" onPress={handleImport} isDisabled={files.length === 0} isLoading={importing}>
                {importing ? `导入中 (${importProgress.current}/${importProgress.total})` : `开始导入${files.length > 1 ? ` (${files.length} 个文件)` : ""}`}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
