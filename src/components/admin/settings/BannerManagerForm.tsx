/**
 * 统一 Banner 配置管理表单
 * 用于在系统设置中集中管理所有页面的 Banner 配置
 */
"use client";

import { useState, useEffect } from "react";
import { Button, Input, Textarea, Chip } from "@heroui/react";
import { Plus, Trash2, Save, RefreshCw, X } from "lucide-react";
import { FormImageUpload } from "@/components/ui/form-image-upload";
import type { BannerPageKey, PresetBannerPageKey } from "@/types/banner";
import { getDefaultBannerConfig, serializeBannerConfig } from "@/lib/banner-config";
import { KEY_BANNER_CONFIG } from "@/lib/settings/setting-keys";

interface BannerConfig {
  tips: string;
  title: string;
  description: string;
  backgroundImage: string;
  buttonText?: string;
  buttonLink?: string;
  height?: number;
}

interface CustomBannerItem {
  key: string;
  label: string;
  config: BannerConfig;
}

interface BannerManagerFormProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  loading?: boolean;
}

const PRESET_PAGES: Array<{ key: PresetBannerPageKey; label: string; icon: string }> = [
  { key: 'album', label: '相册页面', icon: '📸' },
  { key: 'essay', label: '动态页面', icon: '✨' },
  { key: 'fcircle', label: '朋友圈', icon: '🌐' },
  { key: 'recent_comments', label: '最近评论', icon: '💬' },
  { key: 'equipment', label: '装备页面', icon: '🛠️' },
  { key: 'friend_link', label: '友链页面', icon: '🔗' },
  { key: 'home_top', label: '首页顶部', icon: '🏠' },
];

export function BannerManagerForm({ values, onChange, loading }: BannerManagerFormProps) {
  const [selectedTab, setSelectedTab] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetKey, setSelectedPresetKey] = useState<BannerPageKey>('album');
  const [customBanners, setCustomBanners] = useState<CustomBannerItem[]>([]);
  const [selectedCustomKey, setSelectedCustomKey] = useState<string>('');
  const [newCustomKey, setNewCustomKey] = useState('');

  // 从 values 中加载自定义 Banner（集中存储结构）
  useEffect(() => {
    const customItems: CustomBannerItem[] = [];
    
    // 直接从 KEY_BANNER_CONFIG 获取所有 Banner 配置
    const bannerValue = values[KEY_BANNER_CONFIG];
    if (bannerValue && typeof bannerValue === 'string') {
      try {
        const allBanners = JSON.parse(bannerValue);
        
        // 遍历所有 Banner 配置，提取自定义的
        Object.entries(allBanners).forEach(([key, value]: [string, any]) => {
          // 跳过预设页面
          if (PRESET_PAGES.some(p => p.key === key)) {
            return;
          }
          
          // 添加自定义 Banner
          customItems.push({
            key,
            label: key,
            config: {
              tips: String(value.tips || ''),
              title: String(value.title || ''),
              description: String(value.description || ''),
              backgroundImage: String(value.backgroundImage || value.background || ''),
              buttonText: value.buttonText ? String(value.buttonText) : '',
              buttonLink: value.buttonLink ? String(value.buttonLink) : '',
              height: value.height || 300,
            },
          });
        });
      } catch (error) {
        console.error('解析 banner 配置失败:', error);
      }
    }
    
    setCustomBanners(customItems);
    if (customItems.length > 0 && !selectedCustomKey) {
      setSelectedCustomKey(customItems[0].key);
    }
  }, [values]);

  // 初始化预设 Banner 配置（集中存储结构）
  const [presetBanners, setPresetBanners] = useState<Record<BannerPageKey, BannerConfig>>(() => {
    const initial: Record<string, BannerConfig> = {};
    
    // 从 KEY_BANNER_CONFIG 获取所有 Banner 配置
    const bannerValue = values[KEY_BANNER_CONFIG];
    let allBanners: Record<string, any> = {};
    
    if (bannerValue && typeof bannerValue === 'string') {
      try {
        allBanners = JSON.parse(bannerValue);
      } catch {
        // 解析失败，使用空对象
      }
    }
    
    PRESET_PAGES.forEach(({ key }) => {
      let config: BannerConfig = { ...getDefaultBannerConfig(key as PresetBannerPageKey) } as BannerConfig;
      
      // 从集中存储中获取配置
      if (allBanners[key]) {
        const savedValue = allBanners[key];
        config = {
          tips: String(savedValue.tips || config.tips || ''),
          title: String(savedValue.title || config.title || ''),
          description: String(savedValue.description || config.description || ''),
          backgroundImage: String(savedValue.backgroundImage || savedValue.background || ''),
          buttonText: savedValue.buttonText ? String(savedValue.buttonText) : '',
          buttonLink: savedValue.buttonLink ? String(savedValue.buttonLink) : '',
          height: savedValue.height || 300,
        };
      }
      
      initial[key] = config;
    });
    return initial as Record<BannerPageKey, BannerConfig>;
  });

  // 重新初始化预设 Banner 配置（在值更新时）
  useEffect(() => {
    const newPresetBanners: Record<string, BannerConfig> = {};
    
    // 从 KEY_BANNER_CONFIG 获取所有 Banner 配置
    const bannerValue = values[KEY_BANNER_CONFIG];
    let allBanners: Record<string, any> = {};
    
    if (bannerValue && typeof bannerValue === 'string') {
      try {
        allBanners = JSON.parse(bannerValue);
      } catch {
        // 解析失败，使用空对象
      }
    }
    
    PRESET_PAGES.forEach(({ key }) => {
      let config: BannerConfig = { ...getDefaultBannerConfig(key as PresetBannerPageKey) } as BannerConfig;
      
      // 从集中存储中获取配置
      if (allBanners[key]) {
        const savedValue = allBanners[key];
        config = {
          tips: String(savedValue.tips || config.tips || ''),
          title: String(savedValue.title || config.title || ''),
          description: String(savedValue.description || config.description || ''),
          backgroundImage: String(savedValue.backgroundImage || savedValue.background || ''),
          buttonText: savedValue.buttonText ? String(savedValue.buttonText) : '',
          buttonLink: savedValue.buttonLink ? String(savedValue.buttonLink) : '',
          height: savedValue.height || 300,
        };
      }
      
      newPresetBanners[key] = config;
    });
    
    setPresetBanners(newPresetBanners as Record<BannerPageKey, BannerConfig>);
  }, [values]);

  // 获取当前选中的 Banner 配置
  const getCurrentBanner = (): BannerConfig | null => {
    if (selectedTab === 'preset') {
      return presetBanners[selectedPresetKey] || null;
    } else {
      const custom = customBanners.find(b => b.key === selectedCustomKey);
      return custom?.config || null;
    }
  };

  const handleFieldChange = (field: keyof BannerConfig, value: string) => {
    if (selectedTab === 'preset') {
      setPresetBanners(prev => ({
        ...prev,
        [selectedPresetKey]: {
          ...prev[selectedPresetKey],
          [field]: value,
        },
      }));
    } else {
      setCustomBanners(prev => prev.map(banner => 
        banner.key === selectedCustomKey
          ? { ...banner, config: { ...banner.config, [field]: value } }
          : banner
      ));
    }
  };

  const handleSave = () => {
    const currentBanner = getCurrentBanner();
    if (!currentBanner) return;

    // 收集所有 Banner 配置
    const allBanners: Record<string, any> = {};
    
    // 添加预设 Banner 配置
    PRESET_PAGES.forEach(({ key }) => {
      const config = presetBanners[key];
      if (config) {
        allBanners[key] = {
          tips: config.tips || '',
          title: config.title || '',
          description: config.description || '',
          backgroundImage: config.backgroundImage || '',
          buttonText: config.buttonText || '',
          buttonLink: config.buttonLink || '',
          height: config.height || 300,
        };
      }
    });
    
    // 添加自定义 Banner 配置
    customBanners.forEach(banner => {
      allBanners[banner.key] = {
        tips: banner.config.tips || '',
        title: banner.config.title || '',
        description: banner.config.description || '',
        backgroundImage: banner.config.backgroundImage || '',
        buttonText: banner.config.buttonText || '',
        buttonLink: banner.config.buttonLink || '',
        height: banner.config.height || 300,
      };
    });
    
    // 序列化所有 Banner 配置为一条 JSON 记录
    const serialized = JSON.stringify(allBanners);
    onChange('banner', serialized);
  };

  const handleResetToDefault = () => {
    if (selectedTab === 'preset') {
      const defaults = getDefaultBannerConfig(selectedPresetKey as PresetBannerPageKey);
      setPresetBanners(prev => ({
        ...prev,
        [selectedPresetKey]: {
          tips: defaults.tips || '',
          title: defaults.title || '',
          description: defaults.description || '',
          backgroundImage: defaults.backgroundImage || '',
          buttonText: defaults.buttonText || '',
          buttonLink: defaults.buttonLink || '',
        },
      }));
    }
  };

  const handleAddCustomBanner = () => {
    if (!newCustomKey.trim()) return;
    
    const key = newCustomKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (customBanners.some(b => b.key === key) || PRESET_PAGES.some(p => p.key === key)) {
      alert('该标识符已存在，请使用其他名称');
      return;
    }

    const newBanner: CustomBannerItem = {
      key,
      label: key,
      config: {
        tips: '',
        title: '',
        description: '',
        backgroundImage: '',
        buttonText: '',
        buttonLink: '',
      },
    };

    setCustomBanners(prev => [...prev, newBanner]);
    setSelectedCustomKey(key);
    setNewCustomKey('');
  };

  const handleRemoveCustomBanner = (key: string) => {
    // 从列表中移除
    setCustomBanners(prev => prev.filter(b => b.key !== key));
    
    // 从集中存储中移除该 Banner 配置
    const bannerValue = values[KEY_BANNER_CONFIG];
    if (bannerValue && typeof bannerValue === 'string') {
      try {
        const allBanners = JSON.parse(bannerValue);
        delete allBanners[key];
        
        // 重新序列化并保存
        const serialized = JSON.stringify(allBanners);
        onChange(KEY_BANNER_CONFIG, serialized);
      } catch (error) {
        console.error('解析 banner 配置失败:', error);
      }
    }
    
    // 如果删除的是当前选中的，切换到其他自定义 Banner
    if (selectedCustomKey === key) {
      const remaining = customBanners.filter(b => b.key !== key);
      setSelectedCustomKey(remaining.length > 0 ? remaining[0].key : '');
    }
  };

  const currentBanner = getCurrentBanner();
  const currentPageInfo = selectedTab === 'preset' 
    ? PRESET_PAGES.find(p => p.key === selectedPresetKey)
    : customBanners.find(b => b.key === selectedCustomKey);
  
  // 现在所有 Banner 都统一存储在 banner key 中
  const storageKey = KEY_BANNER_CONFIG;

  const showButtonFields = selectedTab === 'preset' 
    ? (selectedPresetKey === 'essay' || selectedPresetKey === 'home_top')
    : false;

  return (
    <div className="space-y-6">
      {/* 说明卡片 */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">📋 Banner 统一管理</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          在此页面可以集中配置所有子页面的顶部横幅（Banner）。支持预设页面和自定义页面，配置保存后，各页面会自动读取并展示。
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 border-b border-border/60">
        <button
          onClick={() => setSelectedTab('preset')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === 'preset'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          预设页面
        </button>
        <button
          onClick={() => setSelectedTab('custom')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === 'custom'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          自定义页面
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：选择列表 */}
        <div className="lg:col-span-1 space-y-3">
          {selectedTab === 'preset' ? (
            <>
              <label className="text-sm font-medium text-foreground">选择页面</label>
              <div className="space-y-1.5">
                {PRESET_PAGES.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPresetKey(key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                      selectedPresetKey === key
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'bg-card hover:bg-muted border border-border/50 text-foreground/70 hover:text-foreground'
                    }`}
                  >
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <label className="text-sm font-medium text-foreground">自定义 Banner</label>
              
              {/* 添加新 Banner */}
              <div className="flex gap-2">
                <Input
                  placeholder="输入标识符（如：my_page）"
                  value={newCustomKey}
                  onValueChange={setNewCustomKey}
                  size="sm"
                  className="flex-1"
                />
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleAddCustomBanner}
                  startContent={<Plus className="w-4 h-4" />}
                  isDisabled={!newCustomKey.trim()}
                >
                  添加
                </Button>
              </div>

              {/* 自定义 Banner 列表 */}
              <div className="space-y-1.5 mt-2">
                {customBanners.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    暂无自定义 Banner<br/>
                    在上方输入标识符添加
                  </div>
                ) : (
                  customBanners.map(({ key, label }) => (
                    <div
                      key={key}
                      className={`flex flex-col gap-2 px-4 py-3 rounded-lg transition-all ${
                        selectedCustomKey === key
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'bg-card hover:bg-muted border border-border/50 text-foreground/70 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <button
                          onClick={() => setSelectedCustomKey(key)}
                          className="flex-1 text-left text-sm font-medium"
                        >
                          {label}
                        </button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleRemoveCustomBanner(key)}
                          isIconOnly
                          className="min-w-8 w-8 h-8"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                         <Chip 
                            size="sm" 
                            variant="flat" 
                            classNames={{ base: "bg-background/50 border-small border-default/50" }}
                          >
                            {key}
                          </Chip>
                          <Button
                             size="sm"
                             variant="light"
                             isIconOnly
                             className="h-5 w-5 min-w-5"
                             onPress={() => handleRemoveCustomBanner(key)}
                          >
                             <X className="w-3 h-3" />
                          </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* 右侧：配置编辑器 */}
        <div className="lg:col-span-2 space-y-4">
          {!currentBanner ? (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              {selectedTab === 'custom' && customBanners.length === 0
                ? '请先添加自定义 Banner'
                : '请选择一个页面进行配置'}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {currentPageInfo ? (
                      <>
                        {'icon' in currentPageInfo && <span>{(currentPageInfo as any).icon} </span>}
                        {currentPageInfo.label} - Banner 配置
                      </>
                    ) : (
                      `${selectedCustomKey} - Banner 配置`
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    存储键名：<code className="px-1.5 py-0.5 rounded bg-muted text-xs">{storageKey}</code>
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedTab === 'preset' && (
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={handleResetToDefault}
                      startContent={<RefreshCw className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      恢复默认
                    </Button>
                  )}
                  <Button
                    size="sm"
                    color="primary"
                    onPress={handleSave}
                    isLoading={loading}
                    startContent={<Save className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    保存配置
                  </Button>
                </div>
              </div>

              {/* 配置表单 */}
              <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
                <Input
                  label="提示文字（小标签）"
                  placeholder="例如：相册、动态、朋友圈"
                  value={currentBanner.tips}
                  onValueChange={(v) => handleFieldChange('tips', v)}
                  description="显示在标题上方的小标签文本"
                />

                <Input
                  label="标题"
                  placeholder="例如：Album、Moments、Fcircle"
                  value={currentBanner.title}
                  onValueChange={(v) => handleFieldChange('title', v)}
                  description="Banner 的主标题，通常使用英文"
                />

                <Textarea
                  label="描述文字"
                  placeholder="例如：记录美好瞬间、分享生活点滴"
                  value={currentBanner.description}
                  onValueChange={(v) => handleFieldChange('description', v)}
                  minRows={2}
                  description="显示在标题下方的描述性文字"
                />

                <FormImageUpload
                  label="背景图片"
                  value={currentBanner.backgroundImage}
                  onValueChange={(v) => handleFieldChange('backgroundImage', v)}
                  placeholder="上传或输入背景图片 URL"
                  description="Banner 的背景图片，建议使用高清大图"
                />

                {showButtonFields && (
                  <>
                    <Input
                      label="按钮文字（可选）"
                      placeholder="例如：查看更多、立即体验"
                      value={currentBanner.buttonText || ''}
                      onValueChange={(v) => handleFieldChange('buttonText', v)}
                      description="如果需要在 Banner 上显示按钮，请填写按钮文字"
                    />

                    <Input
                      label="按钮链接（可选）"
                      placeholder="/path/to/page 或 https://example.com"
                      value={currentBanner.buttonLink || ''}
                      onValueChange={(v) => handleFieldChange('buttonLink', v)}
                      description="按钮点击后跳转的链接"
                    />
                  </>
                )}
              </div>

              {/* 预览区域 */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-5">
                <h4 className="text-sm font-medium text-foreground mb-3">👁️ 实时预览</h4>
                <div 
                  className="relative h-[200px] rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
                  style={{
                    backgroundImage: currentBanner.backgroundImage ? `url(${currentBanner.backgroundImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="relative z-10 text-center text-white px-4">
                    {currentBanner.tips && (
                      <div className="text-xs font-medium mb-2 opacity-90">{currentBanner.tips}</div>
                    )}
                    {currentBanner.title && (
                      <h2 className="text-2xl font-bold mb-2">{currentBanner.title}</h2>
                    )}
                    {currentBanner.description && (
                      <p className="text-sm opacity-80">{currentBanner.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}