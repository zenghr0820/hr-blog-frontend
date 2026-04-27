"use client";

import { useCallback, useRef } from "react";
import { useEssayList } from "@/hooks/queries/use-essays";
import { useSiteConfigStore } from "@/store/site-config-store";
import { scrollTo } from "@/store/scroll-store";
import { Spinner } from "@/components/ui";
import { BannerCard } from "@/components/common/BannerCard";
import { CommentSection } from "@/components/post/Comment";
import { MomentCard } from "./MomentCard";
import type { EssayItem } from "@/types/essay";
import { extractBannerConfig, getDefaultBannerConfig } from "@/lib/banner-config";
import styles from "../essay.module.css";

export function EssayPageClient() {
  const siteConfig = useSiteConfigStore(state => state.siteConfig);
  
  // 使用统一的 Banner 配置提取器（essay 对应 moments）
  const bannerConfig = extractBannerConfig(siteConfig, 'essay');
  const defaultConfig = getDefaultBannerConfig('essay');
  
  const { data, isPending, isError } = useEssayList({
    page: 1,
    page_size: bannerConfig.display_limit || siteConfig?.moments?.display_limit || 30,
  });

  const moments = data?.list || [];
  const commentSectionRef = useRef<HTMLDivElement>(null);

  const handleCommentClick = useCallback((moment: EssayItem) => {
    const text = moment.content.text;
    const quoteText = text
      ? text.length > 100 ? text.substring(0, 100) + "..." : text
      : "[动态]";

    if (commentSectionRef.current) {
      scrollTo(commentSectionRef.current, { offset: -80 });
    }

    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("comment-form-set-quote", {
          detail: { text: quoteText, targetPath: "/essay" },
        })
      );
    }, 300);
  }, []);

  return (
    <div className={`cardWidget ${styles.essayPage}`}>
      <BannerCard
        tips={bannerConfig.tips || defaultConfig.tips}
        title={bannerConfig.title || defaultConfig.title}
        description={bannerConfig.description || defaultConfig.description}
        backgroundImage={bannerConfig.backgroundImage}
        height={300}
        buttonText={bannerConfig.buttonText}
        buttonLink={bannerConfig.buttonLink}
      />

      {isPending && (
        <div className={styles.loading}>
          <Spinner />
        </div>
      )}

      {isError && <div className={styles.emptyText}>动态加载失败，请稍后再试。</div>}

      {!isPending && moments.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
          </span>
          <p>暂无动态</p>
        </div>
      )}

      {moments.length > 0 && (
        <div className={styles.momentList}>
          {moments.map(moment => (
            <MomentCard key={moment.id} moment={moment} onCommentClick={handleCommentClick} />
          ))}
        </div>
      )}

      {moments.length > 0 && (
        <div className={styles.momentTip}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          <span>只显示最近{momentsConfig?.display_limit || 30}条动态</span>
        </div>
      )}

      <div ref={commentSectionRef} className={styles.commentSection}>
        <CommentSection targetPath="/essay" targetTitle="动态" />
      </div>
    </div>
  );
}
