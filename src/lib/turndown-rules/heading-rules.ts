/**
 * turndown-rules 标题规则
 * 处理标题中的锚点链接，在 HTML 转 Markdown 时移除 headerlink 锚点，
 * 避免锚点链接文本污染 Markdown 输出。
 */

import type TurndownService from "turndown";

/** 注册标题锚点相关的 Turndown 转换规则，移除标题内的 headerlink 锚点元素 */
export function registerHeadingRules(td: TurndownService) {
  td.addRule("headingAnchor", {
    filter: (node): node is HTMLElement => {
      const parent = node.parentElement;
      return !!(
        parent &&
        /^(H[1-6])$/i.test(parent.nodeName) &&
        node.nodeName === "A" &&
        node.classList.contains("headerlink")
      );
    },
    replacement: (content) => {
      return content;
    },
  });
}
