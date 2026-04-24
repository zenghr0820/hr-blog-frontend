"use client";

import { SettingsSection } from "./SettingsSection";
import { Spinner } from "@/components/ui/spinner";
import { BannerEditor } from "./editors/BannerEditor";
import { EquipmentListEditor } from "./editors/EquipmentListEditor";
import {
  KEY_EQUIPMENT_BANNER_BG,
  KEY_EQUIPMENT_BANNER_TITLE,
  KEY_EQUIPMENT_BANNER_DESC,
  KEY_EQUIPMENT_BANNER_TIP,
  KEY_EQUIPMENT_LIST,
} from "@/lib/settings/setting-keys";

interface EquipmentPageFormProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  loading?: boolean;
}

export function EquipmentPageForm({ values, onChange, loading }: EquipmentPageFormProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* 横幅配置 */}
      <SettingsSection title="横幅" description="页面顶部展示区域">
        <BannerEditor
          prefix="equipment.banner"
          values={values}
          onChange={onChange}
          cols={2}
          labels={{
            background: "背景图",
            title: "标题",
            description: "描述",
            tip: "提示",
          }}
          placeholders={{
            background: "图片 URL",
            title: "页面标题",
            description: "页面描述",
            tip: "提示文字",
          }}
        />
      </SettingsSection>

      {/* 装备列表 */}
      <SettingsSection title="装备列表" description="分类管理，支持拖拽排序">
        <EquipmentListEditor value={values[KEY_EQUIPMENT_LIST]} onValueChange={v => onChange(KEY_EQUIPMENT_LIST, v)} />
      </SettingsSection>
    </div>
  );
}
