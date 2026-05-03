/**
 * 代码块规范化 Hook
 * 将裸 <pre><code> 元素转换为 md-editor-code 折叠面板结构，
 * 添加语言标签、行号占位和折叠属性，与编辑器保存格式保持一致。
 */

import { useCallback } from "react";

export function useCodeBlockNormalize() {
  const normalizeCodeBlocks = useCallback((container: HTMLElement) => {
    const pres = container.querySelectorAll("pre");
    pres.forEach(pre => {
      if (pre.closest(".md-editor-code")) return;
      if (pre.closest("[data-mermaid-code]") || pre.closest(".mermaid-block")) return;

      const code = pre.querySelector("code");
      if (!code) return;
      if (code.classList.contains("language-mermaid")) return;

      const langMatch = code.className.match(/language-(\w+)/);
      const language = langMatch ? langMatch[1] : "";
      const title = pre.getAttribute("data-title") || "";
      const displayLabel = title || language || "plaintext";
      const codeText = code.textContent || "";
      const lines = codeText.split("\n");
      if (lines[lines.length - 1] === "") lines.pop();

      const isOpen = pre.getAttribute("data-open") !== "false";
      const isCollapsed = pre.getAttribute("data-collapsed") === "true";

      const lineNumberSpans = lines.map(() => "<span></span>").join("");

      const details = document.createElement("details");
      details.className = "md-editor-code";
      if (isOpen) {
        details.setAttribute("open", "");
      }
      if (isCollapsed) {
        details.setAttribute("data-collapsed", "true");
      }

      const summary = document.createElement("summary");
      summary.className = "md-editor-code-head";
      summary.innerHTML = `<div class="code-lang">${displayLabel.toUpperCase()}</div>`;
      details.appendChild(summary);

      const newPre = document.createElement("pre");
      const newCode = document.createElement("code");
      if (language) {
        newCode.className = `language-${language}`;
        newCode.setAttribute("language", language);
      }
      newCode.innerHTML =
        `<span class="md-editor-code-block">${codeText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>` +
        `<span rn-wrapper="" aria-hidden="true">${lineNumberSpans}</span>`;
      newPre.appendChild(newCode);
      details.appendChild(newPre);

      pre.replaceWith(details);
    });
  }, []);

  return { normalizeCodeBlocks };
}
