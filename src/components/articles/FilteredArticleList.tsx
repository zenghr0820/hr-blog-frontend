"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FaFileLines, FaTriangleExclamation } from "react-icons/fa6";
import { useFeedList } from "@/hooks/queries";
import { useSiteConfigStore } from "@/store/site-config-store";
import { FeedArticleCardNew } from "@/components/home/FeedArticleList/FeedArticleCardNew";
import { Pagination } from "@/components/home";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/types/article";
import styles from "@/components/home/FeedArticleList/FeedArticleList.module.css";

type FilterType = "category" | "tag";

const COLUMN_COUNT = 2;

interface FilteredArticleListProps {
  filterType: FilterType;
  filterValue: string;
  page?: number;
  onPageChange?: (nextPage: number) => void;
}

function buildFilteredPath(filterType: FilterType, filterValue: string, page: number) {
  const encodedValue = encodeURIComponent(filterValue);
  if (page <= 1) {
    return `/${filterType === "category" ? "categories" : "tags"}/${encodedValue}/`;
  }
  return `/${filterType === "category" ? "categories" : "tags"}/${encodedValue}/page/${page}`;
}

export function FilteredArticleList({ filterType, filterValue, page = 1, onPageChange }: FilteredArticleListProps) {
  const router = useRouter();
  const siteConfig = useSiteConfigStore(state => state.siteConfig);

  const isDoubleColumn = useMemo(() => {
    const value = siteConfig?.post?.default?.double_column;
    if (value === undefined) return true;
    return value === true || value === "true";
  }, [siteConfig]);

  const pageSize = useMemo(() => {
    return siteConfig?.post?.default?.page_size || 12;
  }, [siteConfig]);

  const queryParams = useMemo(() => {
    return filterType === "category" ? { page, pageSize, category: filterValue } : { page, pageSize, tag: filterValue };
  }, [filterType, filterValue, page, pageSize]);

  const { data, isLoading, isError } = useFeedList(queryParams);
  const feedItems = useMemo(() => data?.list || [], [data]);
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const isNewest = (index: number) => page === 1 && index === 0;

  const columns = useMemo(() => {
    if (!isDoubleColumn) return [feedItems.map((article, index) => ({ article, originalIndex: index }))];
    const cols: { article: FeedItem; originalIndex: number }[][] = Array.from({ length: COLUMN_COUNT }, () => []);
    feedItems.forEach((article, index) => {
      cols[index % COLUMN_COUNT].push({ article, originalIndex: index });
    });
    return cols;
  }, [feedItems, isDoubleColumn]);
  const listStateClassName = cn(
    styles.feedArticleList,
    (isLoading || isError || feedItems.length === 0) && styles.feedArticleListStable
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (onPageChange) {
        onPageChange(nextPage);
      } else {
        const path = buildFilteredPath(filterType, filterValue, nextPage);
        router.push(path);
      }
      const element = document.querySelector(`.${styles.feedArticleList}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [filterType, filterValue, router, onPageChange]
  );

  if (isLoading) {
    return (
      <div className={listStateClassName}>
        {isDoubleColumn ? (
          <div className={styles.doubleColumnContainer}>
            {Array.from({ length: COLUMN_COUNT }, (_, colIndex) => (
              <div key={colIndex} className={styles.doubleColumn}>
                {Array.from({ length: 3 }, (_, i) => (
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

  if (isError) {
    return (
      <div className={listStateClassName}>
        <div className={styles.errorState}>
          <FaTriangleExclamation aria-hidden="true" />
          <p>加载文章列表失败，请稍后重试</p>
        </div>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className={listStateClassName}>
        <div className={styles.emptyState}>
          <FaFileLines aria-hidden="true" />
          <p>暂无文章</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.feedArticleList}>
      {isDoubleColumn ? (
        <div className={styles.doubleColumnContainer}>
          {columns.map((col, colIndex) => (
            <div key={colIndex} className={styles.doubleColumn}>
              {col.map((item) => (
                <div
                  key={item.article.id}
                  className={styles.cardWrapper}
                  style={{ "--card-order": item.originalIndex } as React.CSSProperties}
                >
                  <FeedArticleCardNew
                    article={item.article}
                    isDoubleColumn={isDoubleColumn}
                    isNewest={isNewest(item.originalIndex)}
                    animationOrder={item.originalIndex}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.articleList}>
          {feedItems.map((article, index) => (
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

      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />}
    </div>
  );
}

function renderSkeletonCard(double: boolean) {
  return (
    <div className={cn(styles.skeletonCard, double && styles.skeletonCardDouble)}>
      <div className={styles.skeletonCover} />
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonTags} />
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonMeta} />
      </div>
    </div>
  );
}
