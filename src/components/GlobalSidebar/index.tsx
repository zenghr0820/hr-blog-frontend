"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/react";
import { useUiStore } from "@/store/ui-store";
import { useTheme } from "@/hooks/use-theme";
import { useReadingMode } from "@/hooks/use-reading-mode";
import { scrollTo } from "@/store/scroll-store";
import styles from "./GlobalSidebar.module.css";

export function GlobalSidebar() {
  const pathname = usePathname();
  const { isDark, toggleTheme, mounted } = useTheme();

  const isCommentBarrageVisible = useUiStore(state => state.isCommentBarrageVisible);
  const toggleCommentBarrage = useUiStore(state => state.toggleCommentBarrage);
  const isSidebarVisible = useUiStore(state => state.isSidebarVisible);
  const { isReadingMode, toggleReadingMode } = useReadingMode();

  const isDarkMode = mounted && isDark;

  const isPostDetail = pathname.startsWith("/posts/") || pathname.startsWith("/doc/");

  const handleThemeToggle = useCallback(() => {
    if (!mounted) return;
    toggleTheme();
  }, [mounted, toggleTheme]);

  const handleSidebarToggle = useCallback(() => {
    const wasVisible = isSidebarVisible;
    useUiStore.getState().toggleSidebar();
    addToast({
      title: wasVisible ? "侧边栏已隐藏" : "侧边栏已显示",
      color: wasVisible ? "default" : "success",
      timeout: 2000,
    });
  }, [isSidebarVisible]);

  const handleCommentBarrageToggle = useCallback(() => {
    const wasVisible = isCommentBarrageVisible;
    toggleCommentBarrage();
    addToast({
      title: wasVisible ? "热评弹幕已关闭" : "热评弹幕已开启",
      color: wasVisible ? "default" : "success",
      timeout: 2000,
    });
  }, [isCommentBarrageVisible, toggleCommentBarrage]);

  const handleReadingModeToggle = useCallback(() => {
    const wasEnabled = isReadingMode;
    toggleReadingMode();
    addToast({
      title: wasEnabled ? "已退出阅读模式" : "已进入阅读模式",
      color: wasEnabled ? "default" : "success",
      timeout: 2000,
    });
  }, [isReadingMode, toggleReadingMode]);

  const handleScrollToTop = useCallback(() => {
    scrollTo(0, { duration: 500 });
  }, []);

  const handleScrollToComment = useCallback(() => {
    const commentSection = document.getElementById("post-comment");
    if (commentSection) {
      commentSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const renderButton = (
    icon: string,
    text: string,
    onClick: () => void,
    isActive?: boolean,
    ariaLabel?: string
  ) => (
    <button
      type="button"
      className={`${styles.button} ${isActive ? styles.active : ""}`}
      onClick={onClick}
      aria-label={ariaLabel || text}
    >
      <Icon icon={icon} className={styles.icon} />
      <span className={styles.text}>{text}</span>
    </button>
  );

  return (
    <div id="rightside" className={`${styles.sidebar} ${styles.show}`}>
      {renderButton(
        isDarkMode ? "solar:sun-bold" : "solar:moon-bold",
        "亮暗切换",
        handleThemeToggle,
        undefined,
        "主题切换"
      )}

      {renderButton(
        "ri:sidebar-fold-fill",
        "侧栏显隐",
        handleSidebarToggle,
        !isSidebarVisible,
        "侧边栏开关"
      )}

      {isPostDetail && (
        <>
          {renderButton(
            "fa:comments",
            "快速评论",
            handleScrollToComment,
            undefined,
            "快速评论"
          )}
          {renderButton(
            "ri:book-open-fill",
            "阅读模式",
            handleReadingModeToggle,
            isReadingMode,
            "阅读模式"
          )}
          {renderButton(
            "ri:message-3-fill",
            "热评弹幕",
            handleCommentBarrageToggle,
            isCommentBarrageVisible,
            "热评弹幕"
          )}
        </>
      )}

      {renderButton(
        "fa:arrow-up",
        "回到顶部",
        handleScrollToTop,
        undefined,
        "回到顶部"
      )}
    </div>
  );
}
