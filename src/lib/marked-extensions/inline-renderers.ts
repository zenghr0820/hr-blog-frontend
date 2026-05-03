/**
 * marked-extensions 行内渲染器
 * 将自定义行内标签语法（{xxx}...{/xxx}）渲染为对应的 HTML 结构，
 * 包括链接卡片、按钮、提示气泡、音乐播放器、下划线、着重号、波浪线、删除线、键盘键和行内密码等。
 */

import { escapeHtml, extractAttr } from "./shared-utils";

/** 渲染链接卡片，显示站点图标、标题、站点名和外链提示 */
function renderInlineLinkcard(params: string): string {
  const url = extractAttr(params, "url") || "#";
  const title = extractAttr(params, "title");
  const sitename = extractAttr(params, "sitename");
  const icon = extractAttr(params, "icon") || "rivet-icons:link";
  const tips = extractAttr(params, "tips") || "引用站外地址";

  const isIconify = icon.includes(":");
  const [prefix, name] = isIconify ? icon.split(":") : ["", ""];
  const iconUrl = isIconify && prefix && name
    ? `https://api.iconify.design/${escapeHtml(prefix)}/${escapeHtml(name)}.svg?color=currentColor`
    : `https://api.iconify.design/rivet-icons/link.svg?color=currentColor`;

  const arrowIconUrl = "https://api.iconify.design/fa6-solid/angle-right.svg?color=currentColor";

  return `<div class="anzhiyu-tag-link"><a class="tag-Link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><div class="tag-link-tips">${escapeHtml(tips)}</div><div class="tag-link-bottom"><div class="tag-link-left"><img src="${iconUrl}" data-iconify="${escapeHtml(icon)}" alt="" loading="lazy" /></div><div class="tag-link-right"><div class="tag-link-title">${escapeHtml(title)}</div><div class="tag-link-sitename">${escapeHtml(sitename)}</div></div><img class="tag-link-arrow-icon" src="${arrowIconUrl}" alt="" loading="lazy" aria-hidden="true" data-iconify="fa6-solid:angle-right" /></div></a></div>`;
}

/** 渲染行内按钮，支持实心/描边样式、大小和颜色配置 */
function renderInlineBtn(params: string): string {
  const url = extractAttr(params, "url") || "#";
  const text = extractAttr(params, "text") || "按钮";
  const icon = extractAttr(params, "icon") || "anzhiyu-icon-circle-arrow-right";
  const style = extractAttr(params, "style");
  const size = extractAttr(params, "size");
  const color = extractAttr(params, "color");

  let cls = "btn-anzhiyu";
  if (style === "outline") cls += " btn-outline";
  if (size === "larger") cls += " btn-larger";
  if (color) cls += ` btn-${color}`;

  return `<a class="${cls}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><i class="${escapeHtml(icon)}"></i><span>${escapeHtml(text)}</span></a>`;
}

/** 渲染提示气泡，鼠标悬停或点击时显示提示内容，支持位置、主题和触发方式配置 */
function renderInlineTip(params: string): string {
  const text = extractAttr(params, "text");
  const content = extractAttr(params, "content");
  const position = extractAttr(params, "position") || "top";
  const theme = extractAttr(params, "theme") || "dark";
  const trigger = extractAttr(params, "trigger") || "hover";

  const posClass = position === "bottom" ? " tip-bottom" : "";
  const themeClass = theme === "light" ? " tip-light" : "";
  const triggerAttr = trigger === "click" ? ' data-trigger="click"' : "";
  const triggerClass = trigger === "click" ? " tip-click" : "";

  return `<span class="anzhiyu-tip-wrapper${triggerClass}"${triggerAttr}><span class="anzhiyu-tip-text">${escapeHtml(text)}</span><span class="anzhiyu-tip${posClass}${themeClass}">${escapeHtml(content)}</span></span>`;
}

const NETEASE_DECORATION_IMG =
  "https://upload-bbs.miyoushe.com/upload/2025/11/04/125766904/606ad4f7e660998724ec17f4114085aa_6429154021753184587.png";

function renderInlineMusic(params: string): string {
  const neteaseId = extractAttr(params, "neteaseId") || extractAttr(params, "id");
  const name = extractAttr(params, "name") || "未知歌曲";
  const artist = extractAttr(params, "artist") || "未知艺术家";
  const pic = extractAttr(params, "pic") || "/static/img/music-vinyl-background.png";
  const color = extractAttr(params, "color");

  const dataObj: Record<string, string> = {};
  if (neteaseId) dataObj.neteaseId = neteaseId;
  if (name) dataObj.name = name;
  if (artist) dataObj.artist = artist;
  if (pic) dataObj.pic = pic;
  if (color) dataObj.color = color;

  const escapedName = escapeHtml(name);
  const escapedArtist = escapeHtml(artist);

  return `<div class="markdown-music-player" data-music-id="${escapeHtml(neteaseId)}" data-music-data="${escapeHtml(JSON.stringify(dataObj))}"><div class="music-player-container"><div class="music-error" style="display: none;"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg><span>音乐加载失败</span></div><div class="music-artwork-container"><div class="music-artwork-wrapper"><img src="/static/img/music-vinyl-background.png" alt="唱片背景" class="vinyl-background"><img src="/static/img/music-vinyl-outer.png" alt="唱片外圈" class="artwork-image-vinyl-background"><img src="/static/img/music-vinyl-inner.png" alt="唱片内圈" class="artwork-image-vinyl-inner-background"><img src="/static/img/music-vinyl-needle.png" alt="撞针" class="artwork-image-needle-background"><img src="/static/img/music-vinyl-groove.png" alt="凹槽背景" class="artwork-image-groove-background"><div class="artwork-transition-wrapper"><img src="${escapeHtml(pic)}" alt="专辑封面" class="artwork-image"><img src="${escapeHtml(pic)}" alt="模糊背景" class="artwork-image-blur"><div class="artwork-border-ring"></div></div><div class="music-play-overlay"><div class="music-play-button-overlay"><svg class="music-play-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg><svg class="music-pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="display: none;"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"></path></svg></div></div></div></div><div class="music-info-container"><div class="music-text-info"><div class="music-name">${escapedName}</div><div class="music-artist">${escapedArtist}</div></div><span class="nmsingle-playtime"><span class="current-time">00:00</span> / <span class="duration">00:00</span></span></div><div class="music-decoration-image"><img src="${NETEASE_DECORATION_IMG}" alt="音乐装饰"></div><div class="music-progress-bar"><div class="music-progress-track"><div class="music-progress-fill" style="width: 0%"></div></div></div><audio class="music-audio-element" preload="none"></audio></div></div>`;
}

/** 简单行内标签渲染器：仅包裹内容，无需解析参数（u/emp/wavy/del/kbd/psw） */
export const inlineSimpleTags: Record<string, (content: string) => string> = {
  u: (c) => `<span class="inline-underline">${c}</span>`,
  emp: (c) => `<span class="inline-emphasis-mark">${c}</span>`,
  wavy: (c) => `<span class="inline-wavy">${c}</span>`,
  del: (c) => `<span class="inline-delete">${c}</span>`,
  kbd: (c) => `<span class="inline-kbd">${c}</span>`,
  psw: (c) => `<span class="inline-password">${c}</span>`,
};

/** 渲染行内隐藏内容，点击按钮后显示/隐藏，支持自定义按钮样式 */
export function renderInlineHide(params: string, content: string): string {
  const display = extractAttr(params, "display") || "查看";
  const bg = extractAttr(params, "bg");
  const color = extractAttr(params, "color");

  let btnStyle = "";
  if (bg) btnStyle += `background-color:${bg};`;
  if (color) btnStyle += `color:${color};`;
  const styleAttr = btnStyle ? ` style="${btnStyle}"` : "";

  return `<span class="hide-inline"><button type="button" class="hide-button"${styleAttr}>${escapeHtml(display)}</button><span class="hide-content" style="display: none;">${content}</span></span>`;
}

/** 复杂行内标签渲染器：需要解析参数的行内标签（linkcard/btn/tip/music） */
export const inlineComplexTags: Record<string, (params: string) => string> = {
  linkcard: renderInlineLinkcard,
  btn: renderInlineBtn,
  tip: renderInlineTip,
  music: renderInlineMusic,
};
