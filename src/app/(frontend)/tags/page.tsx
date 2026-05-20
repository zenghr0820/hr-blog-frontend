import type { Metadata } from "next";
import { TagPageContentNew } from "@/components/tags/TagPageContentNew";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "按标签浏览博客内容",
    description: "按分类浏览文章，快速找到感兴趣的内容",
    path: "/tags",
  });
}

export default function TagsPage() {
  return <TagPageContentNew />;
}
