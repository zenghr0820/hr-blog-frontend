/**
 * marked-extensions Obsidian Callout 解析器
 * 解析 Markdown blockquote 中的 > [!type] 标题 语法，
 * 支持 Obsidian 风格的 callout 类型、折叠标记和别名映射。
 */

export interface CalloutMatch {
  raw: string;
  calloutType: string;
  title: string;
  fold: string;
  body: string;
}

const CALLOUT_RE = /^\[!([\w-]+)\]([+-]?)\s*(.*)/;

export const CALLOUT_TYPES: Record<string, string> = {
  note: "note",
  info: "info",
  tip: "tip",
  success: "success",
  warning: "warning",
  danger: "danger",
  question: "question",
  quote: "quote",
  example: "example",
  abstract: "abstract",
  failure: "failure",
  todo: "todo",
  bug: "danger",
  error: "danger",
  fail: "failure",
  missing: "failure",
  caution: "warning",
  attention: "warning",
  check: "success",
  done: "success",
  hint: "tip",
  important: "tip",
  help: "question",
  faq: "question",
  cite: "quote",
  summary: "abstract",
  tldr: "abstract",
};

export function resolveCalloutType(raw: string): string {
  const lower = raw.toLowerCase();
  return CALLOUT_TYPES[lower] || lower;
}

export function matchObsidianCallout(src: string): CalloutMatch | null {
  const normalized = src.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");

  if (lines.length === 0) return null;

  const firstLine = lines[0];
  const firstMatch = firstLine.match(/^>\s*\[!([\w-]+)\]([+-]?)\s*(.*)/);
  if (!firstMatch) return null;

  const rawType = firstMatch[1];
  const calloutType = resolveCalloutType(rawType);
  const fold = firstMatch[2];
  const title = firstMatch[3].trim();

  const bodyLines: string[] = [];
  let endIdx = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^>\s?/.test(line)) {
      bodyLines.push(line.replace(/^>\s?/, ""));
      endIdx = i;
    } else if (/^>\s*$/.test(line)) {
      bodyLines.push("");
      endIdx = i;
    } else {
      break;
    }
  }

  const raw = lines.slice(0, endIdx + 1).join("\n");
  const body = bodyLines.join("\n").replace(/\n$/, "");

  return { raw, calloutType, title, fold, body };
}
