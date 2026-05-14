"use client";

import { useEffect, useRef } from "react";
import { useUiStore } from "@/store/ui-store";
import { applyPrimaryWithOps, clearSitePrimaryAppearanceOverrides } from "@/utils/site-theme-colors";

/**
 * 将用户个性化设置同步到 :root。
 * - 主题色：当用户设置了个性化主题色时，SiteThemeColorsSync 会跳过更新，由本组件接管
 * - 内容宽度：动态设置 --anzhiyu-content-width CSS 变量
 * - 简洁主题：动态切换 html.minimal-theme class，通过 CSS 变量覆盖去除卡片阴影
 */
export function PersonalizationSync() {
  const customPrimaryColor = useUiStore(state => state.customPrimaryColor);
  const contentWidth = useUiStore(state => state.contentWidth);
  const isMinimalTheme = useUiStore(state => state.isMinimalTheme);
  const appliedRef = useRef<string | null>(null);

  // 主题色同步
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (customPrimaryColor && customPrimaryColor.trim() !== "") {
      if (appliedRef.current === customPrimaryColor) return;
      const root = document.documentElement;
      const ok = applyPrimaryWithOps(root, customPrimaryColor);
      if (ok) {
        appliedRef.current = customPrimaryColor;
      }
    } else {
      if (appliedRef.current === null) return;
      clearSitePrimaryAppearanceOverrides();
      appliedRef.current = null;
    }
  }, [customPrimaryColor]);

  // 内容宽度同步
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.style.setProperty("--anzhiyu-content-width", `${contentWidth}px`);
  }, [contentWidth]);

  // 简洁主题同步：切换 html.minimal-theme class
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.toggle("minimal-theme", isMinimalTheme);
  }, [isMinimalTheme]);

  return null;
}
