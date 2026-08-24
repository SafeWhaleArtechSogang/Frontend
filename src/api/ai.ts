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

export interface ReportQuestion {
  id: string;
  text: string;
  options: string[];
  allowCustom: boolean;
}

export interface ReportQuestionSet {
  introduction: string;
  questions: ReportQuestion[];
}

export interface ReportFlowAnswer {
  questionId: string;
  question: string;
  answer: string;
}

export interface ReportFlowDraft {
  summary: string;
  hazardContent: string;
  improvementSuggestion: string;
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

  // AI 서버 연동 전 신고 챗봇 Mock 계약
  getReportQuestions: (reportId: number, incidentDescription: string) =>
    http.post<ReportQuestionSet>("/ai/report-flow/questions", {
      reportId,
      incidentDescription,
    }),

  createReportDraft: (
    reportId: number,
    locationDescription: string,
    incidentDescription: string,
    answers: ReportFlowAnswer[],
  ) =>
    http.post<ReportFlowDraft>("/ai/report-flow/draft", {
      reportId,
      locationDescription,
      incidentDescription,
      answers,
    }),
};
