import type { RiskLevel } from "@/types";

// 위험도 라벨/색상 — 단일 출처 (Map·MyReports 공용)
export const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: "낮음",
  MEDIUM: "중간",
  HIGH: "높음",
};

export const RISK_DOT: Record<RiskLevel, string> = {
  LOW: "bg-[#E5C946]",
  MEDIUM: "bg-[#E8943A]",
  HIGH: "bg-[#D94A4A]",
};

export const RISK_BORDER: Record<RiskLevel, string> = {
  LOW: "border-[#E5C946]",
  MEDIUM: "border-[#E8943A]",
  HIGH: "border-[#D94A4A]",
};

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

/** 위험도 배지 — 색상 점 + 라벨(낮음/중간/높음) */
export default function RiskBadge({ level, className = "" }: RiskBadgeProps) {
  return (
    <span
      className={`text-xs font-semibold text-[#262626] border ${RISK_BORDER[level]} rounded-full px-2 py-1 tracking-[-0.3px] flex items-center gap-1.5 leading-[1.48] ${className}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${RISK_DOT[level]}`} />
      {RISK_LABEL[level]}
    </span>
  );
}
