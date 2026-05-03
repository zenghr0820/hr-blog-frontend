/**
 * 链接卡片规范化 Hook
 * 修复链接卡片（.anzhiyu-tag-link）的 DOM 结构，确保：
 * - Iconify 图标从 <span> 转换为 <img> 以兼容懒加载
 * - 旧版 anzhiyufont 图标迁移到 Iconify 格式
 * - 补全缺失的标题、站点名、提示文本和箭头图标
 * - 还原 data-src 懒加载图片的真实 src
 */

import { useCallback } from "react";

export function useLinkCardNormalize() {
  const normalizeLinkCardStructure = useCallback((container: HTMLElement) => {
    const toIconifySvgUrl = (iconifyName: string): string => {
      const [prefix, name] = iconifyName.split(":");
      if (!prefix || !name) return "";
      return `https://api.iconify.design/${prefix}/${name}.svg?color=currentColor`;
    };
    const mapLegacyIconToFa6 = (legacyIconClass: string): string => {
      if (legacyIconClass === "anzhiyu-icon-angle-right") return "fa6-solid:angle-right";
      return "rivet-icons:link";
    };
    const createFa6IconImage = (iconifyName: string, className?: string): HTMLImageElement => {
      const iconImg = document.createElement("img");
      iconImg.src = toIconifySvgUrl(iconifyName);
      iconImg.alt = "";
      iconImg.loading = "eager";
      iconImg.setAttribute("data-iconify", iconifyName);
      if (className) iconImg.className = className;
      return iconImg;
    };

    const linkCards = container.querySelectorAll(".anzhiyu-tag-link .tag-Link");
    linkCards.forEach(cardNode => {
      const card = cardNode as HTMLElement;
      const bottom = card.querySelector(".tag-link-bottom") as HTMLElement | null;
      if (!bottom) return;
      const left = bottom.querySelector(".tag-link-left") as HTMLElement | null;

      if (left) {
        const iconifySpans = left.querySelectorAll(".iconify[data-icon]");
        iconifySpans.forEach(span => {
          const iconName = (span.getAttribute("data-icon") || "").trim();
          const [prefix, name] = iconName.split(":");
          if (!prefix || !name) return;
          const iconImg = createFa6IconImage(`${prefix}:${name}`);
          iconImg.alt = iconName;
          span.replaceWith(iconImg);
        });

        const legacyIconNodes = left.querySelectorAll("i.anzhiyufont");
        legacyIconNodes.forEach(node => {
          const legacyIconClass = Array.from(node.classList).find(cls => cls.startsWith("anzhiyu-icon-")) || "";
          const mappedIcon = mapLegacyIconToFa6(legacyIconClass);
          node.replaceWith(createFa6IconImage(mappedIcon));
        });

        if (!left.querySelector("img, i")) {
          left.appendChild(createFa6IconImage("rivet-icons:link"));
        }
      }

      const right = bottom.querySelector(".tag-link-right") as HTMLElement | null;
      if (right) {
        const titleEl = right.querySelector(".tag-link-title") as HTMLElement | null;
        const fallbackTitle = (card as HTMLAnchorElement).getAttribute("href") || "链接卡片";
        if (titleEl && !(titleEl.textContent || "").trim()) {
          titleEl.textContent = fallbackTitle;
        }

        let sitenameEl = right.querySelector(".tag-link-sitename") as HTMLElement | null;
        if (!sitenameEl) {
          sitenameEl = document.createElement("span");
          sitenameEl.className = "tag-link-sitename";
          right.appendChild(sitenameEl);
        }
        if (!(sitenameEl.textContent || "").trim()) {
          sitenameEl.textContent = "网站名称";
        }
      }

      const tipsEl = card.querySelector(".tag-link-tips") as HTMLElement | null;
      if (tipsEl && !(tipsEl.textContent || "").trim()) {
        tipsEl.textContent = "引用站外地址";
      }

      const hasArrow = Array.from(bottom.children).some(
        child =>
          (child.tagName === "I" &&
            child.classList.contains("anzhiyufont") &&
            child.classList.contains("anzhiyu-icon-angle-right")) ||
          (child.tagName === "IMG" && (child as HTMLImageElement).dataset.iconify === "fa6-solid:angle-right") ||
          child.classList.contains("tag-link-arrow-icon")
      );

      const legacyArrowNodes = bottom.querySelectorAll("i.anzhiyufont.anzhiyu-icon-angle-right");
      legacyArrowNodes.forEach(node => {
        node.replaceWith(createFa6IconImage("fa6-solid:angle-right", "tag-link-arrow-icon"));
      });

      if (!hasArrow) {
        bottom.appendChild(createFa6IconImage("fa6-solid:angle-right", "tag-link-arrow-icon"));
      }
    });

    const linkCardIcons = container.querySelectorAll(".anzhiyu-tag-link .tag-link-left img[data-src]");
    linkCardIcons.forEach((img: Element) => {
      const el = img as HTMLImageElement;
      const dataSrc = el.getAttribute("data-src");
      if (dataSrc) {
        el.src = dataSrc;
        el.removeAttribute("data-src");
        el.classList.remove("lazy-image", "lazy-loaded", "lazy-loading");
        el.removeAttribute("data-lazy-processed");
      }
    });
  }, []);

  return { normalizeLinkCardStructure };
}
