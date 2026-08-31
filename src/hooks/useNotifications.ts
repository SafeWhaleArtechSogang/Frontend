import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, meApi } from "@/api";
import type { AppNotification } from "@/types";

/**
 * 알림 목록 조회·읽음 처리
 * 벨 배지와 알림 패널이 같은 상태를 공유하도록 화면에서 한 번만 호출한다.
 * source로 사용자용(/me)과 관리자용(/admin) 엔드포인트를 고른다.
 */
export function useNotifications(enabled: boolean, source: "me" | "admin" = "me") {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = useMemo(
    () =>
      source === "admin"
        ? { list: adminApi.notifications, read: adminApi.readNotification }
        : { list: meApi.getNotifications, read: meApi.readNotification },
    [source],
  );

  // reload는 version을 올려 아래 effect를 다시 태운다 (effect 안에서 동기 setState를 피한다)
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const items = await api.list();
        if (cancelled) return;
        setNotifications(items);
        setError(null);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "알림을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [enabled, api, version]);

  // 로그아웃 등으로 비활성화되면 이전 목록을 노출하지 않는다
  const visible = enabled ? notifications : [];

  // 낙관적 업데이트 — 실패하면 되돌린다
  const markRead = useCallback(
    (notification: AppNotification) => {
      if (notification.read) return;
      setNotifications((items) =>
        items.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
      );
      void api.read(notification.id).catch(() => {
        setNotifications((items) =>
          items.map((item) => (item.id === notification.id ? { ...item, read: false } : item)),
        );
      });
    },
    [api],
  );

  return {
    notifications: visible,
    loading,
    error,
    hasUnread: visible.some((item) => !item.read),
    markRead,
    reload,
  };
}
