/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import { BannerCard } from "@/components/common/BannerCard";
import { Spinner } from "@/components/ui";
import { useSiteConfigStore } from "@/store/site-config-store";
import { extractBannerConfig, getDefaultBannerConfig } from "@/lib/banner-config";
import { fcircleApi } from "@/lib/api/fcircle";
import type { FCircleMoment, FCircleStatistics, LinkInfo } from "@/types/fcircle";
import { CommentSection } from "@/components/post/Comment";
import styles from "../_styles/fcircle.module.scss";

interface LinkArticle {
  post_title: string;
  post_url: string;
  published_at: string;
}

interface FishingLevel {
  level: number;
  title: string;
  minClicks: number;
}

const FISHING_LEVELS: FishingLevel[] = [
  { level: 1, title: "钓鱼新手", minClicks: 0 },
  { level: 5, title: "钓鱼学徒", minClicks: 5 },
  { level: 10, title: "钓鱼达人", minClicks: 20 },
  { level: 20, title: "钓鱼高手", minClicks: 50 },
  { level: 30, title: "钓鱼专家", minClicks: 100 },
  { level: 45, title: "钓鱼大师", minClicks: 200 },
  { level: 60, title: "钓鱼宗师", minClicks: 500 },
  { level: 80, title: "钓鱼王者", minClicks: 1000 },
];

const FISHING_PREFIXES = [
  "为了抗议世间的不公，割破手指写下了",
  "在月黑风高的夜晚，悄悄写下",
  "冒着被追杀的风险，偷偷记录下",
  "经过七七四十九天的煎熬，终于悟出",
  "在历经九九八十一难后，挥泪写下",
  "趁着夜深人静，偷偷爬起来记下",
  "顶着被发现的巨大压力，含泪写下",
  "冒着掉发的风险，深夜敲下",
  "在经历了无数次失败后，终于顿悟出",
  "顶着熊猫眼的代价，执着地写下",
];

function getRandomFishingPrefix(): string {
  const index = Math.floor(Math.random() * FISHING_PREFIXES.length);
  return FISHING_PREFIXES[index];
}

const STORAGE_KEY = "fcircle_fishing_data";
const ANTI_SPAM_WINDOW_MS = 10000;
const ANTI_SPAM_TRIGGER_COUNT = 3;
const ANTI_SPAM_COOLDOWN_MS = 5000;

interface FishingData {
  totalClicks: number;
  lastClickTimes: number[];
  fishingPrefix?: string;
}

function getFishingLevel(totalClicks: number): FishingLevel {
  let currentLevel = FISHING_LEVELS[0];
  for (const level of FISHING_LEVELS) {
    if (totalClicks >= level.minClicks) {
      currentLevel = level;
    } else {
      break;
    }
  }
  return currentLevel;
}

function loadFishingData(): FishingData {
  if (typeof window === "undefined") {
    return { totalClicks: 0, lastClickTimes: [] };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return { totalClicks: 0, lastClickTimes: [] };
}

function saveFishingData(data: FishingData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function FcirclePageClient() {
  const [moments, setMoments] = useState<FCircleMoment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedLink, setSelectedLink] = useState<number | null>(null);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupLink, setPopupLink] = useState<LinkInfo | null>(null);
  const [linkArticles, setLinkArticles] = useState<LinkArticle[]>([]);
  const [linkArticlesLoading, setLinkArticlesLoading] = useState(false);

  const [randomPost, setRandomPost] = useState<FCircleMoment | null>(null);
  const [isFishing, setIsFishing] = useState(false);
  const [fishingLevel, setFishingLevel] = useState<FishingLevel>(FISHING_LEVELS[0]);
  const [isCooldown, setIsCooldown] = useState(false);
  const [statistics, setStatistics] = useState<FCircleStatistics | null>(null);

  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const selectedLinkRef = useRef<number | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimesRef = useRef<number[]>([]);

  const siteConfig = useSiteConfigStore(state => state.siteConfig);

  // 使用统一的 Banner 配置提取器
  const bannerConfig = extractBannerConfig(siteConfig, 'test');
  const defaultConfig = getDefaultBannerConfig('fcircle');

  useEffect(() => {
    const data = loadFishingData();
    const level = getFishingLevel(data.totalClicks);
    setFishingLevel(level);
    clickTimesRef.current = data.lastClickTimes;
  }, []);

  useEffect(() => {
    selectedLinkRef.current = selectedLink;
  }, [selectedLink]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const fetchMoments = useCallback(async (currentPage: number, isRefresh = false) => {
    if (loadingRef.current || (!hasMoreRef.current && !isRefresh)) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const pageSize = 12;
      const data = await fcircleApi.getMoments({
        page: currentPage,
        page_size: pageSize,
        link_id: selectedLinkRef.current ?? undefined,
      });

      if (isRefresh) {
        setMoments(data.list);
      } else {
        setMoments((prev) => [...prev, ...data.list]);
      }

      const totalPages = Math.ceil(data.total / pageSize);
      setHasMore(currentPage < totalPages);
      setPage(currentPage);
    } catch (err) {
      setError("获取动态失败，请稍后重试");
      console.error("Failed to fetch moments:", err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchMoments(1, true);
  }, [fetchMoments]);

  const handleLoadMore = useCallback(() => {
    if (!loadingRef.current && hasMoreRef.current) {
      fetchMoments(page + 1);
    }
  }, [page, fetchMoments]);

  useEffect(() => {
    fetchMoments(1, true);
  }, [selectedLink, fetchMoments]);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const stats = await fcircleApi.getStatistics();
        setStatistics(stats);
      } catch (err) {
        console.error("Failed to fetch statistics:", err);
      }
    };
    fetchStatistics();
  }, []);

  const handleManualRefresh = async () => {
    try {
      await fcircleApi.refreshMoments();
      handleRefresh();
    } catch (err) {
      setError("刷新失败，请稍后重试");
      console.error("Failed to refresh moments:", err);
    }
  };

  const fetchLinkArticles = async (linkId: number) => {
    setLinkArticlesLoading(true);
    try {
      const data = await fcircleApi.getMomentsByLinkID(linkId, { page: 1, page_size: 5 });
      setLinkArticles(
        data.list.map((m) => ({
          post_title: m.post_title,
          post_url: m.post_url,
          published_at: m.published_at,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch link articles:", err);
      setLinkArticles([]);
    } finally {
      setLinkArticlesLoading(false);
    }
  };

  const handleAuthorClick = async (link: LinkInfo) => {
    setPopupLink(link);
    setPopupVisible(true);
    await fetchLinkArticles(link.id);
  };

  const closePopup = () => {
    setPopupVisible(false);
    setPopupLink(null);
    setLinkArticles([]);
  };

  const triggerCooldown = useCallback(() => {
    setIsCooldown(true);
    setIsFishing(false);
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = setTimeout(() => {
      setIsCooldown(false);
      cooldownTimerRef.current = null;
    }, ANTI_SPAM_COOLDOWN_MS);
  }, []);

  const handleFishing = async () => {
    if (isFishing) {
      return;
    }

    if (isCooldown) {
      return;
    }

    const now = Date.now();
    clickTimesRef.current.push(now);

    clickTimesRef.current = clickTimesRef.current.filter((t) => now - t < ANTI_SPAM_WINDOW_MS);

    if (clickTimesRef.current.length >= ANTI_SPAM_TRIGGER_COUNT) {
      clickTimesRef.current = [];
      triggerCooldown();
      return;
    }

    const data = loadFishingData();
    data.totalClicks += 1;
    data.lastClickTimes = clickTimesRef.current;
    const fishingPrefix = getRandomFishingPrefix();
    data.fishingPrefix = fishingPrefix;
    saveFishingData(data);

    const level = getFishingLevel(data.totalClicks);
    setFishingLevel(level);

    setIsFishing(true);
    try {
      const moment = await fcircleApi.getRandomPost();
      setTimeout(() => {
        setRandomPost({ ...moment, fishingPrefix });
        setIsFishing(false);
      }, 500);
    } catch (err) {
      console.error("Failed to fishing:", err);
      setTimeout(() => {
        setRandomPost(null);
        setIsFishing(false);
      }, 500);
    }
  };

  return (
    <>
      <div className={`cardWidget ${styles.fcircle}`}>

        <BannerCard
            tips={bannerConfig.tips || defaultConfig.tips}
            title={bannerConfig.title || defaultConfig.title}
            description={bannerConfig.description || defaultConfig.description}
            backgroundImage={bannerConfig.backgroundImage}
            height={300}
        />

        <div className={styles.momentsList}>
          <div className={styles.randomPostContainer}>
            <div className={styles.titleSection}>
              <div className={styles.titleLeft}>
                <h2>🎣 钓鱼</h2>
                <button
                  type="button"
                  aria-label="刷新钓鱼文章"
                  className={`${styles.randomPostStart} ${isFishing ? styles.opacity : ""}`}
                  onClick={handleFishing}
                  disabled={isFishing}
                >
                  <Icon icon="ri:refresh-line" width={20} height={20} />
                </button>
              </div>
              <div className={styles.titleRight}>
                <button
                  type="button"
                  className={styles.randomPostAll}
                  onClick={() => {
                    window.location.href = "/link";
                  }}
                >
                  全部友链
                </button>
              </div>
            </div>
            <div id="random-post" className={styles.randomPostContent}>
              {isCooldown ? (
                <div>
                  因为只钓鱼不吃鱼，过分饥饿导致本次钓鱼失败...(点击任意一篇钓鱼获得的文章即可恢复）
                </div>
              ) : isFishing ? (
                <div>
                  钓鱼中... （Lv.{fishingLevel.level} 当前称号：{fishingLevel.title}）
                </div>
              ) : randomPost ? (
                <div>
                  {randomPost.fishingPrefix || "为了抗议世间的不公，割破手指写下了"} 来自友链{" "}
                  <b>{randomPost.link.name}</b> 的文章：
                  <a
                    className={styles.randomFriendsPost}
                    target="_blank"
                    href={randomPost.post_url}
                    rel="external nofollow"
                  >
                    {randomPost.post_title}
                  </a>
                </div>
              ) : (
                <div>
                  因为只钓鱼不吃鱼，过分饥饿导致本次钓鱼失败...(点击任意一篇钓鱼获得的文章即可恢复）
                </div>
              )}
            </div>
          </div>

          <div className={styles.titleSection}>
            <div className={styles.titleLeft}>
              <h2>🐟 朋友圈</h2>
            </div>
          </div>

          <div className={styles.momentsGrid}>
            {moments.map((moment) => (
              <div key={moment.id} className={styles.momentItem}>
                <div className={styles.momentCard}>
                  <a
                    className={styles.momentTitle}
                    href={moment.post_url}
                    target="_blank"
                    rel="noopener nofollow"
                    title={moment.post_title}
                  >
                    {moment.post_title}
                  </a>
                  <div className={styles.momentSummary}>{moment.post_summary}</div>
                  <div className={styles.momentBottom}>
                    {moment.link.logo ? (
                      <Image
                        src={moment.link.logo}
                        alt={moment.link.name}
                        width={24}
                        height={24}
                        className={styles.momentAvatar}
                        unoptimized
                      />
                    ) : (
                      <div className={styles.momentAvatarPlaceholder}>
                        {moment.link.name[0]}
                      </div>
                    )}
                    <button
                      type="button"
                      className={styles.momentAuthor}
                      aria-label={`查看 ${moment.link.name} 更多文章`}
                      onClick={() => handleAuthorClick(moment.link)}
                    >
                      {moment.link.name}
                    </button>
                    <span className={styles.momentTime}>
                      <Icon icon="ri:time-fill" width={12} height={12} />
                      {formatTime(moment.published_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {hasMore && moments.length > 0 && (
            <div className={styles.momentsMoreContainer}>
              <button
                type="button"
                className={styles.momentsMoreBtn}
                onClick={handleLoadMore}
                disabled={loading}
              >
                <Icon icon="ri:arrow-down-s-line" width={18} height={18} />
              </button>
            </div>
          )}

          <div className={styles.momentsFooter}>
            <div className={styles.footerContent}>
              <div className={styles.footerInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>订阅</span>
                  <span className={styles.value}>{statistics?.active_links || 0}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>活跃</span>
                  <span className={styles.value}>{statistics?.active_links || 0}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>日志</span>
                  <span className={styles.value}>{statistics?.total_articles || 0}</span>
                </div>
              </div>
              <div className={styles.footerSetting}>
                <span className={styles.updateTime}>更新于：{statistics?.last_updated_at || "暂无更新"}</span>
              </div>
            </div>
          </div>
          </div>

          {loading && !refreshing && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingIcon}>
                <Icon icon="ri:loader-4-line" width={24} height={24} />
              </div>
            </div>
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}

          {!loading && !hasMore && moments.length > 0 && (
            <div className={styles.noMore}>没有更多动态了</div>
          )}

          {!loading && moments.length === 0 && !error && (
            <div className={styles.emptyData}>暂无动态</div>
          )}

          
        </div>
      
        {/* 评论区 */}
        <CommentSection targetTitle="朋友圈" targetPath="/fcircle" />
      </div>

      {popupVisible && (
        <>
          <div className={styles.momentOverlay} onClick={closePopup}></div>
          <div className={styles.momentPopup}>
            <div className={styles.popupContent}>
              <div className={styles.popupHeader}>
                {popupLink?.logo ? (
                  <Image
                    src={popupLink.logo}
                    alt={popupLink.name}
                    width={40}
                    height={40}
                    className={styles.popupAvatar}
                    unoptimized
                  />
                ) : (
                  <div className={styles.popupAvatarPlaceholder}>
                    {popupLink?.name[0]}
                  </div>
                )}
                <a href={popupLink?.url} target="_blank" rel="noopener nofollow">
                  {popupLink?.name}
                </a>
              </div>
              <div className={styles.popupBody}>
                {linkArticlesLoading ? (
                  <div className={styles.popupEmpty}>
                    <p>加载中...</p>
                  </div>
                ) : linkArticles.length > 0 ? (
                  linkArticles.map((article, index) => (
                    <div
                      key={index}
                      className={`${styles.popupArticleItem} ${index === linkArticles.length - 1 ? "is-last" : ""}`}
                    >
                      <a
                        className={styles.popupArticleTitle}
                        href={article.post_url}
                        target="_blank"
                        rel="noopener nofollow"
                        data-title={article.post_title}
                      >
                        {article.post_title}
                      </a>
                      <div className={styles.popupArticleMeta}>
                        <Icon icon="ri:time-fill" width={12} height={12} />
                        <span className={styles.popupArticleTime}>{formatTime(article.published_at)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.popupEmpty}>
                    <p>暂无文章</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

    </>
  );
}
