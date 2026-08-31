import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronLeft, X } from "lucide-react";
import ProfileIdentity from "@/components/common/ProfileIdentity";
import MyReportCard from "@/components/report/MyReportCard";
import ReportDetailView from "@/components/report/ReportDetailView";
import NotificationPanel from "@/components/notification/NotificationPanel";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/auth";
import { meApi } from "@/api";
import type { Report, RiskLevel } from "@/types";

interface MyReport {
  id: number;
  title: string;
  description: string;
  departmentName: string;
  riskLevel: RiskLevel;
  date: string;
  imageUrl?: string;
}

function toMyReport(report: Report): MyReport {
  return {
    id: report.id,
    title: report.locationDescription ?? report.building?.name ?? report.summary ?? "안전 신고",
    description: report.description ?? "상세 내용이 없습니다.",
    departmentName: report.department?.name ?? "담당 부서 배정 중",
    riskLevel: report.riskLevel ?? "MEDIUM",
    date: new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" })
      .format(new Date(report.submittedAt ?? report.createdAt)),
    imageUrl: report.photos[0]?.url,
  };
}

export default function MyReportsPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isAuthLoading, user, logout } = useAuth();
  const [reports, setReports] = useState<MyReport[]>([]);
  const [selected, setSelected] = useState<MyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, loading: notificationsLoading, error: notificationsError, hasUnread, markRead } =
    useNotifications(isLoggedIn);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isLoggedIn) {
      navigate("/login", { replace: true, state: { from: "/my-reports" } });
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const data = await meApi.getReports();
        if (!cancelled) setReports(data.map(toMyReport));
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "내 신고를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [isAuthLoading, isLoggedIn, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/map");
  };

  return (
    <div className="app-shell relative flex h-svh flex-col bg-gray-10">
      {/* 상단바 (297:4845) */}
      <div className="flex shrink-0 items-center justify-between px-2.5 pt-2">
        <button
          type="button"
          aria-label="뒤로"
          className="flex size-9 items-center justify-center transition active:scale-95"
          onClick={() => (selected ? setSelected(null) : navigate("/map"))}
        >
          <ChevronLeft className="size-6 text-neutral-800" />
        </button>
        {!selected && (
          <button
            type="button"
            aria-label="알림"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="relative z-40 flex size-9 items-center justify-center transition active:scale-95"
          >
            {notificationsOpen ? (
              <X className="size-5 text-neutral-800" />
            ) : (
              <span className="relative block">
                <Bell className="size-5 text-neutral-800" />
                {hasUnread && (
                  <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-sogang-500 ring-2 ring-gray-10" />
                )}
              </span>
            )}
          </button>
        )}
      </div>

      {selected ? (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <ReportDetailView report={selected} />
        </div>
      ) : (
        <>
          {/* 프로필 (297:4765) */}
          <div className="shrink-0 border-b border-gray-200 px-4 pb-4 pt-5">
            <div className="flex items-center gap-[30px] px-1">
              <ProfileIdentity
                className="flex-1"
                name={user?.name ?? "사용자"}
                detail={
                  [user?.major, user?.studentNo].filter(Boolean).join(" · ") || "프로필 정보 미등록"
                }
              />
              <div className="flex w-40 shrink-0 flex-col items-center text-neutral-800">
                <span className="text-xl font-semibold leading-[1.48] tracking-[-0.5px]">
                  {reports.length}
                </span>
                <span className="text-[10px] font-medium leading-[1.48] tracking-[-0.25px]">내 신고</span>
              </div>
            </div>
          </div>

          {/* 신고 목록 (297:5035) */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading && <p className="py-20 text-center text-sm text-neutral-500">내 신고를 불러오는 중...</p>}
            {error && <p className="px-4 py-20 text-center text-sm text-sogang-500">{error}</p>}
            {!loading && !error && reports.length === 0 && (
              <p className="py-20 text-center text-base font-medium leading-[1.48] tracking-[-0.4px] text-neutral-500">
                아직 신고한 내역이 없어요.
                <br />
                위험한 곳을 발견하면 알려주세요.
              </p>
            )}
            {reports.map((report) => (
              <MyReportCard key={report.id} report={report} onClick={() => setSelected(report)} />
            ))}

            {!loading && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-6 text-center text-sm font-medium tracking-[-0.35px] text-neutral-500 underline underline-offset-4 transition active:text-neutral-800"
              >
                로그아웃
              </button>
            )}
          </div>
        </>
      )}
      <NotificationPanel
        open={notificationsOpen}
        notifications={notifications}
        loading={notificationsLoading}
        error={notificationsError}
        onRead={markRead}
      />
    </div>
  );
}
