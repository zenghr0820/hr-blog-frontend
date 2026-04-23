"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Spinner, Switch, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Plus, Pencil, Trash2, FileJson, ChevronDown, ChevronRight } from "lucide-react";
import { AdminPageHeader, ConfirmDialog } from "@/components/admin";
import { adminContainerVariants, adminItemVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useMetaMappingPage } from "./_hooks/use-meta-mapping-page";
import { TemplateFormModal } from "./_components/TemplateFormModal";
import { MappingFormModal } from "./_components/MappingFormModal";
import { ContainerMappingFormModal } from "./_components/ContainerMappingFormModal";
import type { MetaMappingTemplate, MetaMapping, ContainerMapping } from "@/types/meta-mapping";

function TemplateRow({
  template,
  isExpanded,
  onToggleExpand,
  cm,
}: {
  template: MetaMappingTemplate;
  isExpanded: boolean;
  onToggleExpand: () => void;
  cm: ReturnType<typeof useMetaMappingPage>;
}) {
  const { data: mappingsData, isLoading: mappingsLoading } = cm.useExpandedMappings(template.template_key);
  const mappings = mappingsData?.mappings ?? [];

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer",
          isExpanded && "bg-muted/20"
        )}
        onClick={onToggleExpand}
      >
        <div className="shrink-0 text-muted-foreground">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>

        <span className="font-mono text-sm bg-muted/50 px-2 py-0.5 rounded">{template.template_key}</span>

        <span className="font-medium flex-1">{template.template_name}</span>

        <span className="text-muted-foreground text-sm line-clamp-1 max-w-[200px] hidden sm:block">
          {template.description || ""}
        </span>

        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          {template.mapping_count}
        </span>

        <span className="text-muted-foreground text-xs w-[140px] text-right hidden md:block">
          {new Date(template.updated_at).toLocaleString("zh-CN")}
        </span>

        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => cm.handleOpenCreateMapping(template.template_key)}
            className="text-primary hover:bg-primary/10"
            title="新增映射字段"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => cm.handleOpenEditTemplate(template)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => cm.handleDeleteClick("template", template)}
            className="text-danger hover:bg-danger/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pl-11 pr-4 pb-3">
              {mappingsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Spinner size="sm" label="加载映射字段..." />
                </div>
              ) : mappings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <FileJson className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">暂无映射字段</p>
                  <Button
                    size="sm"
                    variant="flat"
                    className="mt-2"
                    startContent={<Plus className="w-3.5 h-3.5" />}
                    onPress={() => cm.handleOpenCreateMapping(template.template_key)}
                  >
                    新增字段
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-border/40 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-left w-[180px]">源字段</th>
                        <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-left w-[180px]">目标字段</th>
                        <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-center w-[80px]">类型</th>
                        <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-left">转换规则</th>
                        <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-center w-[50px]">排序</th>
                        <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-center w-[60px]">状态</th>
                        <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-right w-[70px]">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {mappings.map(mapping => (
                        <tr key={mapping.id} className="bg-card/50 hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2">
                            <span className="font-mono text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                              {mapping.source_field}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-mono text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">
                              {mapping.target_field}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <FieldTypeBadge type={mapping.field_type} />
                          </td>
                          <td className="px-3 py-2">
                            {mapping.transform_rule ? (
                              <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                {mapping.transform_rule}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center text-xs text-muted-foreground">{mapping.sort_order}</td>
                          <td className="px-3 py-2 text-center">
                            <Switch
                              size="sm"
                              isSelected={mapping.is_active}
                              onValueChange={() => cm.handleToggleStatus(mapping)}
                              isDisabled={mapping.is_system}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onPress={() => cm.handleOpenEditMapping(mapping)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="h-7 w-7 text-danger hover:bg-danger/10"
                                onPress={() => cm.handleDeleteClick("mapping", mapping, mapping.template_key)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldTypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    string: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    boolean: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    date: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    array: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    number: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    object: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  };
  return (
    <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded", colorMap[type] || "bg-muted text-muted-foreground")}>
      {type}
    </span>
  );
}

function SystemBadge({ system }: { system: string }) {
  if (!system) return <span className="text-xs text-muted-foreground/50">-</span>;
  const colorMap: Record<string, string> = {
    vuepress: "bg-green-500/10 text-green-600 dark:text-green-400",
    hexo: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    hugo: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    jekyll: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    docusaurus: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  };
  return (
    <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded", colorMap[system.toLowerCase()] || "bg-muted text-muted-foreground")}>
      {system}
    </span>
  );
}

function ContainerMappingSection({ cm }: { cm: ReturnType<typeof useMetaMappingPage> }) {
  return (
    <div className="rounded-lg overflow-hidden">
      <div className="border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Icon icon="lucide:box" className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">别名</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">目标容器</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">默认参数</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">来源系统</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1 hidden sm:block">更新时间</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[60px] text-center">状态</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[70px] text-right">操作</span>
        </div>
      </div>

      {cm.containerMappingsLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner size="sm" label="加载容器映射..." />
        </div>
      ) : cm.containerMappings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <Icon icon="lucide:box" className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">暂无容器映射</p>
          <p className="text-xs mt-1">点击上方「新增映射」创建容器别名映射</p>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {cm.containerMappings.map(mapping => (
            <div
              key={mapping.id}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors",
                !mapping.is_active && "opacity-50"
              )}
            >
              <Icon icon="lucide:box" className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-mono text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded w-[120px]">
                {mapping.name}
              </span>
              <span className="font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded w-[120px]">
                {mapping.target}
              </span>
              <span className="text-xs text-muted-foreground w-[100px]">
                {mapping.params || <span className="text-muted-foreground/50">-</span>}
              </span>
              <span className="w-[100px]">
                <SystemBadge system={mapping.system} />
              </span>
              <span className="text-xs text-muted-foreground flex-1 hidden sm:block">
                {new Date(mapping.updated_at).toLocaleString("zh-CN")}
              </span>
              <span className="w-[60px] flex justify-center">
                <Switch
                  size="sm"
                  isSelected={mapping.is_active}
                  onValueChange={() => cm.handleToggleContainerMappingStatus(mapping)}
                />
              </span>
              <span className="w-[70px] flex justify-end gap-0.5">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onPress={() => cm.handleOpenEditContainerMapping(mapping)}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="h-7 w-7 text-danger hover:bg-danger/10"
                  onPress={() => cm.handleDeleteContainerMappingClick(mapping)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MetaMappingPage() {
  const cm = useMetaMappingPage();

  if (cm.templatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" label="加载中..." />
      </div>
    );
  }

  return (
    <motion.div
      className="relative h-full flex flex-col overflow-hidden -m-4 lg:-m-8"
      variants={adminContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={adminItemVariants} className="px-6 pt-5 lg:px-8 lg:pt-8">
        <AdminPageHeader
          title="映射管理"
          description="管理元数据映射模版、字段映射关系和 Markdown 容器别名映射"
          icon={FileJson}
          primaryAction={{
            label: "新建模版",
            icon: Plus,
            onClick: cm.handleOpenCreateTemplate,
          }}
        />
      </motion.div>

      <div className="flex-1 min-h-0 flex flex-col mx-6 mt-4 mb-4 lg:mx-8 lg:mb-8 gap-4 overflow-auto">
        <motion.div
          variants={adminItemVariants}
          className="bg-card border border-border/60 rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">元数据映射模版</h3>
              <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                {cm.templates.length}
              </span>
            </div>
          </div>
          <div className="overflow-auto max-h-[50vh]">
            <div className="rounded-lg overflow-hidden">
            <div className="border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-4 shrink-0" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">模版标识</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">模版名称</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider max-w-[200px] hidden sm:block">描述</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[40px] text-center">字段</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[140px] text-right hidden md:block">更新时间</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[100px] text-right">操作</span>
              </div>
            </div>

            {cm.templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileJson className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">暂无映射模版</p>
                <p className="text-xs mt-1">点击右上角「新建模版」创建第一个映射模版</p>
              </div>
            ) : (
              cm.templates.map(template => (
                <TemplateRow
                  key={template.id}
                  template={template}
                  isExpanded={cm.expandedKeys.has(template.template_key)}
                  onToggleExpand={() => cm.handleToggleExpand(template.template_key)}
                  cm={cm}
                />
              ))
            )}
          </div>
          </div>
        </motion.div>

        <motion.div
          variants={adminItemVariants}
          className="bg-card border border-border/60 rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:box" className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Markdown 容器映射</h3>
              <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                {cm.containerMappings.length}
              </span>
            </div>
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<Plus className="w-3.5 h-3.5" />}
              onPress={cm.handleOpenCreateContainerMapping}
            >
              新增映射
            </Button>
          </div>
          <div className="overflow-auto max-h-[40vh]">
            <ContainerMappingSection cm={cm} />
          </div>
        </motion.div>
      </div>

      <TemplateFormModal cm={cm} />
      <MappingFormModal cm={cm} />
      <ContainerMappingFormModal cm={cm} />

      <ConfirmDialog
        isOpen={cm.deleteModal.isOpen}
        onOpenChange={cm.deleteModal.onOpenChange}
        title={
          cm.containerDeleteTarget
            ? "删除容器映射"
            : cm.deleteTarget?.type === "template"
              ? "删除模版"
              : "删除映射字段"
        }
        description={
          cm.containerDeleteTarget
            ? `确定要删除容器别名「${cm.containerDeleteTarget.name} → ${cm.containerDeleteTarget.target}」吗？此操作不可撤销。`
            : cm.deleteTarget?.type === "template"
              ? `确定要删除模版「${(cm.deleteTarget?.item as MetaMappingTemplate)?.template_name}」吗？该模版下的所有映射字段也将被删除，此操作不可撤销。`
              : `确定要删除映射字段「${(cm.deleteTarget?.item as MetaMapping)?.source_field} → ${(cm.deleteTarget?.item as MetaMapping)?.target_field}」吗？此操作不可撤销。`
        }
        confirmText="删除"
        confirmColor="danger"
        icon={<Trash2 className="w-5 h-5 text-danger" />}
        iconBg="bg-danger/10"
        loading={cm.deleteLoading || cm.deleteContainerMappingLoading}
        onConfirm={cm.containerDeleteTarget ? cm.handleDeleteContainerMappingConfirm : cm.handleDeleteConfirm}
      />
    </motion.div>
  );
}
