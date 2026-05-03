/**
 * turndown-rules 图片规则
 * 将 HTML figure+img 结构转换为 Markdown 图片语法，
 * 处理 figcaption 标题、data-src 懒加载和 alt 文本。
 */

import type TurndownService from "turndown";

/** 注册图片相关的 Turndown 转换规则，处理 figure 包裹的图片元素 */
export function registerImageRules(td: TurndownService) {
  td.addRule("figureWithImage", {
    filter: (node) => {
      if (node.nodeName !== "FIGURE") return false;
      return !!(node as HTMLElement).querySelector("img");
    },
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const img = el.querySelector("img");
      if (!img) return _content;

      const cleanAttr = (value: string | null | undefined): string =>
        (value ?? "").replace(/(\n+\s*)+/g, " ").trim();

      const alt = cleanAttr(img.getAttribute("alt"));
      const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
      if (!src) return _content;

      const figcap = el.querySelector("figcaption");
      const captionText = cleanAttr(figcap?.textContent);
      const imgTitle = cleanAttr(img.getAttribute("title"));
      const finalTitle = captionText || imgTitle;
      const titlePart = finalTitle ? ` "${finalTitle.replace(/"/g, '\\"')}"` : "";

      return `![${alt}](${src}${titlePart})`;
    },
  });
}
