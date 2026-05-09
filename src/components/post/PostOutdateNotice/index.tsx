"use client";

import { useMemo } from "react";
import { RiNotificationFill } from "react-icons/ri";
import { useSiteConfigStore } from "@/store/site-config-store";
import styles from "./PostOutdateNotice.module.scss";

interface PostOutdateNoticeProps {
  updatedAt: string;
}

function getDaysSinceUpdate(updatedAt: string): number {
  const then = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getExpirationThreshold(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (isNaN(num) || num <= 0) return null;
  return num;
}

export function PostOutdateNotice({ updatedAt }: PostOutdateNoticeProps) {
  const expirationTime = useSiteConfigStore(
    state => state.siteConfig?.post?.expiration_time,
  );

  const isOutdated = useMemo(() => {
    const threshold = getExpirationThreshold(expirationTime);
    if (threshold === null) return false;
    return getDaysSinceUpdate(updatedAt) >= threshold;
  }, [expirationTime, updatedAt]);

  const daysSinceUpdate = useMemo(() => getDaysSinceUpdate(updatedAt), [updatedAt]);

  if (!isOutdated) return null;

  return (
    <div className={styles.notice} role="alert">
      <RiNotificationFill className={styles.icon} />
      <span>距离上次更新已经过去了 {daysSinceUpdate} 天，文章的内容可能已经过时。</span>
    </div>
  );
}
