/**
 * Mermaid 图表渲染 Hook
 * 提供 Mermaid 图表的渲染和交互缩放功能：
 * - renderMermaidBlocks: 扫描容器中的 Mermaid 代码块，动态导入 mermaid 库并渲染为 SVG
 * - initMermaidZoom: 为渲染后的 Mermaid 图表添加缩放/拖拽交互，
 *   支持鼠标滚轮缩放、拖拽平移和触屏双指缩放，
 *   通过图钉按钮切换交互模式
 * - renderAndInitMermaid: 合并渲染与缩放初始化，使用 generation 标记防止并发覆盖
 * - shouldRerenderOnThemeChange: 判断主题切换时是否需要重新渲染 Mermaid 图表
 */

import { useCallback, useRef, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";

/** Mermaid 缩放清理函数类型 */
type MermaidCleanupFn = (() => void) | null;

export function useMermaid() {
  const { isDark } = useTheme();
  // 异步 mermaid 渲染需读取最新 isDark，避免把 isDark 列入 useCallback 依赖（否则 callback 引用变化会触发主 useEffect 整个重跑）
  const isDarkRef = useRef(isDark);
  // 主 useEffect 与主题 useEffect 并发写 mermaidCleanupRef，过期任务以 generation 标记后跳过 init zoom
  const mermaidGenRef = useRef(0);
  // 主题 useEffect 首挂时与主渲染 useEffect 会同时触发渲染，用此 ref 跳过首次执行
  const lastIsDarkRef = useRef<boolean | null>(null);
  // Mermaid 缩放清理函数（hook 内部管理，调用方无需传入）
  const mermaidCleanupRef = useRef<MermaidCleanupFn>(null);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  const renderMermaidBlocks = useCallback(async (container: HTMLElement, shouldAbort?: () => boolean) => {
    const blocks: { element: Element; code: string; isRendered: boolean }[] = [];
    const seen = new WeakSet<Element>();

    container.querySelectorAll("div[data-mermaid-code], div.mermaid-block").forEach(div => {
      if (seen.has(div)) return;
      seen.add(div);
      const code =
        (div as HTMLElement).getAttribute("data-mermaid-code") ||
        (div.querySelector("code.language-mermaid")?.textContent || "");
      if (code.trim()) blocks.push({ element: div, code, isRendered: div.classList.contains("md-editor-mermaid") });
    });

    container.querySelectorAll("pre").forEach(pre => {
      if (pre.closest("[data-mermaid-code]") || pre.closest(".mermaid-block")) return;
      if (pre.closest(".md-editor-code")) return;
      const codeEl = pre.querySelector("code.language-mermaid");
      if (!codeEl) return;
      if (seen.has(pre)) return;
      blocks.push({ element: pre, code: codeEl.textContent || "", isRendered: false });
    });

    // 已渲染的 mermaid wrapper（含 data-mermaid-code 属性的 p.md-editor-mermaid）
    container.querySelectorAll("p.md-editor-mermaid[data-mermaid-code]").forEach(p => {
      if (seen.has(p)) return;
      seen.add(p);
      const code = (p as HTMLElement).getAttribute("data-mermaid-code") || "";
      if (code.trim()) blocks.push({ element: p, code, isRendered: true });
    });

    if (blocks.length === 0) return;

    try {
      const { default: mermaid } = await import("mermaid");
      // 异步导入期间可能已被取消
      if (shouldAbort?.()) return;

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: isDarkRef.current ? "dark" : "default",
        flowchart: { useMaxWidth: true, htmlLabels: true },
        sequence: { useMaxWidth: true },
        gantt: { useMaxWidth: true },
      });

      for (const block of blocks) {
        // 每个图表渲染前检查是否已取消
        if (shouldAbort?.()) return;
        if (!block.element.isConnected) continue;
        try {
          const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
          const { svg } = await mermaid.render(id, block.code);
          if (shouldAbort?.()) return;
          if (!block.element.isConnected) continue;

          if (block.isRendered) {
            // 复用旧 wrapper，保留 action div 仅替换 SVG
            const wrapper = block.element as HTMLElement;
            const actionDiv = wrapper.querySelector(".md-editor-mermaid-action");
            wrapper.innerHTML = svg;
            if (actionDiv) {
              wrapper.appendChild(actionDiv);
            }
          } else {
            const wrapper = document.createElement("p");
            wrapper.className = "md-editor-mermaid";
            wrapper.setAttribute("data-processed", "");
            wrapper.setAttribute("data-mermaid-code", block.code);
            wrapper.innerHTML = svg;
            block.element.replaceWith(wrapper);
          }
        } catch {
          // 单个图表渲染失败时保留源码
        }
      }
    } catch {
      // mermaid 库加载失败
    }
  }, []);

  const initMermaidZoom = useCallback((container: HTMLElement): (() => void) | null => {
    const mermaidContainers = container.matches(".md-editor-mermaid")
      ? [container]
      : Array.from(container.querySelectorAll(".md-editor-mermaid"));

    if (mermaidContainers.length === 0) return null;

    const removeEventsMap = new Map<Element, { removeEvent?: () => void; removeClick?: () => void }>();

    const pinOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"></path><path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89"></path><path d="m2 2 20 20"></path><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"></path></svg>`;
    const pinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>`;

    const addZoomEvent = (mm: Element) => {
      const el = mm as HTMLElement;
      let scale = 1;
      let translateX = 0;
      let translateY = 0;
      let isDragging = false;
      let startX = 0;
      let startY = 0;

      const updateTransform = () => {
        const svg = el.querySelector("svg");
        if (svg) {
          (svg as unknown as HTMLElement).style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
          (svg as unknown as HTMLElement).style.transformOrigin = "center center";
        }
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        scale = Math.max(0.5, Math.min(3, scale + delta));
        updateTransform();
      };

      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        el.style.cursor = "grabbing";
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
      };

      const onMouseUp = () => {
        isDragging = false;
        el.style.cursor = "grab";
      };

      const onMouseLeave = () => {
        isDragging = false;
        el.style.cursor = "grab";
      };

      let lastTouchDistance = 0;
      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          lastTouchDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        } else if (e.touches.length === 1) {
          isDragging = true;
          startX = e.touches[0].clientX - translateX;
          startY = e.touches[0].clientY - translateY;
        }
      };

      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 2) {
          const distance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const delta = (distance - lastTouchDistance) * 0.01;
          scale = Math.max(0.5, Math.min(3, scale + delta));
          lastTouchDistance = distance;
          updateTransform();
        } else if (isDragging && e.touches.length === 1) {
          translateX = e.touches[0].clientX - startX;
          translateY = e.touches[0].clientY - startY;
          updateTransform();
        }
      };

      const onTouchEnd = () => {
        isDragging = false;
        lastTouchDistance = 0;
      };

      el.addEventListener("wheel", onWheel, { passive: false });
      el.addEventListener("mousedown", onMouseDown);
      el.addEventListener("mousemove", onMouseMove);
      el.addEventListener("mouseup", onMouseUp);
      el.addEventListener("mouseleave", onMouseLeave);
      el.addEventListener("touchstart", onTouchStart, { passive: false });
      el.addEventListener("touchmove", onTouchMove, { passive: false });
      el.addEventListener("touchend", onTouchEnd);

      el.style.cursor = "grab";
      el.style.overflow = "hidden";

      return () => {
        el.removeEventListener("wheel", onWheel);
        el.removeEventListener("mousedown", onMouseDown);
        el.removeEventListener("mousemove", onMouseMove);
        el.removeEventListener("mouseup", onMouseUp);
        el.removeEventListener("mouseleave", onMouseLeave);
        el.removeEventListener("touchstart", onTouchStart);
        el.removeEventListener("touchmove", onTouchMove);
        el.removeEventListener("touchend", onTouchEnd);

        const svg = el.querySelector("svg");
        if (svg) {
          (svg as unknown as HTMLElement).style.transform = "";
        }
        el.style.cursor = "";
        el.removeAttribute("data-grab");
      };
    };

    mermaidContainers.forEach(mm => {
      let actionDiv = mm.querySelector(".md-editor-mermaid-action");
      if (!actionDiv && mm.nextElementSibling?.classList.contains("md-editor-mermaid-action")) {
        actionDiv = mm.nextElementSibling;
        mm.appendChild(actionDiv);
      }
      if (!actionDiv) {
        const div = document.createElement("div");
        div.className = "md-editor-mermaid-action";
        div.innerHTML = pinOffIcon;
        mm.appendChild(div);
        actionDiv = div;
      }

      const onClick = () => {
        const current = removeEventsMap.get(mm);
        if (current?.removeEvent) {
          current.removeEvent();
          mm.removeAttribute("data-grab");
          removeEventsMap.set(mm, { removeClick: current.removeClick });
          actionDiv!.innerHTML = pinOffIcon;
        } else {
          const removeEvent = addZoomEvent(mm);
          mm.setAttribute("data-grab", "");
          removeEventsMap.set(mm, {
            removeEvent,
            removeClick: current?.removeClick,
          });
          actionDiv!.innerHTML = pinIcon;
        }
      };

      (actionDiv as HTMLElement).addEventListener("click", onClick);
      removeEventsMap.set(mm, {
        removeClick: () => (actionDiv as HTMLElement).removeEventListener("click", onClick),
      });
    });

    return () => {
      removeEventsMap.forEach(({ removeEvent, removeClick }) => {
        removeEvent?.();
        removeClick?.();
      });
      removeEventsMap.clear();
    };
  }, []);

  // 渲染 Mermaid 图表并初始化缩放功能
  // mermaidCleanupRef 由 hook 内部管理，调用方只需传入 container
  const renderAndInitMermaid = useCallback(async (container: HTMLElement) => {
    const gen = ++mermaidGenRef.current;
    if (mermaidCleanupRef.current) {
      mermaidCleanupRef.current();
      mermaidCleanupRef.current = null;
    }
    await renderMermaidBlocks(container, () => gen !== mermaidGenRef.current);
    if (gen !== mermaidGenRef.current) return;
    if (!container.isConnected) return;
    mermaidCleanupRef.current = initMermaidZoom(container);
  }, [renderMermaidBlocks, initMermaidZoom]);

  // 判断主题切换时是否需要重新渲染 Mermaid 图表
  const shouldRerenderOnThemeChange = useCallback((container: HTMLElement | null): boolean => {
    // 首挂时主渲染 useEffect 已经按当前主题渲染过一次，跳过避免重复
    if (lastIsDarkRef.current === null) {
      lastIsDarkRef.current = isDarkRef.current;
      return false;
    }
    if (lastIsDarkRef.current === isDarkRef.current) return false;
    lastIsDarkRef.current = isDarkRef.current;
    if (!container) return false;
    return !!container.querySelector(".md-editor-mermaid[data-mermaid-code]");
  }, []);

  return { renderMermaidBlocks, initMermaidZoom, renderAndInitMermaid, shouldRerenderOnThemeChange, isDark };
}
