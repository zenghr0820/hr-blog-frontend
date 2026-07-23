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

import { useEffect, useRef, useMemo, useCallback } from "react";
import styles from "./PostContent.module.scss";
import "./content-blocks-frontend.scss";
import "./code-highlight.css";
import { useCopyCopyright } from "./hooks/use-copy-copyright";
import { useTipEvents } from "./hooks/use-tip-events";
import { useHiddenEvents } from "./hooks/use-hidden-events";
import { useTabsEvents } from "./hooks/use-tabs-events";
import { useInlinePasswordEvents } from "./hooks/use-inline-password-events";
import { useLinkCardNormalize } from "./hooks/use-link-card-normalize";
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
// 上游新增功能所需的导入（尚未提取到独立 Hook）
import { enhanceVideoGalleryFirstFrames } from "@/lib/video-gallery";
import { parseMusicPlayerData, renderMusicPlayerHtml } from "@/lib/marked-extensions";

interface ArticleCopyInfo {
  isReprint?: boolean;
  copyrightAuthor?: string;
  copyrightUrl?: string;
}

interface PostContentProps {
  content: string;
  articleInfo?: ArticleCopyInfo;
  enableScripts?: boolean;
  articleId?: string;
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

declare global {
  interface Window {
    __musicPlayerToggle?: (playerId: string) => Promise<void>;
    __musicPlayerSeek?: (playerId: string, event: MouseEvent) => void;
  }
}

export function PostContent({ content, articleInfo, enableScripts = false, articleId = "" }: PostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const eventCleanupRef = useRef<(() => void) | null>(null);
  // 代码复制事件清理 ref（独立管理，避免与 eventCleanupRef 混合）
  const codeCopyCleanupRef = useRef<(() => void) | null>(null);
  // Safari 滚轮修复清理 ref
  const codeWheelCleanupRef = useRef<(() => void) | null>(null);

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
  const { initTipEvents } = useTipEvents();
  const { initHiddenEvents } = useHiddenEvents();
  const { initTabsEvents } = useTabsEvents();
  const { initInlinePasswordEvents } = useInlinePasswordEvents();
  const { normalizeLinkCardStructure } = useLinkCardNormalize();
  const { initPaidContentEvents } = usePaidContentEvents();
  const { initPasswordContentEvents } = usePasswordContentEvents(articleId);
  const { initLoginRequiredContentEvents } = useLoginRequiredEvents();
  const { initMusicPlayers, handleMusicPlayerToggle, handleMusicPlayerSeek } = useMusicPlayer();
  const { renderAndInitMermaid, shouldRerenderOnThemeChange, isDark } = useMermaid();

  // 规范化音乐播放器 DOM 结构：将 .markdown-music-player 替换为完整播放器 HTML
  // TODO: 后续提取到 useMusicPlayer Hook 中
  const normalizeMusicPlayerStructure = useCallback((container: HTMLElement) => {
    let musicPlayerIndex = 0;
    container.querySelectorAll<HTMLElement>(".markdown-music-player").forEach(player => {
      if (player.querySelector(".music-player-container .music-audio-element")) {
        return;
      }

      const musicData = parseMusicPlayerData(player.getAttribute("data-music-data") || "");
      const neteaseId = player.getAttribute("data-music-id") || musicData.neteaseId || "";
      const name = musicData.name || player.getAttribute("data-music-name") || "";
      const artist = musicData.artist || player.getAttribute("data-music-artist") || "";
      const pic = musicData.pic || player.getAttribute("data-music-pic") || "";
      const color = musicData.color || "";
      const template = document.createElement("template");
      template.innerHTML = renderMusicPlayerHtml({
        neteaseId,
        name,
        artist,
        pic,
        color,
        playerId: player.id || undefined,
        instanceKey: musicPlayerIndex,
      });
      musicPlayerIndex += 1;

      const nextPlayer = template.content.firstElementChild;
      if (nextPlayer) {
        player.replaceWith(nextPlayer);
      }
    });
  }, []);

  // 代码块展开/收起事件已通过内联 onclick 处理，无需额外事件委托
  // TODO: 后续提取到独立 Hook 中
  const initCodeExpandEvents = useCallback((_container: HTMLElement) => {
    // 事件处理已在 initCodeBlockIcons 中通过内联 onclick 实现
  }, []);

  // 修复 Safari/WebKit 下代码块吞掉鼠标垂直滚轮、导致整页无法滚动的问题。
  // 代码块内 .md-editor-code-block 是横向滚动容器(overflow-x:auto)，Safari 会把落在其上的
  // 垂直滚轮"锁定"在该容器却不向页面冒泡。此处仅在 Safari 手动把垂直滚轮转发给页面，
  // 横向(deltaX 主导，如 shift+滚轮/触控板横向)仍交给代码块，保留横向滚动能力。
  // TODO: 后续提取到独立 Hook 中
  const initCodeBlockWheelFix = useCallback((container: HTMLElement): (() => void) | undefined => {
    const isAppleSafari =
      typeof navigator !== "undefined" &&
      /Apple/.test(navigator.vendor) &&
      /Safari/.test(navigator.userAgent) &&
      !/Chrome|CriOS|Chromium|Android/.test(navigator.userAgent);
    if (!isAppleSafari) return;

    // 事件委托绑定在内容容器上（该元素由 React 通过 ref 管理，稳定存在，
    // 不会随代码块内部 DOM 被 dangerouslySetInnerHTML 重建而失效）：
    // 当鼠标落在代码块内且以垂直滚动为主时，手动把滚动转发给页面。
    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.(".md-editor-code")) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        window.scrollBy(0, e.deltaY);
      }
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  // 处理文章内容中的链接、标签插件等
  useEffect(() => {
    if (!contentRef.current) return;
    const currentContent = contentRef.current;
    // 增强视频画廊首帧：为视频元素添加首帧封面
    enhanceVideoGalleryFirstFrames(currentContent);

    const links = currentContent.querySelectorAll('a[href^="http"]');
    links.forEach(link => {
      if (!link.getAttribute("target")) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });

    normalizeLinkCardStructure(currentContent);

    const loadImage = (img: HTMLImageElement) => {
      const dataSrc = img.getAttribute("data-src");
      if (!dataSrc) return;
      img.src = dataSrc;
      img.removeAttribute("data-src");
      img.removeAttribute("loading");
      img.removeAttribute("data-lazy-processed");
    };

    const images = currentContent.querySelectorAll<HTMLImageElement>("img[data-src]");
    // 使用局部变量管理 IntersectionObserver，不需要跨渲染持久化
    let lazyImageObserver: IntersectionObserver | null = null;
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
          lazyImageObserver = new IntersectionObserver(
            entries => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  loadImage(entry.target as HTMLImageElement);
                  lazyImageObserver?.unobserve(entry.target);
                }
              });
            },
            { rootMargin: "300px" }
          );
          stillRemaining.forEach(img => lazyImageObserver?.observe(img));
        }
      }
    }

    // 初始化标签插件事件
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
    initCodeExpandEvents(currentContent);

    // 代码复制事件使用独立 ref 管理，避免与 eventCleanupRef 混合
    if (codeCopyCleanupRef.current) {
      codeCopyCleanupRef.current();
    }
    codeCopyCleanupRef.current = initCodeCopyEvents(currentContent) ?? null;

    // Safari 滚轮修复使用独立 ref 管理
    if (codeWheelCleanupRef.current) {
      codeWheelCleanupRef.current();
    }
    codeWheelCleanupRef.current = initCodeBlockWheelFix(currentContent) ?? null;

    initCodeHighlight(currentContent);
    initKatex(currentContent);

    window.__musicPlayerToggle = handleMusicPlayerToggle;
    window.__musicPlayerSeek = handleMusicPlayerSeek;
    normalizeMusicPlayerStructure(currentContent);
    initMusicPlayers(currentContent);

    // 渲染 Mermaid 图表并初始化缩放功能
    renderAndInitMermaid(currentContent);

    // Fancybox 图片灯箱：异步加载，cancelled 标记防止卸载后回调操作已分离的 DOM
    let cancelled = false;
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
      if (codeCopyCleanupRef.current) {
        codeCopyCleanupRef.current();
        codeCopyCleanupRef.current = null;
      }
      if (codeWheelCleanupRef.current) {
        codeWheelCleanupRef.current();
        codeWheelCleanupRef.current = null;
      }
      lazyImageObserver?.disconnect();
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
    initCodeExpandEvents,
    initCodeBlockWheelFix,
    initCodeHighlight,
    initKatex,
    initMusicPlayers,
    handleMusicPlayerToggle,
    handleMusicPlayerSeek,
    normalizeMusicPlayerStructure,
    renderAndInitMermaid,
  ]);

  // 主题切换时重新渲染 Mermaid 图表以适配深/浅模式
  // 通过 next-themes 的 useTheme hook 订阅，避免直接监听 DOM 实现细节
  useEffect(() => {
    // 首挂时主渲染 useEffect 已经按当前主题渲染过一次，跳过避免重复
    if (!shouldRerenderOnThemeChange(contentRef.current)) return;
    renderAndInitMermaid(contentRef.current!);
  }, [isDark, renderAndInitMermaid, shouldRerenderOnThemeChange]);

  // 浏览器不会执行通过 innerHTML 插入的 <script>，需手动重建节点
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
