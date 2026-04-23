"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { useScrollStore } from "@/store/scroll-store";

const LENIS_LERP = 0.1;
const SCROLL_DIRECTION_THRESHOLD = 60;

function isAdminPath(pathname: string | null): boolean {
  return !!pathname && (pathname === "/admin" || pathname.startsWith("/admin/"));
}

export function LenisScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  const handleScroll = useCallback((lenis: Lenis) => {
    const scrollY = Math.max(0, lenis.scroll);
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const scrollableHeight = scrollHeight - clientHeight;

    let scrollPercent = 0;
    if (scrollableHeight > 10 && scrollY > 1) {
      scrollPercent = Math.round((scrollY / scrollableHeight) * 100);
    }

    const lastScrollY = useScrollStore.getState()._lastScrollY;
    let scrollDirection: "up" | "down" | "none" = "none";
    let isScrolled = false;

    if (scrollY <= 0) {
      scrollDirection = "none";
      isScrolled = false;
    } else if (scrollY > SCROLL_DIRECTION_THRESHOLD) {
      scrollDirection = scrollY > lastScrollY ? "down" : "up";
      isScrolled = scrollDirection === "down";
    }

    let isFooterVisible = false;
    const footerEl = document.getElementById("footer-container");
    if (footerEl) {
      isFooterVisible = scrollY + clientHeight >= footerEl.offsetTop;
    }

    useScrollStore.setState({
      scrollY,
      scrollPercent,
      scrollDirection,
      isAtTop: scrollY === 0,
      isScrolled,
      isFooterVisible,
      _lastScrollY: scrollY,
    });
  }, []);

  useEffect(() => {
    if (isAdminPath(pathname)) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    if (lenisRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = new Lenis({
      lerp: prefersReducedMotion ? 1 : LENIS_LERP,
      smoothWheel: !prefersReducedMotion,
      autoRaf: true,
      allowNestedScroll: true,
    });

    lenis.on("scroll", handleScroll);
    lenisRef.current = lenis;
    useScrollStore.setState({ _lenis: lenis });

    return () => {
      lenis.destroy();
      lenisRef.current = null;
      useScrollStore.setState({ _lenis: null });
    };
  }, [pathname, handleScroll]);

  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname;
      if (!isAdminPath(pathname)) {
        lenisRef.current?.scrollTo(0, { immediate: true });
      }
    }
  }, [pathname]);

  return null;
}
