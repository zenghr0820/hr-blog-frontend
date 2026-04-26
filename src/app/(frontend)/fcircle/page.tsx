import type { Metadata } from "next";
import { FcirclePageClient } from "./_components/FcirclePageClient";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "朋友圈",
    description: "展示朋友圈动态",
    path: "/fcircle",
  });
}

export default function FcirclePage() {
  return <FcirclePageClient />;
}
