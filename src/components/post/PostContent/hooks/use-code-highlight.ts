/**
 * 代码高亮 Hook
 * 使用 highlight.js 对代码块进行语法高亮渲染，
 * 动态导入 highlight.js 库，根据语言标签自动检测或指定语言进行高亮，
 * 已高亮的代码块会跳过以避免重复处理。
 */

import { useCallback } from "react";

export function useCodeHighlight() {
  const initCodeHighlight = useCallback(async (container: HTMLElement) => {
    const codeBlocks = container.querySelectorAll(".md-editor-code-block");
    if (codeBlocks.length === 0) return;

    const hljs = await import("highlight.js").then(m => m.default);

    codeBlocks.forEach(block => {
      const codeElement = block.closest("code");
      const language = codeElement?.getAttribute("language") || "";

      if (block.getAttribute("data-highlighted") === "yes") return;

      const codeText = block.textContent || "";

      try {
        let highlighted: string;
        if (language && hljs.getLanguage(language)) {
          highlighted = hljs.highlight(codeText, { language }).value;
        } else {
          highlighted = hljs.highlightAuto(codeText).value;
        }

        block.innerHTML = highlighted;
        block.setAttribute("data-highlighted", "yes");
      } catch (err) {
        console.warn("代码高亮失败:", err);
      }
    });
  }, []);

  return { initCodeHighlight };
}
