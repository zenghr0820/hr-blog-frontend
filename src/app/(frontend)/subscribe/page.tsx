import type { Metadata } from "next";
import { SubscribePageClient } from "./_components/SubscribePageClient";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "订阅本站",
    description: "通过公众号、邮件或RSS订阅本站，第一时间获取最新文章更新",
    path: "/subscribe",
  });
}

export default function SubscribePage() {
  return <SubscribePageClient />;
}
