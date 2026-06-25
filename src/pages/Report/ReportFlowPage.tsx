import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { ReportStepper } from "@/components/common";
import { CATEGORIES } from "@/types";
import type { DangerLevel, Category } from "@/types";
import { Check, AlertTriangle, Phone } from "lucide-react";

type Step = "emergency" | "classify" | "location" | "proposal" | "confirm" | "complete";
type LocationType = "outdoor" | "indoor";

const STEPPER_LABELS = ["분류", "위치", "제안서", "확인"];

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

const DEMO_DESCRIPTION =
  "정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞 횡단보도.";

export default function ReportFlowPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("emergency");
  const [showEmergencyCall, setShowEmergencyCall] = useState(false);
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

  // ─── 위치 결정 ───
  const [locationType, setLocationType] = useState<LocationType>("outdoor");
  const [building, setBuilding] = useState("김대건관");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");

  // ─── 제안서 ───
  const [proposalText, setProposalText] = useState("");

  // ─── 제출 ───
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showDuplicateSheet, setShowDuplicateSheet] = useState(false);
  const [trackingId, setTrackingId] = useState("");

  const dangerLabel = dangerLevel
    ? DANGER_LEVELS.find((d) => d.key === dangerLevel)?.label || ""
    : "";

  // 건물 기반 위치 표현 자동 생성
  const locationText =
    locationType === "indoor"
      ? `${building || "건물"}${floor ? ` ${floor}층` : ""}${room ? ` ${room}` : ""}`.trim()
      : `${building || "건물"} 정문 앞 보도`;

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

  // 응급 아님 → 분석 시작하고 분류 단계로
  const handleProceedReport = () => {
    setStep("classify");
    handleStartAnalysis();
  };

  // 제안서 본문 자동 생성 (학생어 → 행정 톤)
  const generateProposal = () =>
    `안녕하십니까. 학내 안전 위험 요소를 제보드립니다.\n\n` +
    `[발견 위치] ${locationText}\n` +
    `[위험 유형] ${selectedCategory?.label ?? ""}\n` +
    `[위험도] ${dangerLabel}\n\n` +
    `[현황]\n${(description || DEMO_DESCRIPTION).trim()}\n\n` +
    `[개선 제안]\n해당 구역에 대한 현장 점검 및 보수 조치를 요청드립니다. ` +
    `보행자 안전사고 예방을 위해 조속한 확인 부탁드립니다.\n\n감사합니다.`;

  const handleEnterProposal = () => {
    if (!proposalText.trim()) {
      setProposalText(generateProposal());
    }
    setStep("proposal");
  };

  const handleClose = () => {
    if (step === "complete") {
      navigate("/map");
    } else {
      setShowCancelSheet(true);
    }
  };

  // 제출 시도 → 중복 탐지 안내
  const handleSubmitAttempt = () => {
    setShowDuplicateSheet(true);
  };

  const finalizeSubmit = () => {
    setShowDuplicateSheet(false);
    setTrackingId(`SW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setStep("complete");
  };

  // ─── Emergency Branch ───
  if (step === "emergency") {
    if (showEmergencyCall) {
      return (
        <div className="flex flex-col h-dvh">
          <Header title="신고 등록" closeMode onBack={handleClose} />

          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-[100px] h-[100px] bg-[#D94A4A] rounded-full flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <h2 className="mt-6 text-xl font-bold text-[#1d1d1f] tracking-[-0.5px] leading-[1.48]">
              먼저 도움을 요청하세요
            </h2>
            <p className="mt-2 text-base font-medium text-[#7A7A7A] tracking-[-0.4px] text-center leading-[1.48]">
              부상자나 진행 중인 사고가 있다면
              <br />
              아래로 즉시 연락해 주세요.
            </p>
            <div className="w-full max-w-[300px] mt-8 flex flex-col gap-2.5">
              <a
                href="tel:119"
                className="w-full h-12 bg-[#D94A4A] rounded-[4px] text-base font-semibold text-white tracking-[-0.4px] flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                119 (화재·구급)
              </a>
              <a
                href="tel:112"
                className="w-full h-12 bg-[#262626] rounded-[4px] text-base font-semibold text-white tracking-[-0.4px] flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                112 (범죄·사고)
              </a>
            </div>
          </div>

          <div className="px-4 pb-6 shrink-0">
            <button
              className="w-full h-11 border border-[#262626] rounded-[4px] text-base font-semibold text-[#262626] tracking-[-0.4px]"
              onClick={handleProceedReport}
            >
              안전해졌어요 · 제보 이어가기
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-dvh">
        <Header title="신고 등록" closeMode onBack={handleClose} />

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-[100px] h-[100px] bg-[#F5F5F5] rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-[#262626]" />
          </div>
          <h2 className="mt-6 text-xl font-bold text-[#1d1d1f] tracking-[-0.5px] leading-[1.48]">
            응급 상황인가요?
          </h2>
          <p className="mt-2 text-base font-medium text-[#7A7A7A] tracking-[-0.4px] text-center leading-[1.48]">
            부상자나 진행 중인 사고가 있다면
            <br />
            제보보다 즉시 신고가 우선입니다.
          </p>
        </div>

        <div className="px-4 pb-6 shrink-0 flex flex-col gap-2">
          <button
            className="w-full h-11 bg-[#D94A4A] rounded-[4px] text-base font-semibold text-white tracking-[-0.4px]"
            onClick={() => setShowEmergencyCall(true)}
          >
            네, 응급 상황이에요
          </button>
          <button
            className="w-full h-11 bg-[#262626] rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px]"
            onClick={handleProceedReport}
          >
            아니요, 시설 위험 제보예요
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

  // ─── AI Analyzing ───
  if (isAnalyzing) {
    return (
      <div className="flex flex-col h-dvh">
        <Header title="신고 등록" closeMode onBack={handleClose} />
        <ReportStepper currentStep={0} steps={STEPPER_LABELS} />

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
        <ReportStepper currentStep={0} steps={STEPPER_LABELS} />

        {!selectedCategory ? (
          <div className="flex-1" />
        ) : showOtherForm ? (
          // ─── 기타 선택 후 직접 입력 ───
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
              <PhotoTagsHeader
                category={selectedCategory.label}
                dangerLevel={dangerLevel}
                description={DEMO_DESCRIPTION}
              />

              <div className="mt-4 bg-[#F5F5F5] rounded-[4px] py-1.5 px-4 text-center">
                <p className="text-xs font-semibold text-black tracking-[-0.3px] leading-[1.48]">
                  AI가 분류하지 못했어요. 직접 작성해주세요.
                </p>
              </div>

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

            <div className="sticky bottom-0 bg-white border-t border-[#E9E9E9] px-4 py-3">
              <button
                className="w-full h-11 bg-[#262626] rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px] disabled:opacity-40"
                disabled={!description.trim()}
                onClick={() => setStep("location")}
              >
                다음
              </button>
            </div>
          </div>
        ) : (
          // ─── 일반 분류 완료 ───
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
              <PhotoTagsHeader
                category={selectedCategory.label}
                dangerLevel={dangerLevel}
                description={DEMO_DESCRIPTION}
              />

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
                      <span className="w-5 shrink-0 text-[#7B7B7B]">
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
                      <span className={`w-2.5 h-2.5 rounded-full ${DANGER_DOT[key]}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
                    setStep("location");
                  }
                }}
              >
                다음
              </button>
            </div>
          </div>
        )}

        <CancelSheet
          open={showCancelSheet}
          onContinue={() => setShowCancelSheet(false)}
          onSave={() => navigate("/map")}
          onDiscard={() => navigate("/map")}
        />
      </div>
    );
  }

  // ─── Location Step ───
  if (step === "location") {
    return (
      <div className="flex flex-col min-h-dvh">
        <Header title="신고 등록" closeMode onBack={handleClose} />
        <ReportStepper currentStep={1} steps={STEPPER_LABELS} />

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
            <PhotoTagsHeader
              category={selectedCategory?.label || ""}
              dangerLevel={dangerLevel}
              description={DEMO_DESCRIPTION}
            />

            <div className="mt-4 bg-[#F5F5F5] rounded-[4px] py-1.5 px-4 text-center">
              <p className="text-xs font-semibold text-black tracking-[-0.3px] leading-[1.48]">
                위치를 확인해주세요. 건물 안이면 층·호수를 입력하세요.
              </p>
            </div>

            {/* 위치 유형 */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-[#7B7B7B] tracking-[-0.3px] leading-[1.48] mb-2.5">
                위치 유형 · 2개 중 선택
              </p>
              <div className="flex gap-2.5">
                {(
                  [
                    { key: "outdoor", label: "건물 외부" },
                    { key: "indoor", label: "건물 내부" },
                  ] as { key: LocationType; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    className={`flex-1 h-[52px] rounded-[4px] border text-sm font-semibold tracking-[-0.3px] transition-colors ${
                      locationType === key
                        ? "border-[#262626] text-[#262626]"
                        : "border-[#E9E9E9] text-[#7B7B7B]"
                    }`}
                    onClick={() => setLocationType(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 건물 */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-[#262626] tracking-[-0.35px] mb-2">
                건물
              </p>
              <input
                className="w-full h-11 px-3 border border-[#E9E9E9] rounded-[4px] text-base outline-none placeholder:text-[#C4C4C4] tracking-[-0.35px]"
                placeholder="예: 김대건관"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
              />
            </div>

            {/* 층 · 호수 (내부일 때만) */}
            {locationType === "indoor" && (
              <div className="mt-4 flex gap-2.5">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#262626] tracking-[-0.35px] mb-2">
                    층
                  </p>
                  <input
                    className="w-full h-11 px-3 border border-[#E9E9E9] rounded-[4px] text-base outline-none placeholder:text-[#C4C4C4] tracking-[-0.35px]"
                    placeholder="예: 2"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#262626] tracking-[-0.35px] mb-2">
                    호수 · 위치
                  </p>
                  <input
                    className="w-full h-11 px-3 border border-[#E9E9E9] rounded-[4px] text-base outline-none placeholder:text-[#C4C4C4] tracking-[-0.35px]"
                    placeholder="예: 201호 복도"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 자동 생성된 위치 표현 */}
            <div className="mt-6 bg-[#F5F5F5] rounded-[4px] p-4">
              <p className="text-xs font-semibold text-[#7B7B7B] tracking-[-0.3px] mb-1.5">
                자동 생성된 위치 표현
              </p>
              <p className="text-base font-semibold text-[#262626] tracking-[-0.4px] leading-[1.48]">
                {locationText}
              </p>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-[#E9E9E9] px-4 py-3 flex gap-2">
            <button
              className="w-[125px] shrink-0 h-11 border border-[#262626] rounded-[4px] text-base font-semibold text-[#262626] tracking-[-0.4px]"
              onClick={() => setStep("classify")}
            >
              이전
            </button>
            <button
              className="flex-1 h-11 bg-black rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px] disabled:opacity-40"
              disabled={!building.trim()}
              onClick={handleEnterProposal}
            >
              다음
            </button>
          </div>
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

  // ─── Proposal Preview / Edit Step ───
  if (step === "proposal") {
    return (
      <div className="flex flex-col min-h-dvh">
        <Header title="신고 등록" closeMode onBack={handleClose} />
        <ReportStepper currentStep={2} steps={STEPPER_LABELS} />

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
            <div className="bg-[#F5F5F5] rounded-[4px] py-1.5 px-4 text-center">
              <p className="text-xs font-semibold text-black tracking-[-0.3px] leading-[1.48]">
                AI가 안전·보건 제안서를 작성했어요. 필요하면 수정하세요.
              </p>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#262626] tracking-[-0.35px]">
                  안전·보건 제안서
                </p>
                <button
                  className="text-xs font-semibold text-[#7B7B7B] tracking-[-0.3px] underline"
                  onClick={() => setProposalText(generateProposal())}
                >
                  다시 작성
                </button>
              </div>
              <textarea
                className="w-full h-[360px] p-3 border border-[#E9E9E9] rounded-[4px] text-sm leading-[1.6] resize-none outline-none placeholder:text-[#C4C4C4] tracking-[-0.35px]"
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-[#E9E9E9] px-4 py-3 flex gap-2">
            <button
              className="w-[125px] shrink-0 h-11 border border-[#262626] rounded-[4px] text-base font-semibold text-[#262626] tracking-[-0.4px]"
              onClick={() => setStep("location")}
            >
              이전
            </button>
            <button
              className="flex-1 h-11 bg-black rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px] disabled:opacity-40"
              disabled={!proposalText.trim()}
              onClick={() => setStep("confirm")}
            >
              다음
            </button>
          </div>
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

  // ─── Confirm Step ───
  if (step === "confirm") {
    return (
      <div className="flex flex-col min-h-dvh">
        <Header title="신고 등록" closeMode onBack={handleClose} />
        <ReportStepper currentStep={3} steps={STEPPER_LABELS} />

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
          <PhotoTagsHeader
            category={selectedCategory?.label || ""}
            dangerLevel={dangerLevel}
            title={locationText}
            description={DEMO_DESCRIPTION}
          />

          {/* Details Card */}
          <div className="mt-4 bg-[#F5F5F5] rounded-[4px] p-5 space-y-2.5">
            {[
              ["위치", locationText],
              ["학교", "서강대학교"],
              ["카테고리", selectedCategory?.label || ""],
              ["위험도", dangerLabel],
              ["촬영시각", "2026년 4월 18일 15:42"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-base font-semibold text-[#7B7B7B] tracking-[-0.4px] leading-[1.48]">
                  {label}
                </span>
                <span className="text-base font-semibold text-[#262626] tracking-[-0.4px] leading-[1.48] text-right">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* 제보 방식 (익명 / 실명) */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-[#7B7B7B] tracking-[-0.3px] leading-[1.48] mb-2.5">
              제보 방식 · 2개 중 선택
            </p>
            <div className="flex gap-2.5">
              {(
                [
                  { key: true, label: "익명" },
                  { key: false, label: "실명" },
                ] as { key: boolean; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={String(key)}
                  className={`flex-1 h-11 rounded-[4px] border text-sm font-semibold tracking-[-0.3px] transition-colors ${
                    isAnonymous === key
                      ? "border-[#262626] text-[#262626]"
                      : "border-[#E9E9E9] text-[#7B7B7B]"
                  }`}
                  onClick={() => setIsAnonymous(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs font-medium text-[#7A7A7A] tracking-[-0.3px] leading-[1.48]">
              {isAnonymous
                ? "익명으로 발송돼요. 처리 상태는 추적 ID로 확인할 수 있어요."
                : "이름과 연락처가 안전관리센터에 함께 전달돼요."}
            </p>
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

        <div className="sticky bottom-0 bg-white border-t border-[#E9E9E9] px-4 py-3 flex gap-2">
          <button
            className="w-[125px] shrink-0 h-11 border border-[#262626] rounded-[4px] text-base font-semibold text-[#262626] tracking-[-0.4px]"
            onClick={() => setStep("proposal")}
          >
            이전
          </button>
          <button
            className="flex-1 h-11 bg-black rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px] disabled:opacity-40"
            disabled={!agreed}
            onClick={handleSubmitAttempt}
          >
            제출하기
          </button>
        </div>

        <DuplicateSheet
          open={showDuplicateSheet}
          building={building}
          onMerge={finalizeSubmit}
          onCreate={finalizeSubmit}
          onClose={() => setShowDuplicateSheet(false)}
        />

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

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-[100px] h-[100px] bg-[#262626] rounded-full flex items-center justify-center">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="mt-6 text-xl font-bold text-[#1d1d1f] tracking-[-0.5px] leading-[1.48]">
          제안서 발송 완료
        </h2>
        <p className="mt-2 text-base font-medium text-[#7A7A7A] tracking-[-0.4px] text-center leading-[1.48]">
          안전관리센터로 제안서가 발송되고
          <br />
          핀이 지도에 표시됩니다.
        </p>

        {/* 추적 ID */}
        <div className="w-full max-w-[300px] mt-6 bg-[#F5F5F5] rounded-[4px] p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#7B7B7B] tracking-[-0.35px]">
            추적 ID
          </span>
          <span className="text-base font-bold text-[#262626] tracking-[-0.4px]">
            {trackingId}
          </span>
        </div>
        <p className="mt-2 text-xs font-medium text-[#7A7A7A] tracking-[-0.3px] text-center leading-[1.48]">
          추적 ID로 처리 상태를 확인할 수 있어요.
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

// ─── 사진 + 태그(카테고리/위험도) + 설명 헤더 (공통) ───
function PhotoTagsHeader({
  category,
  dangerLevel,
  title,
  description,
}: {
  category: string;
  dangerLevel: DangerLevel | null;
  title?: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-[100px] min-w-[100px] aspect-square bg-[#E9E9E9] rounded-[3px] shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
        <div className="flex items-center gap-1 flex-nowrap">
          <span className="text-xs font-medium text-[#262626] bg-[#F5F5F5] border border-[#E9E9E9] rounded-full px-2.5 py-1 tracking-[-0.3px]">
            {category}
          </span>
          <span
            className={`text-xs font-semibold text-[#262626] border ${dangerLevel ? DANGER_BORDER[dangerLevel] : "border-[#262626]"} rounded-full px-2 py-1 tracking-[-0.3px] flex items-center gap-1.5`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${dangerLevel ? DANGER_DOT[dangerLevel] : ""}`}
            />
            {dangerLevel
              ? DANGER_LEVELS.find((d) => d.key === dangerLevel)?.label
              : ""}
          </span>
        </div>
        {title && (
          <h3 className="text-lg font-bold text-[#1d1d1f] tracking-[-0.45px] leading-[1.48]">
            {title}
          </h3>
        )}
        <p className="text-xs font-medium text-[#7A7A7A] tracking-[-0.3px] leading-[1.48]">
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── 중복 탐지 안내 Bottom Sheet ───
function DuplicateSheet({
  open,
  building,
  onMerge,
  onCreate,
  onClose,
}: {
  open: boolean;
  building: string;
  onMerge: () => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[430px] mx-auto bg-white rounded-t-[10px] animate-slide-up flex flex-col">
        <div className="flex justify-center pt-[5px] pb-[5px]">
          <div className="w-14 h-[5px] bg-[#D9D9D9] rounded-full" />
        </div>
        <div className="px-4 pt-4 pb-6">
          <h3 className="text-lg font-bold text-[#262626] tracking-[-0.45px]">
            유사한 제보가 있어요
          </h3>
          <p className="mt-2 text-sm font-medium text-[#7B7B7B] tracking-[-0.35px] leading-[1.48]">
            최근 {building || "해당 건물"} 인근에서 비슷한 제보가 접수됐어요.
            <br />
            기존 제안서에 심각성을 더해 함께 전달할 수 있어요.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              className="w-full h-11 bg-[#262626] rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px]"
              onClick={onMerge}
            >
              기존 제보에 병합해 전달
            </button>
            <button
              className="w-full h-11 border border-[#262626] rounded-[4px] text-base font-semibold text-[#262626] tracking-[-0.4px]"
              onClick={onCreate}
            >
              새 제보로 제출
            </button>
            <button
              className="w-full text-sm font-medium text-[#C4C4C4] tracking-[-0.35px] mt-1 underline"
              onClick={onClose}
            >
              다시 확인할게요
            </button>
          </div>
        </div>
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
