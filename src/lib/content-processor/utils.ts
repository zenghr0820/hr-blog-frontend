/**
 * content-processor 共享工具函数
 * 提供标题 ID 生成和锚点插入等通用能力，供 processors 和 pipeline 复用
 */

/** 将文本转换为 URL 友好的 slug 格式（小写、连字符分隔、保留中文） */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff\-]/g, "");
}

/** 为标题元素添加锚点链接，自动去重 ID */
export function addAnchorToHeading(heading: HTMLElement, usedIds: Set<string>): void {
  if (heading.querySelector("a.headerlink")) return;

  const text = heading.textContent?.trim() || "";
  if (!text) return;

  let baseId = heading.getAttribute("id") || slugify(text);
  let id = baseId;
  let counter = 1;

  while (usedIds.has(id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }
  usedIds.add(id);

  heading.setAttribute("id", id);

  const anchor = document.createElement("a");
  anchor.href = `#${id}`;
  anchor.className = "headerlink";
  anchor.title = text;
  anchor.innerHTML = "";

  heading.insertBefore(anchor, heading.firstChild);
}
