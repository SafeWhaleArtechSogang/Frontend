import { ChevronRight } from "lucide-react";
import RiskBadge from "@/components/common/RiskBadge";
import MyBadge from "@/components/common/MyBadge";
import type { RiskLevel } from "@/types";

interface SafetyPinRowProps {
  riskLevel: RiskLevel;
  title: string;
  description: string;
  isMine?: boolean;
  onClick?: () => void;
}

/** 안전핀 리스트 행 (Figma 289:3607) — 74px 고정 높이 */
export default function SafetyPinRow({
  riskLevel,
  title,
  description,
  isMine = false,
  onClick,
}: SafetyPinRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[74px] w-full items-center gap-4 border-b border-gray-200 pb-[17px] pl-5 pr-4 pt-4 text-left transition active:bg-neutral-100"
    >
      <RiskBadge level={riskLevel} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-base font-semibold leading-[21px] tracking-[-0.4px] text-neutral-800">
          {title}
        </p>
        <p className="truncate text-xs font-medium leading-4 tracking-[-0.3px] text-neutral-500">
          {description}
        </p>
      </div>
      {isMine && <MyBadge />}
      <ChevronRight className="size-6 shrink-0 text-neutral-300" />
    </button>
  );
}
