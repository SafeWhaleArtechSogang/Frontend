import { http } from "./http";
import type { Report, ReporterType } from "@/types";

export interface LocationPatch {
  buildingId?: number;
  indoor?: boolean;
  floor?: string;
  room?: string;
  lat?: number;
  lng?: number;
}

// ── 지도 / 공개 조회 ──
export const reportApi = {
  getMap: (filter: "all" | "mine" = "all", bbox?: string) =>
    http.get<Report[]>(
      `/reports/map?filter=${filter}${bbox ? `&bbox=${bbox}` : ""}`,
    ),

  getByTrackingId: (trackingId: string) =>
    http.get<Report>(`/reports/${trackingId}`),

  // ── 신고 플로우 (draft 방식) ──
  createDraft: () => http.post<Report>("/reports/draft"),

  uploadPhotos: (reportId: number, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("photos", file));
    return http.post<Report>(`/reports/${reportId}/photos`, form);
  },

  patchLocation: (reportId: number, body: LocationPatch) =>
    http.patch<Report>(`/reports/${reportId}/location`, body),

  patch: (reportId: number, body: { summary?: string; description?: string; reporterType?: ReporterType }) =>
    http.patch<Report>(`/reports/${reportId}`, body),

  getDuplicates: (reportId: number) =>
    http.get<Report[]>(`/reports/${reportId}/duplicates`),

  generateReportFile: (reportId: number) =>
    http.post<Report>(`/reports/${reportId}/report-file`),

  submit: (reportId: number) => http.post<Report>(`/reports/${reportId}/submit`),

  deleteDraft: (reportId: number) => http.del<null>(`/reports/${reportId}`),
};
