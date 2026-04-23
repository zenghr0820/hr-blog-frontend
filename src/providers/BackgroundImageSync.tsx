"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useShallow } from "zustand/shallow";
import { useSiteConfigStore } from "@/store/site-config-store";

const DEFAULT_BG = "/images/bg.webp";

export function BackgroundImageSync() {
  const isLoaded = useSiteConfigStore(s => s.isLoaded);
  const { backgroundImage, backgroundImageDark } = useSiteConfigStore(
    useShallow(s => ({
      backgroundImage: s.siteConfig.page?.background_image,
      backgroundImageDark: s.siteConfig.page?.background_image_dark,
    }))
  );
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return;
    if (!resolvedTheme) return;

    if (isAdmin) {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundRepeat = "";
      document.body.style.backgroundAttachment = "";
      return;
    }

    const isDark = resolvedTheme === "dark";
    const bg = isDark
      ? backgroundImageDark || backgroundImage || DEFAULT_BG
      : backgroundImage || DEFAULT_BG;

    document.body.style.backgroundImage = `url("${bg}")`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";

    return () => {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundRepeat = "";
      document.body.style.backgroundAttachment = "";
    };
  }, [isLoaded, backgroundImage, backgroundImageDark, resolvedTheme, isAdmin]);

  return null;
}
