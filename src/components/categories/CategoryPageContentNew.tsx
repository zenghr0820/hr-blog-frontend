"use client";

import dynamic from "next/dynamic";
import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCategories } from "@/hooks/queries";
import { useSiteConfigStore } from "@/store/site-config-store";
import type { RoseChartConfig } from "@/components/common/charts";
import styles from "./CategoryPageContentNew.module.css";

// 动态导入图表组件（SSR 禁用）
const RoseChart = dynamic(
  () => import("@/components/common/charts").then(mod => mod.RoseChart),
  { 
    ssr: false,
    loading: () => <div className={styles.loadingTip}>图表加载中...</div>
  }
);

export function CategoryPageContentNew() {
  const router = useRouter();
  const siteConfig = useSiteConfigStore(state => state.siteConfig);
  const { data: categories = [], isLoading, isError } = useCategories();

  const homeTopCategories = useMemo(() => {
    return siteConfig?.HOME_TOP?.category || [];
  }, [siteConfig]);

  // 准备图表数据
  const chartData = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    
    return categories.map(category => ({
      name: category.name,
      value: category.count,
      id: category.id,
      slug: category.slug,
    }));
  }, [categories]);

  const goToCategory = useCallback(
    (categoryName: string) => {
      const homeCategory = homeTopCategories.find(category => category.name === categoryName);
      if (homeCategory?.path) {
        const path = homeCategory.path;
        const isExternal = homeCategory.isExternal ?? false;
        const isExternalUrl = /^https?:\/\//.test(path);

        if (isExternalUrl) {
          if (isExternal) {
            window.open(path, "_blank");
          } else {
            window.location.href = path;
          }
          return;
        }

        if (isExternal) {
          window.open(path, "_blank");
          return;
        }

        router.push(path);
        return;
      }

      router.push(`/categories/${encodeURIComponent(categoryName)}/`);
    },
    [homeTopCategories, router]
  );

  // 图表配置
  const chartConfig: RoseChartConfig = useMemo(() => ({
    title: "", // 不显示标题，因为页面已有标题
    height: "280px",
    radius: ["15%", "45%"],
    center: ["50%", "50%"],
    roseType: "radius",
    labelFormatter: "{b}：{c}篇",
    labelFontSize: 14,
    tooltipFormatter: "{b}: {c} 篇文章 ({d}%)",
    showLegend: false,
    onItemClick: (categoryName: string) => goToCategory(categoryName),
  }), [goToCategory]);

  return (
    <div className={`cardWidget ${styles.categoryChartContainer}`}>
      {isLoading && <div className={styles.loadingTip}>分类加载中...</div>}
      {isError && <div className={styles.errorTip}>加载分类失败，请稍后重试</div>}

      {!isLoading && !isError && (
        <>
          {chartData.length > 0 ? (
            <RoseChart
              data={chartData}
              config={chartConfig}
            />
          ) : (
            <div className={styles.emptyTip}>暂无分类数据</div>
          )}

          <div className={styles.categoryLists}>
            <ul className={styles.categoryList}>
              {categories.map(category => (
                <li key={category.id} >
                  <a 
                    href={`/categories/${encodeURIComponent(category.slug || category.name)}/`}
                    className={styles.categoryLink}
                  >
                    {category.name}
                  </a>
                  <span className={styles.categoryListCount}>{category.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
