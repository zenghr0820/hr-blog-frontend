/**
 * 音乐播放器 Hook
 * 管理网易云音乐播放器的完整生命周期：
 * - initMusicPlayers: 初始化播放器 DOM 事件（播放/暂停/进度/结束）
 * - handleMusicPlayerToggle: 切换播放/暂停状态，首次播放时自动加载音频
 * - handleMusicPlayerSeek: 点击进度条跳转播放位置
 * - 通过 API 获取音频 URL，强制 HTTPS 协议
 * - 将全局回调挂载到 window 供 onclick 属性调用
 */

import { useCallback } from "react";
import { apiClient } from "@/lib/api/client";

export function useMusicPlayer() {
  const formatTime = useCallback((seconds: number) => {
    if (!isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const ensureHttps = useCallback((url: string) => {
    if (!url) return url;
    if (url.startsWith("http://")) {
      return url.replace("http://", "https://");
    }
    return url;
  }, []);

  const fetchAudioUrl = useCallback(
    async (neteaseId: string): Promise<string | null> => {
      try {
        const result = await apiClient.post<{ audioUrl?: string }>("/api/public/music/song-resources", { neteaseId });
        if (result.code === 200 && result.data?.audioUrl) {
          return ensureHttps(result.data.audioUrl);
        }
        const errMsg = result.message || "未知错误";
        console.error(`[音乐播放器] 获取音频资源失败 (neteaseId: ${neteaseId}): ${errMsg} (code: ${result.code})`);
        return null;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[音乐播放器] 获取音频资源请求异常 (neteaseId: ${neteaseId}): ${msg}`);
        return null;
      }
    },
    [ensureHttps]
  );

  /** 解析 data-music-data 和 data-music-id 属性，返回音乐元数据对象 */
  const parseMusicData = useCallback((player: HTMLElement) => {
    const musicDataAttr = player.getAttribute("data-music-data");
    const musicId = player.getAttribute("data-music-id") || "";

    if (!musicDataAttr && !musicId) return null;

    let parsed: Record<string, string> = {};
    if (musicDataAttr) {
      const decodedData = musicDataAttr
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, "&");

      try {
        parsed = JSON.parse(decodedData);
      } catch {
        // JSON 解析失败，继续使用 musicId
      }
    }

    if (musicId && !parsed.neteaseId) {
      parsed.neteaseId = musicId;
    }

    return parsed as {
      neteaseId?: string;
      name?: string;
      artist?: string;
      pic?: string;
      color?: string;
    };
  }, []);

  const initMusicPlayerData = useCallback(
    async (playerId: string) => {
      const player = document.getElementById(playerId);
      if (!player || player.dataset.audioLoaded) return;

      const audio = player.querySelector(".music-audio-element") as HTMLAudioElement;
      const errorEl = player.querySelector(".music-error") as HTMLElement;

      if (!audio) {
        console.error("[音乐播放器] 未找到 audio 元素:", playerId);
        return;
      }

      try {
        const musicData = parseMusicData(player);
        if (!musicData) {
          console.error("[音乐播放器] 没有找到 data-music-data 属性或解析失败");
          if (errorEl) errorEl.style.display = "flex";
          return;
        }

        if (!musicData.neteaseId) {
          console.error("[音乐播放器] 缺少网易云音乐 ID，无法获取音频资源");
          if (errorEl) errorEl.style.display = "flex";
          return;
        }

        console.log("[音乐播放器] 通过 API 获取音频链接 - 网易云 ID:", musicData.neteaseId);
        player.classList.add("loading");

        const audioUrl = await fetchAudioUrl(musicData.neteaseId);
        if (audioUrl) {
          audio.src = audioUrl;
          audio.preload = "metadata";

          const durationEl = player.querySelector(".duration") as HTMLElement;
          const updateDuration = () => {
            if (durationEl && audio.duration) {
              durationEl.textContent = formatTime(audio.duration);
            }
          };

          if (audio.readyState >= 1) {
            updateDuration();
          } else {
            audio.addEventListener("loadedmetadata", updateDuration, { once: true });
          }

          audio.load();
          player.dataset.audioLoaded = "true";
          player.classList.remove("loading");
          console.log("[音乐播放器] 加载完成:", musicData.name);
        } else {
          console.error("[音乐播放器] 无法获取音频 URL");
          if (errorEl) errorEl.style.display = "flex";
          player.classList.remove("loading");
        }
      } catch (error) {
        console.error("[音乐播放器] 初始化失败:", error);
        if (errorEl) errorEl.style.display = "flex";
        player.classList.remove("loading");
      }
    },
    [fetchAudioUrl, formatTime, parseMusicData]
  );

  const handleMusicPlayerToggle = useCallback(
    async (playerId: string) => {
      const player = document.getElementById(playerId);
      if (!player) return;

      const audio = player.querySelector(".music-audio-element") as HTMLAudioElement;
      if (!audio) return;

      if (!player.dataset.audioLoaded) {
        await initMusicPlayerData(playerId);
      }

      if (audio.paused) {
        audio.play().catch(err => console.error("[音乐播放器] 播放失败:", err));
      } else {
        audio.pause();
      }
    },
    [initMusicPlayerData]
  );

  const handleMusicPlayerSeek = useCallback((playerId: string, event: MouseEvent) => {
    const player = document.getElementById(playerId);
    if (!player) return;

    const audio = player.querySelector(".music-audio-element") as HTMLAudioElement;
    const progressBar = event.currentTarget as HTMLElement;
    if (!audio || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    if (audio.duration) {
      audio.currentTime = percent * audio.duration;
    }
  }, []);

  const NETEASE_DECORATION_IMG =
    "https://upload-bbs.miyoushe.com/upload/2025/11/04/125766904/606ad4f7e660998724ec17f4114085aa_6429154021753184587.png";

  /** 为旧版占位符播放器构建完整的播放器 DOM 结构（兼容历史数据） */
  const buildMusicPlayerDOM = useCallback((player: HTMLElement) => {
    const musicData = parseMusicData(player);
    const playerId = `music-player-${Math.random().toString(36).slice(2, 12)}`;
    const name = musicData?.name || "未知歌曲";
    const artist = musicData?.artist || "未知艺术家";
    const pic = musicData?.pic || "/static/img/music-vinyl-background.png";

    const escapedName = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const escapedArtist = artist.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    player.id = playerId;

    player.innerHTML = `
      <div class="music-player-container">
        <div class="music-error" style="display: none;">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
          </svg>
          <span>音乐加载失败</span>
        </div>
        <div class="music-artwork-container">
          <div class="music-artwork-wrapper">
            <img src="/static/img/music-vinyl-background.png" alt="唱片背景" class="vinyl-background">
            <img src="/static/img/music-vinyl-outer.png" alt="唱片外圈" class="artwork-image-vinyl-background">
            <img src="/static/img/music-vinyl-inner.png" alt="唱片内圈" class="artwork-image-vinyl-inner-background">
            <img src="/static/img/music-vinyl-needle.png" alt="撞针" class="artwork-image-needle-background">
            <img src="/static/img/music-vinyl-groove.png" alt="凹槽背景" class="artwork-image-groove-background">
            <div class="artwork-transition-wrapper">
              <img src="${pic}" alt="专辑封面" class="artwork-image">
              <img src="${pic}" alt="模糊背景" class="artwork-image-blur">
              <div class="artwork-border-ring"></div>
            </div>
            <div class="music-play-overlay" onclick="window.__musicPlayerToggle?.('${playerId}')">
              <div class="music-play-button-overlay">
                <svg class="music-play-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"></path>
                </svg>
                <svg class="music-pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div class="music-info-container">
          <div class="music-text-info">
            <div class="music-name">${escapedName}</div>
            <div class="music-artist">${escapedArtist}</div>
          </div>
          <span class="nmsingle-playtime">
            <span class="current-time">00:00</span> / <span class="duration">00:00</span>
          </span>
        </div>
        <div class="music-decoration-image">
          <img src="${NETEASE_DECORATION_IMG}" alt="音乐装饰">
        </div>
        <div class="music-progress-bar" onclick="window.__musicPlayerSeek?.('${playerId}', event)">
          <div class="music-progress-track">
            <div class="music-progress-fill" style="width: 0%"></div>
          </div>
        </div>
        <audio class="music-audio-element" preload="none"></audio>
      </div>
    `;
  }, [parseMusicData]);

  const initMusicPlayers = useCallback(
    (container: HTMLElement) => {
      const musicPlayers = container.querySelectorAll(".markdown-music-player[data-music-id]");

      musicPlayers.forEach(playerEl => {
        const player = playerEl as HTMLElement;

        if (!player.querySelector(".music-audio-element")) {
          buildMusicPlayerDOM(player);
        }

        const audio = player.querySelector(".music-audio-element") as HTMLAudioElement;

        if (!audio || audio.dataset.eventsAttached) return;
        audio.dataset.eventsAttached = "true";

        const artworkWrapper = player.querySelector(".music-artwork-wrapper") as HTMLElement;
        const needleEl = player.querySelector(".artwork-image-needle-background") as HTMLElement;
        const playIcon = player.querySelector(".music-play-icon") as HTMLElement;
        const pauseIcon = player.querySelector(".music-pause-icon") as HTMLElement;
        const progressFill = player.querySelector(".music-progress-fill") as HTMLElement;
        const currentTimeEl = player.querySelector(".current-time") as HTMLElement;
        const durationEl = player.querySelector(".duration") as HTMLElement;

        audio.addEventListener("play", () => {
          if (artworkWrapper) artworkWrapper.classList.add("is-playing");
          if (needleEl) needleEl.classList.add("needle-playing");
          if (playIcon) playIcon.style.display = "none";
          if (pauseIcon) pauseIcon.style.display = "block";
        });

        audio.addEventListener("pause", () => {
          if (artworkWrapper) artworkWrapper.classList.remove("is-playing");
          if (needleEl) needleEl.classList.remove("needle-playing");
          if (playIcon) playIcon.style.display = "block";
          if (pauseIcon) pauseIcon.style.display = "none";
        });

        audio.addEventListener("timeupdate", () => {
          if (progressFill && audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100 || 0;
            progressFill.style.width = progress + "%";
          }
          if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(audio.currentTime);
          }
        });

        audio.addEventListener("loadedmetadata", () => {
          if (durationEl) {
            durationEl.textContent = formatTime(audio.duration);
          }
        });

        audio.addEventListener("ended", () => {
          audio.currentTime = 0;
          if (artworkWrapper) artworkWrapper.classList.remove("is-playing");
          if (needleEl) needleEl.classList.remove("needle-playing");
        });

        const playerId = player.id || `music-player-${Math.random().toString(36).slice(2, 12)}`;
        player.id = playerId;

        const playOverlay = player.querySelector(".music-play-overlay") as HTMLElement;
        if (playOverlay) {
          playOverlay.addEventListener("click", (e: Event) => {
            e.stopPropagation();
            window.__musicPlayerToggle?.(playerId);
          });
        }

        const progressBar = player.querySelector(".music-progress-bar") as HTMLElement;
        if (progressBar && !progressBar.getAttribute("onclick")) {
          progressBar.addEventListener("click", (e: Event) => {
            window.__musicPlayerSeek?.(playerId, e as MouseEvent);
          });
        }

        const preloadAudioMetadata = async () => {
          try {
            const musicData = parseMusicData(player);
            if (!musicData) return;

            if (musicData.color && progressFill) {
              progressFill.style.background = musicData.color;
            }

            if (!musicData.neteaseId) return;

            const audioUrl = await fetchAudioUrl(musicData.neteaseId);
            if (audioUrl) {
              audio.src = audioUrl;
              audio.preload = "metadata";
              player.dataset.audioLoaded = "true";
            }
          } catch (error) {
            console.error("[音乐播放器] 预加载元数据失败:", error);
          }
        };

        preloadAudioMetadata();
      });
    },
    [formatTime, fetchAudioUrl, buildMusicPlayerDOM, parseMusicData]
  );

  return {
    initMusicPlayers,
    handleMusicPlayerToggle,
    handleMusicPlayerSeek,
  };
}
