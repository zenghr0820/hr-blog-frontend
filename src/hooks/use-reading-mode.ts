"use client";

import { useCallback, useEffect } from "react";
import { useSyncExternalStore } from "react";

const READING_MODE_CLASS = "reading-mode";

let isReadingMode = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function getSnapshot() {
  return isReadingMode;
}

function updateBodyClass(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.body.classList.toggle(READING_MODE_CLASS, enabled);
}

export function useReadingMode() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    updateBodyClass(enabled);
  }, [enabled]);

  const toggleReadingMode = useCallback(() => {
    isReadingMode = !isReadingMode;
    updateBodyClass(isReadingMode);
    notify();
  }, []);

  return { isReadingMode: enabled, toggleReadingMode } as const;
}
