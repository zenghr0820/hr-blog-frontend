/**
 * 代码块图标与折叠 Hook
 * 为代码块添加交互元素：
 * - 复制按钮：点击复制代码，显示成功/失败图标反馈
 * - 展开/折叠按钮：控制代码块的展开和收起
 * - macOS 风格圆点：根据配置显示红黄绿圆点装饰
 * - 超长代码折叠：行数超过阈值时自动折叠并显示"展开更多"按钮
 */

import { useCallback } from "react";
import type { CodeBlockConfig } from "./use-code-block-config";

export function useCodeBlockIcons(config: CodeBlockConfig) {
  const { macStyle, codeMaxLines, collapsedHeight } = config;

  const initCodeBlockIcons = useCallback((container: HTMLElement) => {
    const expandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 448 512"><path fill="currentColor" d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7L86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/></svg>`;

    const expandMoreIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 448 512"><path fill="currentColor" d="M246.6 470.6c-12.5 12.5-32.8 12.5-45.3 0l-160-160c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L224 402.7l137.4-137.3c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3l-160 160zm160-352l-160 160c-12.5 12.5-32.8 12.5-45.3 0l-160-160c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L224 210.7L361.4 73.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3z"/></svg>`;

    const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512"><path fill="currentColor" d="M408 480H184a72 72 0 0 1-72-72V184a72 72 0 0 1 72-72h224a72 72 0 0 1 72 72v224a72 72 0 0 1-72 72"/><path fill="currentColor" d="M160 80h235.88A72.12 72.12 0 0 0 328 32H104a72 72 0 0 0-72 72v224a72.12 72.12 0 0 0 48 67.88V160a80 80 0 0 1 80-80"/></svg>`;

    const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 448 512"><path fill="currentColor" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`;

    const codeBlocks = container.querySelectorAll(".md-editor-code");

    codeBlocks.forEach(codeBlock => {
      const codeHead = codeBlock.querySelector(".md-editor-code-head");
      if (!codeHead) return;

      let lineCount = 0;
      const preElement = codeBlock.querySelector("pre");
      if (preElement) {
        const rnWrapper = preElement.querySelector("span[rn-wrapper]");
        if (rnWrapper) {
          lineCount = rnWrapper.children.length;
        } else {
          const codeContent = preElement.textContent || "";
          lineCount = (codeContent.match(/\n/g) || []).length + 1;
        }
      }

      const savedCollapsed = codeBlock.getAttribute("data-collapsed");
      const needsCollapse = savedCollapsed === "true" || (savedCollapsed === null && codeMaxLines !== -1 && lineCount > codeMaxLines);

      let copyBtn = codeHead.querySelector(".copy-button");
      if (!copyBtn) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "copy-button";
        btn.innerHTML = copyIcon;
        btn.setAttribute("data-copy-icon", copyIcon);
        btn.setAttribute("data-check-icon", checkIcon);
        btn.setAttribute("title", "复制代码");
        codeHead.appendChild(btn);
        copyBtn = btn;
      } else if (copyBtn.tagName !== "BUTTON") {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = copyBtn.className;
        const t = copyBtn.getAttribute("title");
        if (t) btn.setAttribute("title", t);
        const dc = copyBtn.getAttribute("data-copy-icon");
        const dch = copyBtn.getAttribute("data-check-icon");
        if (dc) btn.setAttribute("data-copy-icon", dc);
        if (dch) btn.setAttribute("data-check-icon", dch);
        btn.innerHTML = copyBtn.innerHTML;
        copyBtn.replaceWith(btn);
        copyBtn = btn;
      } else {
        (copyBtn as HTMLButtonElement).type = "button";
        if (!copyBtn.querySelector("svg")) {
          copyBtn.innerHTML = copyIcon;
          copyBtn.setAttribute("data-copy-icon", copyIcon);
          copyBtn.setAttribute("data-check-icon", checkIcon);
        }
      }

      let expandBtn = codeHead.querySelector(".expand") as HTMLElement | null;
      if (!expandBtn) {
        expandBtn = document.createElement("span");
        expandBtn.className = "expand";
        expandBtn.innerHTML = expandIcon;
        expandBtn.setAttribute(
          "onclick",
          `event.preventDefault(); event.stopPropagation(); const details = this.closest('details'); if(details) { details.open = !details.open; }`
        );
        codeHead.insertBefore(expandBtn, codeHead.firstChild);
      } else if (!expandBtn.querySelector("svg")) {
        expandBtn.innerHTML = expandIcon;
      }

      const existingDots = codeHead.querySelector(".mac-dots");
      if (macStyle) {
        if (!existingDots) {
          const dotsWrapper = document.createElement("span");
          dotsWrapper.className = "mac-dots";
          dotsWrapper.innerHTML = `<span class="mac-dot red"></span><span class="mac-dot yellow"></span><span class="mac-dot green"></span>`;
          codeHead.insertBefore(dotsWrapper, expandBtn?.nextSibling || codeHead.firstChild);
          codeHead.classList.add("has-mac-dots");
        }
      } else {
        if (existingDots) existingDots.remove();
        codeHead.classList.remove("has-mac-dots");
      }

      if (needsCollapse) {
        codeBlock.classList.add("is-collapsible");

        const existingExpandBtn = codeBlock.querySelector(".code-expand-btn");
        if (!existingExpandBtn || !existingExpandBtn.classList.contains("is-expanded")) {
          codeBlock.setAttribute("open", "");
          codeBlock.classList.add("is-collapsed");
          if (preElement) {
            (preElement as HTMLElement).style.height = `${collapsedHeight}px`;
            (preElement as HTMLElement).style.overflow = "hidden";
          }
        }

        let expandMoreBtn = codeBlock.querySelector(".code-expand-btn") as HTMLElement | null;
        if (!expandMoreBtn) {
          expandMoreBtn = document.createElement("div");
          expandMoreBtn.className = "code-expand-btn";
          expandMoreBtn.innerHTML = `<i>${expandMoreIcon}</i>`;
          expandMoreBtn.setAttribute(
            "onclick",
            `const container = this.closest('details.md-editor-code'); const pre = container.querySelector('pre'); const icon = this.querySelector('i'); if(container.classList.contains('is-collapsed')) { container.classList.remove('is-collapsed'); if(pre) { pre.style.height = ''; pre.style.overflow = ''; } if(icon) { icon.style.transform = 'rotate(180deg)'; } this.classList.add('is-expanded'); } else { container.classList.add('is-collapsed'); if(pre) { pre.style.height = '${collapsedHeight}px'; pre.style.overflow = 'hidden'; } if(icon) { icon.style.transform = 'rotate(0deg)'; } this.classList.remove('is-expanded'); }`
          );
          codeBlock.appendChild(expandMoreBtn);
        } else if (!expandMoreBtn.querySelector("svg")) {
          const iconWrapper = expandMoreBtn.querySelector("i");
          if (iconWrapper) {
            iconWrapper.innerHTML = expandMoreIcon;
          } else {
            expandMoreBtn.innerHTML = `<i>${expandMoreIcon}</i>`;
          }
        }
      } else {
        codeBlock.classList.remove("is-collapsible", "is-collapsed");
        const existingExpandMoreBtn = codeBlock.querySelector(".code-expand-btn");
        if (existingExpandMoreBtn) existingExpandMoreBtn.remove();

        codeBlock.setAttribute("open", "");
        if (preElement) {
          (preElement as HTMLElement).style.height = "";
          (preElement as HTMLElement).style.overflow = "";
        }
      }
    });
  }, [macStyle, codeMaxLines, collapsedHeight]);

  return { initCodeBlockIcons };
}
