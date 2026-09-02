import type { ReportStatus } from "@/types";
import { STATUS_BADGE, STATUS_LABEL } from "@/constants/adminStatus";

/** 학생·관리자 화면에서 공용으로 쓰는 신고 처리 상태 태그. */
export default function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-medium tracking-[-0.4px] ${STATUS_BADGE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
