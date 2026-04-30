/**
 * 新的文章上下篇导航组件
 * 采用 demo 中的设计风格，带封面图覆盖效果
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ArticleLink } from "@/types/article";
import styles from "./PostPaginationNew.module.css";

interface PostPaginationNewProps {
  prevArticle?: ArticleLink | null;
  nextArticle?: ArticleLink | null;
  defaultCover?: string;
}

function getArticleHref(link: ArticleLink): string {
  // if (link.is_doc) {
  //   return `/doc/${link.id}`;
  // }
  return `/posts/${link.abbrlink || link.id}`;
}

interface PaginationCoverImageProps {
  coverUrl?: string;
  defaultCover: string;
  alt: string;
}

/**
 * 上下篇封面图：加载失败时回退到默认图
 */
function PaginationCoverImage({ coverUrl, defaultCover, alt }: PaginationCoverImageProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const src = loadFailed || !coverUrl?.trim() ? defaultCover : coverUrl.trim();

  return (
    <Image
      src={src}
      className={styles.cover}
      alt={alt}
      fill
      loading="lazy"
      onError={() => setLoadFailed(true)}
    />
  );
}

export function PostPaginationNew({
  prevArticle,
  nextArticle,
  defaultCover = "/images/default-cover.webp",
}: PostPaginationNewProps) {
  if (!prevArticle && !nextArticle) {
    return null;
  }

  // 判断是否只有一个文章（上篇或下篇）
  const hasOnlyOne = (prevArticle && !nextArticle) || (!prevArticle && nextArticle);

  return (
    <nav className={styles.paginationPostNew} id="pagination">
      {prevArticle && (
        <Link
          href={getArticleHref(prevArticle)}
          className={`${styles.prevPost} ${hasOnlyOne ? styles.pullFull : ""}`}
          title={prevArticle.title}
        >
          <PaginationCoverImage
            coverUrl={prevArticle.cover_url}
            defaultCover={defaultCover}
            alt="cover of previous post"
          />
          <div className={styles.paginationInfo}>
            <div className={styles.label}>上一篇</div>
            <div className={styles.prevInfo}>{prevArticle.title}</div>
          </div>
        </Link>
      )}

      {nextArticle && (
        <Link
          href={getArticleHref(nextArticle)}
          className={`${styles.nextPost} ${hasOnlyOne ? styles.pullFull : ""}`}
          title={nextArticle.title}
        >
          <PaginationCoverImage
            coverUrl={nextArticle.cover_url}
            defaultCover={defaultCover}
            alt="cover of next post"
          />
          <div className={styles.paginationInfo}>
            <div className={styles.label}>下一篇</div>
            <div className={styles.nextInfo}>{nextArticle.title}</div>
          </div>
        </Link>
      )}
    </nav>
  );
}

export default PostPaginationNew;
