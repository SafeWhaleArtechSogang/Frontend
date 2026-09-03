import type { ReportStatus } from "@/types";

export const STATUS_LABEL: Record<ReportStatus, string> = {
  RECEIVING: "작성중",
  RECEIVED: "접수완료",
  REVIEWING: "검토중",
  RESOLVED: "처리완료",
};

/** 상태 배지 색 (Figma 323:5439 / 323:5449 / 323:5479) */
export const STATUS_BADGE: Record<ReportStatus, string> = {
  RECEIVING: "bg-neutral-100 text-neutral-500",
  RECEIVED: "bg-sogang-50 text-sogang-500",
  REVIEWING: "bg-warning-10 text-risk-medium",
  RESOLVED: "bg-success-10 text-success-700",
};

/** 관리자가 필터로 쓰는 상태 (작성중 draft는 제외) */
export const FILTER_STATUSES: ReportStatus[] = ["RECEIVED", "REVIEWING", "RESOLVED"];

/** 상세 화면 처리 이력 단계 */
export const TIMELINE_STEPS: { status: ReportStatus; label: string }[] = [
  { status: "RECEIVED", label: "접수" },
  { status: "REVIEWING", label: "검토중" },
  { status: "RESOLVED", label: "처리완료" },
];
