import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { EssayPageClient } from "./_components/EssayPageClient";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "动态",
    description: "查看我的最新动态，分享生活点滴和即时想法",
    path: "/essay",
  });
}

export default function EssayPage() {
  return <EssayPageClient />;
}
