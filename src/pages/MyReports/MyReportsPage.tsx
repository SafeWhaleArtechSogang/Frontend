import { useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import Header from "@/components/layout/Header";
import { useAuth } from "@/App";
import type { DangerLevel, ReportStatus } from "@/types";

interface MyReport {
  id: string;
  trackingId: string;
  title: string;
  description: string;
  category: string;
  dangerLevel: DangerLevel;
  status: ReportStatus;
  isAnonymous: boolean;
  date: string;
}

const MY_REPORTS: MyReport[] = [
  {
    id: "2",
    trackingId: "SW-2026-4821",
    title: "서강대학교 김대건관",
    description:
      "김대건관 2층 복도 난간 일부가 흔들려 보행 시 위험함. 고정이 헐거워져 기대면 안전사고 우려가 있음.",
    category: "추락·낙하 위험",
    dangerLevel: "medium",
    status: "confirmed",
    isAnonymous: true,
    date: "2026년 5월 14일 09:15",
  },
  {
    id: "4",
    trackingId: "SW-2026-4793",
    title: "서강대학교 하비에르관",
    description:
      "하비에르관 정문 앞 보도블록이 들떠 있어 보행자가 걸려 넘어질 위험이 있음. 비 오는 날 미끄러짐 사고 우려.",
    category: "보행 표면 위험",
    dangerLevel: "high",
    status: "complete",
    isAnonymous: false,
    date: "2026년 5월 12일 11:20",
  },
];

const DANGER_LABEL: Record<DangerLevel, string> = {
  low: "낮음",
  medium: "중간",
  high: "높음",
};
const DANGER_DOT: Record<DangerLevel, string> = {
  low: "bg-[#E5C946]",
  medium: "bg-[#E8943A]",
  high: "bg-[#D94A4A]",
};
const DANGER_BORDER: Record<DangerLevel, string> = {
  low: "border-[#E5C946]",
  medium: "border-[#E8943A]",
  high: "border-[#D94A4A]",
};

const STATUS_FLOW: { key: ReportStatus; label: string }[] = [
  { key: "received", label: "접수중" },
  { key: "confirmed", label: "접수완료" },
  { key: "reviewing", label: "검토중" },
  { key: "complete", label: "처리완료" },
];

export default function MyReportsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
              김준수
            </span>
            <span className="text-xs font-medium text-[#7B7B7B] tracking-[-0.3px] leading-[1.48] truncate">
              아트&테크놀로지학과 · 20211234
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
            총 {MY_REPORTS.length}건의 신고를 보냈어요. 추적 ID로 처리 상태를 확인하세요.
          </p>
        </div>

        {MY_REPORTS.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <p className="text-base font-medium text-[#7A7A7A] tracking-[-0.4px] text-center leading-[1.48]">
              아직 보낸 제보가 없어요.
              <br />
              위험 요소를 발견하면 사진으로 제보해보세요.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4 pt-1 pb-4">
            {MY_REPORTS.map((report) => (
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
        <div className="w-[100px] min-w-[100px] aspect-square bg-[#E9E9E9] rounded-[3px] shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-medium text-white bg-[#C4C4C4] rounded-full px-2.5 py-1 tracking-[-0.3px]">
              {STATUS_FLOW.find((s) => s.key === report.status)?.label}
            </span>
            <span className="text-xs font-medium text-[#262626] bg-[#F5F5F5] border border-[#E9E9E9] rounded-full px-2.5 py-1 tracking-[-0.3px]">
              {report.category}
            </span>
            <span
              className={`text-xs font-semibold text-[#262626] border ${DANGER_BORDER[report.dangerLevel]} rounded-full px-2 py-1 tracking-[-0.3px] flex items-center gap-1.5 leading-[1.48]`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${DANGER_DOT[report.dangerLevel]}`} />
              {DANGER_LABEL[report.dangerLevel]}
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
            {report.isAnonymous ? "익명" : "실명"}
          </span>
        </div>
      </div>

      {/* Status Timeline */}
      <StatusTimeline status={report.status} />
    </div>
  );
}

function StatusTimeline({ status }: { status: ReportStatus }) {
  const n = STATUS_FLOW.length;
  const currentIndex = STATUS_FLOW.findIndex((s) => s.key === status);
  const inset = (0.5 / n) * 100; // 첫/마지막 글자 중앙까지의 여백 (%)
  const filledWidth = (currentIndex / n) * 100; // 현재 단계 글자까지

  return (
    <div className="mt-4">
      <div className="relative flex items-center">
        {/* Background bar — 글자 사이만 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 bg-[#F5F5F5] rounded-full"
          style={{ left: `${inset}%`, right: `${inset}%` }}
        />
        {/* Filled bar */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 bg-[#262626] rounded-full transition-all"
          style={{ left: `${inset}%`, width: `${filledWidth}%` }}
        />
        {/* 단계 글자 (노드 자리) */}
        {STATUS_FLOW.map((s, i) => (
          <div key={s.key} className="relative z-10 flex-1 flex justify-center">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] tracking-[-0.3px] ${
                i <= currentIndex
                  ? "bg-[#262626] font-semibold text-white"
                  : "bg-[#F5F5F5] font-medium text-[#7B7B7B]"
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
