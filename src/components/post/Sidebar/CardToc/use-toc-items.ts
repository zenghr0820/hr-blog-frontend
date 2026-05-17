/**
 * useTocItems Hook
 * 解析 HTML 内容提取标题目录项，供 CardToc 和父组件共享目录检测逻辑
 */
"use client";

import { useState, useEffect } from "react";

export interface TocItem {
  id: string;
  uniqueId: string;
  text: string;
  level: number;
  index: number;
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

function buildTocItems(headings: HTMLElement[]): TocItem[] {
  const idCountMap: Record<string, number> = {};
  const items: TocItem[] = [];

  headings.forEach((heading, index) => {
    const headingId = heading.id?.trim();
    let baseId =
      headingId || heading.textContent?.trim().replace(/\s+/g, "-").toLowerCase() || `heading-${index}`;

    // 处理重复 ID，避免 React key 和激活态冲突
    if (idCountMap[baseId] !== undefined) {
      idCountMap[baseId]++;
      baseId = `${baseId}-${idCountMap[baseId]}`;
    } else {
      idCountMap[baseId] = 0;
    }

    items.push({
      id: headingId || baseId,
      uniqueId: baseId,
      text: heading.textContent?.trim() || "",
      level: parseInt(heading.tagName.charAt(1), 10),
      index,
    });
  });

  return items;
}

/**
 * 解析 HTML 提取标题
 * 仅在客户端调用（DOMParser 是浏览器 API）
 */
function parseTocItems(contentHtml: string): TocItem[] {
  // SSR 环境下返回空数组
  if (typeof window === "undefined" || !contentHtml) return [];

  // 优先使用真实渲染 DOM，确保目录项与页面中的 heading 一一对应
  const domHeadings = getPostContentHeadings();
  if (domHeadings.length > 0) {
    return buildTocItems(domHeadings);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(contentHtml, "text/html");
  const headings = Array.from(doc.querySelectorAll(HEADING_SELECTOR)).filter(
    (heading): heading is HTMLElement => heading instanceof HTMLElement
  );

  return buildTocItems(headings);
}

export interface UseTocItemsReturn {
  tocItems: TocItem[];
  headings: HTMLElement[];
}

export function useTocItems(contentHtml: string): UseTocItemsReturn {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [headings, setHeadings] = useState<HTMLElement[]>([]);

  useEffect(() => {
    const updateTocItems = () => {
      const items = parseTocItems(contentHtml);
      setTocItems(items);
      setHeadings(getPostContentHeadings());
    };

    updateTocItems();
    const rafId = window.requestAnimationFrame(updateTocItems);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [contentHtml]);

  return { tocItems, headings };
}

export { parseTocItems, getPostContentHeadings, buildTocItems };
