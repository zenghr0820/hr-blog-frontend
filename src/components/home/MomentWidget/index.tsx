"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useEssayList } from "@/hooks/queries";
import type { EssayItem, EssayContent } from "@/types/essay";
import styles from "./MomentWidget.module.css";

function getContentTypes(content: EssayContent): string[] {
  const types: string[] = [];
  if (content.images && content.images.length > 0) types.push("image");
  if (content.video) types.push("video");
  if (content.link) types.push("link");
  if (content.music) types.push("music");
  return types;
}

function ContentTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "image":
      return <Icon icon="ri:image-fill" />;
    case "video":
      return <Icon icon="ri:video-fill" />;
    case "link":
      return <Icon icon="ri:link" />;
    case "music":
      return <Icon icon="ri:music-2-fill" />;
    default:
      return null;
  }
}

export function MomentWidget() {
  const { data: essayData } = useEssayList({ page: 1, page_size: 10 });
  const moments = essayData?.list ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [animState, setAnimState] = useState<"idle" | "enter" | "leave">("idle");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentMoment: EssayItem | undefined = moments[currentIndex];

  useEffect(() => {
    const len = moments.length;
    if (len <= 1) return;

    function nextMoment() {
      setAnimState("leave");
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % len);
        setAnimState("enter");
        setTimeout(() => setAnimState("idle"), 300);
      }, 300);
    }

    timerRef.current = setInterval(nextMoment, 3000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [moments.length]);

  if (!moments.length) return null;

  const contentTypes = currentMoment ? getContentTypes(currentMoment.content) : [];

  const wrapperClassName =
    animState === "enter"
      ? `${styles.momentContentWrapper} ${styles.slideEnter}`
      : animState === "leave"
        ? `${styles.momentContentWrapper} ${styles.slideLeave}`
        : styles.momentContentWrapper;

  return (
    <div
      className={styles.momentWidget}
      onMouseEnter={() => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }}
      onMouseLeave={() => {
        if (moments.length > 1 && !timerRef.current) {
          const len = moments.length;
          function nextMoment() {
            setAnimState("leave");
            setTimeout(() => {
              setCurrentIndex((prev) => (prev + 1) % len);
              setAnimState("enter");
              setTimeout(() => setAnimState("idle"), 300);
            }, 300);
          }
          timerRef.current = setInterval(nextMoment, 3000);
        }
      }}
    >
      <Link href="/essay" className={styles.momentContainer}>
        <div className={styles.widgetIcon}>
          <Icon icon="ri:quill-pen-ai-fill" />
        </div>

        <div className={styles.widgetCenter}>
          <div className={wrapperClassName} key={currentIndex}>
            <span className={styles.momentContent}>
              {currentMoment?.content?.text ?? ""}
            </span>
            {contentTypes.length > 0 && (
              <span className={styles.contentIcons}>
                {contentTypes.map((type) => (
                  <ContentTypeIcon key={type} type={type} />
                ))}
              </span>
            )}
          </div>
        </div>

        <div className={styles.widgetIcon}>
          <Icon icon="ri:arrow-right-s-line" />
        </div>
      </Link>
    </div>
  );
}
