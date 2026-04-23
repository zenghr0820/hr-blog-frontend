/**
 * 滚动状态初始化器
 * 在应用启动时初始化全局滚动监听
 * 必须在客户端组件中使用
 */
"use client";

import { useEffect } from "react";
import { useScrollStore } from "@/store";

export function ScrollInitializer() {
  useEffect(() => {
    useScrollStore.setState({
      scrollY: 0,
      scrollPercent: 0,
      scrollDirection: "none",
      isAtTop: true,
      isScrolled: false,
      isFooterVisible: false,
      _lastScrollY: 0,
    });
  }, []);

  return null;
}

export default ScrollInitializer;
