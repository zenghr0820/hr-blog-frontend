/**
 * marked-extensions 共享工具函数
 * 提供 HTML 转义和属性提取等通用能力，供容器渲染器和行内渲染器复用
 */

/** 转义 HTML 特殊字符，防止 XSS 注入 */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** 从属性字符串中提取指定属性的值，支持引号和无引号两种格式 */
export function extractAttr(str: string, name: string): string {
  const m = str.match(new RegExp(`${name}\\s*=\\s*["']([^"']*?)["']`));
  if (m) return m[1];
  const m2 = str.match(new RegExp(`${name}\\s*=\\s*(\\S+)`));
  return m2 ? m2[1] : "";
}
