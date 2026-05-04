/**
 * 文章内容组件
 * 渲染文章 HTML 内容，支持自定义标签插件。
 *
 * 主要职责：
 * 1. 还原懒加载图片的真实 src（restoreLazyImages）
 * 2. 初始化各交互模块（版权复制、提示气泡、隐藏内容、选项卡、密码验证等）
 * 3. 规范化链接卡片和代码块的 DOM 结构
 * 4. 动态加载并渲染代码高亮、KaTeX 公式、Mermaid 图表
 * 5. 初始化音乐播放器和 Fancybox 图片灯箱
 * 6. 处理图片懒加载（IntersectionObserver）
 * 7. 可选执行内容中的 <script> 标签
 *
 * 所有功能逻辑已拆分为独立的 Hook，本组件仅负责组合调用和生命周期管理。
 */
"use client";

import { useEffect, useRef, useMemo } from "react";
import styles from "./PostContent.module.scss";
import "./content-blocks-frontend.scss";
import "./code-highlight.css";
import { useCopyCopyright } from "./hooks/use-copy-copyright";
import { useTipEvents } from "./hooks/use-tip-events";
import { useHiddenEvents } from "./hooks/use-hidden-events";
import { useTabsEvents } from "./hooks/use-tabs-events";
import { useInlinePasswordEvents } from "./hooks/use-inline-password-events";
import { useLinkCardNormalize } from "./hooks/use-link-card-normalize";
import { useIconifyNormalize } from "./hooks/use-iconify-normalize";
import { usePaidContentEvents } from "./hooks/use-paid-content-events";
import { usePasswordContentEvents } from "./hooks/use-password-content-events";
import { useLoginRequiredEvents } from "./hooks/use-login-required-events";
import { useCodeBlockConfig } from "./hooks/use-code-block-config";
import { useCodeBlockNormalize } from "./hooks/use-code-block-normalize";
import { useCodeBlockIcons } from "./hooks/use-code-block-icons";
import { useCodeCopyEvents } from "./hooks/use-code-copy-events";
import { useCodeHighlight } from "./hooks/use-code-highlight";
import { useKatex } from "./hooks/use-katex";
import { useMusicPlayer } from "./hooks/use-music-player";
import { useMermaid } from "./hooks/use-mermaid";

interface ArticleCopyInfo {
  isReprint?: boolean;
  copyrightAuthor?: string;
  copyrightUrl?: string;
}

interface PostContentProps {
  content: string;
  articleInfo?: ArticleCopyInfo;
  enableScripts?: boolean;
}

/** 还原懒加载图片：将 SVG 占位 src 替换为真实 data-src，并添加 loading="lazy" */
function restoreLazyImages(html: string): string {
  const srcFirstRe = /(<img\s[^>]*?)src="(data:image\/svg\+xml;base64,[^"]*)"([^>]*?)data-src="([^"]*)"([^>]*>)/g;
  let out = html.replace(srcFirstRe, (_, before, _pl, mid, realSrc, after) =>
    `${before}src="${realSrc}"${mid}loading="lazy"${after}`.replace(/\s*data-lazy-processed="[^"]*"/g, "")
  );
  const dataSrcFirstRe = /(<img\s[^>]*?)data-src="([^"]*)"([^>]*?)src="(data:image\/svg\+xml;base64,[^"]*)"([^>]*>)/g;
  out = out.replace(dataSrcFirstRe, (_, before, realSrc, mid, _pl, after) =>
    `${before}src="${realSrc}"${mid}loading="lazy"${after}`.replace(/\s*data-lazy-processed="[^"]*"/g, "")
  );
  return out;
}

/** Mermaid 缩放清理函数类型 */
type MermaidCleanupFn = (() => void) | null;

declare global {
  interface Window {
    __musicPlayerToggle?: (playerId: string) => Promise<void>;
    __musicPlayerSeek?: (playerId: string, event: MouseEvent) => void;
  }
}

export function PostContent({ content, articleInfo, enableScripts = false }: PostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const mermaidCleanupRef = useRef<MermaidCleanupFn>(null);
  const eventCleanupRef = useRef<(() => void) | null>(null);
  const imageObserverRef = useRef<IntersectionObserver | null>(null);

  const innerHtml = useMemo(
    () => ({ __html: restoreLazyImages(content) }),
    [content]
  );

  useCopyCopyright(contentRef, articleInfo);

  const codeBlockConfig = useCodeBlockConfig();
  const { normalizeCodeBlocks } = useCodeBlockNormalize();
  const { initCodeBlockIcons } = useCodeBlockIcons(codeBlockConfig);
  const { initCodeCopyEvents } = useCodeCopyEvents();
  const { initCodeHighlight } = useCodeHighlight();
  const { initKatex } = useKatex();
  const { initTipEvents, cleanupTipEvents } = useTipEvents();
  const { initHiddenEvents } = useHiddenEvents();
  const { initTabsEvents } = useTabsEvents();
  const { initInlinePasswordEvents } = useInlinePasswordEvents();
  const { normalizeLinkCardStructure } = useLinkCardNormalize();
  const { normalizeIconifyIcons } = useIconifyNormalize();
  const { initPaidContentEvents } = usePaidContentEvents();
  const { initPasswordContentEvents } = usePasswordContentEvents();
  const { initLoginRequiredContentEvents } = useLoginRequiredEvents();
  const { initMusicPlayers, handleMusicPlayerToggle, handleMusicPlayerSeek } = useMusicPlayer();
  const { renderMermaidBlocks, initMermaidZoom } = useMermaid();

  useEffect(() => {
    if (!contentRef.current) return;
    const currentContent = contentRef.current;

    const links = currentContent.querySelectorAll('a[href^="http"]');
    links.forEach(link => {
      if (!link.getAttribute("target")) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });

    normalizeLinkCardStructure(currentContent);
    normalizeIconifyIcons(currentContent);

    const loadImage = (img: HTMLImageElement) => {
      const dataSrc = img.getAttribute("data-src");
      if (!dataSrc) return;
      img.src = dataSrc;
      img.removeAttribute("data-src");
      img.removeAttribute("loading");
      img.removeAttribute("data-lazy-processed");
    };

    const images = currentContent.querySelectorAll<HTMLImageElement>("img[data-src]");
    if (images.length > 0) {
      const hasPlaceholder = (el: HTMLImageElement) => (el.getAttribute("src") || "").startsWith("data:image/svg+xml;base64,");
      images.forEach(img => {
        if (hasPlaceholder(img)) loadImage(img);
      });

      const remaining = currentContent.querySelectorAll<HTMLImageElement>("img[data-src]");
      if (remaining.length > 0) {
        const viewportHeight = window.innerHeight;
        remaining.forEach(img => {
          const rect = img.getBoundingClientRect();
          if (rect.top < viewportHeight + 300 || rect.height === 0) loadImage(img);
        });

        const stillRemaining = currentContent.querySelectorAll<HTMLImageElement>("img[data-src]");
        if (stillRemaining.length > 0 && "IntersectionObserver" in window) {
          if (imageObserverRef.current) {
            imageObserverRef.current.disconnect();
          }
          imageObserverRef.current = new IntersectionObserver(
            entries => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  loadImage(entry.target as HTMLImageElement);
                  imageObserverRef.current?.unobserve(entry.target);
                }
              });
            },
            { rootMargin: "300px" }
          );
          stillRemaining.forEach(img => imageObserverRef.current?.observe(img));
        }
      }
    }

    initTipEvents(currentContent);

    if (eventCleanupRef.current) {
      eventCleanupRef.current();
    }
    const cleanups: (() => void)[] = [];

    const hiddenCleanup = initHiddenEvents(currentContent);
    if (hiddenCleanup) cleanups.push(hiddenCleanup);

    const tabsCleanup = initTabsEvents(currentContent);
    if (tabsCleanup) cleanups.push(tabsCleanup);

    const inlinePasswordCleanup = initInlinePasswordEvents(currentContent);
    if (inlinePasswordCleanup) cleanups.push(inlinePasswordCleanup);

    const paidContentCleanup = initPaidContentEvents(currentContent);
    if (paidContentCleanup) cleanups.push(paidContentCleanup);

    const passwordContentCleanup = initPasswordContentEvents(currentContent);
    if (passwordContentCleanup) cleanups.push(passwordContentCleanup);

    const loginRequiredCleanup = initLoginRequiredContentEvents(currentContent);
    if (loginRequiredCleanup) cleanups.push(loginRequiredCleanup);

    normalizeCodeBlocks(currentContent);
    initCodeBlockIcons(currentContent);

    const codeCopyCleanup = initCodeCopyEvents(currentContent);
    if (codeCopyCleanup) cleanups.push(codeCopyCleanup);

    eventCleanupRef.current = () => cleanups.forEach(fn => fn());

    initCodeHighlight(currentContent);
    initKatex(currentContent);

    window.__musicPlayerToggle = handleMusicPlayerToggle;
    window.__musicPlayerSeek = handleMusicPlayerSeek;
    initMusicPlayers(currentContent);

    if (mermaidCleanupRef.current) {
      mermaidCleanupRef.current();
      mermaidCleanupRef.current = null;
    }
    let cancelled = false;
    renderMermaidBlocks(currentContent).then(() => {
      if (cancelled) return;
      mermaidCleanupRef.current = initMermaidZoom(currentContent);
    });

    let fancyboxModule: typeof import("@fancyapps/ui") | null = null;
    import("@fancyapps/ui/dist/fancybox/fancybox.css");
    import("@fancyapps/ui").then(mod => {
      if (cancelled) return;
      fancyboxModule = mod;
      mod.Fancybox.bind(currentContent, "img:not(a img)", {
        groupAll: true,
      });
    });

    return () => {
      cancelled = true;
      if (eventCleanupRef.current) {
        eventCleanupRef.current();
        eventCleanupRef.current = null;
      }
      if (mermaidCleanupRef.current) {
        mermaidCleanupRef.current();
        mermaidCleanupRef.current = null;
      }
      if (imageObserverRef.current) {
        imageObserverRef.current.disconnect();
        imageObserverRef.current = null;
      }
      cleanupTipEvents();
      delete window.__musicPlayerToggle;
      delete window.__musicPlayerSeek;
      if (fancyboxModule) {
        fancyboxModule.Fancybox.unbind(currentContent);
        fancyboxModule.Fancybox.close(true);
      }
    };
  }, [
    content,
    normalizeLinkCardStructure,
    normalizeIconifyIcons,
    normalizeCodeBlocks,
    initTipEvents,
    initHiddenEvents,
    initTabsEvents,
    initInlinePasswordEvents,
    initPaidContentEvents,
    initPasswordContentEvents,
    initLoginRequiredContentEvents,
    initCodeBlockIcons,
    initCodeCopyEvents,
    initCodeHighlight,
    initKatex,
    initMusicPlayers,
    handleMusicPlayerToggle,
    handleMusicPlayerSeek,
    renderMermaidBlocks,
    initMermaidZoom,
    cleanupTipEvents,
  ]);

  useEffect(() => {
    if (!enableScripts || !contentRef.current) return;
    const container = contentRef.current;
    const scripts = container.querySelectorAll("script");
    const createdScripts: HTMLScriptElement[] = [];

    scripts.forEach(oldScript => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
      createdScripts.push(newScript);
    });

    return () => {
      createdScripts.forEach(s => s.remove());
    };
  }, [content, enableScripts]);

  return (
    <article
      ref={contentRef}
      className={`${styles.postContent} postContent`}
      data-post-content="true"
      dangerouslySetInnerHTML={innerHtml}
    />
  );
}

export default PostContent;
