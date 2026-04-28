"use client";

import { Icon } from "@iconify/react";
import { useReadingMode } from "@/hooks/use-reading-mode";

export function ReadingModeExit() {
  const { toggleReadingMode } = useReadingMode();

  return (
    <button
      type="button"
      className="exit-readmode"
      onClick={toggleReadingMode}
      aria-label="退出阅读模式"
    >
      <Icon icon="ri:logout-circle-r-line" />
    </button>
  );
}
