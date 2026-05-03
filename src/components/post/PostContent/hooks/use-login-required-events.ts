/**
 * 登录可见内容事件 Hook
 * 为登录可见内容块的按钮绑定点击事件，
 * 点击后跳转到登录/注册页面，并携带当前页面地址作为重定向参数。
 */

import { useCallback } from "react";

export function useLoginRequiredEvents() {
  const initLoginRequiredContentEvents = useCallback((container: HTMLElement) => {
    const loginBtns = container.querySelectorAll("[data-login-action='check-email']");
    loginBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `/login?redirect=${currentUrl}`;
      });
    });

    const registerBtns = container.querySelectorAll("[data-login-action='register-form']");
    registerBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `/register?redirect=${currentUrl}`;
      });
    });
  }, []);

  return { initLoginRequiredContentEvents };
}
