import type { Metadata } from "next";
import { ToolsPageContent } from "./_components/ToolsPageContent";
import { buildPageMetadata, fetchSiteConfigForSeo } from "@/lib/seo";

async function getToolsConfig() {
  try {
    const config = await fetchSiteConfigForSeo();
    if (!config) return null;
    const bannerValue = (config as Record<string, unknown>)?.banner;
    let banner: Record<string, unknown> = {};
    if (bannerValue) {
      banner = typeof bannerValue === "string" ? JSON.parse(bannerValue) : (bannerValue as Record<string, unknown>);
    }
    const toolsBanner = (banner as Record<string, Record<string, unknown>>)?.tools ?? {};
    return {
      title: String(toolsBanner.title ?? ""),
      description: String(toolsBanner.description ?? ""),
      background: String(toolsBanner.backgroundImage ?? toolsBanner.background ?? ""),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getToolsConfig();

  return buildPageMetadata({
    title: data?.title || "工具库",
    description: data?.description || "收集实用工具与资源",
    path: "/tools",
    image: data?.background,
  });
}

export default function ToolsPage() {
  return <ToolsPageContent />;
}
