"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTags } from "@/hooks/queries";
import { useSiteConfigStore } from "@/store/site-config-store";
import { useMounted } from "@/hooks/use-mounted";
import TagText from "@/components/common/TagText";
import { BannerCard } from "@/components/common/BannerCard";
import { extractBannerConfig } from "@/lib/banner-config";
import styles from "./TagPageContentNew.module.css";

export function TagPageContentNew() {
  const mounted = useMounted();
  const siteConfig = useSiteConfigStore(state => state.siteConfig);
  const { data: tags = [], isLoading, isError } = useTags("count");

  const isOneImageEnabled = useMemo(() => {
    const pageConfig = siteConfig?.page?.one_image?.config || siteConfig?.page?.oneImageConfig;
    return pageConfig?.tags?.enable || false;
  }, [siteConfig]);

    // 使用统一的 Banner 配置提取器
  const bannerConfig = extractBannerConfig(siteConfig, 'tag');

  return (
    <div className={`cardWidget ${styles.tagPageContainer}`}>
      {!isOneImageEnabled && Object.keys(bannerConfig).length === 0 && <h1 className={styles.pageTitle}>标签</h1>}

      <BannerCard
            tips={bannerConfig.tips || "分类标签"}
            title={bannerConfig.title || "文章分类"}
            description={bannerConfig.description || ""}
            backgroundImage={bannerConfig.backgroundImage}
            height={300}
        />


      <div className={styles.tagCloudList}>
        {!mounted || isLoading ? (
          <div className={styles.loadingTip}>标签加载中...</div>
        ) : isError ? (
          <div className={styles.errorTip}>加载标签失败，请稍后重试</div>
        ) : tags.length === 0 ? (
          <div className={styles.emptyTip}>暂无标签</div>
        ) : (
          tags.map(tag => (
            <Link key={tag.id} className={styles.tagItem} href={`/tags/${encodeURIComponent(tag.name)}/`}>
              <TagText key={tag.id} tag={tag.name} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
