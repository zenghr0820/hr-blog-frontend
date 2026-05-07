"use client";

import { useState, useMemo } from "react";
import { FaFileLines, FaTriangleExclamation } from "react-icons/fa6";
import { useFeedList } from "@/hooks/queries";
import { useSiteConfigStore } from "@/store/site-config-store";
import { cn } from "@/lib/utils";
import { FeedArticleCardNew } from "./FeedArticleCardNew";
import { Pagination } from "../Pagination";
import styles from "./FeedArticleList.module.css";

interface FeedArticleListProps {
  category?: string;
  tag?: string;
  pageSize?: number;
}

const COLUMN_COUNT = 2;
const SKELETON_PER_COLUMN = 3;

export function FeedArticleList({ category, tag, pageSize: propPageSize }: FeedArticleListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const siteConfig = useSiteConfigStore(state => state.siteConfig);

  // 从配置读取是否双栏模式（默认为 true）
  const isDoubleColumn = useMemo(() => {
    const value = siteConfig?.post?.default?.double_column;
    // 如果没有配置，默认为 true
    if (value === undefined) return true;
    return value === true || value === "true";
  }, [siteConfig]);

  // 从配置读取每页数量
  const pageSize = useMemo(() => {
    return propPageSize || siteConfig?.post?.default?.page_size || 12;
  }, [propPageSize, siteConfig]);

  const { data, isLoading, isError } = useFeedList({
    page: currentPage,
    pageSize,
    category,
    tag,
  });

  const articles = useMemo(() => data?.list || [], [data]);
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const isNewest = (index: number) => currentPage === 1 && index === 0;

  // 将文章按行优先顺序分入各列：0→左列, 1→右列, 2→左列, 3→右列 ...
  const columns = useMemo(() => {
    if (!isDoubleColumn) return [articles];
    const cols: (typeof articles)[] = Array.from({ length: COLUMN_COUNT }, () => []);
    articles.forEach((article, index) => {
      cols[index % COLUMN_COUNT].push(article);
    });
    return cols;
  }, [articles, isDoubleColumn]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到文章列表顶部
    const element = document.querySelector(`.${styles.feedArticleList}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // 骨架屏卡片
  const renderSkeletonCard = (double: boolean) => (
    <div className={cn(styles.skeletonCard, double && styles.skeletonCardDouble)}>
      <div className={styles.skeletonCover} />
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonTags} />
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonMeta} />
      </div>
    </div>
  );

  // 加载状态 - 骨架屏
  if (isLoading) {
    return (
      <div className={styles.feedArticleList}>
        {isDoubleColumn ? (
          <div className={styles.doubleColumnContainer}>
            {Array.from({ length: COLUMN_COUNT }, (_, colIndex) => (
              <div key={colIndex} className={styles.doubleColumn}>
                {Array.from({ length: SKELETON_PER_COLUMN }, (_, i) => (
                  <div key={i}>{renderSkeletonCard(true)}</div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.articleList}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i}>{renderSkeletonCard(false)}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 错误状态
  if (isError) {
    return (
      <div className={styles.feedArticleList}>
        <div className={styles.errorState}>
          <FaTriangleExclamation aria-hidden="true" />
          <p>加载文章列表失败，请稍后重试</p>
        </div>
      </div>
    );
  }

  // 空状态
  if (articles.length === 0) {
    return (
      <div className={styles.feedArticleList}>
        <div className={styles.emptyState}>
          <FaFileLines aria-hidden="true" />
          <p>暂无文章</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.feedArticleList}>
      {/* 文章列表 */}
      {isDoubleColumn ? (
        <div className={styles.doubleColumnContainer}>
          {columns.map((col, colIndex) => (
            <div key={colIndex} className={styles.doubleColumn}>
              {col.map((article, index) => {
                // 还原原始索引：第 colIndex 列中第 index 个元素 = index * COLUMN_COUNT + colIndex
                const originalIndex = index * COLUMN_COUNT + colIndex;
                return (
                  <FeedArticleCardNew
                    key={article.id}
                    article={article}
                    isDoubleColumn={isDoubleColumn}
                    isNewest={isNewest(originalIndex)}
                    animationOrder={originalIndex}
                  />
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.articleList}>
          {articles.map((article, index) => (
            <FeedArticleCardNew
              key={article.id}
              article={article}
              isDoubleColumn={isDoubleColumn}
              isNewest={isNewest(index)}
              animationOrder={index}
            />
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
}
