export type ReportStatus = "RECEIVING" | "RECEIVED" | "REVIEWING" | "RESOLVED";
export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";
export type RiskLevelSource = "AI" | "ADMIN";
export type ReporterType = "ANONYMOUS" | "REAL_NAME";

export interface Department {
  id: number;
  name: string;
  code?: string;
}

export interface Building {
  id: number;
  name: string;
  code?: string;
  lat: number | null;
  lng: number | null;
  address?: string;
}

export interface User {
  id: number;
  name: string;
  major?: string | null;
  studentNo?: string | null;
}

export interface ReportPhoto {
  id: number;
  url: string;
  displayOrder: number;
}

export interface ReportActivity {
  type: string;
  fromStatus: ReportStatus | null;
  toStatus: ReportStatus | null;
  actionNote: string | null;
  createdAt: string;
}

export interface Report {
  id: number;
  trackingId: string | null;
  summary: string | null;
  description: string | null;
  status: ReportStatus;
  riskLevel: RiskLevel | null;
  riskLevelSource: RiskLevelSource;
  department: Pick<Department, "id" | "name"> | null;
  reporterType: ReporterType;
  reporterName?: string;
  building: Pick<Building, "id" | "name" | "address"> | null;
  locationDescription: string | null;
  indoor: boolean | null;
  floor: string | null;
  room: string | null;
  lat: number | null;
  lng: number | null;
  detectedHazards: string | null;
  reportFileUrl: string | null;
  photos: ReportPhoto[];
  timeline: ReportActivity[] | null;
  submittedAt: string | null;
  createdAt: string;
}

export type NotificationType = "SUBMITTED" | "HIGH_RISK" | "STATUS_CHANGED" | "RESOLVED";

export interface AppNotification {
  id: number;
  trackingId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  RECEIVING: "작성중",
  RECEIVED: "접수완료",
  REVIEWING: "검토중",
  RESOLVED: "처리완료",
};
