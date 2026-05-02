"use client";

import { SettingsSection } from "./SettingsSection";
import { Spinner } from "@/components/ui/spinner";
import { ToolListEditor } from "./editors/ToolListEditor";
import { KEY_TOOLS_LIST } from "@/lib/settings/setting-keys";

interface ToolsPageFormProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  loading?: boolean;
}

export function ToolsPageForm({ values, onChange, loading }: ToolsPageFormProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <SettingsSection title="工具列表" description="分类管理，支持拖拽排序。Banner 配置请在「外观配置 → Banner 管理」中设置">
        <ToolListEditor value={values[KEY_TOOLS_LIST]} onValueChange={v => onChange(KEY_TOOLS_LIST, v)} />
      </SettingsSection>
    </div>
  );
}
