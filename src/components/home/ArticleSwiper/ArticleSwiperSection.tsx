"use client";

import { useMemo } from "react";
import { useFeedList } from "@/hooks/queries";
import { ArticleSwiper } from "./ArticleSwiper";

const SWIPER_PAGE_SIZE = 7;

export function ArticleSwiperSection() {
  const { data } = useFeedList({ page: 1, pageSize: SWIPER_PAGE_SIZE });

  const articles = useMemo(() => data?.list || [], [data]);

  if (articles.length === 0) return null;

  return <ArticleSwiper articles={articles} />;
}
