"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import echarts from "@/lib/echarts/echarts-setup";
import type { EChartsOption } from "echarts";
import styles from "./RoseChart.module.css";

export interface ChartDataItem {
  name: string;
  value: number;
  [key: string]: any;
}

export interface RoseChartConfig {
  // 图表基础配置
  title?: string;
  height?: string;
  maxWidth?: string;
  className?: string;
  
  // 玫瑰图特定配置
  radius?: string | string[]; // 内外半径，如 ["15%", "45%"] 或 "50%"
  center?: string[]; // 圆心位置，如 ["50%", "50%"]
  roseType?: "radius" | "area"; // 玫瑰图类型（不使用 false，用 undefined 表示不启用）
  
  // 样式配置
  borderRadius?: number; // 圆角大小
  itemStyle?: any; // 额外的项样式
  
  // 标签配置
  labelFormatter?: string; // 标签格式化字符串，默认 "{b}\n{c}篇"
  labelFontSize?: number; // 标签字体大小
  showLabel?: boolean; // 是否显示标签
  
  // Tooltip 配置
  tooltipFormatter?: string; // 提示框格式化字符串，默认 "{b}: {c} ({d}%)"
  
  // 图例配置
  showLegend?: boolean; // 是否显示图例
  legendOrient?: "horizontal" | "vertical"; // 图例方向
  legendPosition?: string; // 图例位置
  
  // 事件回调
  onItemClick?: (name: string, data: ChartDataItem, params: any) => void;
  
  // 完整 option 覆盖（高级用法）
  optionOverride?: Partial<EChartsOption>;
}

export interface RoseChartProps {
  data: ChartDataItem[];
  config?: RoseChartConfig;
}

// 默认配置
const DEFAULT_CONFIG: Omit<RoseChartConfig, "onItemClick" | "optionOverride"> = {
  title: "",
  height: "280px",
  className: "",
  radius: ["15%", "45%"],
  center: ["50%", "50%"],
  roseType: "radius",
  borderRadius: 8,
  itemStyle: {},
  labelFormatter: "{b}\n{c}",
  labelFontSize: 14,
  showLabel: true,
  tooltipFormatter: "{b}: {c} ({d}%)",
  showLegend: true,
  legendOrient: "vertical",
  legendPosition: "left",
};

// 主题颜色配置
interface ThemeColors {
  textColor: string;
  titleColor: string;
  tooltipBg: string;
  tooltipBorder: string;
}

const LIGHT_THEME: ThemeColors = {
  textColor: "#374151",
  titleColor: "#111827",
  tooltipBg: "rgba(255, 255, 255, 0.9)",
  tooltipBorder: "#e5e7eb",
};

const DARK_THEME: ThemeColors = {
  textColor: "#e5e7eb",
  titleColor: "#f9fafb",
  tooltipBg: "rgba(0, 0, 0, 0.8)",
  tooltipBorder: "#374151",
};

export function RoseChart({
  data,
  config = {},
}: RoseChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  
  // 使用状态管理主题，触发重新渲染
  const [isDarkMode, setIsDarkMode] = useState(() => 
    document.documentElement.classList.contains("dark")
  );

  // 合并配置
  const finalConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);

  // 准备图表数据
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  // 获取当前主题颜色
  const themeColors = isDarkMode ? DARK_THEME : LIGHT_THEME;

  // 监听主题变化
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const newIsDarkMode = document.documentElement.classList.contains("dark");
          if (newIsDarkMode !== isDarkMode) {
            setIsDarkMode(newIsDarkMode);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, [isDarkMode]);

  // 构建基础 option
  const buildBaseOption = (): EChartsOption => {
    return {
      title: finalConfig.title ? {
        text: finalConfig.title,
        left: "center",
        top: 10,
        textStyle: {
          fontSize: 24,
          color: themeColors.titleColor,
        },
      } : undefined,
      
      tooltip: {
        trigger: "item",
        formatter: finalConfig.tooltipFormatter,
        backgroundColor: themeColors.tooltipBg,
        borderColor: themeColors.tooltipBorder,
        textStyle: {
          color: themeColors.textColor,
        },
      },
      
      legend: finalConfig.showLegend ? {
        orient: finalConfig.legendOrient,
        left: finalConfig.legendPosition,
        top: "middle",
        type: "scroll",
        textStyle: {
          fontSize: 14,
          color: themeColors.textColor,
        },
      } : undefined,
      
      series: [
        {
          name: "数据",
          type: "pie",
          radius: finalConfig.radius,
          center: finalConfig.center,
          roseType: finalConfig.roseType,
          itemStyle: {
            borderRadius: finalConfig.borderRadius,
            ...finalConfig.itemStyle,
          },
          label: finalConfig.showLabel ? {
            show: true,
            formatter: finalConfig.labelFormatter,
            fontSize: finalConfig.labelFontSize,
            color: themeColors.textColor,
          } : { show: false },
          emphasis: {
            label: {
              show: finalConfig.showLabel,
              fontSize: finalConfig.labelFontSize,
              fontWeight: "normal",
              color: themeColors.textColor,
            },
          },
          data: chartData,
        },
      ],
    };
  };

  // 初始化图表
  useEffect(() => {
    if (!chartRef.current || chartData.length === 0) return;

    // 如果已有实例，先销毁
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    // 创建新实例
    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    // 构建并设置 option
    let option = buildBaseOption();
    
    // 应用用户自定义覆盖
    if (finalConfig.optionOverride) {
      option = {
        ...option,
        ...finalConfig.optionOverride,
      };
    }

    chart.setOption(option);

    // 响应式调整
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
      chartInstance.current = null;
    };
  }, [chartData, finalConfig, isDarkMode]); // 添加 isDarkMode 依赖


  // 处理图表点击事件
  useEffect(() => {
    if (!chartInstance.current || !finalConfig.onItemClick) return;

    const handleClick = (params: any) => {
      if (params.data && params.data.name && finalConfig.onItemClick) {
        finalConfig.onItemClick(params.data.name, params.data, params);
      }
    };

    chartInstance.current.on("click", handleClick);

    return () => {
      chartInstance.current?.off("click", handleClick);
    };
  }, [finalConfig.onItemClick]);

  if (!chartData || chartData.length === 0) {
    return <div className={styles.emptyTip}>暂无数据</div>;
  }

  return (
    <div className={`${styles.roseChartContainer} ${finalConfig.className}`}>
      <div
        ref={chartRef}
        className={styles.chartWrapper}
        style={{ 
          height: finalConfig.height,
          maxWidth: finalConfig.maxWidth 
        }}
      />
    </div>
  );
}
