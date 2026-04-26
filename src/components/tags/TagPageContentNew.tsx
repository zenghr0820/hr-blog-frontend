"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTags } from "@/hooks/queries";
import { useSiteConfigStore } from "@/store/site-config-store";
import TagText from "@/components/common/TagText";
import styles from "./TagPageContentNew.module.css";

export function TagPageContentNew() {
  const siteConfig = useSiteConfigStore(state => state.siteConfig);
  const { data: tags = [], isLoading, isError } = useTags("count");

  const isOneImageEnabled = useMemo(() => {
    const pageConfig = siteConfig?.page?.one_image?.config || siteConfig?.page?.oneImageConfig;
    return pageConfig?.tags?.enable || false;
  }, [siteConfig]);

  return (
    <div className={`cardWidget ${styles.tagPageContainer}`}>
      {!isOneImageEnabled && <h1 className={styles.pageTitle}>标签</h1>}

      {isLoading && <div className={styles.loadingTip}>标签加载中...</div>}
      {isError && <div className={styles.errorTip}>加载标签失败，请稍后重试</div>}

      {!isLoading && !isError && (
        <div className={styles.tagCloudList}>
          {tags.map(tag => (
            <Link key={tag.id} className={styles.tagItem} href={`/tags/${encodeURIComponent(tag.name)}/`}>
              <TagText key={tag.id} tag={tag.name} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
