import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { meApi } from "@/api";
import type { AppNotification } from "@/types";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const typeLabel: Record<AppNotification["type"], string> = {
  SUBMITTED: "접수",
  HIGH_RISK: "고위험",
  STATUS_CHANGED: "상태 변경",
  RESOLVED: "처리 완료",
};

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void meApi.getNotifications()
      .then((items) => { if (!cancelled) setNotifications(items); })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "알림을 불러오지 못했습니다.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]);

  const markRead = (notification: AppNotification) => {
    if (notification.read) return;
    setNotifications((items) => items.map((item) =>
      item.id === notification.id ? { ...item, read: true } : item,
    ));
    void meApi.readNotification(notification.id).catch(() => {
      setNotifications((items) => items.map((item) =>
        item.id === notification.id ? { ...item, read: false } : item,
      ));
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/25" role="dialog" aria-modal="true" aria-label="알림">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="알림 닫기" onClick={onClose} />
      <section className="relative flex h-svh w-full max-w-md flex-col bg-[#fcfcfc] shadow-[-8px_0_24px_rgba(0,0,0,0.14)]">
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 pb-4 pt-14">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-neutral-800" />
            <h2 className="text-lg font-semibold tracking-[-0.45px] text-neutral-800">알림</h2>
          </div>
          <button type="button" aria-label="닫기" onClick={onClose} className="rounded-full p-2 transition active:scale-95">
            <X className="size-5 text-neutral-800" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && <p className="py-16 text-center text-sm text-neutral-500">알림을 불러오는 중...</p>}
          {error && <p className="px-5 py-16 text-center text-sm text-sogang-500">{error}</p>}
          {!loading && !error && notifications.length === 0 && (
            <p className="py-16 text-center text-sm text-neutral-500">새 알림이 없어요.</p>
          )}
          {notifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              onClick={() => markRead(notification)}
              className={`flex w-full gap-3 border-b border-gray-100 px-5 py-4 text-left transition active:bg-neutral-100 ${
                notification.read ? "bg-white" : "bg-sogang-10/40"
              }`}
            >
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${
                notification.type === "HIGH_RISK" ? "bg-[#D94A4A]" : notification.read ? "bg-neutral-300" : "bg-sogang-500"
              }`} />
              <span className="min-w-0 flex-1">
                <span className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-[-0.28px] text-neutral-800">{notification.title}</span>
                  <span className={`text-[10px] font-medium ${notification.type === "HIGH_RISK" ? "text-[#D94A4A]" : "text-neutral-500"}`}>
                    {typeLabel[notification.type]}
                  </span>
                </span>
                <span className="block text-sm leading-[1.45] tracking-[-0.28px] text-neutral-600">{notification.message}</span>
                <span className="mt-1.5 block text-xs text-neutral-400">
                  {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.createdAt))}
                </span>
              </span>
              {notification.read && <Check className="mt-1 size-4 shrink-0 text-neutral-400" />}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
