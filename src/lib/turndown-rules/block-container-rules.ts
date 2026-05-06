/**
 * turndown-rules 块级容器规则
 * 将 HTML 块级容器元素转换回 Markdown 自定义容器语法（:::xxx），
 * 包括付费内容、密码保护、登录可见、代码块、选项卡、折叠、隐藏、按钮组、画廊和视频画廊等。
 */

import type TurndownService from "turndown";

function faClassToIconify(className: string): string {
  if (!className) return "";
  const parts = className.trim().split(/\s+/);
  if (parts.length < 2 || !parts[0].startsWith("fa-")) return className;
  const prefix = parts[0].replace(/^fa-/, "fa6-");
  const name = parts.slice(1).map(p => p.replace(/^fa-/, "")).join(":");
  return `${prefix}:${name}`;
}

function extractIconFromEl(iconEl: HTMLElement): string {
  const dataIcon = iconEl.getAttribute("data-icon");
  if (dataIcon) return dataIcon;
  const cls = iconEl.className || "";
  if (cls.includes("anzhiyu-icon") || cls.includes("anzhiyufont")) return cls;
  if (cls.startsWith("fa-")) return faClassToIconify(cls);
  return cls;
}

/** 注册块级容器相关的 Turndown 转换规则 */
export function registerBlockContainerRules(td: TurndownService) {
  td.addRule("paidContent", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("paid-content-editor-preview"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const title = el.getAttribute("data-title") || "付费内容";
      const price = el.getAttribute("data-price") || "0";
      const originalPrice = el.getAttribute("data-original-price") || "";
      const currency = el.getAttribute("data-currency") || "¥";

      let attrs = `title="${title}" price="${price}"`;
      if (originalPrice) attrs += ` original-price="${originalPrice}"`;
      if (currency !== "¥") attrs += ` currency="${currency}"`;

      const body = el.querySelector(".paid-content-preview") || el.querySelector(".paid-content-body");
      const inner = body ? td.turndown(body.innerHTML.trim()) : "";

      return `\n:::paid-content ${attrs}\n${inner}\n:::\n\n`;
    },
  });

  td.addRule("passwordContent", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("password-content-editor-preview"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const id = el.getAttribute("data-content-id") || "";
      const title = el.getAttribute("data-title") || "密码保护内容";
      const password = el.getAttribute("data-password") || "";
      const hint = el.getAttribute("data-hint") || "";
      const placeholder = el.getAttribute("data-placeholder") || "";

      let attrs = `password="${password}" id="${id}" title="${title}"`;
      if (hint) attrs += ` hint="${hint}"`;
      if (placeholder) attrs += ` placeholder="${placeholder}"`;

      const body = el.querySelector(".password-content-preview") || el.querySelector(".password-content-body");
      const inner = body ? td.turndown(body.innerHTML.trim()) : "";

      return `\n:::password-content ${attrs}\n${inner || "这里是密码保护的内容。"}\n:::\n\n`;
    },
  });

  td.addRule("loginRequiredContent", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("login-required-content-editor-preview"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const id = el.getAttribute("data-content-id") || "";
      const title = el.getAttribute("data-title") || "登录后可查看";
      const hint = el.getAttribute("data-hint") || "";

      let attrs = `id="${id}" title="${title}"`;
      if (hint) attrs += ` hint="${hint}"`;

      const body = el.querySelector(".login-required-content-preview") || el.querySelector(".login-required-content-body");
      const inner = body ? td.turndown(body.innerHTML.trim()) : "";

      return `\n:::login-required ${attrs}\n${inner || "这里是登录后可查看的内容。"}\n:::\n\n`;
    },
  });

  td.addRule("codeBlock", {
    filter: (node) =>
      node.nodeName === "DETAILS" && (node as HTMLElement).classList.contains("md-editor-code"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const langEl = el.querySelector(".code-lang");
      const language = langEl?.textContent?.trim().toLowerCase() || "";

      const codeBlock = el.querySelector(".md-editor-code-block");
      let code = "";
      if (codeBlock) {
        code = codeBlock.textContent || "";
      } else {
        const codeEl = el.querySelector("code");
        code = codeEl?.textContent || "";
      }

      if (code.endsWith("\n")) code = code.slice(0, -1);

      return `\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    },
  });

  td.addRule("tabsTurndownSource", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("tabs-turndown-source"),
    replacement: (_content, node) => {
      const text = (node as HTMLElement).textContent?.trim() ?? "";
      return text ? `\n${text}\n\n` : "\n\n";
    },
  });

  td.addRule("tabs", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("tabs"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const navTabs = el.querySelector(".nav-tabs");
      const tabContents = el.querySelector(".tab-contents");
      if (!navTabs || !tabContents) return _content;

      const buttons = navTabs.querySelectorAll(".tab");
      const items = tabContents.querySelectorAll(".tab-item-content");
      const activeIndex = Array.from(buttons).findIndex((b) => b.classList.contains("active"));
      const tabType = el.getAttribute("data-type") || (el.classList.contains("tabs-compact") ? "compact" : "");

      let params = `active=${activeIndex >= 0 ? activeIndex + 1 : 1}`;
      if (tabType) params += ` type=${tabType}`;
      let md = `\n:::tabs ${params}\n`;

      buttons.forEach((btn, i) => {
        const caption = btn.textContent?.trim() || `Tab ${i + 1}`;
        const rawHtml = items[i]?.innerHTML?.trim() || "";
        const content = rawHtml ? td.turndown(rawHtml).trim() : "";
        md += `== tab ${caption}\n${content}\n\n`;
      });

      md += ":::\n\n";
      return md;
    },
  });

  td.addRule("folding", {
    filter: (node) =>
      node.nodeName === "DETAILS" && (node as HTMLElement).classList.contains("folding-tag"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const summary = el.querySelector("summary");
      const contentDiv = el.querySelector(".content");

      const title = summary?.textContent?.trim() || "折叠内容";
      const isOpen = el.hasAttribute("open");
      let params = `folding title="${title}"`;
      if (isOpen) params += " open";

      if (el.classList.contains("custom-color")) {
        const summaryStyleAttr = summary ? (summary as HTMLElement).getAttribute("style") || "" : "";
        const detailsStyleAttr = el.getAttribute("style") || "";
        const hexMatch = summaryStyleAttr.match(/background-color:\s*(#[\da-fA-F]{3,8})/) ||
          detailsStyleAttr.match(/border-color:\s*(#[\da-fA-F]{3,8})/);
        const summaryBgColor = summary ? (summary as HTMLElement).style.backgroundColor : "";
        const borderColor = el.style.borderColor;
        const color = hexMatch?.[1] || summaryBgColor || borderColor;
        if (color) params += ` color="${color}"`;
      }

      const inner = contentDiv ? contentDiv.innerHTML.trim() : "";

      return `\n:::${params}\n${inner}\n:::\n\n`;
    },
  });

  td.addRule("hiddenBlock", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("hide-block"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const button = el.querySelector(".hide-button") as HTMLElement | null;
      const hideContent = el.querySelector(".hide-content") as HTMLElement | null;
      if (!button || !hideContent) return _content;

      const displayText = button.textContent?.trim() || "查看隐藏内容";
      const bgColor = button.style.backgroundColor || "";
      const textColor = button.style.color || "";
      const inner = hideContent.innerHTML.trim();

      let params = "hidden";
      if (displayText !== "查看隐藏内容") params += ` display=${displayText}`;
      if (bgColor) params += ` bg=${bgColor}`;
      if (textColor) params += ` color=${textColor}`;

      return `\n:::${params}\n${inner}\n:::\n\n`;
    },
  });

  td.addRule("btns", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("btns-container"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;

      let cols = 3;
      const colsMatch = el.className.match(/btns-cols-(\d+)/);
      if (colsMatch) cols = parseInt(colsMatch[1], 10);

      let groupStyle = "default";
      const styleMatch = el.className.match(/btns-style-(card|simple|default)/);
      if (styleMatch) groupStyle = styleMatch[1];

      let md = `\n:::btns cols=${cols}${groupStyle !== "default" ? ` style=${groupStyle}` : ""}\n`;

      el.querySelectorAll(".btn-item").forEach((item) => {
        const link = item as HTMLElement;
        const url = link.getAttribute("href") || "#";
        const titleEl = link.querySelector(".btn-title");
        const descEl = link.querySelector(".btn-desc");
        const iconEl = link.querySelector(".btn-icon i, .btn-icon .iconify-img, .btn-icon .iconify[data-icon], .btn-icon svg[data-icon]");
        const title = titleEl?.textContent?.trim() || "";
        const desc = descEl?.textContent?.trim() || "";

        let icon = "";
        if (iconEl) {
          icon = extractIconFromEl(iconEl as HTMLElement);
        }

        let itemLine = `- title=${title} url=${url}`;
        if (icon) itemLine += ` icon=${icon}`;
        if (desc) itemLine += ` desc=${desc}`;

        const colorMatch = link.className.match(/btn-color-(\w+)/);
        if (colorMatch) itemLine += ` color=${colorMatch[1]}`;

        md += itemLine + "\n";
      });

      md += ":::\n\n";
      return md;
    },
  });

  td.addRule("gallery", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("gallery-container"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;

      let cols = 3;
      const colsMatch = el.className.match(/gallery-cols-(\d+)/);
      if (colsMatch) cols = parseInt(colsMatch[1], 10);

      const gap = el.style.gap || el.style.getPropertyValue("--gallery-gap") || "";
      const ratio = el.style.getPropertyValue("--gallery-ratio") || "";

      let params = `gallery cols=${cols}`;
      if (gap) params += ` gap=${gap}`;
      if (ratio) params += ` ratio=${ratio}`;

      let md = `\n:::${params}\n`;

      el.querySelectorAll(".gallery-item").forEach((item) => {
        const img = item.querySelector("img");
        if (!img) return;
        const url = img.getAttribute("src") || "";
        const alt = img.getAttribute("alt") || "";
        const title = item.querySelector(".gallery-title")?.textContent?.trim() || "";
        const desc = item.querySelector(".gallery-desc")?.textContent?.trim() || "";
        md += `![${alt}](${url}${title ? ` "${title}"` : ""})${desc ? ` desc="${desc}"` : ""}\n`;
      });

      md += ":::\n\n";
      return md;
    },
  });

  td.addRule("videoGallery", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("video-gallery-container"),
    replacement: (_content, node) => {
      const el = node as HTMLElement;

      let cols = 2;
      const colsMatch = el.className.match(/video-gallery-cols-(\d+)/);
      if (colsMatch) cols = parseInt(colsMatch[1], 10);

      const gap = el.style.gap || el.style.getPropertyValue("--video-gallery-gap") || "";
      const ratio = el.style.getPropertyValue("--video-gallery-ratio") || "";

      let params = `video-gallery cols=${cols}`;
      if (gap) params += ` gap=${gap}`;
      if (ratio) params += ` ratio=${ratio}`;

      let md = `\n:::${params}\n`;

      el.querySelectorAll(".video-gallery-item").forEach((item) => {
        const source = item.querySelector("source");
        const video = item.querySelector("video");
        if (!source) return;
        const url = source.getAttribute("src") || "";
        const type = source.getAttribute("type") || "";
        const poster = video?.getAttribute("poster") || "";
        const title = item.querySelector(".video-gallery-title")?.textContent?.trim() || "";
        const desc = item.querySelector(".video-gallery-desc")?.textContent?.trim() || "";

        let line = `url=${url}`;
        if (type) line += ` type=${type}`;
        if (poster) line += ` poster=${poster}`;
        if (title) line += ` title=${title}`;
        if (desc) line += ` desc=${desc}`;
        md += line + "\n";
      });

      md += ":::\n\n";
      return md;
    },
  });
}
