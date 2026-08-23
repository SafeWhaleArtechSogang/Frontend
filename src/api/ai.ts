import { http } from "./http";
import type { RiskLevel } from "@/types";

export interface LocationSuggestion {
  buildingId: string;
  buildingName: string;
  confidence: number;
}

export interface ContentAnalysis {
  summary: string;
  riskLevel: RiskLevel;
  departmentId: string;
  departmentName: string;
  detectedHazards: string;
}

export interface TextDraft {
  summary: string;
  description: string;
}

export const aiApi = {
  // ② GPS → 후보 건물
  analyzeLocation: (reportId: string, lat: number, lng: number) =>
    http.post<LocationSuggestion>("/ai/analyze-location", {
      reportId,
      lat,
      lng,
    }),

  // ③ 사진+위치 → 요약·위험도·담당부서
  analyzeContent: (reportId: string) =>
    http.post<ContentAnalysis>("/ai/analyze-content", { reportId }),

  // ③-a 자연어 → 보고서 초안
  draftFromText: (reportId: string, text: string) =>
    http.post<TextDraft>("/ai/draft-from-text", { reportId, text }),
};
