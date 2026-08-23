import { http } from "./http";
import type { Report, ReportStatus, RiskLevel, Department } from "@/types";
import type { Page } from "./http";

export interface AdminStatsSummary {
  received: number;
  reviewing: number;
  resolved: number;
  todayNew: number;
}

export interface DepartmentWithCount extends Department {
  pendingCount: number;
}

export interface AdminReportQuery {
  status?: ReportStatus;
  departmentId?: string;
  sort?: "latest";
  q?: string;
  page?: number;
  size?: number;
}

function toQuery(q: AdminReportQuery): string {
  const p = new URLSearchParams();
  if (q.status) p.set("status", q.status);
  if (q.departmentId) p.set("departmentId", q.departmentId);
  if (q.sort) p.set("sort", q.sort);
  if (q.q) p.set("q", q.q);
  p.set("page", String(q.page ?? 0));
  p.set("size", String(q.size ?? 20));
  return p.toString();
}

// 관리자 대시보드 (ROLE_ADMIN)
export const adminApi = {
  statsSummary: () => http.get<AdminStatsSummary>("/admin/stats/summary"),

  departments: () => http.get<DepartmentWithCount[]>("/admin/departments"),

  reports: (query: AdminReportQuery = {}) =>
    http.get<Page<Report>>(`/admin/reports?${toQuery(query)}`),

  reportDetail: (id: string) => http.get<Report>(`/admin/reports/${id}`),

  reportFile: (id: string) =>
    http.get<{ reportFileUrl: string }>(`/admin/reports/${id}/report-file`),

  changeStatus: (id: string, toStatus: ReportStatus) =>
    http.patch<Report>(`/admin/reports/${id}/status`, { toStatus }),

  reassignDepartment: (id: string, departmentId: string) =>
    http.patch<Report>(`/admin/reports/${id}/department`, { departmentId }),

  changeRiskLevel: (id: string, riskLevel: RiskLevel) =>
    http.patch<Report>(`/admin/reports/${id}/risk-level`, { riskLevel }),

  resolve: (id: string, actionNote: string) =>
    http.post<Report>(`/admin/reports/${id}/resolve`, { actionNote }),
};
