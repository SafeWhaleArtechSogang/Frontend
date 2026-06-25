/**
 * 사진(항상 완료) + 라벨 단계들로 구성된 진행 바
 * currentStep: 0부터 시작하는 라벨 단계 인덱스
 * 사진(index -1)은 항상 완료 상태
 */
const DEFAULT_STEPS = ["분류", "확인", "제출"];

interface ReportStepperProps {
  /** 0부터 시작하는 단계 인덱스 */
  currentStep: number;
  /** 단계 라벨 (기본: 분류 → 확인 → 제출) */
  steps?: string[];
}

export default function ReportStepper({ currentStep, steps = DEFAULT_STEPS }: ReportStepperProps) {
  const POINTS = [
    { index: -1, label: null as string | null }, // 사진 (항상 past)
    ...steps.map((label, i) => ({ index: i, label })),
  ];
  // 활성 바 비율: 사진은 이미 지남 → +1 offset
  const filledSegments = currentStep + 1;
  const totalSegments = POINTS.length - 1;

  return (
    <div className="relative flex items-center justify-between px-4 mt-1">
      {/* Background bar */}
      <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-[#F5F5F5]" />
      {/* Filled bar */}
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-[#262626]"
        style={{ width: `calc((100% - 32px) * ${filledSegments} / ${totalSegments})` }}
      />

      {POINTS.map((point, i) => {
        const isPast = point.index < currentStep;
        const isCurrent = point.index === currentStep;
        const isActive = isPast || isCurrent;

        return (
          <div key={i} className="relative z-10 flex items-center justify-center">
            {isCurrent && point.label ? (
              <div className="bg-[#262626] rounded-full px-2 py-1 flex items-center justify-center">
                <span className="text-xs font-medium text-white tracking-[-0.3px]">
                  {point.label}
                </span>
              </div>
            ) : (
              <div
                className={`w-4 h-4 rounded-full ${isActive ? "bg-[#262626]" : "bg-[#F5F5F5]"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
