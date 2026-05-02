"use client";

import { useState, useEffect, useCallback, memo } from "react";
import styles from "./CardPoem.module.css";

const TOKEN_KEY = "jinrishici-token";

interface PoemData {
  content: string;
  origin: {
    dynasty: string;
    author: string;
    title: string;
  };
}

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // 静默失败
  }
}

async function loadPoem(): Promise<PoemData | null> {
  const token = getToken();
  const url = token
    ? `https://v2.jinrishici.com/one.json?client=browser-sdk/1.2&X-User-Token=${encodeURIComponent(token)}`
    : "https://v2.jinrishici.com/one.json?client=browser-sdk/1.2";

  const res = await fetch(url, { credentials: "include" });
  const data = await res.json();

  if (data.status === "success" && data.data) {
    if (data.token) saveToken(data.token);
    return data.data;
  }

  return null;
}

export const CardPoem = memo(function CardPoem() {
  const [poem, setPoem] = useState<PoemData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPoem = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadPoem();
      if (data) setPoem(data);
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoem();
  }, [fetchPoem]);

  return (
    <div className={styles.cardPoem}>
      <div className={styles.poemSentence}>
        {loading ? "诗词加载中..." : poem ? poem.content : "暂无诗词"}
      </div>
      {!loading && poem && (
        <div className={styles.poemInfo}>
          {poem.origin.dynasty && <div className={styles.poemDynasty}>{poem.origin.dynasty}</div>}
          {poem.origin.author && poem.origin.title && (
            <div className={styles.poemAuthor}>
              {poem.origin.author}《{poem.origin.title}》
            </div>
          )}
        </div>
      )}
    </div>
  );
});

CardPoem.displayName = "CardPoem";

export default CardPoem;
