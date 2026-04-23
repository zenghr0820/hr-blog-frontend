"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useMemo, useCallback, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { useSiteConfigStore } from "@/store/site-config-store";
import { scrollTo } from "@/store/scroll-store";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/date";
import { Icon } from "@iconify/react";
import type { FeedItem } from "@/types/article";
import styles from "./FeedArticleCardNew.module.css";

interface FeedArticleCardProps {
  article: FeedItem;
  isDoubleColumn?: boolean;
  isNewest?: boolean;
  animationOrder?: number;
}

const READ_ARTICLES_KEY = "read_articles";
const FALLBACK_COVER = "/images/default-cover.webp";

function checkIsRead(articleId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const readArticlesStr = localStorage.getItem(READ_ARTICLES_KEY);
    if (readArticlesStr) {
      const readArticles: string[] = JSON.parse(readArticlesStr);
      return readArticles.includes(articleId);
    }
  } catch {}
  return false;
}

export const FeedArticleCardNew = memo(function FeedArticleCardNew({
  article,
  isDoubleColumn = false,
  isNewest = false,
  animationOrder = 0,
}: FeedArticleCardProps) {
  const router = useRouter();
  const siteConfig = useSiteConfigStore(state => state.siteConfig);
  const [isRead, setIsRead] = useState(() => checkIsRead(article.id));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [useDefaultCover, setUseDefaultCover] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const isPinned = article.pin_sort != null && article.pin_sort > 0;
  const isHot = article.comment_count != null && article.comment_count > 10;

  const imgRefCallback = useCallback((node: HTMLImageElement | null) => {
    imgRef.current = node;
    if (node && node.complete && node.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, []);

  const coverUrl = useMemo(() => {
    if (useDefaultCover) return FALLBACK_COVER;
    return article.cover_url || siteConfig?.post?.default?.default_cover || FALLBACK_COVER;
  }, [article.cover_url, siteConfig, useDefaultCover]);

  const handleImageError = useCallback(() => {
    if (!useDefaultCover) {
      setUseDefaultCover(true);
    }
    setImageLoaded(true);
  }, [useDefaultCover]);

  const articleUrl = useMemo(() => {
    if (article.item_type === "product") return `/products/${article.id}`;
    if (article.is_doc) return `/doc/${article.id}`;
    return `/posts/${article.id}`;
  }, [article]);

  const handleClick = useCallback(() => {
    if (typeof window !== "undefined") {
      const readArticlesStr = localStorage.getItem(READ_ARTICLES_KEY);
      let readArticles: string[] = [];
      if (readArticlesStr) {
        readArticles = JSON.parse(readArticlesStr);
      }
      if (!readArticles.includes(article.id)) {
        readArticles.push(article.id);
        localStorage.setItem(READ_ARTICLES_KEY, JSON.stringify(readArticles));
        setIsRead(true);
      }
    }
    router.push(articleUrl);
  }, [article.id, articleUrl, router]);

  const goToCategoryPage = (e: React.MouseEvent, category: { name: string; slug?: string }) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/categories/${category.slug || encodeURIComponent(category.name)}/`);
    scrollTo(0, { immediate: true });
  };

  const goToTagPage = (e: React.MouseEvent, tag: { name: string; slug?: string }) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/tags/${tag.slug || encodeURIComponent(tag.name)}/`);
    scrollTo(0, { immediate: true });
  };

  const firstCategory = article.post_categories?.[0];

  const renderBadge = (className: string) => (
    <div className={className}>
      {isPinned && <span className={styles.badgeTop}>置顶</span>}
      {!isPinned && isHot && <span className={styles.badgeEssence}>热门</span>}
      {isNewest && !isPinned && !isHot && <span className={styles.badgeNewest}>最新</span>}
      {!isRead && !isPinned && !isHot && !isNewest && <span className={styles.badgeUnread}>未读</span>}
    </div>
  );

  const renderCover = () => (
    <img
      ref={imgRefCallback}
      className={cn(styles.postBg, imageLoaded ? styles.lazyLoaded : styles.lazyLoading)}
      src={coverUrl}
      alt={article.title}
      loading="lazy"
      onLoad={() => setImageLoaded(true)}
      onError={handleImageError}
    />
  );

  const renderMeta = (className: string) => (
    <div className={className}>
      <span className={styles.articleDate}>
        <Icon className={styles.metaIcon} icon="fa:calendar" />
        <span className={styles.articleMetaLabel}>发表于</span>
        <time dateTime={article.created_at}>{formatDate(article.created_at)}</time>
      </span>

      <span className={styles.articleMeta}>
        <Icon className={styles.metaIcon} icon="fa:history" />
        <span className={styles.articleMetaLabel}>修改于</span>
        <time dateTime={article.updated_at}>{formatDate(article.updated_at)}</time>
      </span>

      {firstCategory && (
        <span className={styles.articleMeta}>
          <Icon className={styles.metaIcon} icon="fa:inbox" />
          <a
            href={`/categories/${firstCategory.slug || encodeURIComponent(firstCategory.name)}/`}
            className={styles.articleMetaCategories}
            onClick={e => goToCategoryPage(e, firstCategory)}
          >
            {firstCategory.name}
          </a>
        </span>
      )}

      {article.post_tags && article.post_tags.length > 0 && (
        <span className={cn(styles.articleMeta, styles.tags)}>
          {article.post_tags.map((tag, index) => (
            <span key={tag.id}>
              {index > 0 && <span className={styles.articleMetaLink}>•</span>}
              <Icon className={styles.metaIcon} icon="fa:tag" />
              <a
                href={`/tags/${tag.slug || encodeURIComponent(tag.name)}/`}
                className={styles.articleMetaTags}
                onClick={e => goToTagPage(e, tag)}
              >
                {tag.name}
              </a>
            </span>
          ))}
        </span>
      )}

      {article.comment_count != null && article.comment_count > 0 && (
        <a
          className={cn(styles.articleMeta, styles.comments)}
          href={`${articleUrl}#post-comment`}
          onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`${articleUrl}#post-comment`); }}
        >
          <Icon className={styles.metaIcon} icon="fa:comments" />
          <span>{article.comment_count}条评论</span>
        </a>
      )}
    </div>
  );

  if (isDoubleColumn) {
    return (
      <div
        className={cn(styles.postItems)}
        style={{ "--animation-order": animationOrder } as React.CSSProperties}
      >
        {renderBadge(styles.postBadge)}
        <div className={styles.postCover}>
          <a href={articleUrl} onClick={e => { e.preventDefault(); handleClick(); }} title={article.title}>
            {renderCover()}
          </a>
        </div>
        <div className={styles.postInfo}>
          <a className={styles.articleTitle} href={articleUrl} onClick={e => { e.preventDefault(); handleClick(); }} title={article.title}>
            {article.title}
          </a>
          {renderMeta(styles.articleMetaWrap)}
          <div className={styles.postDesc}>
            {article.summaries || ""}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(styles.singleColumnItem)}
      style={{ "--animation-order": animationOrder } as React.CSSProperties}
    >
      <div className={styles.singleColumnInfo}>
        <a className={styles.singleColumnTitle} href={articleUrl} onClick={e => { e.preventDefault(); handleClick(); }} title={article.title}>
          {article.title}
        </a>
        {renderMeta(styles.singleColumnMeta)}
        <div className={styles.singleColumnDesc}>
          {article.summaries || ""}
        </div>
      </div>
      <div className={styles.singleColumnCover}>
        {renderBadge(styles.singleColumnBadge)}
        <a href={articleUrl} onClick={e => { e.preventDefault(); handleClick(); }} title={article.title}>
          {renderCover()}
        </a>
      </div>
    </div>
  );
});

FeedArticleCardNew.displayName = "FeedArticleCardNew";
