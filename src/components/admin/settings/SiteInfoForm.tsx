"use client";

import { FormInput } from "@/components/ui/form-input";
import { FormSelect, FormSelectItem } from "@/components/ui/form-select";
import { FormMonacoEditor } from "@/components/ui/form-monaco-editor";
import { SettingsSection, SettingsFieldGroup } from "./SettingsSection";
import { Spinner } from "@/components/ui/spinner";
import {
  KEY_IP_API,
  KEY_IP_API_TOKEN,
  KEY_IP_API_AUTH_TYPE,
  KEY_IP_API_IP_PARAM_NAME,
  KEY_IP_API_RESPONSE_FORMAT,
  KEY_SITE_OWNER_RECTANGLE,
  KEY_COMMENT_QQ_API_URL,
  KEY_COMMENT_QQ_API_KEY,
} from "@/lib/settings/setting-keys";

const AUTH_TYPE_OPTIONS = [
  { key: "bearer", label: "Bearer Token（Header 认证）" },
  { key: "query_key", label: "URL 参数（Query Key）" },
  { key: "none", label: "无需认证" },
];

const DEFAULT_RESPONSE_FORMAT = `{
  "success_field": "code",
  "success_value": "200",
  "data_path": "data",
  "fields": {
    "ip": "ip",
    "country": "country",
    "province": "province",
    "city": "city",
    "isp": "isp",
    "latitude": "latitude",
    "longitude": "longitude",
    "address": "address"
  }
}`;

const IP_API_PRESETS: Record<string, { url: string; authType: string; ipParamName: string; format: string }> = {
  nsuuu: {
    url: "https://v1.nsuuu.com/api/ipip",
    authType: "bearer",
    ipParamName: "ip",
    format: `{
  "success_field": "code",
  "success_value": "200",
  "data_path": "data",
  "fields": {
    "ip": "ip",
    "country": "country",
    "province": "province",
    "city": "city",
    "isp": "isp",
    "latitude": "latitude",
    "longitude": "longitude",
    "address": "address"
  }
}`,
  },
  "ip-api": {
    url: "http://ip-api.com/json/{ip}?lang=zh-CN",
    authType: "none",
    ipParamName: "ip",
    format: `{
  "success_field": "status",
  "success_value": "success",
  "data_path": "",
  "fields": {
    "ip": "query",
    "country": "country",
    "province": "regionName",
    "city": "city",
    "isp": "isp",
    "latitude": "lat",
    "longitude": "lon"
  }
}`,
  },
  ipinfo: {
    url: "https://ipinfo.io/{ip}?lang=zh-CN",
    authType: "query_key",
    ipParamName: "ip",
    format: `{
  "success_field": "",
  "success_value": "",
  "data_path": "",
  "fields": {
    "ip": "ip",
    "country": "country",
    "province": "region",
    "city": "city",
    "latitude": "loc",
    "longitude": "loc"
  }
}`,
  },
};

interface SiteInfoFormProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  loading?: boolean;
}

export function SiteInfoForm({ values, onChange, loading }: SiteInfoFormProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const authType = values[KEY_IP_API_AUTH_TYPE] || "bearer";
  const showTokenField = authType !== "none";

  const handlePresetChange = (preset: string) => {
    if (preset && IP_API_PRESETS[preset]) {
      const p = IP_API_PRESETS[preset];
      onChange(KEY_IP_API, p.url);
      onChange(KEY_IP_API_AUTH_TYPE, p.authType);
      onChange(KEY_IP_API_IP_PARAM_NAME, p.ipParamName);
      onChange(KEY_IP_API_RESPONSE_FORMAT, p.format);
    }
  };

  return (
    <div className="space-y-8">
      <SettingsSection title="IP 定位服务">
        <FormInput
          label="IP 信息 API 地址"
          placeholder="例如: https://v1.nsuuu.com/api/ipip"
          value={values[KEY_IP_API] || ""}
          onValueChange={v => onChange(KEY_IP_API, v)}
          description="用于获取访问者 IP 地理位置信息的 API 地址。支持 {ip} 路径占位符（如 http://ip-api.com/json/{ip}），不含 {ip} 则通过 Query 参数传递 IP"
        />

        <SettingsFieldGroup cols={2}>
          <FormSelect
            label="认证方式"
            value={authType}
            onValueChange={v => onChange(KEY_IP_API_AUTH_TYPE, v)}
            description="选择 API 的认证方式，无需认证的免费接口选「无需认证」"
          >
            {AUTH_TYPE_OPTIONS.map(opt => (
              <FormSelectItem key={opt.key}>{opt.label}</FormSelectItem>
            ))}
          </FormSelect>

          <FormInput
            label="IP 参数名"
            placeholder="ip"
            value={values[KEY_IP_API_IP_PARAM_NAME] || ""}
            onValueChange={v => onChange(KEY_IP_API_IP_PARAM_NAME, v)}
            description="请求 API 时 IP 地址的 URL 参数名，默认为 ip"
          />
        </SettingsFieldGroup>

        {showTokenField && (
          <FormInput
            label="API Token / Key"
            placeholder="请输入 API Token（如不需要可留空）"
            type="password"
            value={values[KEY_IP_API_TOKEN] || ""}
            onValueChange={v => onChange(KEY_IP_API_TOKEN, v)}
            description="Bearer 方式通过 Header 传递，Query Key 方式通过 URL 参数 key 传递"
          />
        )}

        <FormSelect
          label="响应格式预设"
          value=""
          onValueChange={handlePresetChange}
          placeholder="选择预设快速填充格式映射"
          description="选择后自动填充下方的响应格式映射，也可手动编辑"
        >
          <FormSelectItem key="nsuuu">NSUUU ipip（默认）</FormSelectItem>
          <FormSelectItem key="ip-api">ip-api.com</FormSelectItem>
          <FormSelectItem key="ipinfo">ipinfo.io</FormSelectItem>
        </FormSelect>

        <FormMonacoEditor
          label="响应格式映射"
          language="json"
          value={values[KEY_IP_API_RESPONSE_FORMAT] || ""}
          onValueChange={v => onChange(KEY_IP_API_RESPONSE_FORMAT, v)}
          height={260}
          wordWrap
          description={`自定义 API 响应的 JSON 字段映射。留空则使用默认 NSUUU 格式。字段说明：success_field=成功标识字段名, success_value=成功时的值, data_path=数据节点路径(支持嵌套如result.data), fields=标准字段到API字段的映射。示例：${DEFAULT_RESPONSE_FORMAT}`}
        />
      </SettingsSection>

      <SettingsSection title="博主位置">
        <FormInput
          label="博主所在位置坐标"
          placeholder="格式: 经度,纬度 (例: 112.6534116,27.96920845)"
          value={values[KEY_SITE_OWNER_RECTANGLE] || ""}
          onValueChange={v => onChange(KEY_SITE_OWNER_RECTANGLE, v)}
          description="博主所在位置的经纬度坐标，用于来访者距离计算、天气定位等功能。格式：经度,纬度"
        />
      </SettingsSection>

      <SettingsSection title="QQ 头像服务">
        <SettingsFieldGroup cols={2}>
          <FormInput
            label="QQ 头像 API 地址"
            placeholder="https://api.example.com/qq"
            value={values[KEY_COMMENT_QQ_API_URL] || ""}
            onValueChange={v => onChange(KEY_COMMENT_QQ_API_URL, v)}
          />
          <FormInput
            label="QQ API Key"
            type="password"
            placeholder="请输入 API Key"
            value={values[KEY_COMMENT_QQ_API_KEY] || ""}
            onValueChange={v => onChange(KEY_COMMENT_QQ_API_KEY, v)}
          />
        </SettingsFieldGroup>
      </SettingsSection>
    </div>
  );
}
