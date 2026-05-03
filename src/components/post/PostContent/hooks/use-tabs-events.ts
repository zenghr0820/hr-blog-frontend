/**
 * 选项卡事件 Hook
 * 为 .tabs 组件的导航按钮绑定切换事件，
 * 点击选项卡时切换 active 状态，同步更新对应的内容面板显示。
 */

import { useCallback } from "react";

export function useTabsEvents() {
  const initTabsEvents = useCallback((container: HTMLElement) => {
    const tabContainers = container.querySelectorAll(".tabs");

    tabContainers.forEach(tabContainer => {
      const tabs = tabContainer.querySelectorAll(".nav-tabs .tab");
      const contents = tabContainer.querySelectorAll(".tab-contents .tab-item-content");

      tabs.forEach((tab, index) => {
        (tab as HTMLElement).setAttribute(
          "onclick",
          `var c=this.closest('.tabs');` +
          `c.querySelectorAll('.nav-tabs .tab').forEach(function(t){t.classList.remove('active')});` +
          `c.querySelectorAll('.tab-contents .tab-item-content').forEach(function(p){p.classList.remove('active')});` +
          `this.classList.add('active');` +
          `var panels=c.querySelectorAll('.tab-contents .tab-item-content');` +
          `if(panels[${index}])panels[${index}].classList.add('active');`
        );
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
  }, []);

  return { initTabsEvents };
}
