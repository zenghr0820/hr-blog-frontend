/**
 * 行内密码事件 Hook
 * 为 .inline-password 元素绑定点击切换事件，
 * 点击后切换 revealed 类名，实现行内密码内容的显示/隐藏。
 */

import { useCallback } from "react";

export function useInlinePasswordEvents() {
  const initInlinePasswordEvents = useCallback((container: HTMLElement) => {
    const passwords = container.querySelectorAll(".inline-password");

    passwords.forEach(pw => {
      pw.addEventListener("click", () => {
        pw.classList.toggle("revealed");
      });
    });
  }, []);

  return { initInlinePasswordEvents };
}
