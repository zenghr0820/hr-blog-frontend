"use client";

import { SettingsSection } from "./SettingsSection";
import { Spinner } from "@/components/ui/spinner";
import { BannerEditor } from "./editors/BannerEditor";

interface RecentCommentsPageFormProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  loading?: boolean;
}

export function RecentCommentsPageForm({ values, onChange, loading }: RecentCommentsPageFormProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 横幅配置 */}
      <SettingsSection title="横幅配置" description="最近评论页面顶部展示区域">
        <BannerEditor
          prefix="recent_comments.banner"
          values={values}
          onChange={onChange}
          cols={2}
          labels={{
            background: "背景图",
            title: "标题",
            description: "描述",
            tip: "提示文字",
          }}
          placeholders={{
            background: "请输入横幅背景图 URL",
            title: "请输入页面标题",
            description: "请输入页面描述",
            tip: "请输入提示文字",
          }}
        />
      </SettingsSection>
    </div>
  );
}
