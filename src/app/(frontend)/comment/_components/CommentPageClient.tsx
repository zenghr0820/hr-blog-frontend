"use client";

import Link from "next/link";
import { useSiteConfigStore } from "@/store/site-config-store";
import { useUiStore } from "@/store/ui-store";
import { BannerCard } from "@/components/common/BannerCard";
import { CommentSection } from "@/components/post/Comment";
import { Sidebar } from "@/components/home/Sidebar";
import { extractBannerConfig } from "@/lib/banner-config";
import styles from "../comment.module.css";

export function CommentPageClient() {
  const siteConfig = useSiteConfigStore(state => state.siteConfig);
  const isSidebarVisible = useUiStore(state => state.isSidebarVisible);

  const bannerConfig = extractBannerConfig(siteConfig, "comment");
  const hasBanner = bannerConfig && (bannerConfig.title || bannerConfig.tips || bannerConfig.description || bannerConfig.backgroundImage);

  return (
    <div className="content-inner">
      <div className="main-content">
        <div className={`cardWidget ${styles.commentPageContent}`}>
          {hasBanner && (
            <BannerCard
              tips={bannerConfig.tips || "留言板"}
              title={bannerConfig.title || "Message"}
              description={bannerConfig.description || "欢迎在这里留下你的足迹"}
              backgroundImage={bannerConfig.backgroundImage}
              height={300}
              buttonText={bannerConfig.buttonText}
              buttonLink={bannerConfig.buttonLink}
            />
          )}
          
          <div>
            <div className={styles.poemWrap}>
              <div className={`${styles.poemBorder} ${styles.poemBorderLeft}`} />
              <div className={`${styles.poemBorder} ${styles.poemBorderRight}`} />
              <span className={styles.poemTitle}>꧁༺金句༻꧂</span>
              <p className={styles.poemText}>为什么要吵架呢？就不能心平气和的坐下来，打对方几巴掌吗？</p>
            </div>

            <p className={styles.welcomeText}>
              欢迎来到留言板！如果有什么 <strong>想说的</strong>、<strong>想问的</strong> 或者 <strong>发现了本站的BUG</strong>，欢迎留言告知😊。
            </p>
            <p className={styles.welcomeText}>
              若想 <strong>添加友链</strong> 请前往{" "}
              <Link href="/link">申请友情链接</Link> 页面进行友链申请😄
            </p>
            <p className={styles.welcomeText}>
              下面是留言板规范，<strong>希望您可以遵守规范，让我们的留言板成为一个积极、友好的交流平台！</strong>
            </p>

            <details className={styles.rulesToggle}>
              <summary>点击查看</summary>
              <div className={styles.rulesContent}>
                <h2>1. <strong>尊重他人</strong></h2>
                <ul>
                  <li>尊重每个成员的观点和意见。</li>
                  <li>避免使用侮辱性、歧视性或攻击性的语言。</li>
                </ul>

                <h2>2. <strong>保持友好和谐</strong></h2>
                <ul>
                  <li>保持友好的沟通氛围，鼓励积极互动。</li>
                  <li>避免引起不必要的争端或争吵。</li>
                </ul>

                <h2>3. <strong>不允许骚扰</strong></h2>
                <ul>
                  <li>禁止骚扰、威胁或恶意追踪其他成员。</li>
                  <li>如发现任何骚扰行为，将会被直接拉入黑名单。</li>
                </ul>

                <h2>4. <strong>不得发布不适当内容</strong></h2>
                <ul>
                  <li>不得发布涉及色情、恶心或令人不适的内容。</li>
                  <li>禁止分享任何违法或侵权的材料。</li>
                </ul>

                <h2>5. <strong>避免广告和垃圾信息</strong></h2>
                <ul>
                  <li>请勿在留言板发布未经许可的广告信息。</li>
                  <li>禁止发送垃圾信息、连续无意义的文字或链接。</li>
                </ul>

                <h2>6. <strong>谨慎共享个人信息</strong></h2>
                <ul>
                  <li>不要在留言板上公开敏感个人信息。</li>
                  <li>谨慎分享任何涉及隐私的内容。</li>
                </ul>

                <h2>7. <strong>遵守版权法</strong></h2>
                <ul>
                  <li>不得在留言板上发布侵犯版权的内容。</li>
                  <li>尊重他人的知识产权。</li>
                </ul>

                <h2>8. <strong>尊重管理员的决定</strong></h2>
                <ul>
                  <li>遵循<strong>网站管理条约</strong>和<strong>中华人民共和国网络安全法</strong>的指示和决定。</li>
                  <li>若有任何疑问或争议，请以邮件的方式私下联系管理员解决。</li>
                </ul>

                <div className={styles.rulesNotice}>
                  <p><strong>请注意：</strong></p>
                  <ul>
                    <li>违反规范的行为可能导致警告、禁言或永久封禁。</li>
                    <li>网站站长有权根据具体情况对规范进行调整和解释。</li>
                  </ul>
                </div>
              </div>
            </details>
          </div>

          <hr className={styles.hr} />

          <div style={{ marginTop: "1rem" }}>
            <CommentSection targetTitle="留言板" targetPath="/comment" />
          </div>
        </div>
      </div>

      {isSidebarVisible && <Sidebar />}
    </div>
  );
}
