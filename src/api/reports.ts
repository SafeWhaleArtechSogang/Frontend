import { http } from "./http";
import type { Report, ReportStatus, RiskLevel, ReporterType } from "@/types";

// 지도 마커 (경량 응답)
export interface MapMarker {
  reportId: string;
  trackingId: string;
  buildingId: string | null;
  buildingName: string | null;
  lat: number;
  lng: number;
  status: ReportStatus;
  riskLevel: RiskLevel;
  departmentName: string | null;
  summary: string;
}

export interface LocationPatch {
  buildingId?: string;
  isIndoor?: boolean;
  floor?: string;
  room?: string;
  lat?: number;
  lng?: number;
}

// ── 지도 / 공개 조회 ──
export const reportApi = {
  getMap: (filter: "all" | "mine" = "all", bbox?: string) =>
    http.get<MapMarker[]>(
      `/reports/map?filter=${filter}${bbox ? `&bbox=${bbox}` : ""}`,
    ),

  getByTrackingId: (trackingId: string) =>
    http.get<Report>(`/reports/${trackingId}`),

  // ── 신고 플로우 (draft 방식) ──
  createDraft: () =>
    http.post<{ reportId: string; status: ReportStatus }>("/reports/draft"),

  uploadPhoto: (reportId: string, file: File) => {
    const form = new FormData();
    form.append("photo", file);
    return http.post<{ photoId: string; url: string; displayOrder: number }>(
      `/reports/${reportId}/photos`,
      form,
    );
  },

  deletePhoto: (reportId: string, photoId: string) =>
    http.del<null>(`/reports/${reportId}/photos/${photoId}`),

  patchLocation: (reportId: string, body: LocationPatch) =>
    http.patch<Report>(`/reports/${reportId}/location`, body),

  patch: (reportId: string, body: { reporterType?: ReporterType }) =>
    http.patch<Report>(`/reports/${reportId}`, body),

  getDuplicates: (reportId: string) =>
    http.get<Report[]>(`/reports/${reportId}/duplicates`),

  generateReportFile: (reportId: string) =>
    http.post<{ reportFileUrl: string }>(`/reports/${reportId}/report-file`),

  submit: (reportId: string) =>
    http.post<{
      trackingId: string;
      departmentName: string;
      status: ReportStatus;
    }>(`/reports/${reportId}/submit`),

  deleteDraft: (reportId: string) => http.del<null>(`/reports/${reportId}`),
};
