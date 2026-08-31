import RiskBadge from "@/components/common/RiskBadge";
import { RISK_LABEL } from "@/constants/risk";
import type { RiskLevel } from "@/types";

const RISK_TEXT: Record<RiskLevel, string> = {
  HIGH: "text-risk-high",
  MEDIUM: "text-risk-medium",
  LOW: "text-neutral-400",
};

/** 위험도 캡슐 + 라벨 (Figma 323:5433) */
export default function AdminRiskCell({ level }: { level: RiskLevel }) {
  return (
    <span className="flex items-center gap-2">
      <RiskBadge level={level} />
      <span className={`text-xs font-medium tracking-[-0.4px] ${RISK_TEXT[level]}`}>
        {RISK_LABEL[level]}
      </span>
    </span>
  );
}
