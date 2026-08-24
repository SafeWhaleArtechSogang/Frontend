/**
 * 개선 제안 사항 임시 분리
 *
 * 서버에 개선 제안을 담을 필드가 없어 ReportFlowPage가 description에
 * 이어붙여 저장한다. 상세 화면에서 두 항목으로 나눠 보여주기 위한 임시 처리다.
 *
 * 백엔드에 improvementSuggestion 필드가 생기면 이 파일과 사용처,
 * ReportFlowPage의 이어붙이기를 함께 제거한다.
 */
export const IMPROVEMENT_MARKER = "\n\n개선 제안 사항: ";

export interface SplitDescription {
  /** 안전·보건 유해/위험/시설/장소 내용 */
  hazard: string;
  /** 개선 제안 사항. 구분자가 없는 과거 신고는 null */
  improvement: string | null;
}

export function splitDescription(description: string): SplitDescription {
  const at = description.indexOf(IMPROVEMENT_MARKER);
  if (at === -1) return { hazard: description, improvement: null };
  return {
    hazard: description.slice(0, at),
    improvement: description.slice(at + IMPROVEMENT_MARKER.length),
  };
}
