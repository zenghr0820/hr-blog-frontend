/**
 * 代码复制事件 Hook
 * 为代码块的复制按钮绑定点击事件，
 * 使用 Clipboard API 复制代码内容，并显示复制成功/失败的图标反馈和 Toast 提示。
 * 返回清理函数用于卸载事件监听器。
 */

import { useCallback } from "react";
import { addToast } from "@heroui/react";

export function useCodeCopyEvents() {
  const initCodeCopyEvents = useCallback((container: HTMLElement): (() => void) | undefined => {
    const copyButtons = container.querySelectorAll(".md-editor-code .copy-button");
    const cleanups: (() => void)[] = [];

    copyButtons.forEach(btn => {
      const handleClick = async (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const codeBlock = btn.closest(".md-editor-code");
        if (!codeBlock) return;

        const codeElement = codeBlock.querySelector(".md-editor-code-block");
        if (!codeElement) return;

        const codeText = codeElement.textContent || "";

        try {
          await navigator.clipboard.writeText(codeText);
          const checkIcon =
            btn.getAttribute("data-check-icon") ||
            `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 448 512"><path fill="currentColor" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`;
          const copyIcon = btn.getAttribute("data-copy-icon") || btn.innerHTML;
          btn.innerHTML = checkIcon;
          btn.classList.add("copied");

          addToast({
            title: "复制成功",
            color: "success",
            timeout: 2000,
          });

          setTimeout(() => {
            btn.innerHTML = copyIcon;
            btn.classList.remove("copied");
          }, 2000);
        } catch (err) {
          console.error("复制失败:", err);
          addToast({
            title: "复制失败",
            color: "danger",
            timeout: 2000,
          });
        }
      };

      btn.addEventListener("click", handleClick);
      cleanups.push(() => btn.removeEventListener("click", handleClick));
    });

    return () => cleanups.forEach(fn => fn());
  }, []);

  return { initCodeCopyEvents };
}
