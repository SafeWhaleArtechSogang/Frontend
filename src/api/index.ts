// 안전고래 API 클라이언트 — specification repo v1.0 기준
// 백엔드 연동 전 계약(타입·시그니처)만 확정한 상태.
// 실제 서버 붙이면 VITE_API_BASE_URL 만 설정하면 동작.

export * from "./http";
export { authApi } from "./auth";
export type { AuthResult, AdminAuthResult } from "./auth";
export { reportApi } from "./reports";
export type { MapMarker, LocationPatch } from "./reports";
export { aiApi } from "./ai";
export type { LocationSuggestion, ContentAnalysis, TextDraft } from "./ai";
export { meApi } from "./me";
export { buildingApi } from "./buildings";
export { adminApi } from "./admin";
export type {
  AdminStatsSummary,
  DepartmentWithCount,
  AdminReportQuery,
} from "./admin";
