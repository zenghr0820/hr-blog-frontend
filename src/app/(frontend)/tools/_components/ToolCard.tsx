"use client";

import { useState } from "react";
import { RiChat1Fill } from "react-icons/ri";
import { scrollTo } from "@/store/scroll-store";
import type { ToolItem } from "./types";

interface ToolCardProps {
  item: ToolItem;
}

export function ToolCard({ item }: ToolCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleCommentQuote = () => {
    const quoteText = item.description.trim();

    window.dispatchEvent(
      new CustomEvent("comment-form-set-quote", {
        detail: {
          text: quoteText,
          targetPath: "/tools",
        },
      })
    );

    const el = document.getElementById("post-comment");
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
      scrollTo(top);
    }
  };

  return (
    <div className="relative min-h-[240px] overflow-hidden rounded-xl border border-(--anzhiyu-card-border) bg-(--anzhiyu-card-bg) shadow-(--anzhiyu-shadow-border)">
      <div className="flex h-[110px] items-center justify-center border-b border-(--anzhiyu-card-border) bg-(--anzhiyu-secondbg)">
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-4/5 w-[160px] object-contain"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-3xl text-(--anzhiyu-secondtext)">{item.name.charAt(0) || "?"}</span>
        )}
      </div>

      <div className="mt-2 px-3 pb-10">
        <div
          className="mb-1 w-fit cursor-pointer truncate text-base font-bold leading-none text-(--anzhiyu-fontcolor) transition-colors hover:text-(--anzhiyu-main)"
          title={item.name}
        >
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="external nofollow noreferrer"
            >
              {item.name}
            </a>
          ) : (
            item.name
          )}
        </div>

        {item.description && (
          <div className="line-clamp-2 h-[40px] mt-2 text-xs leading-5 text-(--anzhiyu-secondtext)">{item.description}</div>
        )}
      </div>

      <div className="absolute bottom-2 left-0 flex w-full items-center justify-between px-3">
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="external nofollow noreferrer"
            className="rounded-lg bg-(--anzhiyu-gray-op) px-2.5 py-1 text-xs text-(--anzhiyu-fontcolor) no-underline transition-all hover:bg-(--anzhiyu-main) hover:text-(--anzhiyu-white)"
          >
            访问
          </a>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleCommentQuote}
          className="flex items-center justify-center rounded-lg bg-(--anzhiyu-gray-op) px-2.5 py-1 text-(--anzhiyu-fontcolor) transition-all hover:bg-(--anzhiyu-main) hover:text-(--anzhiyu-white)"
        >
          <RiChat1Fill size={12} />
        </button>
      </div>
    </div>
  );
}
