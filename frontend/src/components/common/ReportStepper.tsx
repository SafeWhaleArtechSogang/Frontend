/**
 * 4개 포인트: 사진 → 분류 → 확인 → 제출
 * currentStep: 0 = 분류, 1 = 확인, 2 = 제출
 * 사진(index 0)은 항상 완료 상태
 */
const POINTS = [
  { index: -1, label: null },      // 사진 (항상 past)
  { index: 0, label: "분류" },
  { index: 1, label: "확인" },
  { index: 2, label: "제출" },
];

interface ReportStepperProps {
  /** 0 = 분류, 1 = 확인, 2 = 제출 */
  currentStep: number;
}

export default function ReportStepper({ currentStep }: ReportStepperProps) {
  // 활성 바 비율: 사진은 이미 지남 → +1 offset
  const filledSegments = currentStep + 1; // 0→1, 1→2, 2→3
  const totalSegments = POINTS.length - 1; // 3

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
