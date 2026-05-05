/**
 * 密码保护内容事件 Hook
 * 为密码保护内容块绑定事件：
 * - 点击标题栏折叠/展开内容
 * - 输入密码验证后解锁内容，将预览区替换为真实 HTML
 * - 验证成功后将 access_token 存入 localStorage 以便后续自动解锁
 * 返回清理函数用于卸载事件监听器。
 */

import { useCallback } from "react";
import { addToast } from "@heroui/react";
import { articleApi } from "@/lib/api/article";

export function usePasswordContentEvents() {
  const initPasswordContentEvents = useCallback((container: HTMLElement): (() => void) | undefined => {
    const cleanups: (() => void)[] = [];

    const containers = container.querySelectorAll(".password-content-editor-preview");
    containers.forEach(cont => {
      // 点击标题栏折叠/展开
      const header = cont.querySelector(".password-content-header") as HTMLElement | null;
      if (header && header.dataset.collapseBound !== "true") {
        header.dataset.collapseBound = "true";
        const handleHeaderClick = (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.closest(".password-input") || target.closest(".password-verify-btn")) return;
          cont.classList.toggle("password-collapsed");
        };

        header.addEventListener("click", handleHeaderClick);
        cleanups.push(() => header.removeEventListener("click", handleHeaderClick));
      }

      const btn = cont.querySelector(".password-verify-btn") as HTMLElement | null;
      const input = cont.querySelector(".password-input") as HTMLInputElement | null;
      if (!btn || !input) return;
      // 防止重复绑定事件
      if (btn.dataset.eventBound === "true") return;
      btn.dataset.eventBound = "true";

      // 优先从按钮获取 contentId，其次从容器获取
      const contentId = btn.getAttribute("data-content-id") || cont.getAttribute("data-content-id") || "";

      const handleVerify = async () => {
        if (!input.value.trim()) {
          addToast({ title: "提示", description: "请输入密码", color: "warning" });
          return;
        }

        try {
          // 从 URL 中提取文章 slug
          const pathParts = window.location.pathname.split("/").filter(Boolean);
          const slug = pathParts[pathParts.length - 1] || "";

          const result = await articleApi.verifyArticlePassword(slug, input.value.trim(), "block", contentId);

          if (result.success && result.content_html) {
            const preview = cont.querySelector(".password-content-preview");
            if (preview) {
              preview.innerHTML = result.content_html;
            }

            cont.removeAttribute("data-locked");
            cont.classList.add("password-content-unlocked");

            const badge = cont.querySelector(".password-badge");
            if (badge) {
              badge.textContent = "已解锁";
            }

            if (result.access_token) {
              try {
                const stored = JSON.parse(localStorage.getItem("article_access_tokens") || "{}");
                const slug = window.location.pathname.split("/").filter(Boolean).pop() || "";
                if (!stored[slug]) stored[slug] = { article: "", blocks: [] };
                if (!Array.isArray(stored[slug].blocks)) stored[slug].blocks = [];
                const exists = stored[slug].blocks.some((b: { contentId: string }) => b.contentId === contentId);
                if (!exists) {
                  stored[slug].blocks.push({ contentId, token: result.access_token });
                }
                localStorage.setItem("article_access_tokens", JSON.stringify(stored));
              } catch {}
            }
          } else {
            addToast({ title: "密码错误", description: "请检查密码后重试", color: "danger" });
          }
        } catch {
          addToast({ title: "密码错误", description: "请检查密码后重试", color: "danger" });
        }
      };

      btn.addEventListener("click", handleVerify);
      cleanups.push(() => btn.removeEventListener("click", handleVerify));

      // 回车键触发验证
      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleVerify();
        }
      };

      input.addEventListener("keydown", handleKeydown);
      cleanups.push(() => input.removeEventListener("keydown", handleKeydown));
    });

    return () => cleanups.forEach(fn => fn());
  }, []);

  return { initPasswordContentEvents };
}
