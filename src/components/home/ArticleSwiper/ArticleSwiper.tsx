"use client";

import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-media-query";
import { useSiteConfigStore } from "@/store/site-config-store";
import { formatDate } from "@/utils/date";
import type { FeedItem } from "@/types/article";
import styles from "./ArticleSwiper.module.css";

interface ArticleSwiperProps {
  articles: FeedItem[];
  autoPlayInterval?: number;
}

const FALLBACK_COVER = "/images/default-cover.webp";

function getSlideVariants(isMobile: boolean) {
  const axis = isMobile ? "x" : "y";
  return {
    enter: (direction: number) => ({
      opacity: 0,
      [axis]: direction > 0 ? 40 : -40,
    }),
    center: {
      opacity: 1,
      [axis]: 0,
    },
    exit: (direction: number) => ({
      opacity: 0,
      [axis]: direction > 0 ? -40 : 40,
    }),
  };
}

export const ArticleSwiper = memo(function ArticleSwiper({
  articles,
  autoPlayInterval = 3000,
}: ArticleSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const [useDefaultCover, setUseDefaultCover] = useState<Record<string, boolean>>({});
  const [layerASrc, setLayerASrc] = useState("");
  const [layerBSrc, setLayerBSrc] = useState("");
  const [activeLayer, setActiveLayer] = useState<"A" | "B">("A");
  const pendingUrlRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMobile = useIsMobile();
  const siteConfig = useSiteConfigStore(state => state.siteConfig);

  const total = articles.length;

  const defaultCover = useMemo(
    () => siteConfig?.post?.default?.default_cover || FALLBACK_COVER,
    [siteConfig]
  );

  const getCoverUrl = useCallback(
    (article: FeedItem) => {
      if (useDefaultCover[article.id]) return defaultCover;
      return article.cover_url || defaultCover;
    },
    [useDefaultCover, defaultCover]
  );

  const handleImageError = useCallback((articleId: string) => {
    setUseDefaultCover(prev => ({ ...prev, [articleId]: true }));
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex]
  );

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (!articles || articles.length === 0) return;
    const newUrl = getCoverUrl(articles[currentIndex]);
    pendingUrlRef.current = newUrl;

    const currentSrc = activeLayer === "A" ? layerASrc : layerBSrc;
    if (!currentSrc) {
      setLayerASrc(newUrl);
      return;
    }
    if (newUrl === currentSrc) return;

    const targetLayer: "A" | "B" = activeLayer === "A" ? "B" : "A";
    const setTargetSrc = targetLayer === "A" ? setLayerASrc : setLayerBSrc;

    const img = new Image();
    const apply = () => {
      if (pendingUrlRef.current !== newUrl) return;
      setTargetSrc(newUrl);
      setActiveLayer(targetLayer);
    };
    img.onload = apply;
    img.onerror = apply;
    img.src = newUrl;
  }, [currentIndex, articles, getCoverUrl, activeLayer, layerASrc, layerBSrc]);

  useEffect(() => {
    if (isPaused || total <= 1) return;

    timerRef.current = setInterval(goNext, autoPlayInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, autoPlayInterval, goNext, total]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number; y: number } }) => {
      if (isMobile) {
        if (info.offset.x < -50) goNext();
        else if (info.offset.x > 50) goPrev();
      } else {
        if (info.offset.y < -50) goNext();
        else if (info.offset.y > 50) goPrev();
      }
    },
    [goNext, goPrev, isMobile]
  );

  if (!articles || articles.length === 0) return null;

  const currentArticle = articles[currentIndex];

  return (
    <div
      className={styles.swiper}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.slide}>
        <Link href={`/posts/${currentArticle.id}`} className={styles.imageArea}>
          {layerASrc && (
            <img
              src={layerASrc}
              alt=""
              className={`${styles.imageLayer} ${activeLayer === "A" ? styles.imageLayerActive : ""}`}
              onError={() => handleImageError(currentArticle.id)}
            />
          )}
          {layerBSrc && (
            <img
              src={layerBSrc}
              alt=""
              className={`${styles.imageLayer} ${activeLayer === "B" ? styles.imageLayerActive : ""}`}
              onError={() => handleImageError(currentArticle.id)}
            />
          )}
        </Link>

        <motion.div
          className={styles.content}
          drag={isMobile ? "x" : "y"}
          dragConstraints={isMobile ? { left: 0, right: 0 } : { top: 0, bottom: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={getSlideVariants(isMobile)}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={styles.contentInner}
            >
              <motion.div
                initial={{ opacity: 0, [isMobile ? "x" : "y"]: 12 }}
                animate={{ opacity: 1, [isMobile ? "x" : "y"]: 0 }}
                transition={{ delay: 0.05, duration: 0.25, ease: "easeOut" }}
              >
                <Link href={`/posts/${currentArticle.id}`} className={styles.title} title={currentArticle.title}>
                  {currentArticle.title}
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, [isMobile ? "x" : "y"]: 12 }}
                animate={{ opacity: 1, [isMobile ? "x" : "y"]: 0 }}
                transition={{ delay: 0.1, duration: 0.25, ease: "easeOut" }}
              >
                <span className={styles.date}>{formatDate(currentArticle.created_at)}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, [isMobile ? "x" : "y"]: 12 }}
                animate={{ opacity: 1, [isMobile ? "x" : "y"]: 0 }}
                transition={{ delay: 0.15, duration: 0.25, ease: "easeOut" }}
              >
                <p className={styles.desc}>{currentArticle.summaries || ""}</p>
              </motion.div>

              <motion.div
                className={styles.actions}
                initial={{ opacity: 0, [isMobile ? "x" : "y"]: 12 }}
                animate={{ opacity: 1, [isMobile ? "x" : "y"]: 0 }}
                transition={{ delay: 0.2, duration: 0.25, ease: "easeOut" }}
              >
                <Link href={`/posts/${currentArticle.id}`} className={styles.button}>
                  查看更多
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <div className={styles.pagination}>
        {articles.map((_, index) => (
          <button
            key={index}
            className={`${styles.bullet} ${index === currentIndex ? styles.bulletActive : ""}`}
            onClick={() => goTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
});
