import { useCallback, useEffect, useState } from "react";
import { meApi } from "@/api";
import type { AppNotification } from "@/types";

/**
 * 알림 목록 조회·읽음 처리
 * 벨 배지와 알림 패널이 같은 상태를 공유하도록 화면에서 한 번만 호출한다.
 */
export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNotifications(await meApi.getNotifications());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "알림을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      return;
    }
    void reload();
  }, [enabled, reload]);

  // 낙관적 업데이트 — 실패하면 되돌린다
  const markRead = useCallback((notification: AppNotification) => {
    if (notification.read) return;
    setNotifications((items) =>
      items.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
    );
    void meApi.readNotification(notification.id).catch(() => {
      setNotifications((items) =>
        items.map((item) => (item.id === notification.id ? { ...item, read: false } : item)),
      );
    });
  }, []);

  return {
    notifications,
    loading,
    error,
    hasUnread: notifications.some((item) => !item.read),
    markRead,
    reload,
  };
}
