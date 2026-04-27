"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { addToast, Spinner, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import TurndownService from "turndown";
import { marked } from "marked";
import { X } from "lucide-react";
import { EditorHeader } from "./EditorHeader";
import { EditorToolbar, type EditorMode } from "./EditorToolbar";
import { TiptapEditor } from "./TiptapEditor";
import { SourceCodeEditor } from "./SourceCodeEditor";
import { EditorSidebar, TOCContent } from "./EditorSidebar";
import { useArticleEditor } from "./use-article-editor";
import { useArticleMeta } from "./use-article-meta";
import { useAutoSave } from "./use-auto-save";
import { useArticleForEdit, useCreateArticle, useUpdateArticle } from "@/hooks/queries/use-post-management";
import { processHtmlForSave, cleanHtmlForEditor } from "@/lib/content-processor";
import { turndownArticleMarkdown } from "@/lib/editor-tabs-export";
import { registerCustomRules } from "@/lib/turndown-rules";
import { registerMarkedExtensions, fixTaskListHtml, setContainerAliases } from "@/lib/marked-extensions";
import { MobileToolbar } from "./MobileToolbar";
import { articleApi } from "@/lib/api/article";
import { metaMappingApi } from "@/lib/api/meta-mapping";
import { plainTextFromHtmlSource, roughPlainTextFromMarkdown } from "@/lib/article-summary";
import { useAuthStore } from "@/store/auth-store";

import type { Editor } from "@tiptap/react";

interface ArticleEditorPageProps {
  /** 文章 ID（编辑模式时传入） */
  articleId?: string;
}

/** 字数统计组件 - 固定在编辑器左下角 */
function WordCount({ editor }: { editor: Editor | null }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const text = editor.state.doc.textContent;
      // 统计中文字符 + 英文单词
      const chineseChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
      const englishWords = (text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, "").match(/[a-zA-Z0-9]+/g) || []).length;
      setCount(chineseChars + englishWords);
    };

    update();
    editor.on("update", update);
    return () => {
      editor.off("update", update);
    };
  }, [editor]);

  return (
    <div className="absolute bottom-2 left-3 pointer-events-none z-10">
      <span className="text-xs text-muted-foreground tabular-nums">{count}字</span>
    </div>
  );
}

/** HTML -> Markdown 转换器（单例） */
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});
registerCustomRules(turndownService);
registerMarkedExtensions(marked);

metaMappingApi.getActiveContainerMappings().then(mappings => {
  setContainerAliases(mappings.map(m => ({ name: m.name, target: m.target, params: m.params })));
}).catch(() => {});

export function ArticleEditorPage({ articleId }: ArticleEditorPageProps) {
  const router = useRouter();
  const isEditMode = !!articleId;
  const isAdmin = useAuthStore(state => state.user?.userGroupID === 1 || state.roles.includes("1"));

  // 编辑模式：加载文章数据
  const { data: article, isLoading: isLoadingArticle } = useArticleForEdit(articleId ?? "", { enabled: isEditMode });

  // 标题状态
  const [title, setTitle] = useState("");
  const [prevArticleId, setPrevArticleId] = useState<string | null>(null);

  // 右侧面板 - 桌面端默认打开，移动端默认关闭
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  // Ctrl+S 快捷键保存 - 先定义空函数引用
  const handleSaveRef = useRef<() => void>(() => {});
  // Ctrl+/ 切换视图 - 使用 ref 避免依赖顺序问题
  const editorModeRef = useRef<EditorMode>("visual");
  const handleModeChangeRef = useRef<(mode: EditorMode) => void>(() => {});

  // 专注模式
  const [focusMode, setFocusMode] = useState(false);
  const toggleFocusMode = useCallback(() => setFocusMode(prev => !prev), []);

  useEffect(() => {
    if (!focusMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusMode(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusMode]);

  // Ctrl+S 快捷键保存 和 Ctrl+/ 切换视图
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检测 Ctrl+S (Windows/Linux) 或 Cmd+S (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault(); // 阻止浏览器默认保存行为
        handleSaveRef.current(); // 触发保存
      }

      // 检测 Ctrl+/ (Windows/Linux) 或 Cmd+/ (Mac) - 切换到 Markdown 视图
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault(); // 阻止浏览器默认行为
        if (editorModeRef.current == "visual") {
          handleModeChangeRef.current("markdown");
        }
      }
    };

    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 文章元数据
  const { meta, updateField, updateFields, initFromData, getSubmitData } = useArticleMeta(undefined, {
    isAdmin,
    maxSummaries: 1,
  });

  // Tiptap 编辑器实例
  const editor = useArticleEditor({
    initialContent: "",
    placeholder: "开始编写内容...",
  });

  // 编辑模式切换（可视化 / HTML / Markdown）
  const [editorMode, setEditorMode] = useState<EditorMode>("visual");
  const [sourceContent, setSourceContent] = useState("");
  const visualBackupRef = useRef<Record<string, unknown> | null>(null);
  const sourceModifiedRef = useRef(false);

  const handleSourceChange = useCallback((value: string) => {
    setSourceContent(value);
    sourceModifiedRef.current = true;
  }, []);

  const handleModeChange = useCallback(
    (newMode: EditorMode) => {
      if (newMode === editorMode) return;

      if (editorMode === "visual") {
        if (editor && !editor.isDestroyed) {
          visualBackupRef.current = editor.getJSON() as Record<string, unknown>;
        }
        sourceModifiedRef.current = false;

        const rawHtml = editor?.getHTML() ?? "";
        const processedHtml = processHtmlForSave(rawHtml);
        if (newMode === "html") {
          setSourceContent(processedHtml);
        } else {
          setSourceContent(turndownArticleMarkdown(editor, turndownService, processedHtml));
        }
      } else if (newMode === "visual") {
        if (!sourceModifiedRef.current && visualBackupRef.current) {
          if (editor && !editor.isDestroyed) {
            const backupSnapshot = visualBackupRef.current;
            queueMicrotask(() => editor.commands.setContent(backupSnapshot));
          }
        } else if (editorMode === "html") {
          if (editor && !editor.isDestroyed) {
            queueMicrotask(() => editor.commands.setContent(sourceContent));
          }
        } else {
          const html = fixTaskListHtml(marked.parse(sourceContent, { async: false }) as string);
          if (editor && !editor.isDestroyed) {
            queueMicrotask(() => editor.commands.setContent(html));
          }
        }
        visualBackupRef.current = null;
      } else {
        if (editorMode === "html") {
          setSourceContent(turndownService.turndown(sourceContent));
        } else {
          setSourceContent(fixTaskListHtml(marked.parse(sourceContent, { async: false }) as string));
        }
      }

      setEditorMode(newMode);
    },
    [editorMode, editor, sourceContent]
  );

  // 更新 ref 引用，使快捷键始终调用最新的逻辑
  useEffect(() => {
    editorModeRef.current = editorMode;
  }, [editorMode]);

  useEffect(() => {
    handleModeChangeRef.current = handleModeChange;
  }, [handleModeChange]);

  // 分类和标签列表
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["post-categories"],
    queryFn: () => articleApi.getCategoryList(),
    staleTime: 1000 * 60 * 5,
  });
  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ["post-tags"],
    queryFn: () => articleApi.getTagList("count"),
    staleTime: 1000 * 60 * 5,
  });

  // Mutations
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // 自动保存（仅编辑模式）
  const {
    status: autoSaveStatus,
    lastSavedAt,
    markAsSaved,
  } = useAutoSave({
    articleId,
    editor,
    title,
    getSubmitData,
    interval: 30000,
    enabled: isEditMode,
    editorMode,
    sourceContent,
  });

  // 从文章数据初始化标题和元数据
  if (article && prevArticleId !== article.id) {
    setPrevArticleId(article.id);
    setTitle(article.title || "");
    initFromData(article);
  }

  // 同步编辑器内容
  // 使用 queueMicrotask 延迟 setContent，避免在 React commit 阶段中
  // 触发 tiptap ReactNodeViewRenderer 内部的 flushSync 调用
  const editorSyncedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!article || !editor || editor.isDestroyed) return;
    if (editorSyncedRef.current === article.id) return;
    editorSyncedRef.current = article.id;
    const contentHtml = article.content_html?.trim();
    const contentMd = article.content_md?.trim();
    queueMicrotask(() => {
      if (editor.isDestroyed) return;
      if (contentHtml) {
        // 清理 HTML，移除 heading 中的锚点链接，恢复为纯文本
        const cleanedHtml = cleanHtmlForEditor(contentHtml);
        editor.commands.setContent(cleanedHtml);
        return;
      }
      // 兼容仅返回 Markdown、或历史数据中 content_html 为空的场景：用 MD 转 HTML 初始化可视化编辑器
      if (contentMd) {
        const html = fixTaskListHtml(marked.parse(contentMd, { async: false }) as string);
        editor.commands.setContent(html);
        setSourceContent(contentMd);
      }
    });
  }, [article, editor]);

  // 保存文章
  const handleSave = () => {
    const currentTitle = title.trim();

    if (!currentTitle) {
      addToast({ title: "请输入文章标题", color: "warning" });
      return;
    }

    let html: string;
    let markdown: string;

    if (editorMode === "visual") {
      const rawHtml = editor?.getHTML() ?? "";
      markdown = turndownArticleMarkdown(editor, turndownService, processHtmlForSave(rawHtml));
      html = processHtmlForSave(fixTaskListHtml(marked.parse(markdown, { async: false }) as string));
    } else if (editorMode === "html") {
      html = processHtmlForSave(sourceContent);
      markdown = turndownService.turndown(html);
    } else {
      markdown = sourceContent;
      html = processHtmlForSave(fixTaskListHtml(marked.parse(sourceContent, { async: false }) as string));
    }

    // 合并元数据
    const metaData = getSubmitData();

    if (isEditMode && articleId) {
      updateMutation.mutate(
        {
          id: articleId,
          data: {
            title: currentTitle,
            content_html: html,
            content_md: markdown,
            ...metaData,
          },
        },
        {
          onSuccess: () => {
            markAsSaved();
            addToast({ title: "文章已更新", color: "success" });
          },
          onError: error => {
            addToast({ title: "更新失败", description: error.message, color: "danger" });
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          title: currentTitle,
          content_html: html,
          content_md: markdown,
          status: meta.status,
          ...metaData,
        },
        {
          onSuccess: () => {
            addToast({ title: "文章已发布", color: "success" });
            router.push("/admin/post-management");
          },
          onError: error => {
            addToast({ title: "发布失败", description: error.message, color: "danger" });
          },
        }
      );
    }
  };

  // 更新 handleSave 引用，使快捷键始终调用最新的保存逻辑
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  const getBodyPlainTextForSummary = useCallback(() => {
    if (editorMode === "visual" && editor && !editor.isDestroyed) {
      return editor.getText();
    }
    if (editorMode === "html") {
      return plainTextFromHtmlSource(sourceContent);
    }
    return roughPlainTextFromMarkdown(sourceContent);
  }, [editorMode, editor, sourceContent]);

  // 编辑模式加载中
  if (isEditMode && isLoadingArticle) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-3 bg-background">
        <Spinner size="lg" />
        <p className="text-muted-foreground">加载文章中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* 标题栏 - 专注模式下隐藏 */}
      {!focusMode && (
        <EditorHeader
          title={title}
          onTitleChange={setTitle}
          onSave={handleSave}
          isSaving={isSaving}
          isEditMode={isEditMode}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          articleId={articleId}
          isDoc={meta.is_doc}
          autoSaveStatus={autoSaveStatus}
          lastSavedAt={lastSavedAt}
          articleUpdatedAt={article?.updated_at}
          focusMode={focusMode}
          onToggleFocusMode={toggleFocusMode}
        />
      )}

      {/* 工具栏 - 专注模式下隐藏桌面端工具栏 */}
      {!focusMode && (
        <div className="hidden md:block">
          <EditorToolbar editor={editor} editorMode={editorMode} onModeChange={handleModeChange} />
        </div>
      )}

      {/* 主体区域：编辑器 + 大纲（固定布局） */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* 编辑器区域 - 始终占满剩余空间 */}
        <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
          {/* TipTap 始终挂载，源码模式时隐藏（避免 flushSync 重挂载错误） */}
          <div className={editorMode === "visual" ? "flex-1 overflow-auto bg-card" : "hidden"}>
            <div className="max-w-4xl mx-auto px-3 sm:px-6 md:px-8 py-4 md:py-6">
              <TiptapEditor editor={editor} />
            </div>
          </div>
          {editorMode === "visual" && <WordCount editor={editor} />}
          {editorMode !== "visual" && (
            <SourceCodeEditor
              value={sourceContent}
              onChange={handleSourceChange}
              language={editorMode === "html" ? "html" : "markdown"}
            />
          )}
        </div>

        {/* 大纲面板 - 仅可视化模式且非专注模式显示 */}
        {editorMode === "visual" && !focusMode && (
          <div className="hidden md:block w-64 shrink-0 h-full overflow-auto py-4 px-5">
            <h3 className="text-base font-bold text-foreground mb-3 pl-1">大纲</h3>
            <div className="border-l-2 border-border/60 pl-2">
              <TOCContent editor={editor} />
            </div>
          </div>
        )}

        {/* 文章设置面板 - 专注模式下隐藏，移动端改为底部抽屉 */}
        {sidebarOpen && !focusMode && (
          <>
            {/* 桌面端：右侧固定面板 */}
            <div className="hidden md:block absolute top-0 right-0 h-full w-64 z-20 bg-background border-l-[0.5px] border-border/60 shadow-md overflow-auto">
              <EditorSidebar
                meta={meta}
                onUpdateField={updateField}
                onUpdateFields={updateFields}
                isAdmin={isAdmin}
                categories={categories}
                tags={tags}
                isLoadingCategories={isLoadingCategories}
                isLoadingTags={isLoadingTags}
                editorVariant="app"
                getBodyPlainTextForSummary={getBodyPlainTextForSummary}
                editor={editor}
                articleTitle={title}
              />
            </div>

            {/* 移动端：底部抽屉式面板 */}
            <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
              <div 
                className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-background rounded-t-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* 抽屉头部 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="text-base font-semibold">文章设置</h3>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => setSidebarOpen(false)}
                    aria-label="关闭设置"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* 抽屉内容 */}
                <div className="overflow-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
                  <EditorSidebar
                    meta={meta}
                    onUpdateField={updateField}
                    onUpdateFields={updateFields}
                    isAdmin={isAdmin}
                    categories={categories}
                    tags={tags}
                    isLoadingCategories={isLoadingCategories}
                    isLoadingTags={isLoadingTags}
                    editorVariant="app"
                    getBodyPlainTextForSummary={getBodyPlainTextForSummary}
                    editor={editor}
                    articleTitle={title}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 移动端底部工具栏 */}
      <MobileToolbar editor={editor} />

      {/* 专注模式退出按钮 */}
      {focusMode && (
        <button
          type="button"
          onClick={() => setFocusMode(false)}
          className="fixed top-4 right-4 z-50 px-3 py-1.5 text-xs text-muted-foreground bg-card/80 backdrop-blur border border-border rounded-lg shadow-sm hover:bg-card transition-all opacity-0 hover:opacity-100 focus:opacity-100"
        >
          ESC 退出专注模式
        </button>
      )}
    </div>
  );
}
