"use client";

/**
 * ObsidianCalloutBlock 扩展
 * Obsidian 风格块级 Callout 节点，支持 > [!type] 标题 语法
 * 前台渲染 HTML: <div class="callout" data-callout="type">...</div>
 * 折叠版本: <details class="callout" data-callout="type" data-callout-fold="+/-">...</details>
 * 导出 Markdown 使用 > [!type] 标题 语法（见 turndown-rules / marked-extensions）
 */
import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";
import { getCalloutIcon } from "@/lib/marked-extensions/callout-icons";

type CalloutType =
  | "note"
  | "info"
  | "tip"
  | "success"
  | "warning"
  | "danger"
  | "question"
  | "quote"
  | "example"
  | "abstract"
  | "failure"
  | "todo"
  | "bug";

interface TypeOption {
  value: CalloutType;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { value: "note", label: "笔记", icon: "✏️", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)" },
  { value: "info", label: "信息", icon: "ℹ️", color: "#6366f1", bg: "rgba(99, 102, 241, 0.08)" },
  { value: "tip", label: "提示", icon: "🔥", color: "#10b981", bg: "rgba(16, 185, 129, 0.08)" },
  { value: "success", label: "成功", icon: "✅", color: "#22c55e", bg: "rgba(34, 197, 94, 0.08)" },
  { value: "warning", label: "警告", icon: "⚠️", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)" },
  { value: "danger", label: "危险", icon: "⚡", color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)" },
  { value: "question", label: "问题", icon: "❓", color: "#eab308", bg: "rgba(234, 179, 8, 0.08)" },
  { value: "quote", label: "引用", icon: "💬", color: "#6b7280", bg: "rgba(107, 114, 128, 0.08)" },
  { value: "example", label: "示例", icon: "📋", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.08)" },
  { value: "abstract", label: "摘要", icon: "📝", color: "#14b8a6", bg: "rgba(20, 184, 166, 0.08)" },
  { value: "failure", label: "失败", icon: "❌", color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)" },
  { value: "todo", label: "待办", icon: "☑️", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)" },
  { value: "bug", label: "缺陷", icon: "🐛", color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)" },
];

const ALIAS_MAP: Record<string, CalloutType> = {
  hint: "tip",
  important: "tip",
  caution: "warning",
  attention: "warning",
  check: "success",
  done: "success",
  error: "danger",
  fail: "failure",
  missing: "failure",
  help: "question",
  faq: "question",
  cite: "quote",
  summary: "abstract",
  tldr: "abstract",
};

function resolveType(raw: string): CalloutType {
  const lower = raw.toLowerCase() as CalloutType;
  if (TYPE_OPTIONS.some(o => o.value === lower)) return lower;
  return ALIAS_MAP[lower] || "note";
}

function getTypeOption(type: string): TypeOption {
  const resolved = resolveType(type);
  return TYPE_OPTIONS.find(o => o.value === resolved) ?? TYPE_OPTIONS[0];
}

function TypeSelector({
  current,
  onChange,
}: {
  current: CalloutType;
  onChange: (t: CalloutType) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as globalThis.Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const opt = getTypeOption(current);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 8px",
          borderRadius: "4px",
          border: "1px solid",
          borderColor: opt.color,
          background: opt.bg,
          color: opt.color,
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          lineHeight: 1.4,
        }}
        title="切换类型"
      >
        {opt.icon} {opt.label}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            background: "var(--card, #fff)",
            border: "1px solid var(--border, #e3e8f7)",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            padding: "4px",
            minWidth: "120px",
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {TYPE_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={e => {
                e.stopPropagation();
                onChange(o.value);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                width: "100%",
                padding: "6px 8px",
                borderRadius: "4px",
                border: "none",
                background: current === o.value ? o.bg : "transparent",
                color: current === o.value ? o.color : "var(--foreground, #333)",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {o.icon} {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ObsidianCalloutBlockView({ node, updateAttributes }: NodeViewProps) {
  const [titleEditing, setTitleEditing] = useState(false);
  const calloutType = (node.attrs.calloutType as string) || "note";
  const title = (node.attrs.title as string) || "";
  const fold = (node.attrs.fold as string) || "";
  const opt = getTypeOption(calloutType);

  return (
    <NodeViewWrapper className="obsidian-callout-block-wrapper my-3">
      <div
        style={{
          background: opt.bg,
          border: `1px solid color-mix(in srgb, ${opt.color} 25%, transparent)`,
          borderRadius: "4px",
          padding: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "0.5rem",
          }}
          contentEditable={false}
        >
          <TypeSelector
            current={resolveType(calloutType)}
            onChange={t => updateAttributes({ calloutType: t })}
          />
          {titleEditing ? (
            <input
              type="text"
              value={title}
              placeholder="输入标题（留空使用默认）"
              onChange={e => updateAttributes({ title: e.target.value })}
              onBlur={() => setTitleEditing(false)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === "Escape") setTitleEditing(false);
              }}
              onClick={e => e.stopPropagation()}
              style={{
                flex: 1,
                border: "1px solid var(--border, #e3e8f7)",
                borderRadius: "4px",
                padding: "2px 6px",
                fontSize: "14px",
                fontWeight: 600,
                color: opt.color,
                background: "transparent",
                outline: "none",
              }}
              autoFocus
            />
          ) : title ? (
            <span
              style={{
                fontWeight: 600,
                color: opt.color,
                cursor: "text",
                fontSize: "14px",
              }}
              onClick={() => setTitleEditing(true)}
              title="点击编辑标题"
            >
              {title}
            </span>
          ) : (
            <span
              style={{
                color: "var(--muted-foreground, #999)",
                cursor: "pointer",
                fontSize: "12px",
              }}
              onClick={() => setTitleEditing(true)}
              title="点击添加标题"
            >
              + 添加标题
            </span>
          )}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              const newFold = fold === "+" ? "-" : fold === "-" ? "" : "+";
              updateAttributes({ fold: newFold });
            }}
            style={{
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid var(--border, #e3e8f7)",
              background: fold ? opt.bg : "transparent",
              color: fold ? opt.color : "var(--muted-foreground, #999)",
              fontSize: "11px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            title={fold ? "折叠设置（点击切换）" : "启用折叠"}
          >
            {fold === "+" ? "🔽 可折叠（展开）" : fold === "-" ? "▶️ 可折叠（收起）" : "折叠"}
          </button>
        </div>

        <div style={{ fontSize: "14px", lineHeight: 1.6 }}>
          <NodeViewContent className="obsidian-callout-content" />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    obsidianCalloutBlock: {
      insertObsidianCallout: (type?: CalloutType, title?: string, fold?: string) => ReturnType;
    };
  }
}

export const ObsidianCalloutBlock = Node.create({
  name: "obsidianCalloutBlock",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      calloutType: { default: "note" },
      title: { default: "" },
      fold: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.callout",
        contentElement: ".callout-content",
        getAttrs: (el: HTMLElement) => {
          const calloutType = el.getAttribute("data-callout") || "note";
          const titleEl = el.querySelector(".callout-title-inner");
          return {
            calloutType,
            title: titleEl?.textContent || "",
            fold: "",
          };
        },
      },
      {
        tag: "details.callout",
        contentElement: ".callout-content",
        getAttrs: (el: HTMLElement) => {
          const calloutType = el.getAttribute("data-callout") || "note";
          const fold = el.getAttribute("data-callout-fold") || "";
          const titleEl = el.querySelector(".callout-title-inner");
          return {
            calloutType,
            title: titleEl?.textContent || "",
            fold,
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const calloutType = (node.attrs.calloutType as string) || "note";
    const title = (node.attrs.title as string) || "";
    const fold = (node.attrs.fold as string) || "";
    const titleText = title || calloutType.charAt(0).toUpperCase() + calloutType.slice(1);
    const iconSvg = getCalloutIcon(calloutType);

    const wrap = document.createElement("div");
    wrap.className = "callout-wrap";

    const container = document.createElement(fold ? "details" : "div");
    container.className = "callout";
    container.setAttribute("data-callout", calloutType);
    if (fold) {
      container.setAttribute("data-callout-fold", fold);
      if (fold === "+") container.setAttribute("open", "");
    }

    const titleEl = document.createElement(fold ? "summary" : "div");
    titleEl.className = "callout-title";

    const iconEl = document.createElement("div");
    iconEl.className = "callout-title-icon";
    iconEl.innerHTML = iconSvg;

    const titleInner = document.createElement("div");
    titleInner.className = "callout-title-inner";
    titleInner.textContent = titleText;

    titleEl.appendChild(iconEl);
    titleEl.appendChild(titleInner);

    if (fold) {
      const foldEl = document.createElement("div");
      foldEl.className = "callout-fold";
      titleEl.appendChild(foldEl);
    }

    container.appendChild(titleEl);

    const contentEl = document.createElement("div");
    contentEl.className = "callout-content";
    container.appendChild(contentEl);

    wrap.appendChild(container);

    return {
      dom: wrap,
      contentDOM: contentEl,
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ObsidianCalloutBlockView);
  },

  addCommands() {
    return {
      insertObsidianCallout:
        (type: CalloutType = "note", title?: string, fold?: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              calloutType: type,
              title: title || "",
              fold: fold || "",
            },
            content: [{ type: "paragraph" }],
          });
        },
    };
  },
});
