"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api/client";
import styles from "../subscribe.module.css";

function SubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");

  const [showUnsubscribeDialog, setShowUnsubscribeDialog] = useState(false);
  const [unsubscribeLoading, setUnsubscribeLoading] = useState(false);
  const [unsubscribeMessage, setUnsubscribeMessage] = useState("");
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState(false);

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
    setSubscribeError("");
  };

  const handleSubscribe = async () => {
    if (!email) return;
    setSubscribeLoading(true);
    setSubscribeError("");
    try {
      const res = await apiClient.post<{ code: number; message: string }>("/api/subscribe", {
        email,
      });
      if (res.code === 0) {
        setShowSubscribeDialog(false);
        setEmail("");
      } else {
        setSubscribeError(res.message || "订阅失败");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "订阅失败";
      setSubscribeError(message);
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleUnsubscribe = async (token: string) => {
    setUnsubscribeLoading(true);
    try {
      const res = await apiClient.get<{ code: number; message: string }>(
        `/api/subscribe/unsubscribe?token=${token}`
      );
      setUnsubscribeSuccess(res.code === 0);
      setUnsubscribeMessage(res.code === 0 ? "退订成功！" : res.message || "退订失败");
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
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSubscribe();
                  }}
                />
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
                disabled={subscribeLoading || !email}
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
