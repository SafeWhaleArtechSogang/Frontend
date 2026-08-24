import type { RiskLevel } from "@/types";
import { RISK_BORDER, RISK_FILL, RISK_LABEL } from "@/constants/risk";

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

/**
 * 위험도 캡슐 (Figma 289:3554 내 위험도 인디케이터)
 * 26×20 테두리 캡슐 안에 위험도 색 바를 채운다. 라벨은 aria-label로만 노출.
 */
export default function RiskBadge({ level, className = "" }: RiskBadgeProps) {
  return (
    <span
      role="img"
      aria-label={`위험도 ${RISK_LABEL[level]}`}
      title={`위험도 ${RISK_LABEL[level]}`}
      className={`flex w-[26px] shrink-0 items-center justify-center rounded-full border p-1 ${RISK_BORDER[level]} ${className}`}
    >
      <span className={`h-2.5 w-full rounded-full ${RISK_FILL[level]}`} />
    </span>
  );
}
