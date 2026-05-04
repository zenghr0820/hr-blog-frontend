import { useCallback } from "react";

const svgCache = new Map<string, string>();

function toIconifySvgUrl(iconifyName: string): string {
  const colonIdx = iconifyName.indexOf(":");
  if (colonIdx < 1) return "";
  const prefix = iconifyName.slice(0, colonIdx);
  const name = iconifyName.slice(colonIdx + 1);
  if (!name) return "";
  return `https://api.iconify.design/${prefix}/${name}.svg`;
}

async function fetchSvg(iconifyName: string): Promise<string | null> {
  if (svgCache.has(iconifyName)) return svgCache.get(iconifyName)!;
  const url = toIconifySvgUrl(iconifyName);
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const svg = await res.text();
    svgCache.set(iconifyName, svg);
    return svg;
  } catch {
    return null;
  }
}

function svgToInline(svgText: string, iconifyName: string): SVGElement | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) return null;
  svg.setAttribute("data-icon", iconifyName);
  svg.classList.add("iconify-inline");
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.style.width = "1em";
  svg.style.height = "1em";
  svg.style.verticalAlign = "-0.125em";
  return svg;
}

export function useIconifyNormalize() {
  const normalizeIconifyIcons = useCallback(async (container: HTMLElement) => {
    const spans = container.querySelectorAll<HTMLSpanElement>(".iconify[data-icon]");
    if (spans.length === 0) return;

    const tasks = Array.from(spans).map(async (span) => {
      const iconName = (span.getAttribute("data-icon") || "").trim();
      if (!iconName || !iconName.includes(":")) return;

      const svgText = await fetchSvg(iconName);
      if (!svgText) return;

      const inlineSvg = svgToInline(svgText, iconName);
      if (inlineSvg) {
        span.replaceWith(inlineSvg);
      }
    });

    await Promise.all(tasks);
  }, []);

  return { normalizeIconifyIcons };
}
