import type { ReportStatus } from "@/types";
import { STATUS_BADGE, STATUS_LABEL } from "@/constants/adminStatus";

/** 신고 상태 배지 (Figma 323:5439) */
export default function AdminStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-medium tracking-[-0.4px] ${STATUS_BADGE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
