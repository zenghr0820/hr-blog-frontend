/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2026-02-01 14:27:14
 * @LastEditTime: 2026-02-01 14:39:44
 * @LastEditors: 安知鱼
 */
"use client";

import { motion, type Variants } from "framer-motion";
import { CategoryBar, FeedArticleList, Sidebar, MomentWidget } from "@/components/home";
import { useUiStore } from "@/store/ui-store";

// 动画变体
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1], // easeOut 的贝塞尔曲线
    },
  },
};

export function HomePageContent() {
  const isSidebarVisible = useUiStore(state => state.isSidebarVisible);

  return (
    <motion.div className="home-page-content" initial="hidden" animate="visible" variants={containerVariants}>
       {/* 即刻条 */}
      <motion.div className="essay-bar-wrapper" variants={itemVariants}>
        <MomentWidget />
      </motion.div>

      {/* 首页顶部区域 */}
      {/* <motion.div className="post-home-top-container" variants={itemVariants}>
        <HomeTop />
      </motion.div> */}

      {/* 主内容区域 */}
      <motion.div className="content-inner" variants={itemVariants}>
        {/* 左侧文章区 */}
        <div className="main-content">
          <CategoryBar />
          <FeedArticleList />
        </div>

        {/* 右侧侧边栏 */}
        {isSidebarVisible && <Sidebar />}
      </motion.div>
    </motion.div>
  );
}
