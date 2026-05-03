/**
 * 文章详情页侧边栏组件
 * 包含：作者信息卡片、微信卡片、目录、系列文章、最近文章
 */
"use client";

import { useMemo, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useShallow } from "zustand/shallow";
import { AuthorInfoCardCur } from "@/components/home/Sidebar/AuthorInfoCardCur";
import { CardWechat } from "@/components/home/Sidebar/CardWechat";
import { CardClock } from "@/components/home/Sidebar/CardClock";
import { CustomSidebarBlocks } from "@/components/home/Sidebar/CustomSidebarBlocks";
import { CardToc } from "./CardToc";
import { CardSeriesPost } from "./CardSeriesPost";
import { CardRecentPost } from "./CardRecentPost";
import { useSiteConfigStore } from "@/store/site-config-store";
import { useCategories, useTags } from "@/hooks/queries/use-articles";
import { resolvePostDefaultCoverUrl } from "@/utils/same-origin-media-url";
import type { Article, RecentArticle } from "@/types/article";
import styles from "./PostSidebar.module.css";

const CardPoem = dynamic(() => import("@/components/home/Sidebar/CardPoem").then(m => m.CardPoem), {
  ssr: false,
});

interface PostSidebarProps {
  article: Article;
  recentArticles?: RecentArticle[];
}

export function PostSidebar({ article, recentArticles = [] }: PostSidebarProps) {
  const {
    sidebarAuthor,
    frontDeskSiteOwner,
    subTitle,
    userAvatar,
    sidebarWechat,
    sidebarWeather,
    siteOwnerRectangle,
    postDefaultCover,
    sidebarRecentPost,
    sidebarToc,
    sidebarPoem,
  } = useSiteConfigStore(
    useShallow(s => ({
      sidebarAuthor: s.siteConfig?.sidebar?.author,
      frontDeskSiteOwner: s.siteConfig?.frontDesk?.siteOwner,
      subTitle: s.siteConfig?.SUB_TITLE,
      userAvatar: s.siteConfig?.USER_AVATAR,
      sidebarWechat: s.siteConfig?.sidebar?.wechat,
      sidebarWeather: s.siteConfig?.sidebar?.weather,
      siteOwnerRectangle: s.siteConfig?.site?.owner?.rectangle,
      postDefaultCover: s.siteConfig?.post?.default?.default_cover,
      sidebarRecentPost: s.siteConfig?.sidebar?.recentPost,
      sidebarToc: s.siteConfig?.sidebar?.toc,
      sidebarPoem: s.siteConfig?.sidebar?.poem,
    }))
  );
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // 提取系列分类
  const seriesCategory = useMemo(() => {
    if (!article.post_categories) return null;
    const found = article.post_categories.find(cat => cat.is_series);
    if (!found) return null;
    return {
      id: found.id,
      name: found.name,
      is_series: found.is_series || false,
    };
  }, [article.post_categories]);

  // 提取系列文章（从相关文章中筛选同系列的）
  const seriesArticles = useMemo(() => {
    if (!seriesCategory || !article.related_articles) return [];
    return article.related_articles.map(art => ({
      id: art.id,
      title: art.title,
      abbrlink: art.abbrlink || "",
      cover_url: art.cover_url,
      created_at: art.created_at,
    }));
  }, [seriesCategory, article.related_articles]);

  // 作者信息配置 - 从 sidebar.author 获取
  const authorInfoConfig = useMemo(() => {
    if (!sidebarAuthor?.enable) return null;
    return {
      ownerName: frontDeskSiteOwner?.name || "Zenghr",
      subTitle: subTitle || "",
      description: sidebarAuthor.description || "",
      userAvatar: userAvatar || "",
      statusImg: sidebarAuthor.statusImg || "",
      skills: sidebarAuthor.skills || [],
      social: sidebarAuthor.social || {},
      totalPostCount: 0,
      totalCategoryCount: mounted ? (categories?.length || 0) : 0,
      totalTagCount: mounted ? (tags?.length || 0) : 0,
    };
  }, [sidebarAuthor, frontDeskSiteOwner, subTitle, userAvatar, categories, tags, mounted]);

  // 微信配置 - 从 sidebar.wechat 获取
  const wechatConfig = useMemo(() => {
    if (!sidebarWechat?.enable) return null;
    return {
      face: sidebarWechat.face || "",
      backFace: sidebarWechat.backFace || "",
      blurBackground: sidebarWechat.blurBackground || "",
      link: sidebarWechat.link,
    };
  }, [sidebarWechat]);

  // 天气时钟配置 - enable_page 为 "all" 或 "post" 时在文章页显示
  const ownerRectangleValue = siteOwnerRectangle || "112.6534116,27.96920845";

  const clockConfig = useMemo(() => {
    if (!sidebarWeather?.enable || !sidebarWeather.qweather_key) return null;
    const page = sidebarWeather.enable_page || "all";
    if (page !== "all" && page !== "post") return null;
    return {
      qweatherKey: sidebarWeather.qweather_key,
      qweatherAPIHost: sidebarWeather.qweather_api_host || "devapi.qweather.com",
      ipAPIKey: sidebarWeather.ip_api_key || "",
      loading: sidebarWeather.loading || "",
      defaultRectangle: sidebarWeather.default_rectangle === true || (sidebarWeather.default_rectangle as unknown) === "true",
      rectangle: ownerRectangleValue,
    };
  }, [sidebarWeather, ownerRectangleValue]);

  // 默认封面（与文章详情页一致：后台配置 + 同源压缩 + 内置占位）
  const defaultCover = useMemo(
    () => resolvePostDefaultCoverUrl(postDefaultCover),
    [postDefaultCover]
  );

  const currentArticleId = article.id;

  const recentPostCount = useMemo(() => {
    const raw = sidebarRecentPost?.count;
    const parsed = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(parsed)) return 5;
    return Math.min(20, Math.max(1, Math.trunc(parsed)));
  }, [sidebarRecentPost]);

  const tocCollapseMode = useMemo(() => {
    const val = sidebarToc?.collapseMode;
    return val === true || val === "true";
  }, [sidebarToc]);

  const poemEnabled = useMemo(() => {
    const val = sidebarPoem?.enable;
    return val === true || val === "true";
  }, [sidebarPoem]);

  return (
    <aside id="post-sidebar" className={styles.postSidebar}>
      {/* 作者信息卡片 */}
      {authorInfoConfig && <AuthorInfoCardCur config={authorInfoConfig} />}

      {/* 微信卡片 */}
      {wechatConfig && <CardWechat config={wechatConfig} />}

      {/* 自定义侧边栏块 */}
      <CustomSidebarBlocks isPostPage />

      {/* 今日诗词 */}
      {poemEnabled && <CardPoem />}

      {/* 天气时钟 */}
      {clockConfig && <CardClock config={clockConfig} />}

      {/* 粘性区域 */}
      <div className={styles.stickyContainer}>
        {/* 系列文章 */}
        {seriesCategory && seriesArticles.length > 0 && (
          <CardSeriesPost
            seriesArticles={seriesArticles}
            seriesCategory={seriesCategory}
            currentArticleId={currentArticleId}
            defaultCover={defaultCover}
          />
        )}

        {/* 文章目录 */}
        {article.content_html && <CardToc contentHtml={article.content_html} collapseMode={tocCollapseMode} />}

        {/* 最近发布 */}
        {sidebarRecentPost?.enable !== false &&
          sidebarRecentPost?.enable !== "false" &&
          recentArticles.length > 0 && (
            <CardRecentPost
              articles={recentArticles}
              currentArticleId={currentArticleId}
              defaultCover={defaultCover}
              maxCount={recentPostCount}
            />
          )}
      </div>
    </aside>
  );
}

// 导出子组件
export { CardToc } from "./CardToc";
export { CardSeriesPost } from "./CardSeriesPost";
export { CardRecentPost } from "./CardRecentPost";

export default PostSidebar;
