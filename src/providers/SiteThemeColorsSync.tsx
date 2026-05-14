"use client";

import { useLayoutEffect } from "react";
import { useTheme } from "next-themes";
import { useShallow } from "zustand/shallow";
import { useSiteConfigStore } from "@/store/site-config-store";
import { useUiStore } from "@/store/ui-store";
import type { SiteConfigData } from "@/types/site-config";
import { applySiteAppearanceFromConfig } from "@/utils/site-theme-colors";

/**
 * 将站点配置中的换肤预设与令牌同步到 :root（随 next-themes 解析的亮/暗模式切换）
 * 当用户设置了个性化主题色时，跳过更新主题色，由 PersonalizationSync 接管
 */
export function SiteThemeColorsSync() {
  const isLoaded = useSiteConfigStore(s => s.isLoaded);
  const { skin, tokens } = useSiteConfigStore(
    useShallow(s => ({
      skin: s.siteConfig.APPEARANCE_SKIN,
      tokens: s.siteConfig.APPEARANCE_TOKENS,
    }))
  );
  const { resolvedTheme } = useTheme();
  const customPrimaryColor = useUiStore(s => s.customPrimaryColor);

  useLayoutEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return;
    if (!resolvedTheme) return;

    // 用户设置了个性化主题色时，跳过更新，由 PersonalizationSync 接管
    if (customPrimaryColor && customPrimaryColor.trim() !== "") return;

    const partial: Pick<SiteConfigData, "APPEARANCE_SKIN" | "APPEARANCE_TOKENS"> = {
      APPEARANCE_SKIN: skin,
      APPEARANCE_TOKENS: tokens,
    };
    applySiteAppearanceFromConfig(partial, resolvedTheme === "dark");
  }, [isLoaded, skin, tokens, resolvedTheme, customPrimaryColor]);

  return null;
}
