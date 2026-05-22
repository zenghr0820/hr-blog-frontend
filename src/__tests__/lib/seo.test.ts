import { describe, expect, it } from "vitest";
import { buildPageMetadata } from "@/lib/seo";

describe("buildPageMetadata canonical policy", () => {
  it("noindex 页面默认不输出 canonical", async () => {
    const metadata = await buildPageMetadata({
      title: "登录",
      description: "登录页面",
      path: "/login",
      noindex: true,
      siteConfig: {
        APP_NAME: "安和鱼",
        SUB_TITLE: "生活明朗，万物可爱",
      },
    });

    expect(metadata.alternates).toBeUndefined();
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });

  it("显式 includeCanonical=true 时 noindex 页面仍可输出 canonical", async () => {
    const metadata = await buildPageMetadata({
      title: "登录",
      description: "登录页面",
      path: "/login",
      noindex: true,
      includeCanonical: true,
      siteConfig: {
        APP_NAME: "安和鱼",
        SUB_TITLE: "生活明朗，万物可爱",
      },
    });

    expect(metadata.alternates).toMatchObject({
      canonical: "/login",
    });
  });
});

describe("buildPageMetadata homepage title", () => {
  it("首页使用站点名称和副标题作为绝对 title", async () => {
    const metadata = await buildPageMetadata({
      title: "安和鱼 - 生活明朗，万物可爱",
      path: "/",
      absoluteTitle: true,
      siteConfig: {
        APP_NAME: "安和鱼",
        SUB_TITLE: "生活明朗，万物可爱",
      },
    });

    expect(metadata.title).toEqual({ absolute: "安和鱼 - 生活明朗，万物可爱" });
    expect(metadata.openGraph?.title).toBe("安和鱼 - 生活明朗，万物可爱");
    expect(metadata.twitter?.title).toBe("安和鱼 - 生活明朗，万物可爱");
  });
});
