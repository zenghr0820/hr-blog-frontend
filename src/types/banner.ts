/**
 * 统一的 Banner 配置接口
 * 对应 BannerCard 组件的 Props
 */
export interface UnifiedBannerConfig {
  /** 提示文字（小标签） */
  tips?: string;
  /** 标题 */
  title?: string;
  /** 描述文字 */
  description?: string;
  /** 背景图片 URL */
  backgroundImage?: string;
  /** 按钮文字（可选） */
  buttonText?: string;
  /** 按钮链接（可选） */
  buttonLink?: string;
  /** 高度（默认 300） */
  height?: number | string;
}

/**
 * 预设的 Banner 页面标识符类型
 * 用于区分不同页面的 banner 配置
 */
export type PresetBannerPageKey = 
  | 'album'
  | 'essay'
  | 'fcircle'
  | 'recent_comments'
  | 'equipment'
  | 'friend_link'
  | 'home_top';

/**
 * Banner 页面标识符类型（包含预设和自定义）
 */
export type BannerPageKey = PresetBannerPageKey | string;

/**
 * Banner 配置存储格式
 * key: banner.{pageKey}
 * value: JSON 字符串或扁平化字段
 */
export interface BannerStorageConfig {
  [key: string]: string | UnifiedBannerConfig | undefined;
}
