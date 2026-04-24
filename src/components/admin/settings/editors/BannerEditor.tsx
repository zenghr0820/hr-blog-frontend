/**
 * 通用横幅配置编辑器组件
 * 用于统一管理各个页面的横幅配置（背景图、标题、描述、提示）
 */
"use client";

import { FormInput } from "@/components/ui/form-input";
import { FormImageUpload } from "@/components/ui/form-image-upload";
import { SettingsFieldGroup } from "../SettingsSection";

interface BannerEditorProps {
  /** 配置前缀，例如 "equipment.banner" 或 "recent_comments.banner" */
  prefix: string;
  /** 当前所有配置值 */
  values: Record<string, string>;
  /** 配置变更回调 */
  onChange: (key: string, value: string) => void;
  /** 是否显示为两列布局 */
  cols?: 1 | 2;
  /** 自定义标签文本 */
  labels?: {
    background?: string;
    title?: string;
    description?: string;
    tip?: string;
  };
  /** 自定义占位符 */
  placeholders?: {
    background?: string;
    title?: string;
    description?: string;
    tip?: string;
  };
}

export function BannerEditor({
  prefix,
  values,
  onChange,
  cols = 2,
  labels = {},
  placeholders = {},
}: BannerEditorProps) {
  const getFieldKey = (field: string) => `${prefix}.${field}`;

  return (
    <div className="space-y-4">
      {/* 背景图 - 独占一行 */}
      <FormImageUpload
        label={labels.background || "背景图"}
        value={values[getFieldKey("background")]}
        onValueChange={v => onChange(getFieldKey("background"), v)}
        placeholder={placeholders.background || "请输入横幅背景图 URL"}
      />

      {/* 其他字段 - 网格布局 */}
      <SettingsFieldGroup cols={cols}>
        <FormInput
          label={labels.title || "标题"}
          placeholder={placeholders.title || "请输入页面标题"}
          value={values[getFieldKey("title")]}
          onValueChange={v => onChange(getFieldKey("title"), v)}
        />
        <FormInput
          label={labels.description || "描述"}
          placeholder={placeholders.description || "请输入页面描述"}
          value={values[getFieldKey("description")]}
          onValueChange={v => onChange(getFieldKey("description"), v)}
        />
        <FormInput
          label={labels.tip || "提示文字"}
          placeholder={placeholders.tip || "请输入提示文字"}
          value={values[getFieldKey("tip")]}
          onValueChange={v => onChange(getFieldKey("tip"), v)}
        />
      </SettingsFieldGroup>
    </div>
  );
}
