"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { EssayMusic } from "@/types/essay";
import styles from "./MusicPlayer.module.css";

interface LyricLine {
  time: number;
  text: string;
}

function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split("\n");
  const result: LyricLine[] = [];
  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/);
    if (match && match[1] && match[2] && match[4]) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = match[3] ? parseInt(match[3].padEnd(3, "0")) : 0;
      const text = match[4].trim();
      if (text) {
        result.push({ time: minutes * 60 + seconds + milliseconds / 1000, text });
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

async function fetchLrcText(lrcUrl: string): Promise<string> {
  try {
    const response = await fetch(lrcUrl);
    return await response.text();
  } catch {
    return "";
  }
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function MusicPlayer({ music }: { music: EssayMusic }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsRef = useRef<LyricLine[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    if (!music.lrc) return;
    let cancelled = false;
    const loadLyrics = async () => {
      const lrcText = music.lrc!.startsWith("http") ? await fetchLrcText(music.lrc!) : music.lrc!;
      if (!cancelled) {
        const parsed = parseLrc(lrcText);
        lyricsRef.current = parsed;
        setCurrentLyricIndex(-1);
      }
    };
    loadLyrics();
    return () => {
      cancelled = true;
    };
  }, [music.lrc]);

  const updateCurrentLyric = useCallback((time: number) => {
    const lyrics = lyricsRef.current;
    if (lyrics.length === 0) return;
    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (time >= lyrics[i].time) index = i;
      else break;
    }
    setCurrentLyricIndex(index);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !music.url) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setLoadError(true));
    }
  }, [isPlaying, music.url]);

  const seekTo = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = ratio * duration;
    },
    [duration]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const t = audio.currentTime;
      setCurrentTime(t);
      updateCurrentLyric(t);
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentLyricIndex(-1);
    };
    const onError = () => {
      setLoadError(true);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [updateCurrentLyric]);

  const visibleLyrics = lyricsRef.current.length > 0
    ? [
        currentLyricIndex >= 0 ? { text: lyricsRef.current[currentLyricIndex].text, index: currentLyricIndex, active: true } : null,
        currentLyricIndex + 1 < lyricsRef.current.length ? { text: lyricsRef.current[currentLyricIndex + 1].text, index: currentLyricIndex + 1, active: false } : null,
      ].filter(Boolean)
    : [];

  return (
    <div className={styles.musicPlayer}>
      {music.url && <audio ref={audioRef} src={music.url} preload="metadata" />}

      <div className={styles.playerMain}>
        <div className={styles.playerLeft}>
          <div className={styles.playerCover}>
            {music.cover ? (
              <img src={music.cover} alt={music.title || "封面"} loading="lazy" />
            ) : (
              <div className={styles.coverPlaceholder}>
                <Icon icon="ri:music-2-fill" />
              </div>
            )}
          </div>
          {music.url && (
            <button className={styles.playBtn} onClick={togglePlay} aria-label={isPlaying ? "暂停" : "播放"}>
              <Icon icon={isPlaying ? "ri:pause-fill" : "ri:play-fill"} />
            </button>
          )}
        </div>

        <div className={styles.playerRight}>
          <div className={styles.playerInfo}>
            <span className={styles.trackName}>{music.title || "未知歌曲"}</span>
            <span className={styles.separator}>-</span>
            <span className={styles.trackArtist}>{music.author || "未知艺术家"}</span>
          </div>

          {visibleLyrics.length > 0 && (
            <div className={styles.playerLyrics}>
              {visibleLyrics.map((line) => (
                <div
                  key={line!.index}
                  className={`${styles.lyricLine} ${line!.active ? styles.lyricActive : styles.lyricNext}`}
                >
                  {line!.text}
                </div>
              ))}
            </div>
          )}

          {loadError && music.url ? (
            <div className={styles.playerStatus}>
              <Icon icon="ri:error-warning-line" />
              <span>音频加载失败</span>
            </div>
          ) : music.url ? (
            <div className={styles.playerProgress}>
              <div className={styles.progressBar} onClick={seekTo}>
                <div className={styles.progressPlayed} style={{ width: `${progress}%` }} />
              </div>
              <div className={styles.progressTime}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          ) : (
            <div className={styles.playerStatus}>
              <Icon icon="ri:music-line" />
              <span>暂无播放链接</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
