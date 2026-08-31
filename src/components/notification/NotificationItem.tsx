import type { AppNotification } from "@/types";
import { NOTIFICATION_TYPE_LABEL } from "@/constants/notification";

/** 알림 항목 1개 — 높이 약 83px. 드롭다운·전체 패널 공용 */
export default function NotificationItem({
  notification,
  onRead,
  className = "",
}: {
  notification: AppNotification;
  onRead: (notification: AppNotification) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onRead(notification)}
      className={`flex w-full gap-2.5 border-b border-gray-200 py-3 pl-4 text-left transition active:bg-black/5 ${
        notification.read ? "" : "bg-sogang-10/60"
      } ${className}`}
    >
      <span
        className={`mt-1.5 size-2 shrink-0 rounded-full ${
          notification.type === "HIGH_RISK"
            ? "bg-risk-high"
            : notification.read
              ? "bg-neutral-300"
              : "bg-sogang-500"
        }`}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold tracking-[-0.28px] text-neutral-800">
            {notification.title}
          </span>
          <span
            className={`shrink-0 text-[10px] font-medium ${
              notification.type === "HIGH_RISK" ? "text-risk-high" : "text-neutral-500"
            }`}
          >
            {NOTIFICATION_TYPE_LABEL[notification.type]}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs leading-[1.45] tracking-[-0.28px] text-neutral-600">
          {notification.message}
        </span>
        <span className="mt-1 block text-[11px] text-neutral-400">
          {new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(
            new Date(notification.createdAt),
          )}
        </span>
      </span>
    </button>
  );
}
