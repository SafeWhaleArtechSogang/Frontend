import type { RiskLevel } from "@/types";

// 위험도 라벨/색상 — 단일 출처 (RiskBadge·Map·MyReports 공용)
// 색상은 Figma bottomsheet(289:3554)의 위험도 캡슐 기준
export const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: "낮음",
  MEDIUM: "중간",
  HIGH: "높음",
};

export const RISK_FILL: Record<RiskLevel, string> = {
  LOW: "bg-risk-low",
  MEDIUM: "bg-risk-medium",
  HIGH: "bg-risk-high",
};

export const RISK_BORDER: Record<RiskLevel, string> = {
  LOW: "border-risk-low",
  MEDIUM: "border-risk-medium",
  HIGH: "border-risk-high",
};
