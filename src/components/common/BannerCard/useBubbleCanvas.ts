"use client";

import { useEffect, useRef } from "react";

/**
 * 气泡动画配置
 * 参考 anheyu 主题 header_canvas 气泡效果
 */
interface BubbleCanvasOptions {
  /** 气泡最大半径基数，默认 10 */
  radius?: number;
  /** 气泡密度（每像素宽度生成数量），默认 0.04 */
  density?: number;
}

interface Bubble {
  pos: { x: number; y: number };
  alpha: number;
  alphaChange: number;
  scale: number;
  scaleChange: number;
  speed: number;
}

/**
 * 在容器内创建气泡上升动画的 React Hook
 * 参考 anheyu 主题 header_canvas 气泡效果实现
 */
export function useBubbleCanvas(
  containerRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  options: BubbleCanvasOptions = {}
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationIdRef = useRef<number>(0);

  const radius = options.radius ?? 10;
  const density = options.density ?? 0.04;

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    let width = container.offsetWidth;
    let height = container.offsetHeight;

    // 创建 canvas 元素
    const canvas = document.createElement("canvas");
    canvas.style.pointerEvents = "none";
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.bottom = "0";
    canvas.style.zIndex = "2";
    canvas.width = width;
    canvas.height = height;
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 初始化气泡
    const bubbles: Bubble[] = [];

    function initBubble(bubble: Bubble) {
      bubble.pos.x = Math.random() * width;
      bubble.pos.y = height + Math.random() * 100;
      bubble.alpha = 0.1 + Math.random() * 0.5;
      bubble.alphaChange = 0.0002 + Math.random() * 0.0005;
      bubble.scale = 0.2 + Math.random() * 0.8;
      bubble.scaleChange = Math.random() * 0.002;
      bubble.speed = 0.1 + Math.random() * 0.4;
    }

    function createBubble(): Bubble {
      const bubble: Bubble = {
        pos: { x: 0, y: 0 },
        alpha: 0,
        alphaChange: 0,
        scale: 0,
        scaleChange: 0,
        speed: 0,
      };
      initBubble(bubble);
      return bubble;
    }

    // 根据密度生成气泡
    const num = Math.floor(width * density);
    for (let i = 0; i < num; i++) {
      bubbles.push(createBubble());
    }

    // 动画循环
    function animate() {
      ctx!.clearRect(0, 0, width, height);
      for (const bubble of bubbles) {
        if (bubble.alpha <= 0) {
          initBubble(bubble);
        }
        bubble.pos.y -= bubble.speed;
        bubble.alpha -= bubble.alphaChange;
        bubble.scale += bubble.scaleChange;
        ctx!.beginPath();
        ctx!.arc(
          bubble.pos.x,
          bubble.pos.y,
          bubble.scale * radius,
          0,
          2 * Math.PI,
          false
        );
        ctx!.fillStyle = `rgba(255,255,255,${bubble.alpha})`;
        ctx!.fill();
      }
      animationIdRef.current = requestAnimationFrame(animate);
    }

    animationIdRef.current = requestAnimationFrame(animate);

    // 窗口 resize 处理
    function handleResize() {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    }

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener("resize", handleResize);
      if (canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }
      canvasRef.current = null;
    };
  }, [enabled, radius, density]);

  return canvasRef;
}
