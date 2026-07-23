/**
 * content-processor 各处理器函数
 * 每个函数接收 Document 对象，对 HTML DOM 执行特定的规范化处理。
 * 这些处理器通过 pipeline.ts 组合成保存管道和编辑器清理管道。
 */
import { addAnchorToHeading } from "./utils";

/** 为所有 h1-h6 标题添加锚点链接，用于目录跳转 */
export function processHeadings(doc: Document, usedIds: Set<string>): void {
  doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(heading => {
    addAnchorToHeading(heading as HTMLElement, usedIds);
  });
}

/** 为 table 元素包裹 .table-container 容器，用于响应式横向滚动 */
export function wrapTables(doc: Document): void {
  doc.querySelectorAll("table").forEach(table => {
    if (table.parentElement?.classList.contains("table-container")) return;
    const container = document.createElement("div");
    container.className = "table-container";
    if (table.parentNode) {
      table.parentNode.insertBefore(container, table);
      container.appendChild(table);
    }
  });
}

/** 将缺少 thead 的表格中首行 th 提升为 thead，确保表格结构规范 */
export function normalizeTableHead(doc: Document): void {
  doc.querySelectorAll("table").forEach(table => {
    if (table.querySelector("thead")) return;

    const tbody = table.querySelector("tbody");
    const firstRow =
      tbody?.querySelector("tr") ?? Array.from(table.children).find(el => el.tagName.toLowerCase() === "tr");

    if (!firstRow) return;

    const cells = Array.from(firstRow.children);
    if (cells.length === 0) return;

    const isHeaderRow = cells.every(cell => cell.tagName.toLowerCase() === "th");
    if (!isHeaderRow) return;

    const thead = document.createElement("thead");
    thead.appendChild(firstRow);

    if (tbody && tbody.parentNode === table) {
      table.insertBefore(thead, tbody);
    } else {
      table.insertBefore(thead, table.firstChild);
    }
  });
}

/** 为非 data: 协议的 img 添加 loading="lazy" 属性，实现图片懒加载 */
export function addLazyLoading(doc: Document): void {
  doc.querySelectorAll("img").forEach(img => {
    const src = img.getAttribute("src");
    if (src && !src.startsWith("data:")) {
      img.setAttribute("loading", "lazy");
    }
  });
}

/** 还原 preserve-html-wrapper 占位元素为原始 HTML 内容，用于保留用户手写 HTML */
export function restorePreserveHtml(doc: Document): void {
  doc.querySelectorAll("div.preserve-html-wrapper[data-html]").forEach(wrapper => {
    const originalHtml = wrapper.getAttribute("data-html");
    if (originalHtml) {
      const temp = document.createElement("div");
      temp.innerHTML = originalHtml;
      while (temp.firstChild) {
        wrapper.parentNode?.insertBefore(temp.firstChild, wrapper);
      }
      wrapper.remove();
    }
  });
}

/** 处理 mermaid 占位元素，确保内部包含 <pre><code> 结构以供前端渲染 */
export function processMermaidPlaceholders(doc: Document): void {
  doc.querySelectorAll("div[data-mermaid-code]").forEach(div => {
    const code = div.getAttribute("data-mermaid-code") || "";
    if (code) {
      const pre = div.querySelector("pre");
      if (!pre) {
        const newPre = document.createElement("pre");
        const newCode = document.createElement("code");
        newCode.className = "language-mermaid";
        newCode.textContent = code;
        newPre.appendChild(newCode);
        div.innerHTML = "";
        div.appendChild(newPre);
      }
    }
  });
}

/** 将裸 <pre><code> 规范化为 md-editor-code 折叠面板结构，支持语言标签和行号 */
export function normalizeCodeBlocks(doc: Document): void {
  doc.querySelectorAll("pre").forEach(pre => {
    if (pre.closest(".md-editor-code")) return;
    if (pre.closest("[data-mermaid-code]") || pre.closest(".mermaid-block")) return;

    const code = pre.querySelector("code");
    if (!code) return;

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

    const details = doc.createElement("details");
    details.className = "md-editor-code";
    if (isOpen) {
      details.setAttribute("open", "");
    }
    if (isCollapsed) {
      details.setAttribute("data-collapsed", "true");
    }

    const summary = doc.createElement("summary");
    summary.className = "md-editor-code-head";
    summary.innerHTML = `<div class="code-lang">${displayLabel.toUpperCase()}</div>`;
    details.appendChild(summary);

    const newPre = doc.createElement("pre");
    const newCode = doc.createElement("code");
    if (language) {
      newCode.className = `language-${language}`;
      newCode.setAttribute("language", language);
    }
    const escapedText = codeText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    newCode.innerHTML =
      `<span class="md-editor-code-block">${escapedText}</span>` +
      `<span rn-wrapper="" aria-hidden="true">${lineNumberSpans}</span>`;
    newPre.appendChild(newCode);
    details.appendChild(newPre);

    pre.replaceWith(details);
  });
}

/** 规范化 tabs 组件，确保 active 状态在按钮和内容面板之间一致 */
export function normalizeTabs(doc: Document): void {
  doc.querySelectorAll(".tabs").forEach(tabsEl => {
    const buttons = tabsEl.querySelectorAll(".nav-tabs .tab");
    const items = tabsEl.querySelectorAll(".tab-contents .tab-item-content");
    if (buttons.length === 0 || items.length === 0) return;

    let activeIdx = Array.from(buttons).findIndex(b => b.classList.contains("active"));
    if (activeIdx < 0) activeIdx = 0;

    buttons.forEach((btn, i) => {
      btn.classList.toggle("active", i === activeIdx);
    });
    items.forEach((item, i) => {
      item.classList.toggle("active", i === activeIdx);
    });
  });
}

/** 清除 KaTeX 行内公式元素的 contenteditable 属性，避免编辑器误操作 */
export function cleanKatexAttributes(doc: Document): void {
  doc.querySelectorAll("[data-type='math-inline']").forEach(el => {
    el.removeAttribute("contenteditable");
  });
}

/** 修复任务列表属性：为含 checkbox 的 ul/li 补充 data-type="taskList"/"taskItem" 及相关样式 */
export function fixTaskListAttributes(doc: Document): void {
  doc.querySelectorAll("ul").forEach(ul => {
    if (ul.getAttribute("data-type") === "taskList") return;

    const taskItems = Array.from(ul.querySelectorAll(':scope > li')).filter(li => {
      if (li.getAttribute("data-type") === "taskItem") return false;
      const checkbox = li.querySelector(':scope > input[type="checkbox"]');
      return !!checkbox;
    });

    if (taskItems.length === 0) return;

    ul.setAttribute("data-type", "taskList");
    if (!ul.classList.contains("not-prose")) ul.classList.add("not-prose");
    if (!ul.classList.contains("pl-2")) ul.classList.add("pl-2");

    taskItems.forEach(li => {
      const checkbox = li.querySelector(':scope > input[type="checkbox"]') as HTMLInputElement | null;
      if (!checkbox) return;

      const checked = checkbox.checked || checkbox.hasAttribute("checked");
      li.setAttribute("data-type", "taskItem");
      li.setAttribute("data-checked", checked ? "true" : "false");

      checkbox.remove();
      const content = li.innerHTML.trim();
      li.innerHTML = `<label><input type="checkbox"${checked ? " checked" : ""}><span></span></label><div>${content || "<p></p>"}</div>`;
    });
  });
}

/** 移除标题中的锚点链接（a.headerlink），用于编辑器加载时还原为干净标题 */
export function removeHeadingAnchors(doc: Document): void {
  doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(heading => {
    const anchor = heading.querySelector("a.headerlink");
    if (anchor) anchor.remove();
  });
}
