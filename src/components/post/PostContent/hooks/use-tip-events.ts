/**
 * 提示气泡事件 Hook
 * 为 .anzhiyu-tip-wrapper 元素绑定提示气泡的显示/隐藏事件，
 * 支持 hover（悬停）和 click（点击）两种触发方式，
 * 提供延迟显示和自动隐藏功能，返回清理函数用于卸载事件。
 */

import { useCallback, useRef } from "react";

export function useTipEvents() {
  const tipCleanupFnsRef = useRef<(() => void)[]>([]);

  const initTipEvents = useCallback((container: HTMLElement) => {
    tipCleanupFnsRef.current.forEach(fn => fn());
    tipCleanupFnsRef.current = [];

    const tipWrappers = container.querySelectorAll(".anzhiyu-tip-wrapper");

    tipWrappers.forEach(wrapper => {
      const wrapperEl = wrapper as HTMLElement;
      const tipText = wrapperEl.querySelector(".anzhiyu-tip-text") as HTMLElement;
      const tip = wrapperEl.querySelector(".anzhiyu-tip") as HTMLElement;

      if (!tipText || !tip) return;

      const trigger = tip.getAttribute("data-trigger") || "hover";
      const delay = parseInt(tip.getAttribute("data-delay") || "0", 10);

      const showTip = () => {
        tip.style.visibility = "visible";
        tip.style.opacity = "1";
        tip.classList.add("show");
        tip.setAttribute("data-visible", "true");
      };

      const hideTip = () => {
        tip.style.visibility = "hidden";
        tip.style.opacity = "0";
        tip.classList.remove("show");
        tip.setAttribute("data-visible", "false");
      };

      if (trigger === "click") {
        const handleClick = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          const isVisible = tip.getAttribute("data-visible") === "true";
          if (isVisible) {
            hideTip();
          } else {
            showTip();
          }
        };

        const handleDocumentClick = (e: Event) => {
          if (!wrapperEl.contains(e.target as Node)) {
            hideTip();
          }
        };

        tipText.addEventListener("click", handleClick);
        document.addEventListener("click", handleDocumentClick);

        tipCleanupFnsRef.current.push(() => {
          tipText.removeEventListener("click", handleClick);
          document.removeEventListener("click", handleDocumentClick);
        });
      } else {
        let showTimer: ReturnType<typeof setTimeout> | null = null;
        let hideTimer: ReturnType<typeof setTimeout> | null = null;

        const handleMouseEnter = () => {
          if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
          }
          showTimer = setTimeout(showTip, delay);
        };

        const handleMouseLeave = () => {
          if (showTimer) {
            clearTimeout(showTimer);
            showTimer = null;
          }
          hideTimer = setTimeout(hideTip, 100);
        };

        tipText.addEventListener("mouseenter", handleMouseEnter);
        tipText.addEventListener("mouseleave", handleMouseLeave);

        tipCleanupFnsRef.current.push(() => {
          tipText.removeEventListener("mouseenter", handleMouseEnter);
          tipText.removeEventListener("mouseleave", handleMouseLeave);
          if (showTimer) clearTimeout(showTimer);
          if (hideTimer) clearTimeout(hideTimer);
        });
      }
    });
  }, []);

  const cleanupTipEvents = useCallback(() => {
    tipCleanupFnsRef.current.forEach(fn => fn());
    tipCleanupFnsRef.current = [];
  }, []);

  return { initTipEvents, cleanupTipEvents };
}
