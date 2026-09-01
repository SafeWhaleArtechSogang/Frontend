import { ChevronRight } from "lucide-react";
import DepartmentChip from "@/components/common/DepartmentChip";
import RiskBadge from "@/components/common/RiskBadge";
import type { RiskLevel } from "@/types";
import { resolveApiAssetUrl } from "@/api/http";

export interface MyReportCardData {
  title: string;
  description: string;
  departmentName: string;
  riskLevel: RiskLevel;
  date: string;
  imageUrl?: string;
}

interface MyReportCardProps {
  report: MyReportCardData;
  onClick?: () => void;
}

/** 내 신고 카드 (Figma 297:5035) — 110px 사진 + 부서/위험도 + 제목·설명·날짜 */
export default function MyReportCard({ report, onClick }: MyReportCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 border-b border-gray-200 px-3 pb-[13px] pt-3 text-left transition active:bg-neutral-50"
    >
      <div className="size-[110px] shrink-0 overflow-hidden rounded-[10px] bg-neutral-100">
        {report.imageUrl && (
          <img src={resolveApiAssetUrl(report.imageUrl)} alt="" className="size-full object-cover" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <DepartmentChip label={report.departmentName} />
          <RiskBadge level={report.riskLevel} />
        </div>
        <div className="flex flex-col gap-2.5 px-1">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-[17px] font-bold leading-[22px] tracking-[-0.425px] text-neutral-800">
              {report.title}
            </p>
            <p className="truncate text-xs font-medium leading-4 tracking-[-0.3px] text-neutral-500">
              {report.description}
            </p>
          </div>
          <p className="whitespace-nowrap text-[11px] font-medium leading-[13px] tracking-[-0.275px] text-neutral-500">
            {report.date}
          </p>
        </div>
      </div>

      <ChevronRight className="size-6 shrink-0 text-neutral-300" />
    </button>
  );
}
