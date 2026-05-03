/**
 * KaTeX 数学公式渲染 Hook
 * 使用 KaTeX 渲染行内和块级数学公式，支持三种来源：
 * - .md-editor-katex-inline/block: Markdown 编辑器生成的公式元素
 * - [data-type="math-block/inline"][data-latex]: Tiptap 编辑器生成的公式元素
 * - 原始 $...$ / $$...$$ / \(...\) / \[...\] 语法: 通过 auto-render 兜底处理
 */

import { useCallback } from "react";

export function useKatex() {
  const initKatex = useCallback(async (container: HTMLElement) => {
    const katexInlineElements = container.querySelectorAll(".md-editor-katex-inline:not([data-processed])");
    const katexBlockElements = container.querySelectorAll(".md-editor-katex-block:not([data-processed])");

    const tiptapBlockElements = container.querySelectorAll("[data-type='math-block'][data-latex]:not([data-processed])");
    const tiptapInlineElements = container.querySelectorAll("[data-type='math-inline'][data-latex]:not([data-processed])");

    const needsRawProcessing =
      katexInlineElements.length === 0 &&
      katexBlockElements.length === 0 &&
      tiptapBlockElements.length === 0 &&
      tiptapInlineElements.length === 0 &&
      (container.innerHTML.includes("$") ||
        container.innerHTML.includes("\\(") ||
        container.innerHTML.includes("\\["));

    if (
      katexInlineElements.length === 0 &&
      katexBlockElements.length === 0 &&
      tiptapBlockElements.length === 0 &&
      tiptapInlineElements.length === 0 &&
      !needsRawProcessing
    ) {
      return;
    }

    await import("katex/dist/katex.min.css");
    const katex = await import("katex").then(m => m.default);

    katexInlineElements.forEach(element => {
      try {
        const latex = element.textContent || "";
        katex.render(latex, element as HTMLElement, {
          throwOnError: false,
          displayMode: false,
        });
        element.setAttribute("data-processed", "true");
      } catch (err) {
        console.warn("KaTeX 行内公式渲染失败:", err);
      }
    });

    katexBlockElements.forEach(element => {
      try {
        const latex = element.textContent || "";
        katex.render(latex, element as HTMLElement, {
          throwOnError: false,
          displayMode: true,
        });
        element.setAttribute("data-processed", "true");
      } catch (err) {
        console.warn("KaTeX 块级公式渲染失败:", err);
      }
    });

    tiptapBlockElements.forEach(element => {
      try {
        const latex = element.getAttribute("data-latex") || "";
        if (!latex) return;
        katex.render(latex, element as HTMLElement, {
          throwOnError: false,
          displayMode: true,
        });
        element.setAttribute("data-processed", "true");
      } catch (err) {
        console.warn("KaTeX TipTap 块级公式渲染失败:", err);
      }
    });

    tiptapInlineElements.forEach(element => {
      try {
        const latex = element.getAttribute("data-latex") || "";
        if (!latex) return;
        katex.render(latex, element as HTMLElement, {
          throwOnError: false,
          displayMode: false,
        });
        element.setAttribute("data-processed", "true");
      } catch (err) {
        console.warn("KaTeX TipTap 行内公式渲染失败:", err);
      }
    });

    if (needsRawProcessing) {
      try {
        const renderMathInElement = await import("katex/contrib/auto-render").then(m => m.default);
        renderMathInElement(container, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false },
          ],
          throwOnError: false,
        });
      } catch (err) {
        console.warn("KaTeX auto-render 失败:", err);
      }
    }
  }, []);

  return { initKatex };
}
