/**
 * marked-extensions 任务列表修复
 * 修复后端 HTML 中任务列表缺少 data-type 属性的问题，
 * 将含 checkbox 的 ul/li 转换为 Tiptap 兼容的 taskList/taskItem 结构。
 */

export function fixTaskListHtml(html: string): string {
  if (typeof window === "undefined" || !html.includes('type="checkbox"')) return html;

  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.querySelectorAll("li").forEach(li => {
    const checkbox = li.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    if (!checkbox) return;

    const checked = checkbox.checked || checkbox.hasAttribute("checked");
    li.setAttribute("data-type", "taskItem");
    li.setAttribute("data-checked", checked ? "true" : "false");

    checkbox.remove();
    const content = li.innerHTML.trim();
    li.innerHTML = `<label><input type="checkbox"${checked ? " checked" : ""}><span></span></label><div>${content || "<p></p>"}</div>`;
  });

  doc.querySelectorAll("ul").forEach(ul => {
    if (ul.querySelector(':scope > li[data-type="taskItem"]')) {
      ul.setAttribute("data-type", "taskList");
      ul.classList.add("not-prose", "pl-2");
    }
  });

  return doc.body.innerHTML;
}
