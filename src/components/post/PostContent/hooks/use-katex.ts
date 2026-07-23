/**
 * KaTeX 数学公式渲染 Hook
 * 使用 KaTeX 渲染行内和块级数学公式，支持三种来源：
 * - .md-editor-katex-inline/block: Markdown 编辑器生成的公式元素
 * - [data-type="math-block/inline"][data-latex]: Tiptap 编辑器生成的公式元素
 * - 原始 $...$ / $$...$$ / \(...\) / \[...\] 语法: 通过 auto-render 兜底处理
 */

import { useCallback } from "react";
import { renderKatexInElement } from "@/lib/katex-render";

export function useKatex() {
  const initKatex = useCallback(async (container: HTMLElement) => {
    await renderKatexInElement(container);
  }, []);

  return { initKatex };
}
