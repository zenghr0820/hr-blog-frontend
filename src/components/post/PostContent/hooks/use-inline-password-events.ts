/**
 * 行内密码事件 Hook
 * 为 .inline-password 元素绑定点击切换事件，
 * 点击后切换 revealed 类名，实现行内密码内容的显示/隐藏。
 * 返回清理函数用于卸载事件监听器。
 */

import { useCallback } from "react";

export function useInlinePasswordEvents() {
  const initInlinePasswordEvents = useCallback((container: HTMLElement): (() => void) | undefined => {
    const cleanups: (() => void)[] = [];

    const passwords = container.querySelectorAll(".inline-password");

    passwords.forEach(pw => {
      const handleClick = () => {
        pw.classList.toggle("revealed");
      };

      pw.addEventListener("click", handleClick);
      cleanups.push(() => pw.removeEventListener("click", handleClick));
    });

    return () => cleanups.forEach(fn => fn());
  }, []);

  return { initInlinePasswordEvents };
}
