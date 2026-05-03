/**
 * 隐藏内容事件 Hook
 * 为 .hide-block/.hide-inline 中的 .hide-button 绑定点击事件，
 * 点击后切换隐藏内容的显示/隐藏状态，并更新按钮文本。
 */

import { useCallback } from "react";

export function useHiddenEvents() {
  const initHiddenEvents = useCallback((container: HTMLElement) => {
    const hideButtons = container.querySelectorAll(".hide-button");

    hideButtons.forEach(button => {
      const handleClick = () => {
        const parent = button.closest(".hide-block, .hide-inline");
        if (!parent) return;

        const content = parent.querySelector(".hide-content") as HTMLElement;
        if (!content) return;

        if (content.style.display === "none" || !content.style.display) {
          content.style.display = parent.classList.contains("hide-inline") ? "inline" : "block";
          button.textContent = "收起";
        } else {
          content.style.display = "none";
          const originalText = button.getAttribute("data-display") || "查看";
          button.textContent = originalText;
        }
      };

      if (!button.getAttribute("data-display")) {
        button.setAttribute("data-display", button.textContent || "查看");
      }

      button.addEventListener("click", handleClick);
    });

    const hideContents = container.querySelectorAll(".hide-content") as NodeListOf<HTMLElement>;
    hideContents.forEach(content => {
      content.style.display = "none";
    });
  }, []);

  return { initHiddenEvents };
}
