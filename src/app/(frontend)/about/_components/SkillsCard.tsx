"use client";

import { useMemo } from "react";
import { Icon } from "@iconify/react";
import { useSiteConfigStore } from "@/store/site-config-store";
import type { SkillsTips } from "@/types/about";
import styles from "../about.module.css";

interface CreativityItem {
  name: string;
  icon: string;
  color: string;
}

interface SkillsCardProps {
  skillsTips: SkillsTips;
}

function isImageUrl(icon?: string): boolean {
  return !!icon && (icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("/"));
}

function isIconifyIcon(icon?: string): boolean {
  return !!icon && icon.includes(":") && !isImageUrl(icon);
}

function CreativityIcon({ item }: { item: CreativityItem }) {
  if (isIconifyIcon(item.icon)) {
    return <Icon icon={item.icon} className={styles.skillIconGraphic} aria-hidden="true" />;
  }

  if (isImageUrl(item.icon)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.icon} alt={item.name} className={styles.skillIconGraphic} />;
  }

  return null;
}

export function SkillsCard({ skillsTips }: SkillsCardProps) {
  const siteConfig = useSiteConfigStore(state => state.siteConfig);
  const creativity = useMemo(() => {
    return (siteConfig?.CREATIVITY as { creativity_list?: CreativityItem[] })?.creativity_list || [];
  }, [siteConfig?.CREATIVITY]);

  const creativityPairs = useMemo(() => {
    if (creativity.length === 0) return [];
    const list = [...creativity, ...creativity];
    const pairs: CreativityItem[][] = [];
    for (let i = 0; i < list.length; i += 2) {
      if (list[i + 1]) {
        pairs.push([list[i], list[i + 1]]);
      }
    }
    return pairs;
  }, [creativity]);

  return (
    <div className={`${styles.item} ${styles.skills}`}>
      <div className={styles.cardContent}>
        <div className={styles.itemTips}>{skillsTips.tips}</div>
        <span className={styles.itemTitle}>{skillsTips.title}</span>
        <div className={styles.skillsStyleGroup}>
          {/* 旋转的技能图标 */}
          {creativityPairs.length > 0 && (
            <div className={styles.skillsTagsGroup}>
              <div className={styles.tagsGroupWrapper}>
                {creativityPairs.map((pair, index) => (
                  <div key={index} className={styles.tagsGroupIconPair}>
                    {pair.map((item, j) => (
                      <div
                        key={j}
                        className={styles.tagsGroupIcon}
                        style={{ background: item.color }}
                        title={item.name}
                      >
                        <CreativityIcon item={item} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Hover 时显示的详细技能列表 */}
          <div className={styles.skillsList}>
            {creativity.map((item, index) => (
              <div key={index} className={styles.skillInfo}>
                <div className={styles.skillIcon} style={{ background: item.color }}>
                  <CreativityIcon item={item} />
                </div>
                <span>{item.name}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center" }}>
              <span>...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
