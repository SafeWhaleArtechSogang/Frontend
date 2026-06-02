const STEP_LABELS = ['분류', '확인', '제출']

interface ProgressStepperProps {
  currentStep: number // 0-based
  totalSteps?: number
}

export default function ProgressStepper({
  currentStep,
  totalSteps = 3,
}: ProgressStepperProps) {
  return (
    <div className="flex items-center w-full gap-1 px-page">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`h-1 w-full rounded-full transition-colors ${
              i <= currentStep ? 'bg-primary' : 'bg-border-default'
            }`}
          />
          {STEP_LABELS[i] && (
            <span
              className={`text-xs ${
                i === currentStep ? 'text-text-primary font-semibold' : 'text-text-tertiary'
              }`}
            >
              {STEP_LABELS[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
