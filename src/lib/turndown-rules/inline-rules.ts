/**
 * turndown-rules 行内规则
 * 将 HTML 行内元素转换回 Markdown 自定义行内语法（{xxx}...{/xxx}），
 * 包括隐藏内容、按钮、链接卡片、提示气泡、音乐播放器、
 * 下划线、着重号、波浪线、删除线、键盘键、行内密码、
 * 数学公式、高亮标记、下标、上标、Mermaid 图表、告示块、自定义块和任务列表等。
 */

import type TurndownService from "turndown";

/** 注册行内元素相关的 Turndown 转换规则 */
export function registerInlineRules(td: TurndownService) {
  td.addRule("hiddenInline", {
    filter: (node) =>
      node.nodeName === "SPAN" && (node as HTMLElement).classList.contains("hide-inline"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const button = el.querySelector(".hide-button") as HTMLElement | null;
      const hideContent = el.querySelector(".hide-content") as HTMLElement | null;
      if (!button || !hideContent) return _content;

      const displayText = button.textContent?.trim() || "查看";
      const bgColor = (button as HTMLElement).style.backgroundColor || "";
      const textColor = (button as HTMLElement).style.color || "";
      const inner = hideContent.textContent?.trim() || "";

      let params = `display=${displayText}`;
      if (bgColor) params += ` bg=${bgColor}`;
      if (textColor) params += ` color=${textColor}`;

      return `{hide ${params}}${inner}{/hide}`;
    },
  });

  td.addRule("button", {
    filter: (node) =>
      node.nodeName === "A" && (node as HTMLElement).classList.contains("btn-anzhiyu"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const url = el.getAttribute("href") || "#";
      const textEl = el.querySelector("span") || el.querySelector(".btn-text");
      const text = textEl?.textContent?.trim() || el.textContent?.trim() || "按钮";
      const iconEl = el.querySelector("i");
      const icon = iconEl?.className || "anzhiyu-icon-circle-arrow-right";

      let params = `url=${url} text=${text} icon=${icon}`;
      if (el.classList.contains("btn-outline")) params += " style=outline";
      if (el.classList.contains("btn-larger")) params += " size=larger";

      const colors = ["blue", "pink", "red", "purple", "orange", "green"];
      for (const c of colors) {
        if (el.classList.contains(`btn-${c}`)) {
          params += ` color=${c}`;
          break;
        }
      }

      return `{btn ${params}}{/btn}`;
    },
  });

  td.addRule("linkcard", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("anzhiyu-tag-link"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const link = el.querySelector("a.tag-Link") as HTMLAnchorElement | null;
      if (!link) return _content;

      const url = link.getAttribute("href") || "";
      const title = el.querySelector(".tag-link-title")?.textContent?.trim() || "";
      const sitename = el.querySelector(".tag-link-sitename")?.textContent?.trim() || "";
      const tips = el.querySelector(".tag-link-tips")?.textContent?.trim() || "引用站外地址";

      const iconImg = el.querySelector(".tag-link-left img") as HTMLImageElement | null;
      const icon = iconImg?.getAttribute("data-iconify") || "rivet-icons:link";

      let params = `url="${url}"`;
      if (title) params += ` title="${title}"`;
      if (sitename) params += ` sitename="${sitename}"`;
      if (icon !== "rivet-icons:link") params += ` icon="${icon}"`;
      if (tips && tips !== "引用站外地址") params += ` tips="${tips}"`;

      return `{linkcard ${params}}{/linkcard}`;
    },
  });

  td.addRule("inlineTip", {
    filter: (node) =>
      node.nodeName === "SPAN" && (node as HTMLElement).classList.contains("anzhiyu-tip-wrapper"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const textEl = el.querySelector(".anzhiyu-tip-text");
      const contentEl = el.querySelector(".anzhiyu-tip");
      if (!textEl || !contentEl) return _content;

      const text = textEl.textContent?.trim() || "";
      const content = contentEl.textContent?.trim() || "";

      const isBottom = contentEl.classList.contains("tip-bottom");
      const isLight = contentEl.classList.contains("tip-light");
      const isClick = el.classList.contains("tip-click");

      let params = `text="${text}" content="${content}"`;
      if (isBottom) params += " position=bottom";
      if (isLight) params += " theme=light";
      if (isClick) params += " trigger=click";

      return `{tip ${params}}{/tip}`;
    },
  });

  td.addRule("inlineMusic", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("markdown-music-player"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const musicId = el.getAttribute("data-music-id") || "";
      const musicDataStr = el.getAttribute("data-music-data") || "{}";

      let dataObj: Record<string, string> = {};
      try {
        dataObj = JSON.parse(musicDataStr);
      } catch {
        // ignore
      }

      let params = "";
      if (musicId) params += `neteaseId="${musicId}" `;
      if (dataObj.name) params += `name="${dataObj.name}" `;
      if (dataObj.artist) params += `artist="${dataObj.artist}" `;
      if (dataObj.pic) params += `pic="${dataObj.pic}" `;
      if (dataObj.color) params += `color="${dataObj.color}"`;

      return `{music ${params.trim()}}{/music}`;
    },
  });

  td.addRule("inlineUnderline", {
    filter: (node) =>
      node.nodeName === "SPAN" && (node as HTMLElement).classList.contains("inline-underline"),
    replacement: (_content, node) => {
      const text = (node as HTMLElement).textContent?.trim() || "";
      return `{u}${text}{/u}`;
    },
  });

  td.addRule("inlineEmphasis", {
    filter: (node) =>
      node.nodeName === "SPAN" && (node as HTMLElement).classList.contains("inline-emphasis-mark"),
    replacement: (_content, node) => {
      const text = (node as HTMLElement).textContent?.trim() || "";
      return `{emp}${text}{/emp}`;
    },
  });

  td.addRule("inlineWavy", {
    filter: (node) =>
      node.nodeName === "SPAN" && (node as HTMLElement).classList.contains("inline-wavy"),
    replacement: (_content, node) => {
      const text = (node as HTMLElement).textContent?.trim() || "";
      return `{wavy}${text}{/wavy}`;
    },
  });

  td.addRule("inlineDelete", {
    filter: (node) =>
      node.nodeName === "SPAN" && (node as HTMLElement).classList.contains("inline-delete"),
    replacement: (_content, node) => {
      const text = (node as HTMLElement).textContent?.trim() || "";
      return `{del}${text}{/del}`;
    },
  });

  td.addRule("inlineKbd", {
    filter: (node) =>
      node.nodeName === "SPAN" && (node as HTMLElement).classList.contains("inline-kbd"),
    replacement: (_content, node) => {
      const text = (node as HTMLElement).textContent?.trim() || "";
      return `{kbd}${text}{/kbd}`;
    },
  });

  td.addRule("inlinePassword", {
    filter: (node) =>
      node.nodeName === "SPAN" && (node as HTMLElement).classList.contains("inline-password"),
    replacement: (_content, node) => {
      const text = (node as HTMLElement).textContent?.trim() || "";
      return `{psw}${text}{/psw}`;
    },
  });

  td.addRule("mathBlock", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("math-block"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const latex = el.getAttribute("data-latex") || el.textContent?.trim() || "";
      return `\n$$\n${latex}\n$$\n`;
    },
  });

  td.addRule("mathInline", {
    filter: (node) =>
      node.nodeName === "SPAN" && (node as HTMLElement).classList.contains("math-inline"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const latex = el.getAttribute("data-latex") || el.textContent?.trim() || "";
      return `$${latex}$`;
    },
  });

  td.addRule("highlight", {
    filter: (node) => node.nodeName === "MARK",
    replacement: (_content, node) => {
      const text = (node as HTMLElement).textContent?.trim() || "";
      return `==${text}==`;
    },
  });

  td.addRule("subscript", {
    filter: (node) => node.nodeName === "SUB",
    replacement: (_content, node) => {
      const text = (node as HTMLElement).textContent?.trim() || "";
      return `~${text}~`;
    },
  });

  td.addRule("superscript", {
    filter: (node) => node.nodeName === "SUP",
    replacement: (_content, node) => {
      const text = (node as HTMLElement).textContent?.trim() || "";
      return `^${text}^`;
    },
  });

  td.addRule("mermaidBlock", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("mermaid-placeholder"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const code = el.getAttribute("data-mermaid") || "";
      return `\n\`\`\`mermaid\n${code}\n\`\`\`\n`;
    },
  });

  td.addRule("admonition", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("admonition"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const classes = Array.from(el.classList);
      const typeClass = classes.find(c => ["note", "info", "tip", "success", "warning", "danger"].includes(c));
      if (!typeClass) return _content;

      const titleEl = el.querySelector(".admonition-title");
      const bodyEl = el.querySelector(".admonition-body");
      const title = titleEl?.textContent?.trim() || "";
      const inner = bodyEl ? td.turndown(bodyEl.innerHTML.trim()) : "";

      const titlePart = title ? ` ${title}` : "";
      return `\n!!!${typeClass}${titlePart}\n${inner}\n!!!\n\n`;
    },
  });

  td.addRule("customBlock", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("custom-block"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const classes = Array.from(el.classList);
      const blockClass = classes.find(c => c.startsWith("custom-block-"));
      if (!blockClass) return _content;

      const tagName = blockClass.replace("custom-block-", "");
      const inner = td.turndown(el.innerHTML.trim());

      return `\n:::${tagName}\n${inner}\n:::\n\n`;
    },
  });

  td.addRule("taskList", {
    filter: (node) =>
      node.nodeName === "UL" && (node as HTMLElement).getAttribute("data-type") === "taskList",
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const items = Array.from(el.querySelectorAll(":scope > li"));
      let md = "\n";

      items.forEach(item => {
        const isChecked = item.getAttribute("data-checked") === "true";
        const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
        const contentDiv = item.querySelector("div");
        const text = contentDiv ? contentDiv.textContent?.trim() : item.textContent?.trim() || "";
        const check = isChecked ? "x" : " ";
        md += `- [${check}] ${text}\n`;
      });

      return md + "\n";
    },
  });
}
