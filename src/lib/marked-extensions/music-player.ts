/**
 * 音乐播放器渲染工具
 * 从原 marked-extensions.ts 拆分而来，供 PostContent 和 content-processor 使用
 */

// 默认封面和装饰图
const DEFAULT_MUSIC_COVER = "/static/img/music-default-cover.webp";
const NETEASE_DECORATION_IMG = "/static/img/music-decoration.png";

export interface MusicPlayerRenderData {
  neteaseId?: string;
  name?: string;
  artist?: string;
  pic?: string;
  color?: string;
  playerId?: string;
  instanceKey?: string | number;
}

/** 解码 HTML 实体 */
export function decodeHtmlEntities(value: string): string {
  let decoded = value;
  for (let i = 0; i < 2; i += 1) {
    decoded = decoded
      .replace(/&quot;|&#34;/g, '"')
      .replace(/&#039;|&#39;/g, "'")
      .replace(/&amp;/g, "&");
  }
  return decoded;
}

/** 解析 data-music-data 属性中的 JSON 数据 */
export function parseMusicPlayerData(raw: string): Partial<MusicPlayerRenderData> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(decodeHtmlEntities(raw));
    if (!parsed || typeof parsed !== "object") return {};
    const data = parsed as Record<string, unknown>;
    return {
      neteaseId: typeof data.neteaseId === "string" ? data.neteaseId : "",
      name: typeof data.name === "string" ? data.name : "",
      artist: typeof data.artist === "string" ? data.artist : "",
      pic: typeof data.pic === "string" ? data.pic : "",
      color: typeof data.color === "string" ? data.color : "",
    };
  } catch {
    return {};
  }
}

function createMusicPlayerId(data: MusicPlayerRenderData): string {
  const source =
    [data.neteaseId, data.name, data.artist, data.pic, data.instanceKey].filter(Boolean).join("|") || "music";
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }
  return `music-player-${Math.abs(hash).toString(36)}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** 渲染音乐播放器 HTML */
export function renderMusicPlayerHtml(data: MusicPlayerRenderData): string {
  const neteaseId = data.neteaseId || "";
  const name = data.name || "";
  const artist = data.artist || "";
  const pic = data.pic || "";
  const color = data.color || "";
  const playerId = data.playerId || createMusicPlayerId(data);
  const displayName = name || (neteaseId ? "加载中..." : "未设置歌曲");
  const displayArtist = artist || (neteaseId ? "..." : "请编辑音乐 ID");
  const displayPic = pic || DEFAULT_MUSIC_COVER;
  const dataObj: Record<string, string> = {};
  if (neteaseId) dataObj.neteaseId = neteaseId;
  if (name) dataObj.name = name;
  if (artist) dataObj.artist = artist;
  if (pic) dataObj.pic = pic;
  if (color) dataObj.color = color;

  return `<div class="markdown-music-player" id="${escapeHtml(playerId)}" data-music-id="${escapeHtml(neteaseId)}" data-music-data="${escapeHtml(JSON.stringify(dataObj))}"><div class="music-player-container"><div class="music-error" style="display: none;"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg><span>音乐加载失败</span></div><div class="music-artwork-container"><div class="music-artwork-wrapper"><img src="/static/img/music-vinyl-background.png" alt="唱片背景" class="vinyl-background"><img src="/static/img/music-vinyl-outer.png" alt="唱片外圈" class="artwork-image-vinyl-background"><img src="/static/img/music-vinyl-inner.png" alt="唱片内圈" class="artwork-image-vinyl-inner-background"><img src="/static/img/music-vinyl-needle.png" alt="撞针" class="artwork-image-needle-background"><img src="/static/img/music-vinyl-groove.png" alt="凹槽背景" class="artwork-image-groove-background"><div class="artwork-transition-wrapper"><img src="${escapeHtml(displayPic)}" alt="专辑封面" class="artwork-image"><img src="${escapeHtml(displayPic)}" alt="模糊背景" class="artwork-image-blur"><div class="artwork-border-ring"></div></div><div class="music-play-overlay"><div class="music-play-button-overlay"><svg class="music-play-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg><svg class="music-pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="display: none;"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"></path></svg></div></div></div></div><div class="music-info-container"><div class="music-text-info"><div class="music-name">${escapeHtml(displayName)}</div><div class="music-artist">${escapeHtml(displayArtist)}</div></div><span class="nmsingle-playtime"><span class="current-time">00:00</span> / <span class="duration">00:00</span></span></div><div class="music-decoration-image"><img src="${escapeHtml(NETEASE_DECORATION_IMG)}" alt="音乐装饰"></div><div class="music-progress-bar"><div class="music-progress-track"><div class="music-progress-fill" style="width: 0%"></div></div></div><audio class="music-audio-element" preload="none"></audio></div></div>`;
}
