/**
 * UI 状态管理
 * 用于管理快捷键、右键菜单等前端 UI 状态
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  // 快捷键功能是否启用
  isShortcutsEnabled: boolean;
  // 是否使用自定义右键菜单
  useCustomContextMenu: boolean;
  // 音乐播放器是否可见
  isMusicPlayerVisible: boolean;
  // 评论弹幕是否可见
  isCommentBarrageVisible: boolean;
  // 侧边栏是否可见
  isSidebarVisible: boolean;
  // 简洁主题是否开启（关闭背景图）
  isMinimalTheme: boolean;
  // 用户自定义主题色，null 表示未设置
  customPrimaryColor: string | null;
  // 博客主体宽度，"1200" 或 "1400"
  contentWidth: "1200" | "1400";
  // 切换快捷键启用状态
  toggleShortcuts: (value?: boolean) => void;
  // 切换右键菜单模式
  toggleContextMenuMode: (value?: boolean) => void;
  // 切换音乐播放器可见状态
  toggleMusicPlayer: (value?: boolean) => void;
  // 切换评论弹幕可见状态
  toggleCommentBarrage: (value?: boolean) => void;
  // 切换侧边栏可见状态
  toggleSidebar: (value?: boolean) => void;
  // 切换简洁主题
  toggleMinimalTheme: (value?: boolean) => void;
  // 设置自定义主题色
  setCustomPrimaryColor: (color: string | null) => void;
  // 设置博客主体宽度
  setContentWidth: (width: "1200" | "1400") => void;
  // 重置所有个性化设置
  resetPersonalization: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      isShortcutsEnabled: true,
      useCustomContextMenu: true,
      isMusicPlayerVisible: true, // ✅ 保持默认开启
      isCommentBarrageVisible: true,
      isSidebarVisible: true,
      isMinimalTheme: false,
      customPrimaryColor: null,
      contentWidth: "1200",

      toggleShortcuts: (value?: boolean) => {
        if (typeof value === "boolean") {
          set({ isShortcutsEnabled: value });
        } else {
          set({ isShortcutsEnabled: !get().isShortcutsEnabled });
        }
      },

      toggleContextMenuMode: (value?: boolean) => {
        if (typeof value === "boolean") {
          set({ useCustomContextMenu: value });
        } else {
          set({ useCustomContextMenu: !get().useCustomContextMenu });
        }
      },

      toggleMusicPlayer: (value?: boolean) => {
        if (typeof value === "boolean") {
          set({ isMusicPlayerVisible: value });
        } else {
          set({ isMusicPlayerVisible: !get().isMusicPlayerVisible });
        }
      },

      toggleCommentBarrage: (value?: boolean) => {
        if (typeof value === "boolean") {
          set({ isCommentBarrageVisible: value });
        } else {
          set({ isCommentBarrageVisible: !get().isCommentBarrageVisible });
        }
      },

      toggleSidebar: (value?: boolean) => {
        if (typeof value === "boolean") {
          set({ isSidebarVisible: value });
        } else {
          set({ isSidebarVisible: !get().isSidebarVisible });
        }
      },

      toggleMinimalTheme: (value?: boolean) => {
        if (typeof value === "boolean") {
          set({ isMinimalTheme: value });
        } else {
          set({ isMinimalTheme: !get().isMinimalTheme });
        }
      },

      setCustomPrimaryColor: (color: string | null) => {
        set({ customPrimaryColor: color });
      },

      setContentWidth: (width: "1200" | "1400") => {
        set({ contentWidth: width });
      },

      resetPersonalization: () => {
        set({ isMinimalTheme: false, customPrimaryColor: null, contentWidth: "1200" });
      },
    }),
    {
      name: "anheyu-ui-store",
      partialize: state => ({
        isShortcutsEnabled: state.isShortcutsEnabled,
        useCustomContextMenu: state.useCustomContextMenu,
        isMusicPlayerVisible: state.isMusicPlayerVisible,
        isCommentBarrageVisible: state.isCommentBarrageVisible,
        isSidebarVisible: state.isSidebarVisible,
        isMinimalTheme: state.isMinimalTheme,
        customPrimaryColor: state.customPrimaryColor,
        contentWidth: state.contentWidth,
      }),
    }
  )
);
