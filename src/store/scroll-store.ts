/**
 * 全局滚动状态管理
 * 使用单一滚动事件监听器，避免多个组件重复监听导致的性能问题
 *
 * 最佳实践：
 * - 只在 Layout 中初始化一次
 * - 其他组件通过 selector 订阅需要的状态
 * - 使用 useShallow 避免不必要的重渲染
 */

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

// 滚动方向
type ScrollDirection = "up" | "down" | "none";

type LenisInstance = InstanceType<typeof import("lenis").default> | null;

interface ScrollState {
  scrollY: number;
  scrollPercent: number;
  scrollDirection: ScrollDirection;

  isAtTop: boolean;
  isScrolled: boolean;
  isFooterVisible: boolean;
  _lastScrollY: number;
  _lenis: LenisInstance | null;
}

export const useScrollStore = create<ScrollState>()(() => ({
  scrollY: 0,
  scrollPercent: 0,
  scrollDirection: "none",
  isAtTop: true,
  isScrolled: false,
  isFooterVisible: false,
  _lastScrollY: 0,
  _lenis: null,
}));

/**
 * Hook: 获取 Header 相关的滚动状态
 * 用于替代原有的 useHeader hook
 */
export function useScrollForHeader() {
  return useScrollStore(
    useShallow(state => ({
      isHeaderTransparent: state.isAtTop,
      isScrolled: state.isScrolled,
      scrollPercent: state.scrollPercent,
      isFooterVisible: state.isFooterVisible,
    }))
  );
}

/**
 * Hook: 获取目录组件需要的滚动状态
 */
export function useScrollForToc() {
  const scrollY = useScrollStore(state => state.scrollY);
  return { scrollY };
}

/**
 * Hook: 获取基础滚动位置
 */
export function useScrollY() {
  return useScrollStore(state => state.scrollY);
}

/**
 * Hook: 获取滚动百分比
 */
export function useScrollPercent() {
  return useScrollStore(state => state.scrollPercent);
}

export function scrollTo(target: number | HTMLElement | string, options?: { offset?: number; immediate?: boolean }) {
  const lenis = useScrollStore.getState()._lenis;
  if (lenis) {
    lenis.scrollTo(target, { offset: options?.offset ?? 0, immediate: options?.immediate ?? false });
  } else if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: options?.immediate ? "instant" : "smooth" });
  } else {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (el) {
      const top = (el as HTMLElement).getBoundingClientRect().top + window.scrollY + (options?.offset ?? 0);
      window.scrollTo({ top, behavior: options?.immediate ? "instant" : "smooth" });
    }
  }
}
