/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import styles from "./AuthInfoCardCur.module.css";

interface AuthorConfig {
  description: string;
  statusImg: string;
  skills: string[];
  social: Record<string, { icon: string; link: string }>;
  userAvatar: string;
  ownerName: string;
  subTitle: string;
  totalPostCount: number;
}

interface AuthorInfoCardProps {
  config: AuthorConfig;
}

/**
 * 生成随机索引
 */
function getRandomIndex(length: number): number {
  return length > 0 ? Math.floor(Math.random() * length) : 0;
}

export function AuthorInfoCardCur({ config }: AuthorInfoCardProps) {
  // 技能列表
  const greetings = useMemo(
    () => (config.skills?.length > 0 ? config.skills : ["集中精力，攻克难关"]),
    [config.skills]
  );

  // 初始化时生成随机索引
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(() => getRandomIndex(greetings.length));
  const [showSkill, setShowSkill] = useState(false);

  // 当前显示的技能
  const currentGreeting = useMemo(
    () => greetings[currentGreetingIndex] || "集中精力，攻克难关",
    [greetings, currentGreetingIndex]
  );

  // 显示的内容
  const displayGreeting = useMemo(() => {
    if (!showSkill) {
      return "👋 欢迎光临！";
    }
    return currentGreeting;
  }, [showSkill, currentGreeting]);

  // 切换显示内容
  const changeSayHelloText = () => {
    if (!showSkill) {
      // 第一次点击，切换到显示技能
      setShowSkill(true);
      return;
    }

    // 已经在显示技能，切换到下一个技能
    const totalGreetings = greetings.length;
    if (totalGreetings <= 1) return;
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * totalGreetings);
    } while (newIndex === currentGreetingIndex);
    setCurrentGreetingIndex(newIndex);
  };

  // 渲染社交图标
  const renderSocialIcon = (name: string, social: { icon: string; link: string }) => {
    if (!social.icon) return null;
    const isImageUrl = social.icon?.startsWith("http://") || social.icon?.startsWith("https://");
    const isIconify = social.icon?.includes(":");

    if (!isImageUrl && !isIconify) return null;

    return (
      <a
        key={name}
        className={styles.socialIcon}
        href={social.link}
        aria-label={name}
        rel="external nofollow noreferrer"
        target="_blank"
        title={name}
      >
        {isImageUrl ? (
          <img src={social.icon} alt={name} className={`${styles.socialIconify} ${styles.socialIconImg}`}width={24} height={24} />
        ) : (
          <Icon icon={social.icon} className={styles.socialIconify} aria-hidden="true" />
        )}
      </a>
    );
  };

  return (
    <div className={`${styles.cardWidget} ${styles.cardInfo} ${styles.isCenter}`}>
      {/* 问候语/描述信息区域 */}
      <div className={styles.authorInfoDetail}>
        <p className={styles.authorInfoHello} onClick={changeSayHelloText}>
          {displayGreeting}
        </p>
        <p dangerouslySetInnerHTML={{ __html: config.description }} />
      </div>

      {/* 头像区域 */}
      <div className={styles.avatarImg}>
        <img
          src={config.userAvatar}
          alt="avatar"
          width={118}
          height={118}
          loading="lazy"
        />
        {config.statusImg && (
          <div className={styles.authorStatus}>
            <img
              className={styles.gStatus}
              src={config.statusImg}
              alt="status"
              width={26}
              height={26}
              loading="lazy"
            />
          </div>
        )}
      </div>

      <div className={styles.authorInfoName}>{config.ownerName}</div>

      {/* 统计数据区域 */}
      <div className={styles.siteData}>
        <Link href="/archives" aria-label={`查看全部 ${config.totalPostCount} 篇文章`}>
          <div className={styles.headline}>文章</div>
          <div className={styles.lengthNum}>{config.totalPostCount}</div>
        </Link>
        <Link href="/categories" aria-label={`查看全部 ${0} 个分类`}>
          <div className={styles.headline}>分类</div>
          <div className={styles.lengthNum}>{0}</div>
        </Link>
        <Link href="/tags" aria-label={`查看全部 ${0} 个标签`}>
          <div className={styles.headline}>标签</div>
          <div className={styles.lengthNum}>{0}</div>
        </Link>
      </div>

      <Link 
        id="card-info-btn" 
        className={styles.cardInfoBtn}
        target="_blank" 
        rel="noopener"  
        href="https://github.com/zenghr0820"
      >
        <i className="fab fa-github"></i>
        <span>Follow Me 🛫</span>
      </Link>

      {/* 底部信息 */}
      <div className={styles.cardInfoSocialIcons}>
        {Object.entries(config.social || {}).map(([name, social]) => renderSocialIcon(name, social))}
      </div>
    </div>
  );
}
