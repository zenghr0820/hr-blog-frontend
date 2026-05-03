/**
 * Mermaid 图表渲染 Hook
 * 提供 Mermaid 图表的渲染和交互缩放功能：
 * - renderMermaidBlocks: 扫描容器中的 Mermaid 代码块，动态导入 mermaid 库并渲染为 SVG
 * - initMermaidZoom: 为渲染后的 Mermaid 图表添加缩放/拖拽交互，
 *   支持鼠标滚轮缩放、拖拽平移和触屏双指缩放，
 *   通过图钉按钮切换交互模式
 */

import { useCallback } from "react";

export function useMermaid() {
  const renderMermaidBlocks = useCallback(async (container: HTMLElement) => {
    const blocks: { element: Element; code: string }[] = [];
    const seen = new WeakSet<Element>();

    container.querySelectorAll("div[data-mermaid-code], div.mermaid-block").forEach(div => {
      if (seen.has(div)) return;
      seen.add(div);
      const code =
        (div as HTMLElement).getAttribute("data-mermaid-code") ||
        (div.querySelector("code.language-mermaid")?.textContent || "");
      if (code.trim()) blocks.push({ element: div, code });
    });

    container.querySelectorAll("pre").forEach(pre => {
      if (pre.closest("[data-mermaid-code]") || pre.closest(".mermaid-block")) return;
      if (pre.closest(".md-editor-code")) return;
      const codeEl = pre.querySelector("code.language-mermaid");
      if (!codeEl) return;
      if (seen.has(pre)) return;
      blocks.push({ element: pre, code: codeEl.textContent || "" });
    });

    if (blocks.length === 0) return;

    try {
      const { default: mermaid } = await import("mermaid");
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
        flowchart: { useMaxWidth: true, htmlLabels: true },
        sequence: { useMaxWidth: true },
        gantt: { useMaxWidth: true },
      });

      for (const block of blocks) {
        try {
          const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
          const { svg } = await mermaid.render(id, block.code);
          const wrapper = document.createElement("p");
          wrapper.className = "md-editor-mermaid";
          wrapper.setAttribute("data-processed", "");
          wrapper.setAttribute("data-mermaid-code", block.code);
          wrapper.innerHTML = svg;
          block.element.replaceWith(wrapper);
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

  return { renderMermaidBlocks, initMermaidZoom };
}
