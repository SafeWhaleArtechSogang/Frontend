import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { ReportStepper } from "@/components/common";
import { CATEGORIES } from "@/types";
import type { DangerLevel, Category } from "@/types";
import { Check } from "lucide-react";

type Step = "classify" | "confirm" | "complete";

const DANGER_LEVELS: { key: DangerLevel; label: string }[] = [
  { key: "low", label: "낮음" },
  { key: "medium", label: "중간" },
  { key: "high", label: "높음" },
];

const DANGER_DOT: Record<DangerLevel, string> = {
  low: "bg-[#E5C946]",
  medium: "bg-[#E8943A]",
  high: "bg-[#D94A4A]",
};

const DANGER_BORDER: Record<DangerLevel, string> = {
  low: "border-[#E5C946]",
  medium: "border-[#E8943A]",
  high: "border-[#D94A4A]",
};

export default function ReportFlowPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("classify");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [dangerLevel, setDangerLevel] = useState<DangerLevel | null>(null);
  const [description, setDescription] = useState("");
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [showOtherForm, setShowOtherForm] = useState(false);
  // 페이지 진입 시 바로 AI 분석 시작 (카메라는 MapPage에서 이미 열림)
  useEffect(() => {
    if (step === "classify" && !selectedCategory && !isAnalyzing) {
      handleStartAnalysis();
    }
  }, []);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsAnalyzing(false);
        setSelectedCategory(CATEGORIES[2]);
        setDangerLevel("high");
      }
      setAnalysisProgress(Math.min(progress, 100));
    }, 300);
  };

  const handleClose = () => {
    if (step === "complete") {
      navigate("/map");
    } else {
      setShowCancelSheet(true);
    }
  };

  const handleSubmit = () => {
    setStep("complete");
  };

  const isOther = selectedCategory?.id === 11;

  // ─── AI Analyzing ───
  if (isAnalyzing) {
    return (
      <div className="flex flex-col h-dvh">
        <Header title="신고 등록" closeMode onBack={handleClose} />
        <ReportStepper currentStep={0} />

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-[300px] h-[300px] bg-[#F5F5F5] rounded-[10px] shrink-0" />
          <div className="flex flex-col items-center gap-2 mt-6">
            <h2 className="text-xl font-bold text-[#1d1d1f] tracking-[-0.5px] leading-[1.48]">
              분석하고 있어요
            </h2>
            <p className="text-base font-medium text-[#7A7A7A] tracking-[-0.4px] text-center leading-[1.48]">
              사진을 분석해 카테고리와 위험도를
              <br />
              자동으로 추정합니다.
            </p>
          </div>
          <div className="w-[300px] mt-6">
            <div className="w-full h-1.5 bg-[#E9E9E9] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#262626] rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            <p className="text-center text-base font-medium text-[#7A7A7A] tracking-[-0.4px] mt-3 leading-[1.48]">
              {Math.round(analysisProgress)}%
            </p>
          </div>
        </div>

        <div className="px-4 pb-6 shrink-0">
          <button
            className="w-full h-11 border border-[#262626] rounded-[4px] text-base font-semibold text-[#262626] tracking-[-0.4px]"
            onClick={handleClose}
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  // ─── Classify Step ───
  if (step === "classify") {
    return (
      <div className="flex flex-col min-h-dvh">
        <Header title="신고 등록" closeMode onBack={handleClose} />
        <ReportStepper currentStep={1} />

        {!selectedCategory ? (
          // 분석 대기 (useEffect에서 자동 시작)
          <div className="flex-1" />
        ) : showOtherForm ? (
          // ─── 기타 선택 후 직접 입력 ───
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
              {/* Photo + Tags (horizontal) */}
              <div className="flex gap-3 items-start">
                <div className="w-[100px] min-w-[100px] aspect-square bg-[#E9E9E9] rounded-[3px] shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1 flex-nowrap">
                    <span className="text-xs font-medium text-[#262626] bg-[#F5F5F5] border border-[#E9E9E9] rounded-full px-2.5 py-1 tracking-[-0.3px]">
                      {selectedCategory.label}
                    </span>
                    <span className={`text-xs font-semibold text-[#262626] border ${dangerLevel ? DANGER_BORDER[dangerLevel] : "border-[#262626]"} rounded-full px-2 py-1 tracking-[-0.3px] flex items-center gap-1.5`}>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${dangerLevel ? DANGER_DOT[dangerLevel] : ""}`}
                      />
                      {dangerLevel
                        ? DANGER_LEVELS.find((d) => d.key === dangerLevel)
                            ?.label
                        : ""}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#7A7A7A] tracking-[-0.3px] leading-[1.48]">
                    정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞
                    횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞 횡단보도
                    옆 가드레일 일부가 파손되어 있음. 정문 앞 횡단보도.
                  </p>
                </div>
              </div>

              {/* Notice */}
              <div className="mt-4 bg-[#F5F5F5] rounded-[4px] py-1.5 px-4 text-center">
                <p className="text-xs font-semibold text-black tracking-[-0.3px] leading-[1.48]">
                  AI가 분류하지 못했어요. 직접 작성해주세요.
                </p>
              </div>

              {/* Description */}
              <div className="mt-4">
                <p className="text-sm font-semibold text-[#262626] tracking-[-0.35px] mb-2">
                  위험 요소 설명
                </p>
                <div className="relative">
                  <textarea
                    className="w-full h-[160px] p-3 border border-[#E9E9E9] rounded-[4px] text-base resize-none outline-none placeholder:text-[#C4C4C4] tracking-[-0.35px]"
                    placeholder="위치, 상황, 영향 범위를 자세히 설명해주세요."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={200}
                  />
                  <span className="absolute bottom-3 right-3 text-xs text-[#C4C4C4] tracking-[-0.3px]">
                    {description.length}/200
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom button — fixed */}
            <div className="sticky bottom-0 bg-white border-t border-[#E9E9E9] px-4 py-3">
              <button
                className="w-full h-11 bg-[#262626] rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px] disabled:opacity-40"
                disabled={!description.trim()}
                onClick={() => setStep("confirm")}
              >
                다음
              </button>
            </div>
          </div>
        ) : (
          // ─── 일반 분류 완료 ───
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
              {/* Photo + Tags + Description (horizontal) */}
              <div className="flex gap-3 items-start">
                <div className="w-[100px] min-w-[100px] aspect-square bg-[#E9E9E9] rounded-[3px] shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1 flex-nowrap">
                    <span className="text-xs font-medium text-[#262626] bg-[#F5F5F5] border border-[#E9E9E9] rounded-full px-2.5 py-1 tracking-[-0.3px]">
                      {selectedCategory.label}
                    </span>
                    <span className={`text-xs font-semibold text-[#262626] border ${dangerLevel ? DANGER_BORDER[dangerLevel] : "border-[#262626]"} rounded-full px-2 py-1 tracking-[-0.3px] flex items-center gap-1.5`}>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${dangerLevel ? DANGER_DOT[dangerLevel] : ""}`}
                      />
                      {dangerLevel
                        ? DANGER_LEVELS.find((d) => d.key === dangerLevel)
                            ?.label
                        : ""}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#7A7A7A] tracking-[-0.3px] leading-[1.48]">
                    정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞
                    횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞 횡단보도
                    옆 가드레일 일부가 파손되어 있음. 정문 앞 횡단보도.
                  </p>
                </div>
              </div>

              {/* Notice */}
              <div className="mt-4 bg-[#F5F5F5] rounded-[4px] py-1.5 px-4 text-center">
                <p className="text-xs font-semibold text-black tracking-[-0.3px] leading-[1.48]">
                  AI가 분류했어요. 다르면 아래에서 변경해주세요.
                </p>
              </div>

              {/* Category Grid */}
              <div className="mt-4">
                <p className="text-xs font-semibold text-[#7B7B7B] tracking-[-0.3px] leading-[1.48] mb-2.5">
                  카테고리 · {CATEGORIES.length}개 중 선택
                </p>
                <div className="grid grid-cols-2 gap-x-3.5 gap-y-2.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      className={`h-10 px-3.5 rounded-full border text-xs text-left tracking-[-0.3px] transition-colors flex items-center ${
                        selectedCategory?.id === cat.id
                          ? "border-[#262626] font-semibold text-black"
                          : "border-[#E9E9E9] font-medium text-[#7B7B7B]"
                      }`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      <span
                        className={`w-5 shrink-0 ${selectedCategory?.id === cat.id ? "text-[#7B7B7B]" : "text-[#7B7B7B]"}`}
                      >
                        {String(cat.id).padStart(2, "0")}
                      </span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danger Level */}
              <div className="mt-6">
                <p className="text-xs font-semibold text-[#7B7B7B] tracking-[-0.3px] leading-[1.48] mb-2.5">
                  위험도 · 3개 중 선택
                </p>
                <div className="flex gap-2.5">
                  {DANGER_LEVELS.map(({ key, label }) => (
                    <button
                      key={key}
                      className={`flex-1 h-[52px] rounded-[4px] border flex flex-col items-center justify-center gap-1.5 text-xs font-semibold tracking-[-0.3px] transition-colors ${
                        dangerLevel === key
                          ? "border-[#262626] text-[#262626]"
                          : "border-[#E9E9E9] text-[#7B7B7B]"
                      }`}
                      onClick={() => setDangerLevel(key)}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${DANGER_DOT[key]}`}
                      />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom buttons — fixed */}
            <div className="sticky bottom-0 bg-white border-t border-[#E9E9E9] px-4 py-3 flex gap-2">
              <button
                className="w-[125px] shrink-0 h-11 border border-[#262626] rounded-[4px] text-base font-semibold text-[#262626] tracking-[-0.4px]"
                onClick={() => {
                  setSelectedCategory(null);
                  setDangerLevel(null);
                  setShowOtherForm(false);
                }}
              >
                다시 분류
              </button>
              <button
                className="flex-1 h-11 bg-black rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px] disabled:opacity-40"
                disabled={!dangerLevel}
                onClick={() => {
                  if (selectedCategory?.id === 11) {
                    setShowOtherForm(true);
                  } else {
                    setStep("confirm");
                  }
                }}
              >
                다음
              </button>
            </div>
          </div>
        )}

        {/* Cancel Bottom Sheet */}
        <CancelSheet
          open={showCancelSheet}
          onContinue={() => setShowCancelSheet(false)}
          onSave={() => navigate("/map")}
          onDiscard={() => navigate("/map")}
        />
      </div>
    );
  }

  // ─── Confirm Step ───
  if (step === "confirm") {
    return (
      <div className="flex flex-col min-h-dvh">
        <Header title="신고 등록" closeMode onBack={handleClose} />
        <ReportStepper currentStep={2} />

        <div className="flex-1 overflow-y-auto px-4 pt-4">
          {/* Photo + Info (horizontal) */}
          <div className="flex gap-3 items-start">
            <div className="w-[100px] min-w-[100px] aspect-square bg-[#E9E9E9] rounded-[3px] shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="flex items-center gap-1 flex-nowrap">
                <span className="text-xs font-medium text-[#262626] bg-[#F5F5F5] border border-[#E9E9E9] rounded-full px-2.5 py-1 tracking-[-0.3px]">
                  {selectedCategory?.label}
                </span>
                <span className={`text-xs font-semibold text-[#262626] border ${dangerLevel ? DANGER_BORDER[dangerLevel] : "border-[#262626]"} rounded-full px-2 py-1 tracking-[-0.3px] flex items-center gap-1.5`}>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${dangerLevel ? DANGER_DOT[dangerLevel] : ""}`}
                  />
                  {dangerLevel
                    ? DANGER_LEVELS.find((d) => d.key === dangerLevel)?.label
                    : ""}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1d1d1f] tracking-[-0.45px] leading-[1.48]">
                한빛초등학교 앞 건널목
              </h3>
              <p className="text-xs font-medium text-[#7A7A7A] tracking-[-0.3px] leading-[1.48]">
                정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞
                횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞 횡단보도 옆
                가드레일 일부가 파손되어 있음. 정문 앞 횡단보도.
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="mt-4 bg-[#F5F5F5] rounded-[4px] p-5 space-y-2.5">
            {[
              ["위치", "서울 서대문구 연세로 50"],
              ["학교", "한빛초등학교"],
              ["카테고리", selectedCategory?.label || ""],
              [
                "위험도",
                dangerLevel
                  ? DANGER_LEVELS.find((d) => d.key === dangerLevel)?.label ||
                    ""
                  : "",
              ],
              ["촬영시각", "2026년 4월 18일 15:42"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-base font-semibold text-[#7B7B7B] tracking-[-0.4px] leading-[1.48]">
                  {label}
                </span>
                <span className="text-base font-semibold text-[#262626] tracking-[-0.4px] leading-[1.48]">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Agreement Card */}
          <div
            className="mt-4 bg-[#F5F5F5] rounded-[4px] h-10 flex items-center px-3 cursor-pointer"
            onClick={() => setAgreed(!agreed)}
          >
            <div
              className={`w-[26px] h-[26px] rounded-[4px] border flex items-center justify-center shrink-0 ${
                agreed
                  ? "bg-[#262626] border-[#262626]"
                  : "bg-white border-[#E9E9E9]"
              }`}
            >
              {agreed && <Check className="w-4 h-4 text-white" />}
            </div>
            <span className="ml-2.5 text-sm font-medium text-[#262626] tracking-[-0.35px] leading-[1.48]">
              사실에 기반한 신고이며, 허위 시 제재에 동의합니다
            </span>
          </div>
        </div>

        {/* Bottom buttons — fixed */}
        <div className="sticky bottom-0 bg-white border-t border-[#E9E9E9] px-4 py-3 flex gap-2">
          <button
            className="w-[125px] shrink-0 h-11 border border-[#262626] rounded-[4px] text-base font-semibold text-[#262626] tracking-[-0.4px]"
            onClick={() => setStep("classify")}
          >
            변경
          </button>
          <button
            className="flex-1 h-11 bg-black rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px] disabled:opacity-40"
            disabled={!agreed}
            onClick={handleSubmit}
          >
            제출하기
          </button>
        </div>

        <CancelSheet
          open={showCancelSheet}
          onContinue={() => setShowCancelSheet(false)}
          onSave={() => navigate("/map")}
          onDiscard={() => navigate("/map")}
        />
      </div>
    );
  }

  // ─── Complete Step ───
  return (
    <div className="flex flex-col h-dvh">
      <Header title="신고 등록" closeMode onBack={() => navigate("/map")} />

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-[100px] h-[100px] bg-[#262626] rounded-full flex items-center justify-center">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="mt-6 text-xl font-bold text-[#1d1d1f] tracking-[-0.5px] leading-[1.48]">
          제출 완료
        </h2>
        <p className="mt-2 text-base font-medium text-[#7A7A7A] tracking-[-0.4px] text-center leading-[1.48]">
          핀이 지도에 표시되고
          <br />
          지자체에 자동 전달됩니다.
        </p>
      </div>

      <div className="px-4 pb-6 shrink-0">
        <button
          className="w-full h-11 bg-[#262626] rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px]"
          onClick={() => navigate("/map")}
        >
          지도에서 확인
        </button>
      </div>
    </div>
  );
}

// ─── Cancel Bottom Sheet ───
function CancelSheet({
  open,
  onContinue,
  onSave,
  onDiscard,
}: {
  open: boolean;
  onContinue: () => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onContinue} />
      <div className="relative w-full max-w-[430px] mx-auto bg-white rounded-t-[10px] h-[50dvh] animate-slide-up flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-[5px] pb-[5px]">
          <div className="w-14 h-[5px] bg-[#D9D9D9] rounded-full" />
        </div>
        <div className="px-4 pt-4 flex-1">
          <h3 className="text-lg font-bold text-[#262626] tracking-[-0.45px]">
            신고를 취소할까요?
          </h3>
          <p className="mt-2 text-sm font-medium text-[#7B7B7B] tracking-[-0.35px] leading-[1.48]">
            지금까지 입력한 사진과 분류 정보는 저장되지 않습니다.
            <br />
            임시저장하면 나중에 이어서 작성할 수 있어요.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              className="w-full h-11 bg-[#262626] rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px]"
              onClick={onContinue}
            >
              신고 계속하기
            </button>
            <button
              className="w-full h-11 border border-[#262626] rounded-[4px] text-base font-semibold text-[#262626] tracking-[-0.4px]"
              onClick={onSave}
            >
              임시저장 후 나가기
            </button>
            <button
              className="w-full text-sm font-medium text-[#C4C4C4] tracking-[-0.35px] mt-1 underline"
              onClick={onDiscard}
            >
              저장 안 함
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
