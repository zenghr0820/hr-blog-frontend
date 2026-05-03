/**
 * 付费内容事件 Hook
 * 为付费内容块的购买按钮和订单查询链接绑定点击事件，
 * 当前显示"即将上线"提示，待后端支付功能就绪后替换为真实逻辑。
 */

import { useCallback } from "react";
import { addToast } from "@heroui/react";

export function usePaidContentEvents() {
  const initPaidContentEvents = useCallback((container: HTMLElement) => {
    const purchaseBtns = container.querySelectorAll(".purchase-btn");
    purchaseBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const title = btn.getAttribute("data-title") || "付费内容";
        addToast({
          title: "付费内容",
          description: `「${title}」的购买功能即将上线，敬请期待`,
          color: "warning",
        });
      });
    });

    const queryLinks = container.querySelectorAll(".query-order-link");
    queryLinks.forEach(link => {
      link.addEventListener("click", () => {
        addToast({
          title: "查询订单",
          description: "订单查询功能即将上线，敬请期待",
          color: "primary",
        });
      });
    });
  }, []);

  return { initPaidContentEvents };
}
