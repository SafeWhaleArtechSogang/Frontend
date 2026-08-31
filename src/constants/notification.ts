import type { AppNotification } from "@/types";

export const NOTIFICATION_TYPE_LABEL: Record<AppNotification["type"], string> = {
  SUBMITTED: "접수",
  HIGH_RISK: "고위험",
  STATUS_CHANGED: "상태 변경",
  RESOLVED: "처리 완료",
};
