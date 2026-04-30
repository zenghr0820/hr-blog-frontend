"use client";

import { useMemo, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useSiteConfigStore } from "@/store/site-config-store";
import { useCategories, useTags } from "@/hooks/queries/use-articles";
import { AuthorInfoCardCur } from "./AuthorInfoCardCur";
import { CardWechat } from "./CardWechat";
import { CustomSidebarBlocks } from "./CustomSidebarBlocks";
import { StickyCards } from "./StickyCards";
import styles from "./Sidebar.module.css";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const CardClock = dynamic(() => import("./CardClock").then(m => m.CardClock), {
  ssr: false,
});

export function Sidebar() {
  const siteConfig = useSiteConfigStore(state => state.siteConfig);
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const authorInfoConfig = useMemo(() => {
    if (!siteConfig?.sidebar?.author?.enable) return null;
    return {
      description: siteConfig.sidebar.author.description || "",
      statusImg: siteConfig.sidebar.author.statusImg || "",
      skills: siteConfig.sidebar.author.skills || [],
      social: siteConfig.sidebar.author.social || {},
      userAvatar: siteConfig.USER_AVATAR || "",
      ownerName: siteConfig.frontDesk?.siteOwner?.name || "",
      subTitle: siteConfig.SUB_TITLE || "",
      totalPostCount: siteConfig?.sidebar?.siteinfo?.totalPostCount || 0,
      totalCategoryCount: mounted ? (categories?.length || 0) : 0,
      totalTagCount: mounted ? (tags?.length || 0) : 0,
    };
  }, [siteConfig, categories, tags, mounted]);

  // 微信公众号卡片配置
  const wechatConfig = useMemo(() => {
    if (!siteConfig?.sidebar?.wechat?.enable) return null;
    return {
      face: siteConfig.sidebar.wechat.face || "",
      backFace: siteConfig.sidebar.wechat.backFace || "",
      blurBackground: siteConfig.sidebar.wechat.blurBackground || "",
      link: siteConfig.sidebar.wechat.link,
    };
  }, [siteConfig]);

  // 天气时钟配置
  const clockConfig = useMemo(() => {
    const w = siteConfig?.sidebar?.weather;
    if (!w?.enable || !w.qweather_key) return null;
    return {
      qweatherKey: w.qweather_key,
      qweatherAPIHost: w.qweather_api_host || "devapi.qweather.com",
      ipAPIKey: w.ip_api_key || "",
      loading: w.loading || "",
      defaultRectangle: w.default_rectangle === true || (w.default_rectangle as unknown) === "true",
      rectangle: w.rectangle || "112.6534116,27.96920845",
    };
  }, [siteConfig]);

  return (
    <aside className={styles.asideContent}>
      {authorInfoConfig && <AuthorInfoCardCur config={authorInfoConfig} />}
      {wechatConfig && <CardWechat config={wechatConfig} />}
      <CustomSidebarBlocks />
      {clockConfig && <CardClock config={clockConfig} />}
      <StickyCards />
    </aside>
  );
}
