// ────────────────────────────────────────────────────────────
// 안전고래 도메인 타입 — specification repo v1.0 기준
// (API_명세서.md / DB_설계서.md)
// ────────────────────────────────────────────────────────────

// 신고 상태: 작성중 → 접수완료 → 검토중 → 처리완료
export type ReportStatus = "RECEIVING" | "RECEIVED" | "REVIEWING" | "RESOLVED";

// 위험도
export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

// 위험도 산정 주체 (AI 기본, 관리자 조정 시 ADMIN)
export type RiskLevelSource = "AI" | "ADMIN";

// 제보 방식 (관리자 화면 신원 표시 여부만 결정)
export type ReporterType = "ANONYMOUS" | "REAL_NAME";

// 담당 부서 (동적 · SUPER_ADMIN이 CRUD)
export interface Department {
  id: string;
  name: string; // 시설관리팀, 전산정보처, 환경안전팀 ...
  code: string; // AI 자동 배정 매핑용 코드
}

// 건물
export interface Building {
  id: string;
  name: string;
  code?: string;
  lat: number;
  lng: number;
  address?: string;
}

// 신고자
export interface User {
  id: string;
  name: string;
  major?: string;
  studentNo?: string;
}

// 제보 사진
export interface ReportPhoto {
  id: string;
  url: string;
  originalFilename?: string;
  mimeType?: string;
  sizeBytes?: number;
  displayOrder: number;
}

// 신고
export interface Report {
  id: string;
  trackingId: string; // SW-2026-XXXX (제출 시 채번)
  summary: string;
  description: string;
  status: ReportStatus;
  riskLevel: RiskLevel | null;
  riskLevelSource: RiskLevelSource;
  departmentId: string | null;
  departmentName: string | null;
  reporterType: ReporterType;
  buildingId: string | null;
  buildingName: string | null;
  isIndoor: boolean | null;
  floor: string | null;
  room: string | null;
  lat: number | null;
  lng: number | null;
  detectedHazards: string | null;
  reportFileUrl: string | null;
  photos: ReportPhoto[];
  submittedAt: string | null;
  createdAt: string;
}

// 알림
export type NotificationType = "SUBMITTED" | "STATUS_CHANGED" | "RESOLVED";

export interface AppNotification {
  id: string;
  reportId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string | null;
  createdAt: string;
}

// ── UI 표시용 라벨 매핑 ──
export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  RECEIVING: "작성중",
  RECEIVED: "접수완료",
  REVIEWING: "검토중",
  RESOLVED: "처리완료",
};

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  HIGH: "높음",
  MEDIUM: "중간",
  LOW: "낮음",
};

export const REPORTER_TYPE_LABEL: Record<ReporterType, string> = {
  ANONYMOUS: "익명",
  REAL_NAME: "실명",
};
