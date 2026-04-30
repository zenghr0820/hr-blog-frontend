/**
 * 新相关推荐组件 - 网格卡片布局
 * 采用 demo 中的设计风格，支持响应式网格
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ArticleLink } from "@/types/article";
import styles from "./PostRelatedPostsGrid.module.css";
import { Icon } from "@iconify/react";

interface PostRelatedPostsGridProps {
  articles?: ArticleLink[] | null;
  currentArticleId?: string | number;
  defaultCover?: string;
}

function getArticleHref(link: ArticleLink): string {
  // if (link.is_doc) {
  //   return `/doc/${link.id}`;
  // }
  return `/posts/${link.abbrlink || link.id}`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return dateString;
  }
}

interface RelatedPostCoverImageProps {
  coverUrl?: string;
  defaultCover: string;
  alt: string;
}

/**
 * 相关推荐封面：直接使用原始 URL，加载失败时回退到默认图。
 */
function RelatedPostCoverImage({ coverUrl, defaultCover, alt }: RelatedPostCoverImageProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const src = loadFailed || !coverUrl?.trim() ? defaultCover : coverUrl.trim();

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={styles.cover}
      loading="lazy"
      onError={() => setLoadFailed(true)}
    />
  );
}

export function PostRelatedPostsGrid({
  articles,
  currentArticleId,
  defaultCover = "/images/default-cover.webp",
}: PostRelatedPostsGridProps) {
  if (!articles || articles.length === 0) {
    return null;
  }

  const relatedPosts = articles.filter(article => String(article.id) !== String(currentArticleId));
  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className={styles.relatedPostsNew} aria-label="相关推荐">
      <div className={styles.headline}>
        <Icon icon="ri:thumb-up-fill" className={styles.headlineIcon} />
        <h3 className={styles.headlineTitle}>相关推荐</h3>
      </div>

      <div className={styles.list}>
        {relatedPosts.map(post => (
          <article key={post.id} className={styles.item}>
            <Link href={getArticleHref(post)} className={styles.itemLink} title={post.title}>
              <RelatedPostCoverImage coverUrl={post.cover_url} defaultCover={defaultCover} alt={post.title} />
              <div className={styles.content}>
                <div className={styles.date}>
                  <Icon icon="ri:calendar-todo-fill" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
                <div className={styles.title}>{post.title}</div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PostRelatedPostsGrid;
