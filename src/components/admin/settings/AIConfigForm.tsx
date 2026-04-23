"use client";

import { useState } from "react";
import { FormInput } from "@/components/ui/form-input";
import { FormCodeEditor } from "@/components/ui/form-code-editor";
import { SettingsSection, SettingsFieldGroup } from "./SettingsSection";
import { Spinner } from "@/components/ui/spinner";
import { apiClient } from "@/lib/api/client";
import {
  KEY_AI_BASE_URL,
  KEY_AI_API_KEY,
  KEY_AI_MODEL,
  KEY_AI_SUMMARY_PROMPT,
  KEY_AI_AI_SUMMARY_PROMPT,
  KEY_AI_TITLE_PROMPT,
  KEY_AI_MCP_SECRET,
} from "@/lib/settings/setting-keys";

interface AIConfigFormProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  loading?: boolean;
}

export function AIConfigForm({ values, onChange, loading }: AIConfigFormProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [resetting, setResetting] = useState(false);

  const handleTestConfig = async () => {
    const baseURL = values[KEY_AI_BASE_URL];
    const apiKey = values[KEY_AI_API_KEY];
    const model = values[KEY_AI_MODEL];

    if (!baseURL || !apiKey || !model) {
      setTestResult({ success: false, message: "请先填写 Base URL、API Key 和模型名称" });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      await apiClient.post("/api/admin/ai/test", {
        base_url: baseURL,
        api_key: apiKey,
        model: model,
      });
      setTestResult({ success: true, message: "连接测试成功，AI 服务可用" });
    } catch {
      setTestResult({ success: false, message: "连接测试失败，请检查配置是否正确" });
    } finally {
      setTesting(false);
    }
  };

  const handleResetMCPSecret = async () => {
    setResetting(true);
    try {
      const response = await apiClient.post<{ mcp_secret: string }>("/api/admin/ai/mcp-secret/reset");
      const newSecret = response.data?.mcp_secret;
      if (newSecret) {
        onChange(KEY_AI_MCP_SECRET, newSecret);
      }
    } catch {
      // ignore
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SettingsSection title="基础设置" description="配置 AI 服务的 API 连接信息，支持 OpenAI 兼容格式的 API">
        <SettingsFieldGroup cols={2}>
          <FormInput
            label="API Base URL"
            placeholder="如 https://api.deepseek.com"
            value={values[KEY_AI_BASE_URL] || ""}
            onValueChange={v => onChange(KEY_AI_BASE_URL, v)}
            autoComplete="off"
          />
          <FormInput
            label="模型名称"
            placeholder="如 deepseek-chat"
            value={values[KEY_AI_MODEL] || ""}
            onValueChange={v => onChange(KEY_AI_MODEL, v)}
            autoComplete="off"
          />
        </SettingsFieldGroup>

        <FormInput
          label="API Key"
          placeholder="请输入 API 密钥"
          type="password"
          value={values[KEY_AI_API_KEY] || ""}
          onValueChange={v => onChange(KEY_AI_API_KEY, v)}
          autoComplete="new-password"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestConfig}
            disabled={testing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {testing ? "测试中..." : "测试连接"}
          </button>
          {testResult && (
            <span className={`text-xs ${testResult.success ? "text-green-600" : "text-red-500"}`}>
              {testResult.message}
            </span>
          )}
        </div>
      </SettingsSection>

      <SettingsSection
        title="提示词设置"
        description="自定义 AI 生成内容时使用的提示词，留空则使用系统默认提示词"
      >
        <FormCodeEditor
          label="文章摘要提示词"
          value={values[KEY_AI_SUMMARY_PROMPT] || ""}
          onValueChange={v => onChange(KEY_AI_SUMMARY_PROMPT, v)}
          language="text"
          minRows={4}
          description="用于生成文章摘要（50-100字，作者视角）"
        />

        <FormCodeEditor
          label="AI 总结提示词"
          value={values[KEY_AI_AI_SUMMARY_PROMPT] || ""}
          onValueChange={v => onChange(KEY_AI_AI_SUMMARY_PROMPT, v)}
          language="text"
          minRows={4}
          description="用于生成 AI 总结（150-200字，旁观者视角）"
        />

        <FormCodeEditor
          label="标题生成提示词"
          value={values[KEY_AI_TITLE_PROMPT] || ""}
          onValueChange={v => onChange(KEY_AI_TITLE_PROMPT, v)}
          language="text"
          minRows={4}
          description="用于生成文章标题（15-25字）"
        />
      </SettingsSection>

      <SettingsSection
        title="MCP 配置"
        description="Model Context Protocol 配置，允许 AI 助手通过 MCP 协议与博客交互"
      >
        <FormInput
          label="MCP Secret"
          placeholder="点击重置按钮生成新的密钥"
          type="password"
          value={values[KEY_AI_MCP_SECRET] || ""}
          onValueChange={v => onChange(KEY_AI_MCP_SECRET, v)}
          autoComplete="new-password"
          description="MCP 接口的鉴权密钥，AI 助手连接时需要提供此密钥"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetMCPSecret}
            disabled={resetting}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetting && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {resetting ? "重置中..." : "重置 MCP Secret"}
          </button>
          <span className="text-xs text-muted-foreground">重置后需同步更新 AI 助手中的密钥配置</span>
        </div>

        {values[KEY_AI_MCP_SECRET] && (
          <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-foreground/80">
            MCP 端点地址：<span className="font-mono font-medium text-foreground">{typeof window !== "undefined" ? window.location.origin : ""}/mcp</span>
          </div>
        )}
      </SettingsSection>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground/70">
        AI 功能需要配置有效的 API 密钥才能使用。支持所有 OpenAI 兼容格式的 API 服务（如 DeepSeek、通义千问等）。
      </div>
    </div>
  );
}
