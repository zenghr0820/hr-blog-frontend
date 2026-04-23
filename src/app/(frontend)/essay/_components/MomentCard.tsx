"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { formatDateTime } from "@/utils/date";
import { getVideoIframeSrc } from "@/types/essay";
import { useSiteConfigStore } from "@/store/site-config-store";
import type { EssayItem, EssayContent } from "@/types/essay";
import { MusicPlayer } from "./MusicPlayer";
import styles from "./MomentCard.module.css";

function MomentImages({ images }: { images: string[] }) {
  const [zoomedSrc, setZoomedSrc] = useState<string | null>(null);
  const displayImages = images.slice(0, 6);
  const count = Math.min(images.length, 6);

  const gridClass =
    count === 1
      ? styles.images1
      : count === 2
        ? styles.images2
        : count === 3
          ? styles.images3
          : count === 4
            ? styles.images4
            : count === 5
              ? styles.images5
              : styles.images6;

  return (
    <>
      <div className={`${styles.momentImages} ${gridClass}`}>
        {displayImages.map((image, index) => (
          <div key={index} className={styles.imageItem} onClick={() => setZoomedSrc(image)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={`图片 ${index + 1}`} loading="lazy" />
            {index === 5 && images.length > 6 && (
              <div className={styles.moreOverlay}>
                <Icon icon="ri:image-line" />
                <span>+{images.length - 6}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {zoomedSrc && createPortal(
        <div className={styles.zoomOverlay} onClick={() => setZoomedSrc(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomedSrc} alt="放大图片" className={styles.zoomedImage} onClick={e => e.stopPropagation()} />
          <button className={styles.zoomClose} onClick={() => setZoomedSrc(null)}>
            <Icon icon="ri:close-line" />
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

function MomentVideo({ video }: { video: EssayContent["video"] }) {
  if (!video) return null;

  if (!video.platform || video.platform === "local") {
    return (
      <div className={styles.momentVideo}>
        <video src={video.url} controls preload="metadata" autoPlay={false} />
      </div>
    );
  }

  const iframeSrc = getVideoIframeSrc(video.platform, video.video_id || "");
  if (!iframeSrc) return null;

  return (
    <div className={styles.momentVideo}>
      <iframe
        src={iframeSrc}
        allowFullScreen
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}

function MomentLink({ link }: { link: EssayContent["link"] }) {
  if (!link) return null;

  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.momentLink}>
      {link.favicon && (
        <div className={styles.linkFavicon}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={link.favicon} alt="" loading="lazy" />
        </div>
      )}
      <div className={styles.linkInfo}>
        <div className={styles.linkTitle}>{link.title || "链接"}</div>
        <div className={styles.linkUrl}>{link.url}</div>
      </div>
      <Icon icon="ri:external-link-line" className={styles.linkIcon} />
    </a>
  );
}

export function MomentCard({ moment, onCommentClick }: { moment: EssayItem; onCommentClick?: (moment: EssayItem) => void }) {
  const siteConfig = useSiteConfigStore(state => state.siteConfig);
  const avatarUrl = (siteConfig?.USER_AVATAR as string) || "/avatar.webp";
  const author = (siteConfig?.AUTHOR as string) || "博主";

  const content = moment.content;

  const handleCommentClick = () => {
    onCommentClick?.(moment);
  };

  return (
    <div className={styles.momentItem}>
      <div className={styles.momentHeader}>
        <div className={styles.momentAvatar}>
          <img src={avatarUrl} alt="avatar" loading="lazy" />
        </div>
        <div className={styles.momentMeta}>
          <span className={styles.momentAuthor}>
            {author}
            <Icon icon="ri:verified-badge-fill" />
          </span>
          <div className={styles.momentTime}>
            {moment.publish_time ? formatDateTime(moment.publish_time) : formatDateTime(moment.created_at)}
          </div>
        </div>
      </div>

      <div className={styles.momentContent}>
        {content.text && <div className={styles.momentText}>{content.text}</div>}

        {content.images && content.images.length > 0 && <MomentImages images={content.images} />}

        {content.video && <MomentVideo video={content.video} />}

        {content.music && <MusicPlayer music={content.music} />}

        {content.link && <MomentLink link={content.link} />}
      </div>

      <div className={styles.momentFooter}>
        <div className={styles.momentInfo}>
          {content.location && (
            <span className={styles.location}>
              <Icon icon="ri:map-pin-line" />
              {content.location}
            </span>
          )}
          {content.tags && (
            <span className={styles.tags}>
              <Icon icon="ri:price-tag-3-line" />
              {content.tags}
            </span>
          )}
        </div>
        <div className={styles.momentActions}>
          <button
            className={styles.commentBtn}
            title="评论此动态"
            onClick={handleCommentClick}
          >
            <Icon icon="ri:chat-3-line" />
          </button>
        </div>
      </div>
    </div>
  );
}
