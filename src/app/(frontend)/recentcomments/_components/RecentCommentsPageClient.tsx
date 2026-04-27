/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2026-02-03 16:07:45
 * @LastEditTime: 2026-02-03 16:33:28
 * @LastEditors: 安知鱼
 */
"use client";

import { useMemo } from "react";
import { useLatestComments } from "@/hooks/queries";
import { useSiteConfigStore } from "@/store/site-config-store";
import { Spinner } from "@/components/ui";
import { BannerCard } from "@/components/common/BannerCard";
import { extractBannerConfig, getDefaultBannerConfig } from "@/lib/banner-config";
import { CommentCard } from "@/components/post/Comment/CommentCard";
import type { CommentDisplayConfig } from "@/components/post/Comment/comment-utils";

export function RecentCommentsPageClient() {
  const siteConfig = useSiteConfigStore(state => state.siteConfig);

  // 使用统一的 Banner 配置提取器
  const bannerConfig = extractBannerConfig(siteConfig, 'recent_comments');
  const defaultConfig = getDefaultBannerConfig('recent_comments');

  const { data, isPending, isError } = useLatestComments({ page: 1, pageSize: 20 });
  const comments = data?.list || [];

  const displayConfig: CommentDisplayConfig = useMemo(
    () => ({
      gravatarUrl: siteConfig?.GRAVATAR_URL || "https://cravatar.cn/",
      defaultGravatarType: siteConfig?.DEFAULT_GRAVATAR_TYPE || "mp",
      masterTag: siteConfig?.comment?.master_tag || "博主",
      adminAvatarUrl: (siteConfig?.USER_AVATAR as string) || undefined,
    }),
    [siteConfig]
  );

  return (
    <div className="cardWidget w-full max-w-[1400px] mx-auto px-6 py-8 space-y-6">
      <BannerCard
        tips={bannerConfig.tips || defaultConfig.tips}
        title={bannerConfig.title || defaultConfig.title}
        description={bannerConfig.description || defaultConfig.description}
        backgroundImage={bannerConfig.backgroundImage}
        height={300}
      />

      {isPending && (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      )}

      {isError && <div className="text-muted-foreground">评论加载失败，请稍后再试。</div>}

      {!isPending && comments.length === 0 && <div className="text-muted-foreground">暂无评论</div>}

      <div className="space-y-4">
        {comments.map(comment => (
          <CommentCard
            key={comment.id}
            comment={comment}
            displayConfig={displayConfig}
            showTargetLink={true}
          />
        ))}
      </div>
    </div>
  );
}
