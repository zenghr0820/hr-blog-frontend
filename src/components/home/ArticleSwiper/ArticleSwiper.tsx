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

const slideVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const contentVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export const ArticleSwiper = memo(function ArticleSwiper({
  articles,
  autoPlayInterval = 3000,
}: ArticleSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const [useDefaultCover, setUseDefaultCover] = useState<Record<string, boolean>>({});
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
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          className={styles.slide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.8, ease: "easeInOut" }}
          drag={isMobile ? "x" : "y"}
          dragConstraints={isMobile ? { left: 0, right: 0 } : { top: 0, bottom: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
        >
          <Link href={`/posts/${currentArticle.id}`} className={styles.imageLink}>
            <motion.img
              src={getCoverUrl(currentArticle)}
              alt={currentArticle.title}
              className={styles.image}
              onError={() => handleImageError(currentArticle.id)}
              loading="lazy"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </Link>

          <div className={styles.content}>
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
            >
              <Link href={`/posts/${currentArticle.id}`} className={styles.title} title={currentArticle.title}>
                {currentArticle.title}
              </Link>
            </motion.div>

            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
            >
              <span className={styles.date}>{formatDate(currentArticle.created_at)}</span>
            </motion.div>

            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3, duration: 0.3, ease: "easeOut" }}
            >
              <p className={styles.desc}>{currentArticle.summaries || ""}</p>
            </motion.div>

            <motion.div
              className={styles.actions}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4, duration: 0.3, ease: "easeOut" }}
            >
              <Link href={`/posts/${currentArticle.id}`} className={styles.button}>
                查看更多
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

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
