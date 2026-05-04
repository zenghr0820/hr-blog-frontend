/**
 * marked-extensions 块级渲染器
 * 将自定义容器语法（:::xxx）渲染为对应的 HTML 结构，
 * 包括 tabs、密码保护、付费内容、登录可见、折叠、隐藏、按钮组、画廊、视频画廊和告示块等。
 */

import { escapeHtml, extractAttr } from "./shared-utils";

/** 块级渲染器函数类型：接收内容体、参数和行内解析器，返回 HTML 字符串 */
export type BlockRenderer = (body: string, params: string, parse: (md: string) => string) => string;

/** 渲染 tabs 选项卡组件，解析 == tab 语法生成导航栏和内容面板 */
function renderTabs(body: string, params: string, parse: (md: string) => string): string {
  const activeMatch = params.match(/active=(\d+)/);
  const activeIdx = activeMatch ? parseInt(activeMatch[1], 10) - 1 : 0;

  const lines = body.split("\n");
  const tabs: { caption: string; content: string }[] = [];
  let current: { caption: string; content: string } | null = null;
  let inCode = false;
  let codeMark = "";

  for (const line of lines) {
    const trimmed = line.trim();
    const cm = trimmed.match(/^(`{3,}|~{3,})/);
    if (cm) {
      if (!inCode) { inCode = true; codeMark = cm[1]; }
      else if (trimmed === codeMark) { inCode = false; codeMark = ""; }
    }

    const tabMatch = !inCode ? trimmed.match(/^==\s+tab\s+(.*)/) : null;
    if (tabMatch) {
      if (current) tabs.push(current);
      current = { caption: tabMatch[1].trim(), content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) tabs.push(current);
  if (tabs.length === 0) return `<div class="tabs">${parse(body)}</div>`;

  const id = `tabs-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  let nav = `<ul class="nav-tabs">`;
  let contents = `<div class="tab-contents">`;

  tabs.forEach((tab, i) => {
    const active = i === activeIdx ? " active" : "";
    const tabId = `${id}-${i + 1}`;
    nav += `<button type="button" class="tab${active}" data-href="${tabId}">${escapeHtml(tab.caption)}</button>`;
    contents += `<div class="tab-item-content${active}" id="${tabId}" data-title="${escapeHtml(tab.caption)}">${parse(tab.content.trim())}</div>`;
  });

  nav += "</ul>";
  contents += "</div>";
  return `<div class="tabs" id="${id}">${nav}${contents}<div class="tab-to-top"><button type="button" aria-label="scroll to top"><i class="anzhiyufont anzhiyu-icon-arrow-up"></i></button></div></div>`;
}

/** 渲染密码保护内容块，包含锁图标、标题、预览区和密码输入区 */
function renderPasswordContent(body: string, params: string, parse: (md: string) => string): string {
  const password = extractAttr(params, "password");
  const id = extractAttr(params, "id") || `password-${Date.now()}`;
  const title = extractAttr(params, "title") || "密码保护内容";
  const hint = extractAttr(params, "hint");
  const placeholder = extractAttr(params, "placeholder") || "请输入密码";
  const len = body.trim().length;
  const inner = parse(body.trim());

  return `<div class="password-content-editor-preview" data-section-id="${id}" data-content-id="${id}" data-content-length="${len}" data-password="${escapeHtml(password)}" data-title="${escapeHtml(title)}" data-hint="${escapeHtml(hint)}" data-placeholder="${escapeHtml(placeholder)}"><div class="password-content-header"><span class="password-icon"><svg class="md-editor-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240z m460 600H232V536h560v304z" fill="#5470C6"/><path d="M484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53c12.1-8.7 20-22.9 20-39 0-26.5-21.5-48-48-48s-48 21.5-48 48c0 16.1 7.9 30.3 20 39z" fill="#5470C6"/></svg></span><span class="password-title">${escapeHtml(title)}</span><span class="password-pro-badge">密码保护内容</span></div><div class="password-content-body"><div class="password-content-preview">${inner}</div><div class="password-content-meta"><span class="content-length">约 ${len} 字</span><span class="password-protection-info">• 此内容受密码保护</span></div></div></div>`;
}

/** 渲染付费内容块，显示价格、原价和内容预览 */
function renderPaidContent(body: string, params: string, parse: (md: string) => string): string {
  const title = extractAttr(params, "title") || "付费内容";
  const price = extractAttr(params, "price") || "0";
  const originalPrice = extractAttr(params, "original-price");
  const currency = extractAttr(params, "currency") || "¥";
  const len = body.trim().length;
  const inner = parse(body.trim());

  let opAttr = "";
  if (originalPrice) opAttr = ` data-original-price="${escapeHtml(originalPrice)}"`;

  return `<div class="paid-content-editor-preview" data-title="${escapeHtml(title)}" data-price="${escapeHtml(price)}"${opAttr} data-currency="${escapeHtml(currency)}" data-content-length="${len}"><div class="paid-content-header"><span class="paid-content-title">${escapeHtml(title)}</span><span class="paid-content-badge">付费内容</span></div><div class="paid-content-body"><div class="paid-content-preview">${inner}</div></div></div>`;
}

/** 渲染登录可见内容块，提示用户登录后查看 */
function renderLoginRequired(body: string, params: string, parse: (md: string) => string): string {
  const id = extractAttr(params, "id") || `login-${Date.now()}`;
  const title = extractAttr(params, "title") || "登录后可查看";
  const hint = extractAttr(params, "hint") || "此内容需要登录后才能查看";
  const len = body.trim().length;
  const inner = parse(body.trim());

  return `<div class="login-required-content-editor-preview" data-content-id="${id}" data-title="${escapeHtml(title)}" data-hint="${escapeHtml(hint)}" data-content-length="${len}"><div class="login-required-content-header"><span class="login-required-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span><span class="login-required-title">${escapeHtml(title)}</span><span class="login-required-badge">登录后可查看</span></div><div class="login-required-content-body"><div class="login-required-content-preview">${inner}</div></div></div>`;
}

/** 渲染折叠面板（details/summary），支持自定义颜色和默认展开 */
function renderFolding(body: string, params: string, parse: (md: string) => string): string {
  const titleStr = extractAttr(params, "title") || params.replace(/^folding\s*/, "").replace(/\s*open\s*$/, "").trim() || "折叠内容";
  const isOpen = /\bopen\b/.test(params);
  const color = extractAttr(params, "color");
  const detailsStyle = color ? ` style="border-color: ${color}"` : "";
  const detailsClass = color ? " folding-tag custom-color" : " folding-tag";
  const inner = parse(body.trim());

  let summaryAttrs = "";
  if (color) {
    summaryAttrs = ` style="background-color: ${color}; color: #fff; border-color: ${color};"`;
  }

  return `<details class="${detailsClass}"${isOpen ? " open" : ""}${detailsStyle}><summary${summaryAttrs}>${escapeHtml(titleStr)}</summary><div class="content">${inner}</div></details>`;
}

/** 渲染隐藏内容块，点击按钮后显示/隐藏内容，支持自定义按钮样式 */
function renderHidden(body: string, params: string, parse: (md: string) => string): string {
  const display = extractAttr(params, "display") || "查看隐藏内容";
  const bg = extractAttr(params, "bg");
  const color = extractAttr(params, "color");
  const inner = parse(body.trim());

  let btnStyle = "";
  if (bg) btnStyle += `background-color:${bg};`;
  if (color) btnStyle += `color:${color};`;
  const styleAttr = btnStyle ? ` style="${btnStyle}"` : "";

  return `<div class="hide-block"><button class="hide-button"${styleAttr}>${escapeHtml(display)}</button><div class="hide-content">${inner}</div></div>`;
}

/** 渲染按钮组容器，支持列数和样式配置，每个按钮项可包含图标、标题和描述 */
function renderBtns(body: string, params: string): string {
  const cols = extractAttr(params, "cols") || "3";
  const style = extractAttr(params, "style") || "default";
  const lines = body.trim().split("\n");

  let items = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("-")) continue;
    const itemStr = trimmed.slice(1).trim();
    const title = extractAttr(itemStr, "title");
    const url = extractAttr(itemStr, "url") || "#";
    const icon = extractAttr(itemStr, "icon");
    const desc = extractAttr(itemStr, "desc");
    const color = extractAttr(itemStr, "color");

    let iconHtml = "";
    if (icon) {
      if (icon.startsWith("fa-") || icon.startsWith("fa6-")) {
        const faClass = icon.replace(/^fa6-/, "fa-").replace(":", " fa-");
        iconHtml = `<span class="btn-icon"><i class="${escapeHtml(faClass)}"></i></span>`;
      } else if (icon.includes("anzhiyu-icon") || icon.includes("anzhiyufont")) {
        iconHtml = `<span class="btn-icon"><i class="${escapeHtml(icon)}"></i></span>`;
      } else {
        iconHtml = `<span class="btn-icon"><span class="iconify" data-icon="${escapeHtml(icon)}"></span></span>`;
      }
    }
    let descHtml = "";
    if (desc) descHtml = `<span class="btn-desc">${escapeHtml(desc)}</span>`;

    items += `<a class="btn-item${color ? ` btn-color-${color}` : ""}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${iconHtml}<span class="btn-title">${escapeHtml(title)}</span>${descHtml}</a>`;
  }

  return `<div class="btns-container btns-cols-${cols}${style !== "default" ? ` btns-style-${style}` : ""}">${items}</div>`;
}

/** 渲染图片画廊容器，支持列数、间距和宽高比配置 */
function renderGallery(body: string, params: string): string {
  const cols = extractAttr(params, "cols") || "3";
  const gap = extractAttr(params, "gap");
  const ratio = extractAttr(params, "ratio");
  const lines = body.trim().split("\n");

  let style = "";
  if (gap) style += `--gallery-gap:${gap};`;
  if (ratio) style += `--gallery-ratio:${ratio};`;
  const styleAttr = style ? ` style="${style}"` : "";

  let items = "";
  for (const line of lines) {
    const m = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)(?:\s+desc="([^"]*)")?/);
    if (!m) continue;
    const [, alt, src, title, desc] = m;
    let titleHtml = "";
    if (title) titleHtml = `<span class="gallery-title">${escapeHtml(title)}</span>`;
    let descHtml = "";
    if (desc) descHtml = `<span class="gallery-desc">${escapeHtml(desc)}</span>`;
    const captionHtml = titleHtml || descHtml ? `<div class="gallery-caption">${titleHtml}${descHtml}</div>` : "";
    items += `<div class="gallery-item"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />${captionHtml}</div>`;
  }

  return `<div class="gallery-container gallery-cols-${cols}"${styleAttr}>${items}</div>`;
}

/** 渲染视频画廊容器，支持列数、间距和宽高比配置，每项可包含标题和描述 */
function renderVideoGallery(body: string, params: string): string {
  const cols = extractAttr(params, "cols") || "2";
  const gap = extractAttr(params, "gap");
  const ratio = extractAttr(params, "ratio");
  const lines = body.trim().split("\n");

  let style = "";
  if (gap) style += `--video-gallery-gap:${gap};`;
  if (ratio) style += `--video-gallery-ratio:${ratio};`;
  const styleAttr = style ? ` style="${style}"` : "";

  let items = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const url = extractAttr(trimmed, "url");
    if (!url) continue;
    const type = extractAttr(trimmed, "type") || "video/mp4";
    const poster = extractAttr(trimmed, "poster");
    const title = extractAttr(trimmed, "title");
    const desc = extractAttr(trimmed, "desc");

    let meta = "";
    if (title) meta += `<span class="video-gallery-title">${escapeHtml(title)}</span>`;
    if (desc) meta += `<span class="video-gallery-desc">${escapeHtml(desc)}</span>`;
    const posterAttr = poster ? ` poster="${escapeHtml(poster)}"` : "";

    items += `<div class="video-gallery-item"><video controls${posterAttr}><source src="${escapeHtml(url)}" type="${escapeHtml(type)}" /></video>${meta}</div>`;
  }

  return `<div class="video-gallery-container video-gallery-cols-${cols}"${styleAttr}>${items}</div>`;
}

/** 创建告示块渲染器的工厂函数，生成指定类型的告示块（note/tip/warning 等） */
function renderAdmonition(type: string): BlockRenderer {
  return (body: string, params: string, parse: (md: string) => string) => {
    const title = params.trim();
    const titleHtml = title ? `<div class="admonition-title">${escapeHtml(title)}</div>` : "";
    return `<div class="admonition ${type}">${titleHtml}<div class="admonition-body">${parse(body)}</div></div>`;
  };
}

/** 块级渲染器注册表：容器标签名 -> 渲染函数，未匹配的标签将使用默认 custom-block 渲染 */
export const blockRenderers: Record<string, BlockRenderer> = {
  tabs: renderTabs,
  "password-content": renderPasswordContent,
  "paid-content": renderPaidContent,
  "login-required": renderLoginRequired,
  folding: renderFolding,
  hidden: renderHidden,
  btns: renderBtns,
  gallery: renderGallery,
  "video-gallery": renderVideoGallery,
  note: renderAdmonition("note"),
  info: renderAdmonition("info"),
  tip: renderAdmonition("tip"),
  success: renderAdmonition("success"),
  warning: renderAdmonition("warning"),
  danger: renderAdmonition("danger"),
};
