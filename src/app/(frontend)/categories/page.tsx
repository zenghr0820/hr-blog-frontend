import type { Metadata } from "next";
import { CategoryPageContentNew } from "@/components/categories/CategoryPageContentNew";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "分类",
    description: "按主题分类浏览博客内容。",
    path: "/categories",
  });
}

export default function CategoriesPage() {
  return <CategoryPageContentNew />;
}
