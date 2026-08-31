import type { AppNotification } from "@/types";
import NotificationItem from "./NotificationItem";

interface NotificationDropdownProps {
  open: boolean;
  notifications: AppNotification[];
  loading: boolean;
  error: string | null;
  onRead: (notification: AppNotification) => void;
}

/**
 * 지도용 알림 — 화면 상단에서 내려오는 카드 (항목 3개 높이)
 * 닫기 버튼은 화면의 알림 버튼이 겸하므로 우측 여백을 둔다.
 */
export default function NotificationDropdown({
  open,
  notifications,
  loading,
  error,
  onRead,
}: NotificationDropdownProps) {
  return (
    <div
      aria-hidden={!open}
      className={`absolute left-4 right-4 top-4 z-30 transition-all duration-300 ease-out ${
        open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
      }`}
    >
      <div className="h-[248px] overflow-hidden rounded-[20px] bg-white/70 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)] backdrop-blur-[20px]">
        <div className="h-full min-h-0 overflow-y-auto scrollbar-hide">
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
              className="pr-14"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
