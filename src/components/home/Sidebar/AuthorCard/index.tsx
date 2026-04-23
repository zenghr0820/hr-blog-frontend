/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useSiteConfigStore } from "@/store/site-config-store";
import { useArticleList, useCategories, useTags } from "@/hooks/queries";
import styles from "./AuthorCard.module.css";

interface ContactItem {
  name: string;
  url: string;
  icon: string;
}

export function AuthorCard() {
  const siteConfig = useSiteConfigStore((state) => state.siteConfig);

  const { data: articleData } = useArticleList({ page: 1, pageSize: 1 });
  const { data: categories } = useCategories();
  const { data: tags } = useTags("count");

  const articlesTotal = articleData?.total ?? 0;
  const categoriesTotal = categories?.length ?? 0;
  const tagsTotal = tags?.length ?? 0;

  const avatarUrl = useMemo(() => {
    return siteConfig?.USER_AVATAR || "/avatar.webp";
  }, [siteConfig?.USER_AVATAR]);

  const authorName = useMemo(() => {
    return siteConfig?.frontDesk?.siteOwner?.name || "";
  }, [siteConfig?.frontDesk?.siteOwner?.name]);

  const authorDesc = useMemo(() => {
    return siteConfig?.sidebar?.author?.description || "";
  }, [siteConfig?.sidebar?.author?.description]);

  const authorCardBgUrl = useMemo(() => {
    const bg = (siteConfig as Record<string, unknown>)?.author_card_bg as string | undefined;
    return bg || "/author_bg.webp";
  }, [siteConfig]);

  const contacts = useMemo<ContactItem[]>(() => {
    const social = siteConfig?.sidebar?.author?.social;
    if (!social) return [];
    return Object.entries(social)
      .map(([name, value]) => ({
        name,
        url: value.link,
        icon: value.icon,
      }))
      .filter((item) => item.url && item.url.trim() !== "");
  }, [siteConfig?.sidebar?.author?.social]);

  const cardBgStyle = useMemo(
    () =>
      ({
        "--author-card-bg-url": authorCardBgUrl ? `url(${authorCardBgUrl})` : "none",
      }) as React.CSSProperties,
    [authorCardBgUrl],
  );

  const renderContactIcon = (contact: ContactItem) => {
    const isImageUrl =
      contact.icon?.startsWith("http://") || contact.icon?.startsWith("https://");
    const isIconify = contact.icon?.includes(":");

    return (
      <a
        key={contact.name}
        className={styles.icon}
        href={contact.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`访问 ${contact.name}`}
      >
        {isImageUrl ? (
          <img src={contact.icon} alt={contact.name} width={24} height={24} />
        ) : isIconify ? (
          <Icon icon={contact.icon} aria-hidden="true" />
        ) : (
          <i className={`ri-${contact.icon}`} aria-hidden="true" />
        )}
      </a>
    );
  };

  return (
    <div
      className={`${styles.cardWidget} ${styles.cardInfo} ${styles.isCenter}`}
      style={cardBgStyle}
    >
      <div className={styles.authorInfoDetail}>
        <p className={styles.authorInfoHello}>👋 欢迎光临！</p>
        <p className={styles.authorInfoDesc}>{authorDesc}</p>
      </div>
      <div className={styles.avatarImg}>
        <img src={avatarUrl} alt="头像" loading="lazy" />
      </div>
      <div className={styles.authorInfoName}>{authorName}</div>
      <div className={styles.siteData}>
        <Link href="/archive" aria-label={`查看全部 ${articlesTotal} 篇文章`}>
          <div className={styles.headline}>文章</div>
          <div className={styles.lengthNum}>{articlesTotal}</div>
        </Link>
        <Link href="/categories" aria-label={`查看全部 ${categoriesTotal} 个分类`}>
          <div className={styles.headline}>分类</div>
          <div className={styles.lengthNum}>{categoriesTotal}</div>
        </Link>
        <Link href="/tags" aria-label={`查看全部 ${tagsTotal} 个标签`}>
          <div className={styles.headline}>标签</div>
          <div className={styles.lengthNum}>{tagsTotal}</div>
        </Link>
      </div>
      <a
        id="card-info-btn"
        className={styles.cardInfoBtn}
        target="_blank"
        rel="noopener"
        href="https://github.com/zenghr0820"
      >
        <i className="fab fa-github"></i>
        <span>Follow Me 🛫</span>
      </a>
      <div className={styles.cardInfoIcons}>
        {contacts.map((contact) => renderContactIcon(contact))}
      </div>
    </div>
  );
}
