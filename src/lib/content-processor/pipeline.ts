/**
 * content-processor 管道编排
 * 将各处理器函数组合为两条管道：
 * - savePipeline：文章保存前对 HTML 进行规范化（添加锚点、包裹表格、懒加载等）
 * - cleanPipeline：编辑器加载时对 HTML 进行清理（移除锚点、修复任务列表等）
 */

import {
  processHeadings,
  wrapTables,
  normalizeTableHead,
  addLazyLoading,
  restorePreserveHtml,
  processMermaidPlaceholders,
  normalizeCodeBlocks,
  normalizeTabs,
  cleanKatexAttributes,
  fixTaskListAttributes,
  removeHeadingAnchors,
} from "./processors";

type DocProcessor = (doc: Document) => void;
type DocProcessorWithIds = (doc: Document, usedIds: Set<string>) => void;

/** 管道执行引擎：将 HTML 解析为 Document，依次执行各处理器步骤，返回处理后的 HTML */
function runPipeline(html: string, steps: Array<DocProcessor | { fn: DocProcessorWithIds; withIds: true }>): string {
  if (!html || typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const usedIds = new Set<string>();
  for (const step of steps) {
    if ("withIds" in step) {
      step.fn(doc, usedIds);
    } else {
      step(doc);
    }
  }
  return doc.body.innerHTML;
}

/** 保存管道：文章保存前执行，规范化 HTML 结构以适配前端渲染 */
const savePipeline: Array<DocProcessor | { fn: DocProcessorWithIds; withIds: true }> = [
  { fn: processHeadings, withIds: true },
  wrapTables,
  normalizeTableHead,
  addLazyLoading,
  restorePreserveHtml,
  processMermaidPlaceholders,
  normalizeCodeBlocks,
  normalizeTabs,
  cleanKatexAttributes,
];

/** 对 HTML 执行保存管道处理 */
export function processHtmlForSave(html: string): string {
  return runPipeline(html, savePipeline);
}

/** 编辑器清理管道：加载后端 HTML 到编辑器前执行，清理编辑器不需要的属性并修复结构 */
const cleanPipeline: Array<DocProcessor | { fn: DocProcessorWithIds; withIds: true }> = [
  removeHeadingAnchors,
  fixTaskListAttributes,
];

/** 对 HTML 执行编辑器清理管道处理 */
export function cleanHtmlForEditor(html: string): string {
  return runPipeline(html, cleanPipeline);
}
