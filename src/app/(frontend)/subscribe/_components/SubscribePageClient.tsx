"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api/client";
import styles from "../subscribe.module.css";

function SubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);

  const [showUnsubscribeDialog, setShowUnsubscribeDialog] = useState(false);
  const [unsubscribeLoading, setUnsubscribeLoading] = useState(false);
  const [unsubscribeMessage, setUnsubscribeMessage] = useState("");
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState(false);

  // 验证码倒计时
  useEffect(() => {
    if (codeCountdown > 0) {
      const timer = setTimeout(() => setCodeCountdown(codeCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [codeCountdown]);

  useEffect(() => {
    const action = searchParams.get("action");
    const token = searchParams.get("token");
    if (action === "unsubscribe" && token) {
      setShowUnsubscribeDialog(true);
      handleUnsubscribe(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSubscribeDialog = () => {
    setShowSubscribeDialog(true);
    setEmail("");
    setCode("");
    setSubscribeError("");
    setCodeCountdown(0);
  };

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    if (!email) {
      setSubscribeError("请输入邮箱地址");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubscribeError("请输入有效的邮箱地址");
      return;
    }

    if (isSendingCode || codeCountdown > 0) return;

    try {
      setIsSendingCode(true);
      setSubscribeError("");
      const result = await apiClient.post<{ code: number; message: string }>(
        "/api/public/subscribe/code",
        { email }
      );
      if (result.code === 200) {
        setCodeCountdown(60);
      } else {
        setSubscribeError(result.message || "发送验证码失败");
      }
    } catch {
      setSubscribeError("发送验证码失败，请稍后重试");
    } finally {
      setIsSendingCode(false);
    }
  }, [email, isSendingCode, codeCountdown]);

  // 提交订阅
  const handleSubscribe = useCallback(async () => {
    if (!email) {
      setSubscribeError("请输入邮箱地址");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubscribeError("请输入有效的邮箱地址");
      return;
    }

    if (!code) {
      setSubscribeError("请输入验证码");
      return;
    }

    setSubscribeLoading(true);
    setSubscribeError("");
    try {
      const res = await apiClient.post<{ code: number; message: string }>(
        "/api/public/subscribe",
        { email, code }
      );
      if (res.code === 200) {
        setShowSubscribeDialog(false);
        setEmail("");
        setCode("");
        setCodeCountdown(0);
      } else {
        setSubscribeError(res.message || "订阅失败");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "订阅失败";
      setSubscribeError(message);
    } finally {
      setSubscribeLoading(false);
    }
  }, [email, code]);

  const handleUnsubscribe = async (token: string) => {
    setUnsubscribeLoading(true);
    try {
      const res = await apiClient.get<{ code: number; message: string }>(
        `/api/public/unsubscribe/${token}`
      );
      setUnsubscribeSuccess(res.code === 200);
      setUnsubscribeMessage(res.code === 200 ? "退订成功！" : res.message || "退订失败");
    } catch {
      setUnsubscribeSuccess(false);
      setUnsubscribeMessage("退订失败");
    } finally {
      setUnsubscribeLoading(false);
    }
  };

  const closeUnsubscribeDialog = () => {
    setShowUnsubscribeDialog(false);
    router.replace("/subscribe");
  };

  return (
    <div className={`cardWidget ${styles.page}`}>
      <h1 className={styles.pageTitle}>订阅本站</h1>
      <p className={styles.pageSubtitle}>选择您喜欢的订阅方式，随时获取最新更新</p>

      <div className={styles.subscribeList}>
        <a
          className={`${styles.subscribeItem} ${styles.wechat}`}
          href="#"
          title="公众号"
          onClick={e => e.preventDefault()}
        >
          <div className={styles.subscribeDescription}>
            推送精选文章
            <br />
            推送全文
          </div>
          <div className={styles.subscribeInfoGroup}>
            <div className={styles.subscribeTitle}>公众号订阅</div>
            <div className={styles.subscribeInfo}>推荐的订阅方式</div>
            <Icon icon="ri:wechat-fill" className={styles.subscribeIcon} />
          </div>
        </a>

        <a
          className={`${styles.subscribeItem} ${styles.mail}`}
          href="#"
          title="邮件订阅"
          onClick={e => {
            e.preventDefault();
            openSubscribeDialog();
          }}
        >
          <div className={styles.subscribeDescription}>
            推送全部文章
            <br />
            推送简介
          </div>
          <div className={styles.subscribeInfoGroup}>
            <div className={styles.subscribeTitle}>邮件订阅</div>
            <div className={styles.subscribeInfo}>推荐的订阅方式</div>
            <Icon icon="ri:mail-fill" className={styles.subscribeIcon} />
          </div>
        </a>

        <a
          className={`${styles.subscribeItem} ${styles.rss}`}
          href="/atom.xml"
          title="RSS"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className={styles.subscribeDescription}>
            推送全部文章
            <br />
            推送简介
          </div>
          <div className={styles.subscribeInfoGroup}>
            <div className={styles.subscribeTitle}>RSS</div>
            <div className={styles.subscribeInfo}>备用订阅方式</div>
            <Icon icon="ri:rss-fill" className={styles.subscribeIcon} />
          </div>
        </a>
      </div>

      {showSubscribeDialog && (
        <div
          className={styles.dialogOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="subscribe-dialog-title"
          onClick={() => setShowSubscribeDialog(false)}
        >
          <div className={styles.dialogPanel} onClick={e => e.stopPropagation()}>
            <button
              className={styles.dialogClose}
              aria-label="关闭"
              onClick={() => setShowSubscribeDialog(false)}
            >
              <Icon icon="ri:close-line" width={20} />
            </button>

            <div className={styles.dialogHeader}>
              <Icon icon="ri:mail-fill" className={styles.dialogHeaderIcon} />
              <h2 id="subscribe-dialog-title" className={styles.dialogTitle}>
                邮件订阅
              </h2>
            </div>

            <div className={styles.dialogBody}>
              <p className={styles.dialogDesc}>
                订阅后将收到本站最新文章推送
                <br />
                可随时通过邮件中的退订链接取消订阅
              </p>

              <div className={styles.inputGroup}>
                <label htmlFor="subscribe-email" className={styles.inputLabel}>
                  邮箱地址
                </label>
                <input
                  id="subscribe-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="请输入您的邮箱地址"
                  disabled={subscribeLoading}
                  className={styles.input}
                />
              </div>

              <div className={styles.codeInputGroup}>
                <div className={styles.codeInputWrapper}>
                  <label htmlFor="subscribe-code" className={styles.inputLabel}>
                    验证码
                  </label>
                  <input
                    id="subscribe-code"
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="请输入验证码"
                    disabled={subscribeLoading}
                    className={styles.input}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleSubscribe();
                    }}
                  />
                </div>
                <button
                  className={styles.sendCodeBtn}
                  disabled={codeCountdown > 0 || isSendingCode}
                  onClick={handleSendCode}
                >
                  {isSendingCode ? "发送中..." : codeCountdown > 0 ? `${codeCountdown}s` : "发送验证码"}
                </button>
              </div>

              {subscribeError && <p className={styles.formError}>{subscribeError}</p>}
            </div>

            <div className={styles.dialogFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => setShowSubscribeDialog(false)}
              >
                取消
              </button>
              <button
                className={styles.btnPrimary}
                disabled={subscribeLoading || !email || !code}
                onClick={handleSubscribe}
              >
                {subscribeLoading ? "订阅中..." : "确认订阅"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnsubscribeDialog && (
        <div
          className={styles.dialogOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsubscribe-dialog-title"
          onClick={unsubscribeLoading ? undefined : closeUnsubscribeDialog}
        >
          <div className={styles.dialogPanel} onClick={e => e.stopPropagation()}>
            <button
              className={styles.dialogClose}
              aria-label="关闭"
              onClick={closeUnsubscribeDialog}
              disabled={unsubscribeLoading}
            >
              <Icon icon="ri:close-line" width={20} />
            </button>

            <div className={styles.dialogHeader}>
              <Icon icon="ri:close-circle-line" className={styles.dialogHeaderIcon} />
              <h2 id="unsubscribe-dialog-title" className={styles.dialogTitle}>
                退订确认
              </h2>
            </div>

            <div className={styles.dialogBody}>
              <div className={styles.unsubscribeContent}>
                {unsubscribeLoading ? (
                  <div className={styles.loadingState}>
                    <Icon icon="ri:loader-4-line" className={styles.loadingIcon} />
                    <p>{unsubscribeMessage || "处理中..."}</p>
                  </div>
                ) : (
                  <div className={styles.resultState}>
                    <Icon
                      icon={
                        unsubscribeSuccess
                          ? "ri:checkbox-circle-line"
                          : "ri:close-circle-line"
                      }
                      className={unsubscribeSuccess ? styles.successIcon : styles.errorIcon}
                    />
                    <h3>{unsubscribeMessage}</h3>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.dialogFooter}>
              <button className={styles.btnPrimary} onClick={closeUnsubscribeDialog}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SubscribePageClient() {
  return (
    <Suspense fallback={null}>
      <SubscribeContent />
    </Suspense>
  );
}
