/**
 * marked-extensions 扩展注册
 * 向 marked 库注册所有自定义扩展，包括：
 * - admonitionBangBlock: !!! 告示块语法
 * - containerBlock: ::: 容器块语法
 * - mathBlock: $$ 块级数学公式
 * - inlineCustomTag: {xxx} 行内自定义标签
 * - highlight/subscript/superscript/mathInline: 行内语法扩展
 */

import type { marked as Marked, Tokens } from "marked";
import { escapeHtml } from "./shared-utils";
import { resolveContainerAlias, matchContainerBlock, matchAdmonitionBlock, ADMONITION_TYPES, setContainerAliases } from "./container-parser";
import { matchObsidianCallout } from "./callout-parser";
import { blockRenderers, renderCallout } from "./block-renderers";
import { inlineSimpleTags, inlineComplexTags, renderInlineHide } from "./inline-renderers";

export { setContainerAliases };

/** 注册所有 marked 扩展，使 marked 能够解析自定义 Markdown 语法 */
export function registerMarkedExtensions(marked: typeof Marked) {
  const parseInline = (md: string) => marked.parse(md, { async: false }) as string;

  function renderContainerToken(token: Tokens.Generic): string {
    const { tagName, params, body } = token as Tokens.Generic & {
      tagName: string;
      params: string;
      body: string;
    };
    const { resolvedName, extraParams } = resolveContainerAlias(tagName);
    const mergedParams = extraParams ? (params ? `${extraParams} ${params}` : extraParams) : params;
    if (resolvedName.toLowerCase() !== tagName.toLowerCase()) {
      const renderer = blockRenderers[resolvedName.toLowerCase()];
      if (renderer) return renderer(body, mergedParams, parseInline);
    }
    const renderer = blockRenderers[tagName.toLowerCase()];
    if (renderer) return renderer(body, params, parseInline);
    return `<div class="custom-block custom-block-${tagName}">${parseInline(body)}</div>`;
  }

  marked.use({
    extensions: [
      {
        name: "obsidianCallout",
        level: "block" as const,
        start(src: string) {
          return src.match(/^>\s*\[!\w/m)?.index;
        },
        tokenizer(src: string) {
          const match = matchObsidianCallout(src);
          if (!match) return undefined;
          return {
            type: "obsidianCallout",
            raw: match.raw,
            calloutType: match.calloutType,
            title: match.title,
            fold: match.fold,
            body: match.body,
          };
        },
        renderer(token: Tokens.Generic) {
          const { calloutType, title, fold, body } = token as Tokens.Generic & {
            calloutType: string;
            title: string;
            fold: string;
            body: string;
          };
          return renderCallout({ calloutType, title, fold, body }, parseInline);
        },
      },
    ],
  });

  marked.use({
    extensions: [
      {
        name: "admonitionBangBlock",
        level: "block" as const,
        start(src: string) {
          const m = src.match(/^!!!\s*\w[\w-]*\b/m);
          if (!m) return undefined;
          const tagName = m[0].replace(/^!!!\s*/, "").trimStart().split(/\s/)[0];
          const { resolvedName } = resolveContainerAlias(tagName);
          if (ADMONITION_TYPES.has(resolvedName.toLowerCase())) return m.index;
          return undefined;
        },
        tokenizer(src: string) {
          const block = matchAdmonitionBlock(src);
          if (!block) return undefined;
          const { resolvedName } = resolveContainerAlias(block.tagName);
          if (!ADMONITION_TYPES.has(resolvedName.toLowerCase())) return undefined;
          return {
            type: "admonitionBangBlock",
            raw: block.raw,
            tagName: block.tagName,
            params: block.params,
            body: block.body,
          };
        },
        renderer(token: Tokens.Generic) {
          return renderContainerToken(token);
        },
      },
    ],
  });

  marked.use({
    extensions: [
      {
        name: "containerBlock",
        level: "block" as const,
        start(src: string) {
          return src.match(/^:::\s*\w/m)?.index;
        },
        tokenizer(src: string) {
          const block = matchContainerBlock(src);
          if (!block) return undefined;
          return {
            type: "containerBlock",
            raw: block.raw,
            tagName: block.tagName,
            params: block.params,
            body: block.body,
          };
        },
        renderer(token: Tokens.Generic) {
          return renderContainerToken(token);
        },
      },
    ],
  });

  marked.use({
    extensions: [
      {
        name: "mathBlock",
        level: "block" as const,
        start(src: string) {
          return src.match(/^\$\$/m)?.index;
        },
        tokenizer(src: string) {
          const m = src.match(/^\$\$\n([\s\S]+?)\n\$\$(?:\n|$)/);
          if (m) return { type: "mathBlock", raw: m[0], latex: m[1].trim() };
          const m2 = src.match(/^\$\$([^\n]+?)\$\$(?:\n|$)/);
          if (m2) return { type: "mathBlock", raw: m2[0], latex: m2[1].trim() };
          return undefined;
        },
        renderer(token: Tokens.Generic) {
          const latex = (token as Tokens.Generic & { latex: string }).latex;
          return `<div data-latex="${escapeHtml(latex)}" data-type="math-block" class="math-block">${escapeHtml(latex)}</div>`;
        },
      },
    ],
  });

  marked.use({
    extensions: [
      {
        name: "inlineCustomTag",
        level: "inline" as const,
        start(src: string) {
          return src.match(/\{(?:linkcard|btn|tip|music|hide|u|emp|wavy|del|kbd|psw)[\s}]/)?.index;
        },
        tokenizer(src: string) {
          const m = src.match(/^\{(\w+)(?:\s([^}]*)?)?\}([\s\S]*?)\{\/\1\}/);
          if (m) {
            const [raw, tag, params = "", content] = m;
            return { type: "inlineCustomTag", raw, tag, params, content };
          }
          return undefined;
        },
        renderer(token: Tokens.Generic) {
          const { tag, params, content } = token as Tokens.Generic & {
            tag: string;
            params: string;
            content: string;
          };
          if (inlineSimpleTags[tag]) return inlineSimpleTags[tag](content, params);
          if (tag === "hide") return renderInlineHide(params, content);
          if (inlineComplexTags[tag]) return inlineComplexTags[tag](params);
          return `{${tag} ${params}}${content}{/${tag}}`;
        },
      },
    ],
  });

  marked.use({
    extensions: [
      {
        name: "highlight",
        level: "inline" as const,
        start(src: string) { return src.match(/==/)?.index; },
        tokenizer(src: string) {
          const m = src.match(/^==([^=]+?)==/);
          if (m) return { type: "highlight", raw: m[0], text: m[1] };
          return undefined;
        },
        renderer(token: Tokens.Generic) {
          return `<mark>${(token as Tokens.Generic & { text: string }).text}</mark>`;
        },
      },
      {
        name: "subscript",
        level: "inline" as const,
        start(src: string) { return src.match(/~(?!~)/)?.index; },
        tokenizer(src: string) {
          const m = src.match(/^~([^~\n]+?)~/);
          if (m) return { type: "subscript", raw: m[0], text: m[1] };
          return undefined;
        },
        renderer(token: Tokens.Generic) {
          return `<sub>${(token as Tokens.Generic & { text: string }).text}</sub>`;
        },
      },
      {
        name: "superscript",
        level: "inline" as const,
        start(src: string) { return src.match(/\^(?!\^)/)?.index; },
        tokenizer(src: string) {
          const m = src.match(/^\^([^^\n]+?)\^/);
          if (m) return { type: "superscript", raw: m[0], text: m[1] };
          return undefined;
        },
        renderer(token: Tokens.Generic) {
          return `<sup>${(token as Tokens.Generic & { text: string }).text}</sup>`;
        },
      },
      {
        name: "mathInline",
        level: "inline" as const,
        start(src: string) { return src.match(/\$(?!\$)/)?.index; },
        tokenizer(src: string) {
          const m = src.match(/^\$([^\s$]([^$]*?[^\s$])?)\$(?!\$)/);
          if (m) return { type: "mathInline", raw: m[0], latex: m[1] };
          return undefined;
        },
        renderer(token: Tokens.Generic) {
          const latex = (token as Tokens.Generic & { latex: string }).latex;
          return `<span data-latex="${escapeHtml(latex)}" data-type="math-inline" class="math-inline">${escapeHtml(latex)}</span>`;
        },
      },
    ],
  });

  // 带自定义属性的图片：![alt](src "title"){: width="100" height="200" rotation="90" align="left" imageStyle="border"}
  // 使用 kramdown 属性语法 {: ... }，Typora/Obsidian/Pandoc 等广泛支持
  // 必须在默认 image tokenizer 之前匹配，以拦截带属性块的图片
  marked.use({
    extensions: [
      {
        name: "imageWithAttrs",
        level: "inline" as const,
        start(src: string) {
          // 查找后面紧跟 {: 属性块的图片语法
          const idx = src.match(/!\[/)?.index;
          if (idx === undefined) return undefined;
          // 确认这个 ![ 后面确实有 {: 属性块
          const rest = src.slice(idx);
          if (/^!\[[^\]]*\]\([^)]*\)\{:/.test(rest)) return idx;
          return undefined;
        },
        tokenizer(src: string) {
          // 匹配 ![alt](src "title"){: key="value" ... }
          const m = src.match(/^!\[([^\]]*)\]\(([^)]*?)\)(\{:\s+([^}]+?)\})/);
          if (!m) return undefined;

          const [, alt, hrefAndTitle, attrsRaw, attrsStr] = m;
          const raw = `![${alt}](${hrefAndTitle})${attrsRaw}`;

          // 解析 href 和 title
          let href = hrefAndTitle;
          let title = "";
          const titleMatch = hrefAndTitle.match(/^(.*?)\s+"([^"]*)"$/);
          if (titleMatch) {
            href = titleMatch[1];
            title = titleMatch[2];
          }

          // 解析自定义属性：key="value" 格式
          const attrs: Record<string, string> = {};
          const attrRegex = /(\w+)="([^"]*)"/g;
          let attrMatch;
          while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
            attrs[attrMatch[1]] = attrMatch[2];
          }

          return {
            type: "imageWithAttrs",
            raw,
            alt,
            href,
            title,
            attrs,
          };
        },
        renderer(token: Tokens.Generic) {
          const { alt, href, title, attrs } = token as Tokens.Generic & {
            alt: string;
            href: string;
            title: string;
            attrs: Record<string, string>;
          };

          const align = attrs.align || "center";
          const imageStyle = attrs.imageStyle || "none";
          const width = attrs.width || "";
          const height = attrs.height || "";
          const rotation = attrs.rotation || "0";

          const alignClass = `image-align-${align}`;
          const styleClass = imageStyle !== "none" ? `image-style-${imageStyle}` : "";
          const rotationStyle = rotation !== "0" ? `transform: rotate(${rotation}deg);` : "";

          const imgClasses = [`article-image`, alignClass, styleClass].filter(Boolean).join(" ");
          const imgAttrs: string[] = [
            `class="${imgClasses}"`,
            `src="${escapeHtml(href)}"`,
            `alt="${escapeHtml(alt)}"`,
            `draggable="true"`,
            `loading="lazy"`,
          ];
          if (title) imgAttrs.push(`title="${escapeHtml(title)}"`);
          if (width) imgAttrs.push(`width="${width}"`);
          if (height) imgAttrs.push(`height="${height}"`);
          if (rotationStyle) imgAttrs.push(`style="${rotationStyle}"`);

          const figcap = title || alt;
          if (figcap) {
            const figureClasses = [`image-figure`, alignClass, styleClass].filter(Boolean).join(" ");
            return `<figure class="${figureClasses}"><img ${imgAttrs.join(" ")}><figcaption>${escapeHtml(figcap)}</figcaption></figure>`;
          }

          return `<img ${imgAttrs.join(" ")}>`;
        },
      },
    ],
  });
}
