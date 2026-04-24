/**
 * 简化版评论卡片组件
 * 用于最近评论页面、侧边栏等场景
 * 不包含回复、点赞等交互功能，仅展示
 */
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { Comment } from "@/lib/api/comment";
import {
  formatRelativeTime,
  getAvatarUrl,
  sanitizeCommentHtml,
  type CommentDisplayConfig,
} from "./comment-utils";
import styles from "./CommentCard.module.css";

interface CommentCardProps {
  comment: Comment;
  displayConfig: CommentDisplayConfig;
  /** 是否显示目标文章链接 */
  showTargetLink?: boolean;
}

export function CommentCard({ comment, displayConfig, showTargetLink = true }: CommentCardProps) {
  const avatarUrl = getAvatarUrl(comment, displayConfig);
  const link = `${comment.target_path}#comment-${comment.id}`;

  return (
    <div className={styles.commentCard}>
      {/* 头像 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl}
        alt={`${comment.nickname}头像`}
        className={styles.avatar}
        loading="lazy"
      />

      {/* 内容区域 */}
      <div className={styles.content}>
        {/* 头部信息 */}
        <div className={styles.header}>
          <span className={styles.nickname}>{comment.nickname}</span>
          {comment.is_admin_comment && (
            <span className={styles.masterTag}>{displayConfig.masterTag}</span>
          )}
          <span className={styles.time}>{formatRelativeTime(comment.created_at)}</span>
        </div>

        {/* 评论内容 */}
        <div
          className={styles.commentText}
          dangerouslySetInnerHTML={{ __html: sanitizeCommentHtml(comment.content_html) }}
        />

        {/* 目标文章链接 */}
        {showTargetLink && (
          <Link href={link} className={styles.targetLink}>
            <MessageSquare size={12} />
            <span>{comment.target_title || comment.target_path}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
