/**
 * 复制版权 Hook
 * 监听文章内容的复制事件，在复制文本末尾自动追加版权声明。
 * 支持原创和转载两种模板，可通过站点配置自定义版权文案。
 * 当复制功能被禁用时，阻止复制操作。
 */

import { useEffect, useRef } from "react";
import { addToast } from "@heroui/react";
import { useShallow } from "zustand/shallow";
import { useSiteConfigStore } from "@/store/site-config-store";

interface ArticleCopyInfo {
  isReprint?: boolean;
  copyrightAuthor?: string;
  copyrightUrl?: string;
}

export function useCopyCopyright(
  contentRef: React.RefObject<HTMLDivElement | null>,
  articleInfo?: ArticleCopyInfo
) {
  const copyConfig = useSiteConfigStore(useShallow(state => state.siteConfig?.post?.copy));
  const appName = useSiteConfigStore(state => state.siteConfig?.APP_NAME);
  const siteOwnerName = useSiteConfigStore(state => state.siteConfig?.frontDesk?.siteOwner?.name);

  useEffect(() => {
    if (copyConfig?.enable === false) {
      const preventCopy = (e: ClipboardEvent) => {
        if (contentRef.current?.contains(e.target as Node)) {
          e.preventDefault();
        }
      };
      document.addEventListener("copy", preventCopy, true);
      return () => document.removeEventListener("copy", preventCopy, true);
    }

    const copyrightEnabled = copyConfig?.copyrightEnable === true || copyConfig?.copyright_enable === true;
    if (!copyrightEnabled) return;

    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().length === 0) return;

      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      if (!range) return;
      const container = range.commonAncestorContainer;
      const target = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);
      if (!target || !contentRef.current?.contains(target)) return;

      const currentUrl = window.location.href;
      const siteName = appName || "本站";
      const ownerName = siteOwnerName || "博主";
      let copyrightText: string;

      if (articleInfo?.isReprint) {
        const author = articleInfo.copyrightAuthor || "原作者";
        const originalUrl = articleInfo.copyrightUrl || "";
        const template =
          copyConfig?.copyrightReprint ||
          copyConfig?.copyright_reprint ||
          "本文转载自 {originalAuthor}，原文地址：{originalUrl}\n当前页面：{currentUrl}";
        copyrightText = template
          .replace(/{originalAuthor}/g, author)
          .replace(/{originalUrl}/g, originalUrl)
          .replace(/{currentUrl}/g, currentUrl);
      } else {
        const template =
          copyConfig?.copyrightOriginal ||
          copyConfig?.copyright_original ||
          "本文来自 {siteName}，作者 {author}，转载请注明出处。\n原文地址：{url}";
        copyrightText = template
          .replace(/{siteName}/g, siteName)
          .replace(/{author}/g, ownerName)
          .replace(/{url}/g, currentUrl);
      }

      const originalText = selection.toString();
      e.clipboardData?.setData("text/plain", originalText + "\n\n---\n" + copyrightText);
      e.preventDefault();

      addToast({ title: "复制成功，复制和转载请标注本文地址", color: "success", timeout: 2000 });
    };

    document.addEventListener("copy", handleCopy as EventListener, true);
    return () => document.removeEventListener("copy", handleCopy as EventListener, true);
  }, [copyConfig, appName, siteOwnerName, articleInfo, contentRef]);
}
