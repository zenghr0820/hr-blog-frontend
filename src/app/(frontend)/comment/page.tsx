import type { Metadata } from "next";
import { CommentPageClient } from "./_components/CommentPageClient";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "留言",
    description: "欢迎在这里留下你的足迹，与我互动交流。",
    path: "/comment",
  });
}

export default function CommentPage() {
  return <CommentPageClient />;
}
