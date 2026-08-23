import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import Header from "@/components/layout/Header";
import { useAuth } from "@/auth";
import { meApi } from "@/api";
import type { Report, RiskLevel, ReportStatus, ReporterType } from "@/types";

interface MyReport {
  id: number;
  trackingId: string;
  title: string;
  description: string;
  departmentName: string;
  riskLevel: RiskLevel;
  status: ReportStatus;
  reporterType: ReporterType;
  date: string;
  imageUrl?: string;
}

function toMyReport(report: Report): MyReport {
  return {
    id: report.id,
    trackingId: report.trackingId ?? "제출 처리 중",
    title: report.building?.name ?? report.summary ?? "안전 신고",
    description: report.description ?? "상세 내용이 없습니다.",
    departmentName: report.department?.name ?? "담당 부서 배정 중",
    riskLevel: report.riskLevel ?? "MEDIUM",
    status: report.status,
    reporterType: report.reporterType,
    date: new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" })
      .format(new Date(report.submittedAt ?? report.createdAt)),
    imageUrl: report.photos[0]?.url,
  };
}

const DANGER_LABEL: Record<RiskLevel, string> = {
  LOW: "낮음",
  MEDIUM: "중간",
  HIGH: "높음",
};
const DANGER_DOT: Record<RiskLevel, string> = {
  LOW: "bg-[#E5C946]",
  MEDIUM: "bg-[#E8943A]",
  HIGH: "bg-[#D94A4A]",
};
const DANGER_BORDER: Record<RiskLevel, string> = {
  LOW: "border-[#E5C946]",
  MEDIUM: "border-[#E8943A]",
  HIGH: "border-[#D94A4A]",
};

const STATUS_FLOW: { key: ReportStatus; label: string }[] = [
  { key: "RECEIVED", label: "접수완료" },
  { key: "REVIEWING", label: "검토중" },
  { key: "RESOLVED", label: "처리완료" },
];

export default function MyReportsPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isAuthLoading, user, logout } = useAuth();
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex flex-col min-h-dvh">
      <Header title="내 신고" onBack={() => navigate("/map")} />

      {/* Profile */}
      <div className="px-4 pt-4 pb-4 border-b border-[#E9E9E9]">
        <div className="flex items-center gap-3">
          <div className="w-[60px] h-[60px] rounded-[10px] bg-[#E9E9E9] shrink-0 flex items-center justify-center">
            <UserRound className="w-7 h-7 text-[#7B7B7B]" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-base font-semibold text-[#262626] tracking-[-0.4px] leading-[1.48]">
              {user?.name ?? "사용자"}
            </span>
            <span className="text-xs font-medium text-[#7B7B7B] tracking-[-0.3px] leading-[1.48] truncate">
              {[user?.major, user?.studentNo].filter(Boolean).join(" · ") || "프로필 정보 미등록"}
            </span>
          </div>
          <button
            className="shrink-0 border border-[#E9E9E9] rounded-full px-3 py-1.5 text-xs font-semibold text-[#7B7B7B] tracking-[-0.3px] whitespace-nowrap"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Summary */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-sm font-medium text-[#7B7B7B] tracking-[-0.35px] leading-[1.48] text-center">
            총 {reports.length}건의 신고를 보냈어요. 추적 ID로 처리 상태를 확인하세요.
          </p>
        </div>

        {loading ? (
          <p className="py-20 text-center text-sm text-[#7A7A7A]">내 신고를 불러오는 중...</p>
        ) : error ? (
          <p className="py-20 px-4 text-center text-sm text-[#a92614]">{error}</p>
        ) : reports.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <p className="text-base font-medium text-[#7A7A7A] tracking-[-0.4px] text-center leading-[1.48]">
              아직 보낸 제보가 없어요.
              <br />
              위험 요소를 발견하면 사진으로 제보해보세요.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4 pt-1 pb-4">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: MyReport }) {
  return (
    <div className="bg-white rounded-[10px] border border-[#E9E9E9] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.05)] p-4">
      {/* Photo + Tags + Description */}
      <div className="flex gap-3 items-start">
        <div className="w-[100px] min-w-[100px] aspect-square bg-[#E9E9E9] rounded-[3px] shrink-0 overflow-hidden">
          {report.imageUrl && <img src={report.imageUrl} alt="신고 사진" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-medium text-white bg-[#C4C4C4] rounded-full px-2.5 py-1 tracking-[-0.3px]">
              {STATUS_FLOW.find((s) => s.key === report.status)?.label}
            </span>
            <span className="text-xs font-medium text-[#262626] bg-[#F5F5F5] border border-[#E9E9E9] rounded-full px-2.5 py-1 tracking-[-0.3px]">
              {report.departmentName}
            </span>
            <span
              className={`text-xs font-semibold text-[#262626] border ${DANGER_BORDER[report.riskLevel]} rounded-full px-2 py-1 tracking-[-0.3px] flex items-center gap-1.5 leading-[1.48]`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${DANGER_DOT[report.riskLevel]}`} />
              {DANGER_LABEL[report.riskLevel]}
            </span>
          </div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-[#1d1d1f] tracking-[-0.4px] leading-[1.48]">
              {report.title}
            </h3>
            <span className="text-[10px] font-medium text-[#7A7A7A] tracking-[-0.25px] whitespace-nowrap shrink-0 mt-1">
              {report.date}
            </span>
          </div>
          <p className="text-xs font-medium text-[#7A7A7A] tracking-[-0.3px] leading-[1.48] line-clamp-2">
            {report.description}
          </p>
        </div>
      </div>

      {/* 추적 ID */}
      <div className="mt-3 bg-[#F5F5F5] rounded-[4px] px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#7B7B7B] tracking-[-0.3px]">
          추적 ID
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#262626] tracking-[-0.35px]">
            {report.trackingId}
          </span>
          <span className="text-[10px] font-medium text-[#7B7B7B] border border-[#E9E9E9] rounded-full px-2 py-0.5 tracking-[-0.25px]">
            {report.reporterType === "ANONYMOUS" ? "익명" : "실명"}
          </span>
        </div>
      </div>
    </div>
  );
}
