/**
 * marked-extensions 容器解析器
 * 负责解析 Markdown 中的自定义容器语法（:::xxx 和 !!!xxx），
 * 支持嵌套、代码块跳过和别名映射。
 */

export interface ContainerAliasEntry {
  target: string;
  params: string;
}

const containerAliasMap = new Map<string, ContainerAliasEntry>();

/** 设置容器别名映射，允许将一个容器名映射到另一个容器并附加参数 */
export function setContainerAliases(aliases: Array<{ name: string; target: string; params: string }>) {
  containerAliasMap.clear();
  for (const a of aliases) {
    containerAliasMap.set(a.name.toLowerCase(), { target: a.target.toLowerCase(), params: a.params || "" });
  }
}

export function getContainerAliases(): Map<string, ContainerAliasEntry> {
  return containerAliasMap;
}

/** 解析容器标签名，若存在别名映射则返回目标名和附加参数 */
export function resolveContainerAlias(tagName: string): { resolvedName: string; extraParams: string } {
  const entry = containerAliasMap.get(tagName.toLowerCase());
  if (entry) {
    return { resolvedName: entry.target, extraParams: entry.params };
  }
  return { resolvedName: tagName, extraParams: "" };
}

/** 匹配 :::xxx 容器块语法，支持嵌套和代码块跳过，返回标签名、参数和内容体 */
export function matchContainerBlock(src: string): { raw: string; tagName: string; params: string; body: string } | null {
  const normalized = src.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const openMatch = normalized.match(/^[ \t]*:::[ \t]*(\w[\w-]*)[ \t]*(.*?)[ \t]*\n/);
  if (!openMatch) return null;

  const tagName = openMatch[1];
  const params = openMatch[2].trim();
  let pos = openMatch[0].length;
  let depth = 1;
  let inCode = false;
  let codeMark = "";

  while (pos < normalized.length && depth > 0) {
    const lineEnd = normalized.indexOf("\n", pos);
    const line = lineEnd === -1
      ? normalized.slice(pos).trim()
      : normalized.slice(pos, lineEnd).trim();

    const cm = line.match(/^(`{3,}|~{3,})/);
    if (cm) {
      if (!inCode) {
        inCode = true;
        codeMark = cm[1];
      } else if (line === codeMark) {
        inCode = false;
        codeMark = "";
      }
    }

    if (!inCode) {
      if (/^:::\s*\w/.test(line)) depth++;
      else if (line === ":::") depth--;
    }

    if (lineEnd === -1) {
      pos = normalized.length;
      break;
    }
    pos = lineEnd + 1;
  }

  if (depth !== 0) return null;

  const bodyEnd = normalized.lastIndexOf(":::", pos - 1);
  const body = normalized.slice(openMatch[0].length, bodyEnd).replace(/\n$/, "");
  return { raw: normalized.slice(0, pos), tagName, params, body };
}

/** 告示类型集合，用于 !!! 语法的类型校验 */
export const ADMONITION_TYPES = new Set(["note", "tip", "warning", "danger", "success", "info"]);

export const ADMONITION_OPEN_RE = /^[ \t]*!!![ \t]*(\w[\w-]*)[ \t]*(.*?)[ \t]*\n/;
export const ADMONITION_NESTED_OPEN_RE = /^!!!\s*\w[\w-]*\b/;
export const ADMONITION_CLOSE_RE = /(?:^|\s)!!!$/;

/** 匹配 !!!xxx 告示块语法，支持嵌套和代码块跳过，返回标签名、参数和内容体 */
export function matchAdmonitionBlock(src: string): { raw: string; tagName: string; params: string; body: string } | null {
  const normalized = src.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const openMatch = normalized.match(ADMONITION_OPEN_RE);

  if (!openMatch) return null;

  const tagName = openMatch[1];
  const params = openMatch[2].trim();
  let pos = openMatch[0].length;
  let depth = 1;
  let inCode = false;
  let codeMark = "";

  while (pos < normalized.length && depth > 0) {
    const lineEnd = normalized.indexOf("\n", pos);
    const line = lineEnd === -1
      ? normalized.slice(pos).trim()
      : normalized.slice(pos, lineEnd).trim();

    const cm = line.match(/^(`{3,}|~{3,})/);
    if (cm) {
      if (!inCode) {
        inCode = true;
        codeMark = cm[1];
      } else if (line === codeMark) {
        inCode = false;
        codeMark = "";
      }
    }

    if (!inCode) {
      if (ADMONITION_NESTED_OPEN_RE.test(line)) depth++;
      else if (ADMONITION_CLOSE_RE.test(line)) depth--;
    }

    if (lineEnd === -1) {
      pos = normalized.length;
      break;
    }
    pos = lineEnd + 1;
  }

  if (depth !== 0) return null;

  const bodyEnd = normalized.lastIndexOf("!!!", pos - 1);
  const body = normalized.slice(openMatch[0].length, bodyEnd).replace(/\n$/, "");
  return { raw: normalized.slice(0, pos), tagName, params, body };
}
