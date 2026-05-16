/**
 * turndown-rules 图片规则
 * 将 HTML figure+img 结构转换为 Markdown 图片语法，
 * 处理 figcaption 标题、data-src 懒加载和 alt 文本，
 * 并通过 kramdown 属性语法 {: ... } 保留自定义属性（width/height/rotation/align/imageStyle）。
 * 该语法被 Typora、Obsidian、Pandoc、kramdown 等广泛支持。
 */

import type TurndownService from "turndown";

/**
 * 从 img 元素和其父级 figure 的 class/style 中提取自定义属性，
 * 生成 kramdown 属性语法字符串 {: key="value" ...}。
 */
function buildImageAttrsBlock(img: Element, figure?: Element | null): string {
  const figureCls = figure?.getAttribute("class") || "";
  const imgCls = img.getAttribute("class") || "";
  const combinedCls = `${figureCls} ${imgCls}`;

  let align = "center";
  if (combinedCls.includes("image-align-left")) align = "left";
  else if (combinedCls.includes("image-align-right")) align = "right";

  let imageStyle = "none";
  if (combinedCls.includes("image-style-border")) imageStyle = "border";
  else if (combinedCls.includes("image-style-shadow")) imageStyle = "shadow";

  const width = img.getAttribute("width");
  const height = img.getAttribute("height");

  const imgStyle = img.getAttribute("style") || "";
  let rotation = 0;
  if (imgStyle.includes("rotate(90deg)")) rotation = 90;
  else if (imgStyle.includes("rotate(180deg)")) rotation = 180;
  else if (imgStyle.includes("rotate(270deg)")) rotation = 270;

  const customAttrs: string[] = [];
  if (align !== "center") customAttrs.push(`align="${align}"`);
  if (imageStyle !== "none") customAttrs.push(`imageStyle="${imageStyle}"`);
  if (width) customAttrs.push(`width="${width}"`);
  if (height) customAttrs.push(`height="${height}"`);
  if (rotation !== 0) customAttrs.push(`rotation="${rotation}"`);

  return customAttrs.length > 0 ? `{: ${customAttrs.join(" ")}}` : "";
}

/** 注册图片相关的 Turndown 转换规则，处理 figure 包裹和裸 img 元素 */
export function registerImageRules(td: TurndownService) {
  // 规则 1：figure 包裹的图片
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

      const attrsBlock = buildImageAttrsBlock(img, el);
      const base = `![${alt}](${src}${titlePart})`;

      return attrsBlock ? `${base}${attrsBlock}` : base;
    },
  });

  // 规则 2：带自定义属性的裸 img 元素（无 figure 包裹）
  // 仅当 img 有自定义属性时才拦截，否则交给 Turndown 默认规则处理
  td.addRule("standaloneImageWithAttrs", {
    filter: (node) => {
      if (node.nodeName !== "IMG") return false;
      const img = node as HTMLElement;
      // 检查是否有自定义属性需要保留
      const cls = img.getAttribute("class") || "";
      const style = img.getAttribute("style") || "";
      const hasCustomClass = cls.includes("image-align-") || cls.includes("image-style-");
      const hasRotation = style.includes("rotate(");
      const hasSize = !!(img.getAttribute("width") || img.getAttribute("height"));
      return hasCustomClass || hasRotation || hasSize;
    },
    replacement: (_content, node) => {
      const img = node as HTMLElement;

      const cleanAttr = (value: string | null | undefined): string =>
        (value ?? "").replace(/(\n+\s*)+/g, " ").trim();

      const alt = cleanAttr(img.getAttribute("alt"));
      const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
      if (!src) return _content;

      const imgTitle = cleanAttr(img.getAttribute("title"));
      const titlePart = imgTitle ? ` "${imgTitle.replace(/"/g, '\\"')}"` : "";

      const attrsBlock = buildImageAttrsBlock(img);
      const base = `![${alt}](${src}${titlePart})`;

      return attrsBlock ? `${base}${attrsBlock}` : base;
    },
  });
}
