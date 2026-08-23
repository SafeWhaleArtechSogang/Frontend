import { http } from "./http";
import type { Report } from "@/types";

export interface LocationSuggestion {
  buildingId: number;
  name: string;
  lat: number;
  lng: number;
}

export interface TextDraft {
  summary: string;
  description: string;
}

export const aiApi = {
  // ② GPS → 후보 건물
  analyzeLocation: (lat: number, lng: number) =>
    http.post<LocationSuggestion[]>("/ai/analyze-location", { lat, lng }),

  // ③ 사진+위치 → 요약·위험도·담당부서
  analyzeContent: (reportId: number, description: string) =>
    http.post<Report>("/ai/analyze-content", { reportId, description }),

  // ③-a 자연어 → 보고서 초안
  draftFromText: (text: string) =>
    http.post<TextDraft>("/ai/draft-from-text", { text }),
};
