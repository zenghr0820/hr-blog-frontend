"use client";

import { useState, useCallback } from "react";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, KeyRound, Share2, Check } from "lucide-react";
import { addToast } from "@heroui/react";
import { articleApi } from "@/lib/api/article";

interface ArticlePasswordGateProps {
  articleId: string;
  hint?: string;
  onVerified: (contentHtml: string) => void;
}

export function ArticlePasswordGate({ articleId, hint, onVerified }: ArticlePasswordGateProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyShareLink = useCallback(async () => {
    if (!shareToken) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?token=${shareToken}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      addToast({ title: "分享链接已复制", color: "success", timeout: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({ title: "复制失败，请手动复制", color: "danger", timeout: 2000 });
    }
  }, [shareToken]);

  const handleSubmit = useCallback(
    async (e: React.SubmitEvent) => {
      e.preventDefault();
      if (!password.trim()) {
        setError("请输入密码");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const result = await articleApi.verifyArticlePassword(articleId, password, "full");
        if (result.success && result.content_html) {
          if (result.access_token) {
            setShareToken(result.access_token);
            try {
              const stored = JSON.parse(localStorage.getItem("article_access_tokens") || "{}");
              const slug = window.location.pathname.split("/").filter(Boolean).pop() || "";
              if (!stored[slug]) stored[slug] = { article: "", blocks: [] };
              stored[slug].article = result.access_token;
              localStorage.setItem("article_access_tokens", JSON.stringify(stored));
            } catch {}
          }
          onVerified(result.content_html);
        } else {
          setError("密码错误，请重试");
        }
      } catch {
        setError("验证失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    },
    [articleId, password, onVerified]
  );

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          <p className="text-xl font-semibold mb-2">文章已加密</p>
          <p className="text-sm text-muted-foreground mb-6">
            这篇文章需要密码才能查看
          </p>

          {hint && (
            <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>提示：{hint}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="请输入访问密码"
                className="w-full px-4 py-3 pr-10 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  验证中...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  解锁文章
                </>
              )}
            </button>
          </form>

          {shareToken && (
            <div className="mt-5 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="w-full py-2.5 px-4 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    复制分享链接
                  </>
                )}
              </button>
              <p className="mt-2 text-xs text-muted-foreground/60">
                分享链接7天内有效，无需密码即可查看
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
