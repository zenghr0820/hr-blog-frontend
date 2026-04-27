import type { SiteConfigData } from "@/types/site-config";
import type { UnifiedBannerConfig, PresetBannerPageKey } from "@/types/banner";

/**
 * 从站点配置中提取并标准化 Banner 配置
 * @param siteConfig 站点配置对象
 * @param pageKey 页面标识符（可以是预设的或自定义的）
 * @returns 标准化的 Banner 配置
 */
export function extractBannerConfig(
  siteConfig: SiteConfigData | undefined,
  pageKey: string
): UnifiedBannerConfig {
  if (!siteConfig) return {};

  // 从统一的 banner 字段读取所有配置（集中存储结构）
  const bannerValue = (siteConfig as any)?.banner;
  
  if (bannerValue) {
    try {
      let allBanners: Record<string, any> = {};
      
      // 如果是 JSON 字符串，解析它
      if (typeof bannerValue === 'string') {
        allBanners = JSON.parse(bannerValue);
      } else if (typeof bannerValue === 'object') {
        allBanners = bannerValue;
      }
      
      // 从集中存储中获取指定页面的配置
      if (allBanners && allBanners[pageKey]) {
        return normalizeBannerConfig(allBanners[pageKey]);
      }
    } catch (error) {
      console.warn('解析 banner 配置失败:', error);
    }
  }

  // 如果没有找到配置，返回空对象
  return {};
}

/**
 * 规范化 Banner 配置对象
 * 确保字段名称统一
 */
function normalizeBannerConfig(raw: Record<string, unknown>): UnifiedBannerConfig {
  return {
    tips: String(raw.tips ?? raw.tip ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? raw.desc ?? ''),
    backgroundImage: String(raw.backgroundImage ?? raw.background ?? raw.image ?? ''),
    buttonText: raw.buttonText ? String(raw.buttonText) : undefined,
    buttonLink: raw.buttonLink ? String(raw.buttonLink) : undefined,
    height: (raw.height !== undefined && raw.height !== null) ? Number(raw.height) : undefined,
  };
}

/**
 * 获取默认的 Banner 配置（用于降级）
 * 仅对预设页面有效
 */
export function getDefaultBannerConfig(pageKey: PresetBannerPageKey): Partial<UnifiedBannerConfig> {
  const defaults: Record<PresetBannerPageKey, Partial<UnifiedBannerConfig>> = {
    album: {
      tips: "相册",
      title: "Album",
      description: "记录美好瞬间",
    },
    essay: {
      tips: "动态",
      title: "Moments",
      description: "分享生活点滴",
    },
    fcircle: {
      tips: "朋友圈",
      title: "Fcircle",
      description: "探索精彩世界",
    },
    recent_comments: {
      tips: "最近评论",
      title: "Recent Comments",
      description: "查看最新互动",
    },
    equipment: {
      tips: "我的装备",
      title: "Equipment",
      description: "展示我的工具",
    },
    friend_link: {
      tips: "友情链接",
      title: "Friends",
      description: "结交志同道合的朋友",
    },
    home_top: {
      tips: "欢迎来到",
      title: "安和鱼",
    },
  };

  return defaults[pageKey] || {};
}

/**
 * 将 Banner 配置转换为存储格式（JSON 字符串）
 */
export function serializeBannerConfig(config: UnifiedBannerConfig): string {
  return JSON.stringify({
    tips: config.tips || '',
    title: config.title || '',
    description: config.description || '',
    backgroundImage: config.backgroundImage || '',
    buttonText: config.buttonText || '',
    buttonLink: config.buttonLink || '',
    height: config.height || 300,
  });
}

/**
 * 从 URL 路径中提取 Banner Page Key
 * 例如: /album -> 'album', /equipment -> 'equipment'
 */
export function getBannerPageKeyFromPath(pathname: string): string | null {
  const pathMap: Record<string, PresetBannerPageKey> = {
    '/album': 'album',
    '/essay': 'essay',
    '/fcircle': 'fcircle',
    '/recentcomments': 'recent_comments',
    '/equipment': 'equipment',
    '/links': 'friend_link',
    '/friend-links': 'friend_link',
  };

  // 移除尾部斜杠
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  return pathMap[normalizedPath] || null;
}
