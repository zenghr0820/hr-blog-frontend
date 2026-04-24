"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import type { Article } from "@/types/article";
import styles from "./PostDetail.module.css";
import { Icon } from "@iconify/react";

function sanitize(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html);
}

export function ArticleAiSummary({ article }: { article: Article }) {
  // 优先使用 ai_summary，其次使用 summaries
  const text = article.ai_summary || (article.summaries || []).map(s => s.trim()).filter(Boolean)[0];
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  
  // 打字效果
  useEffect(() => {
    if (!text) return;
    
    let currentIndex = 0;
    setIsTyping(true);
    
    const timer = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 30); // 每个字符 30ms
    
    return () => clearInterval(timer);
  }, [text]);

  if (!text) return null;

  return (
    <div className={styles.aiSummary} role="region" aria-label="AI文章摘要">
      {/* 头部装饰 */}
      <div className={styles.aiHead}>
        <div className={styles.aiHeadLeft}>
          <div className={`${styles.aiCircle} ${styles.aiCircle1}`}></div>
          <div className={`${styles.aiCircle} ${styles.aiCircle2}`}></div>
          <div className={`${styles.aiCircle} ${styles.aiCircle3}`}></div>
        </div>
        <div className={styles.aiHeadRight}>
          <span 
            className={styles.aiAboutLink} 
            // href="#" 
            // target="_blank"
            // rel="noopener noreferrer"
          >
            关于AI
          </span>
        </div>
      </div>

      {/* AI 摘要内容 - 打字效果 */}
      <div 
        className={styles.aiExplanation}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: sanitize(displayedText) }}
      />

      {/* 标题栏 */}
      <div className={styles.aiTitle}>
        <div className={styles.aiTitleLeft}>
          <Icon icon="ri:verified-badge-fill" />
          <div className={styles.aiTitleText}>{article?.owner_name || "博客"}のAI摘要</div>
        </div>
        <div className={styles.aiTag} id="ai-tag">
          AI 自动生成
        </div>
      </div>
    </div>
  );
}
