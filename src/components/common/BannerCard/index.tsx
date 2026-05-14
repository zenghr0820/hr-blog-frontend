/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2026-02-12 14:40:52
 * @LastEditTime: 2026-02-23 18:59:58
 * @LastEditors: 安知鱼
 */
"use client";

/**
 * 通用横幅卡片组件
 * 参考 anheyu-app 的 AnBannerCard，用于子页面顶部横幅展示
 */
import { useRef } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import styles from "./BannerCard.module.css";
import type { UnifiedBannerConfig, PresetBannerPageKey } from "@/types/banner";
import { getDefaultBannerConfig } from "@/lib/banner-config";
import { useBubbleCanvas } from "./useBubbleCanvas";

interface BannerCardProps {
  /** Banner 配置对象 */
  bannerConfig?: UnifiedBannerConfig;
  /** 预设页面类型，用于自动获取默认配置 */
  type?: PresetBannerPageKey;
  /** 自定义默认配置（优先级高于 type 对应的默认值） */
  defaultConfig?: Partial<UnifiedBannerConfig>;
  /** 按钮点击回调（与 buttonLink 二选一） */
  onButtonClick?: () => void;
}

export function BannerCard({
  bannerConfig,
  type,
  defaultConfig: customDefaultConfig,
  onButtonClick,
}: BannerCardProps) {
  const typeDefaults = type ? getDefaultBannerConfig(type) : {};
  const defaults = customDefaultConfig || typeDefaults;

  const tips = bannerConfig?.tips || defaults.tips;
  const title = bannerConfig?.title || defaults.title;
  const description = bannerConfig?.description || defaults.description;
  const backgroundImage = bannerConfig?.backgroundImage;
  const height = bannerConfig?.height || 300;
  const buttonText = bannerConfig?.buttonText;
  const buttonLink = bannerConfig?.buttonLink;

  // 气泡动画：有背景图时启用
  const bannerInnerRef = useRef<HTMLDivElement>(null);
  useBubbleCanvas(bannerInnerRef, !!backgroundImage);

  const containerStyle = {
    height: typeof height === "number" ? `${height}px` : height,
  };

  const innerStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundPosition: 'center center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }
    : undefined;

  const isInternal = buttonLink && buttonLink.startsWith("/") && !buttonLink.startsWith("//");
  const buttonIcon = (
    <Icon icon="jam:arrow-circle-up-right-f" width={22} height={22} className={styles.bannerButtonIcon} />
  );

  const buttonEl = buttonText ? (
    onButtonClick ? (
      <button type="button" onClick={onButtonClick} className={styles.bannerButton}>
        {buttonIcon}
        <span className={styles.bannerButtonText}>{buttonText}</span>
      </button>
    ) : buttonLink ? (
      isInternal ? (
        <Link href={buttonLink} className={styles.bannerButton}>
          {buttonIcon}
          <span className={styles.bannerButtonText}>{buttonText}</span>
        </Link>
      ) : (
        <a href={buttonLink} target="_blank" rel="noopener noreferrer" className={styles.bannerButton}>
          {buttonIcon}
          <span className={styles.bannerButtonText}>{buttonText}</span>
        </a>
      )
    ) : null
  ) : null;

  return (
    <div className={styles.bannerCard} style={containerStyle}>
      <div
        ref={bannerInnerRef}
        className={`${styles.bannerInner} ${backgroundImage ? styles.bannerInnerWithBg : ''}`}
        style={innerStyle}
      >
        <div className={styles.bannerContent}>
          <div>
            {tips && <div className={styles.bannerTips}>{tips}</div>}
            {title && <span className={styles.bannerTitle}>{title}</span>}
          </div>
          <div className={styles.bannerBottom}>
            {description && <div className={styles.bannerDesc}>{description}</div>}
            {buttonEl}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BannerCard;
