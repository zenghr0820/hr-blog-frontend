/**
 * 代码块配置 Hook
 * 从站点配置中读取代码块相关参数：
 * - macStyle: 是否显示 macOS 风格的红黄绿圆点
 * - codeMaxLines: 代码块最大显示行数，超过则折叠
 * - collapsedHeight: 折叠状态下的像素高度
 */

import { useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { useSiteConfigStore } from "@/store/site-config-store";

export interface CodeBlockConfig {
  macStyle: boolean;
  codeMaxLines: number;
  collapsedHeight: number;
}

export function useCodeBlockConfig(): CodeBlockConfig {
  const codeBlockRawConfig = useSiteConfigStore(useShallow(state => state.siteConfig?.post?.code_block));

  const macStyle = useMemo(() => {
    return codeBlockRawConfig?.mac_style !== false;
  }, [codeBlockRawConfig?.mac_style]);

  const codeMaxLines = useMemo(() => {
    const v = codeBlockRawConfig?.code_max_lines;
    if (typeof v === "number") return v;
    if (typeof v === "string") return parseInt(v, 10) || 10;
    return 10;
  }, [codeBlockRawConfig?.code_max_lines]);

  const collapsedHeight = useMemo(() => {
    return codeMaxLines > 0 ? codeMaxLines * 26 + 20 : 0;
  }, [codeMaxLines]);

  return { macStyle, codeMaxLines, collapsedHeight };
}
