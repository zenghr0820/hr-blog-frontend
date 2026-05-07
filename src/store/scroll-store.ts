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

// 滚动方向
type ScrollDirection = "up" | "down" | "none";

interface ScrollState {
  // 基础滚动状态
  scrollY: number;
  scrollPercent: number;
  scrollDirection: ScrollDirection;

  // 派生状态
  isAtTop: boolean; // scrollY === 0
  isScrolled: boolean; // 向下滚动且超过阈值
  isFooterVisible: boolean;

  // 内部状态（不直接暴露）
  _lastScrollY: number;
  _isInitialized: boolean;

  // Actions
  initialize: () => () => void; // 返回 cleanup 函数
  _handleScroll: () => void;
}

// 滚动方向判断阈值
const SCROLL_DIRECTION_THRESHOLD = 60;

// 模块级 rAF ID，不放入 Zustand state 避免触发订阅者重渲染
let _rafId: number | null = null;

export const useScrollStore = create<ScrollState>()((set, get) => ({
  // 初始状态
  scrollY: 0,
  scrollPercent: 0,
  scrollDirection: "none",
  isAtTop: true,
  isScrolled: false,
  isFooterVisible: false,
  _lastScrollY: 0,
  _isInitialized: false,

  // 处理滚动事件（内部方法）
  _handleScroll: () => {
    // 使用 rAF 节流：一帧内只处理一次滚动
    if (_rafId !== null) return;

    _rafId = requestAnimationFrame(() => {
      _rafId = null;

      const state = get();

      // 确保 scrollY 不为负数
      const scrollY = Math.max(0, window.scrollY);
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollableHeight = scrollHeight - clientHeight;

      // 计算滚动百分比
      let scrollPercent = 0;
      if (scrollableHeight > 10 && scrollY > 1) {
        scrollPercent = Math.round((scrollY / scrollableHeight) * 100);
      }

      // 计算滚动方向
      let scrollDirection: ScrollDirection = "none";
      let isScrolled = false;

      if (scrollY <= 0) {
        scrollDirection = "none";
        isScrolled = false;
      } else if (scrollY > SCROLL_DIRECTION_THRESHOLD) {
        scrollDirection = scrollY > state._lastScrollY ? "down" : "up";
        isScrolled = scrollDirection === "down";
      }

      // 检测 Footer 可见性
      let isFooterVisible = false;
      const footerEl = document.getElementById("footer-container");
      if (footerEl) {
        isFooterVisible = scrollY + clientHeight >= footerEl.offsetTop;
      }

      // 批量更新状态
      set({
        scrollY,
        scrollPercent,
        scrollDirection,
        isAtTop: scrollY === 0,
        isScrolled,
        isFooterVisible,
        _lastScrollY: scrollY,
      });
    });
  },

  // 初始化滚动监听
  initialize: () => {
    const state = get();

    // 防止重复初始化
    if (state._isInitialized) {
      return () => {};
    }

    set({ _isInitialized: true });

    const handleScroll = () => {
      get()._handleScroll();
    };

    // 添加滚动监听
    window.addEventListener("scroll", handleScroll, { passive: true });

    // 初始化状态
    requestAnimationFrame(handleScroll);

    // 返回清理函数
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (_rafId !== null) {
        cancelAnimationFrame(_rafId);
        _rafId = null;
      }
      set({
        _isInitialized: false,
      });
    };
  },
}));

/**
 * Hook: 获取 Header 相关的滚动状态
 * 用于替代原有的 useHeader hook
 */
export function useScrollForHeader() {
  const isAtTop = useScrollStore(state => state.isAtTop);
  const isScrolled = useScrollStore(state => state.isScrolled);
  const scrollPercent = useScrollStore(state => state.scrollPercent);
  const isFooterVisible = useScrollStore(state => state.isFooterVisible);

  return {
    isHeaderTransparent: isAtTop,
    isScrolled,
    scrollPercent,
    isFooterVisible,
  };
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
