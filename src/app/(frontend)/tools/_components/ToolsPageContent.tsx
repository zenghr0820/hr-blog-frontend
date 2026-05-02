"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useSiteConfigStore } from "@/store/site-config-store";
import { Spinner } from "@/components/ui";
import { BannerCard } from "@/components/common/BannerCard";
import { CommentSection } from "@/components/post/Comment";
import { ToolCard } from "./ToolCard";
import { extractBannerConfig, getDefaultBannerConfig } from "@/lib/banner-config";
import type { ToolCategory } from "./types";

function parseToolsList(raw: unknown): ToolCategory[] {
  if (!raw) return [];
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(data)) return [];
    return data
      .map((category: Record<string, unknown>) => ({
        title: String(category.title ?? category.name ?? ""),
        description: String(category.description ?? ""),
        tools_list: (Array.isArray(category.tools_list)
          ? category.tools_list
          : Array.isArray(category.items)
            ? category.items
            : []
        ).map((item: Record<string, unknown>) => ({
          name: String(item.name ?? ""),
          image: String(item.image ?? ""),
          link: String(item.link ?? ""),
          description: String(item.description ?? ""),
        })),
      }))
      .filter((c: ToolCategory) => c.title || c.tools_list.length > 0);
  } catch {
    return [];
  }
}

export function ToolsPageContent() {
  const siteConfig = useSiteConfigStore(state => state.siteConfig);
  const isLoaded = useSiteConfigStore(state => state.isLoaded);

  const bannerConfig = extractBannerConfig(siteConfig, "tools");
  const defaultConfig = getDefaultBannerConfig("tools");

  const categories = useMemo(() => parseToolsList(siteConfig?.tools?.list), [siteConfig?.tools?.list]);

  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.trim().toLowerCase();
    return categories
      .map(cat => ({
        ...cat,
        tools_list: cat.tools_list.filter(
          item =>
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.tools_list.length > 0);
  }, [categories, searchQuery]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="cardWidget mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <BannerCard
        tips={bannerConfig.tips || defaultConfig.tips}
        title={bannerConfig.title || defaultConfig.title}
        description={bannerConfig.description || defaultConfig.description}
        backgroundImage={bannerConfig.backgroundImage}
        height={300}
      />

      {categories.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center py-16 text-center">
          <p className="text-(--anzhiyu-secondtext)">暂无工具数据</p>
        </div>
      ) : (
        <div className="mt-8">
          <div className="mb-6">
            <div className="relative">
              <Icon
                icon="mdi:magnify"
                width={18}
                height={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--anzhiyu-secondtext)"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索工具名称或描述..."
                className="w-full rounded-xl border border-(--anzhiyu-card-border) bg-(--anzhiyu-card-bg) py-2.5 pl-10 pr-4 text-sm text-(--anzhiyu-fontcolor) outline-none transition-colors placeholder:text-(--anzhiyu-secondtext) focus:border-(--anzhiyu-main)"
              />
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex flex-1 flex-wrap gap-2">
              {categories.map((cat, idx) => (
                <button
                  key={`${cat.title}-${idx}`}
                  type="button"
                  onClick={() => {
                    setActiveTab(idx);
                    setSearchQuery("");
                  }}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    activeTab === idx
                      ? "bg-(--anzhiyu-main) text-(--anzhiyu-white) shadow-(--anzhiyu-shadow-main)"
                      : "bg-(--anzhiyu-card-bg) text-(--anzhiyu-fontcolor) border border-(--anzhiyu-card-border) hover:text-(--anzhiyu-main)"
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          </div>

          {searchQuery.trim() ? (
            filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-(--anzhiyu-secondtext)">未找到匹配「{searchQuery}」的工具</p>
              </div>
            ) : (
              <div className="space-y-10">
                {filteredCategories.map((category, idx) => (
                  <section key={`${category.title}-${idx}`}>
                    <div className="mb-5">
                      <h2 className="text-2xl font-bold text-(--anzhiyu-fontcolor)">{category.title}</h2>
                      {category.description && (
                        <p className="mt-1.5 text-sm text-(--anzhiyu-secondtext)">{category.description}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {category.tools_list.map((item, itemIdx) => (
                        <ToolCard key={`${item.name}-${itemIdx}`} item={item} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )
          ) : (
            <div>
              {categories[activeTab] && (
                <section>
                  {categories[activeTab].description && (
                    <p className="mb-5 text-sm text-(--anzhiyu-secondtext)">{categories[activeTab].description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {categories[activeTab].tools_list.map((item, itemIdx) => (
                      <ToolCard key={`${item.name}-${itemIdx}`} item={item} />
                    ))}
                  </div>
                  {categories[activeTab].tools_list.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-(--anzhiyu-secondtext)">该分类下暂无工具</p>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-12">
        <CommentSection targetTitle="工具库" targetPath="/tools" />
      </div>
    </div>
  );
}
