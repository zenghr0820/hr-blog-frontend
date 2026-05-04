/**
 * 选项卡事件 Hook
 * 为 .tabs 组件的导航按钮绑定切换事件，
 * 点击选项卡时切换 active 状态，同步更新对应的内容面板显示。
 * 返回清理函数用于卸载事件监听器。
 */

import { useCallback } from "react";

export function useTabsEvents() {
  const initTabsEvents = useCallback((container: HTMLElement): (() => void) | undefined => {
    const cleanups: (() => void)[] = [];

    const tabContainers = container.querySelectorAll(".tabs");

    tabContainers.forEach(tabContainer => {
      const tabs = tabContainer.querySelectorAll(".nav-tabs .tab");
      const contents = tabContainer.querySelectorAll(".tab-contents .tab-item-content");

      tabs.forEach((tab, index) => {
        const handleClick = () => {
          tabContainer.querySelectorAll(".nav-tabs .tab").forEach(t => t.classList.remove("active"));
          tabContainer.querySelectorAll(".tab-contents .tab-item-content").forEach(p => p.classList.remove("active"));
          tab.classList.add("active");
          const panels = tabContainer.querySelectorAll(".tab-contents .tab-item-content");
          if (panels[index]) panels[index].classList.add("active");
        };

        tab.addEventListener("click", handleClick);
        cleanups.push(() => tab.removeEventListener("click", handleClick));
      });

      const activeBtn = tabContainer.querySelector(".nav-tabs .tab.active");
      if (tabs.length > 0) {
        if (!activeBtn) {
          tabs[0].classList.add("active");
        }
        const activeIdx = activeBtn ? Array.from(tabs).indexOf(activeBtn) : 0;
        if (!tabContainer.querySelector(".tab-item-content.active") && contents[activeIdx]) {
          contents[activeIdx].classList.add("active");
        }
      }
    });

    return () => cleanups.forEach(fn => fn());
  }, []);

  return { initTabsEvents };
}
