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
import { blockRenderers } from "./block-renderers";
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
}
