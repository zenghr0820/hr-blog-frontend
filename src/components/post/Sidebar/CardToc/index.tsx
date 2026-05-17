/**
 * 文章目录组件
 * 显示文章标题目录，支持滚动监听和点击跳转
 * 使用全局 scrollStore 避免重复滚动监听
 */
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { FaBars } from "react-icons/fa6";
import { useScrollY } from "@/store";
import { useTocItems } from "./use-toc-items";
import type { TocItem } from "./use-toc-items";
import styles from "./CardToc.module.css";

export type { TocItem } from "./use-toc-items";

interface CardTocProps {
  contentHtml: string;
  collapseMode?: boolean;
  onItemClick?: () => void;
  /** 外部传入的目录项，避免重复解析；不传时组件内部自行计算 */
  tocItems?: TocItem[];
}

const HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6";
const POST_CONTENT_SELECTOR = '[data-post-content="true"]';

function getPostContentHeadings(): HTMLElement[] {
  if (typeof window === "undefined") return [];

  const postContent = document.querySelector(POST_CONTENT_SELECTOR);
  if (!postContent) return [];

  return Array.from(postContent.querySelectorAll(HEADING_SELECTOR)).filter(
    (heading): heading is HTMLElement => heading instanceof HTMLElement
  );
}

function getHeadingElement(item: TocItem, headings: HTMLElement[]): HTMLElement | null {
  // 优先按顺序索引定位，避免特殊字符/重复 id 导致命中错误元素
  if (item.index >= 0 && item.index < headings.length) {
    return headings[item.index];
  }

  if (!item.id) return null;
  const element = document.getElementById(item.id);
  return element instanceof HTMLElement ? element : null;
}

/**
 * 计算当前激活的标题 ID
 * 基于滚动位置和标题元素位置
 */
function computeActiveId(tocItems: TocItem[], headings: HTMLElement[]): string {
  if (tocItems.length === 0) return "";

  const headerOffset = 80;
  // 使用 window.scrollY 与 top 计算保持一致，避免 store 节流导致 scrollY 滞后时误激活下方标题
  const currentScrollY = window.scrollY;
  let currentId = "";

  for (const item of tocItems) {
    const element = getHeadingElement(item, headings);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - headerOffset;
      if (currentScrollY >= top - 10) {
        currentId = item.uniqueId;
      }
    }
  }

  return currentId;
}

export function CardToc({ contentHtml, collapseMode = false, onItemClick, tocItems: externalTocItems }: CardTocProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isScrolling, setIsScrolling] = useState(false);
  const tocContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cachedHeadingsRef = useRef<HTMLElement[]>([]);

  // 使用全局滚动状态
  const scrollY = useScrollY();

  // 当外部未传入 tocItems 时，内部自行解析
  const internalTocResult = useTocItems(contentHtml);

  // 优先使用外部传入的 tocItems，否则使用内部解析结果
  const tocItems = externalTocItems ?? internalTocResult.tocItems;

  // 同步 headings 缓存：外部传入时也需要获取 DOM headings 用于滚动定位
  useEffect(() => {
    cachedHeadingsRef.current = getPostContentHeadings();
  }, [contentHtml]);

  // 滚动监听，高亮当前标题
  // 这里需要在 scrollY 变化时同步 activeId 状态，是合理的外部同步模式
  useEffect(() => {
    if (tocItems.length === 0 || isScrolling) return;

    const newActiveId = computeActiveId(tocItems, cachedHeadingsRef.current);
    setActiveId(prev => (newActiveId && newActiveId !== prev ? newActiveId : prev));
  }, [tocItems, scrollY, isScrolling]);

  // 指示器 ref
  const indicatorRef = useRef<HTMLDivElement>(null);

  // 更新指示器位置
  const updateIndicator = useCallback(() => {
    if (!tocContainerRef.current || !indicatorRef.current) return;

    const activeElement = tocContainerRef.current.querySelector(`[data-id="${activeId}"]`) as HTMLElement;
    if (activeElement) {
      const indicatorHeight = activeElement.offsetHeight / 2;
      const topOffset = activeElement.offsetTop + (activeElement.offsetHeight - indicatorHeight) / 2;
      indicatorRef.current.style.top = `${topOffset}px`;
      indicatorRef.current.style.height = `${indicatorHeight}px`;
      indicatorRef.current.style.opacity = "1";
    } else {
      indicatorRef.current.style.opacity = "0";
    }
  }, [activeId]);

  // 自动滚动目录到激活项并更新指示器
  useEffect(() => {
    if (!activeId || !tocContainerRef.current) return;

    const activeElement = tocContainerRef.current.querySelector(`[data-id="${activeId}"]`);
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }

    // 更新指示器位置
    updateIndicator();
  }, [activeId, updateIndicator]);

  // 点击跳转
  const handleClick = useCallback((item: TocItem) => {
    const headings = getPostContentHeadings();
    const element = getHeadingElement(item, headings);
    if (element) {
      setIsScrolling(true);
      setActiveId(item.uniqueId);

      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const targetTop = Math.min(Math.max(0, elementPosition - headerOffset), maxScrollTop);

      window.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1000);

      onItemClick?.();
    }
  }, [onItemClick]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 折叠模式：计算可见项
  const visibleTocItems = useMemo(() => {
    if (!collapseMode || tocItems.length === 0) return tocItems;

    const activeIndex = tocItems.findIndex(item => item.uniqueId === activeId);
    if (activeIndex === -1) return tocItems;

    const activeItem = tocItems[activeIndex];
    const minLevel = Math.min(...tocItems.map(item => item.level));

    const ancestorIds = new Set<string>();
    for (let i = activeIndex - 1; i >= 0; i--) {
      if (tocItems[i].level < activeItem.level) {
        ancestorIds.add(tocItems[i].uniqueId);
        if (tocItems[i].level === minLevel) break;
      }
    }

    const childIds = new Set<string>();
    for (let i = activeIndex + 1; i < tocItems.length; i++) {
      if (tocItems[i].level <= activeItem.level) break;
      childIds.add(tocItems[i].uniqueId);
    }

    const siblingIds = new Set<string>();
    let siblingStart = activeIndex;
    for (let i = activeIndex - 1; i >= 0; i--) {
      if (tocItems[i].level < activeItem.level) break;
      if (tocItems[i].level === activeItem.level) siblingStart = i;
    }
    for (let i = siblingStart; i < tocItems.length; i++) {
      if (tocItems[i].level < activeItem.level) break;
      if (tocItems[i].level === activeItem.level) siblingIds.add(tocItems[i].uniqueId);
    }

    return tocItems.filter(item => {
      if (item.level === minLevel) return true;
      if (item.uniqueId === activeId) return true;
      if (ancestorIds.has(item.uniqueId)) return true;
      if (childIds.has(item.uniqueId)) return true;
      if (siblingIds.has(item.uniqueId)) return true;
      return false;
    });
  }, [tocItems, activeId, collapseMode]);

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className={styles.cardToc}>
      <div className={styles.cardTitle}>
        <FaBars aria-hidden="true" />
        <span>目录</span>
        <span className={styles.count}>{tocItems.length}</span>
      </div>
      <div ref={tocContainerRef} className={styles.tocContainer}>
        <div className={styles.tocList}>
          {visibleTocItems.map(item => (
            <div
              key={item.uniqueId}
              data-id={item.uniqueId}
              data-level={item.level}
              className={`${styles.tocItem} ${item.uniqueId === activeId ? styles.active : ""}`}
              onClick={() => handleClick(item)}
            >
              <span className={styles.tocText}>{item.text}</span>
            </div>
          ))}
          {/* 激活指示器 */}
          <div ref={indicatorRef} className={styles.indicator} />
        </div>
      </div>
    </div>
  );
}

export default CardToc;
