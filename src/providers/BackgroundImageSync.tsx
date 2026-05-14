"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useShallow } from "zustand/shallow";
import { useSiteConfigStore } from "@/store/site-config-store";
import { useUiStore } from "@/store/ui-store";
import styles from "./BackgroundImageSync.module.css";

const DEFAULT_BG = "/images/bg.webp";

export function BackgroundImageSync() {
  const isLoaded = useSiteConfigStore(s => s.isLoaded);
  const { backgroundImageEnable, backgroundImage, backgroundImageDark } = useSiteConfigStore(
    useShallow(s => ({
      backgroundImageEnable: s.siteConfig.page?.background_image_enable,
      backgroundImage: s.siteConfig.page?.background_image,
      backgroundImageDark: s.siteConfig.page?.background_image_dark,
    }))
  );
  const isMinimalTheme = useUiStore(s => s.isMinimalTheme);
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/admin");

  const [bgUrl, setBgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return;
    if (!resolvedTheme) return;

    if (isAdmin) {
      setBgUrl(null);
      return;
    }

    if (isMinimalTheme) {
      setBgUrl(null);
      return;
    }

    const enabled = backgroundImageEnable !== false && backgroundImageEnable !== "false";
    if (!enabled) {
      setBgUrl(null);
      return;
    }

    const isDark = resolvedTheme === "dark";
    const bg = isDark
      ? backgroundImageDark || backgroundImage || DEFAULT_BG
      : backgroundImage || DEFAULT_BG;

    setBgUrl(bg);
  }, [isLoaded, backgroundImageEnable, backgroundImage, backgroundImageDark, resolvedTheme, isAdmin, isMinimalTheme]);

  if (!bgUrl) return null;

  return (
    <div
      className={styles.bodyBgLayer}
      data-body-bg
      aria-hidden="true"
      style={{ backgroundImage: `url("${bgUrl}")` }}
    />
  );
}
