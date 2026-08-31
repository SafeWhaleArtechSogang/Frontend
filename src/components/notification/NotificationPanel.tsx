import type { AppNotification } from "@/types";
import NotificationItem from "./NotificationItem";

interface NotificationPanelProps {
  open: boolean;
  notifications: AppNotification[];
  loading: boolean;
  error: string | null;
  onRead: (notification: AppNotification) => void;
}

/**
 * 내 프로필용 알림 — 화면 전체를 덮는 패널
 * 상단바는 위에 그대로 남아(z-40) 그 자리의 버튼이 닫기를 겸한다.
 */
export default function NotificationPanel({
  open,
  notifications,
  loading,
  error,
  onRead,
}: NotificationPanelProps) {
  return (
    <div
      aria-hidden={!open}
      className={`absolute inset-0 z-30 flex flex-col bg-gray-10 transition-all duration-300 ease-out ${
        open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      <div className="shrink-0 px-4 pb-3 pt-14">
        <h2 className="text-xl font-semibold leading-[1.48] tracking-[-0.5px] text-neutral-800">
          알림
        </h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-gray-200">
        {loading && <p className="py-20 text-center text-sm text-neutral-500">알림을 불러오는 중...</p>}
        {error && <p className="px-5 py-20 text-center text-sm text-sogang-500">{error}</p>}
        {!loading && !error && notifications.length === 0 && (
          <p className="py-20 text-center text-sm text-neutral-500">새 알림이 없어요.</p>
        )}
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRead={onRead}
            className="pr-4"
          />
        ))}
      </div>
    </div>
  );
}
