import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { CATEGORIES } from "@/types";
import type { DangerLevel, Category } from "@/types";
import { Check, AlertTriangle, Phone, Camera, ArrowUp } from "lucide-react";

// ───────────────────────────────────────────────
// 대화형(AI 채팅) 신고 화면
// 흐름: 응급 → 사진 → 메모 → 분석 → 위치 → 익명 → 중복 → 정리카드 → 완료
// ───────────────────────────────────────────────

type Step =
  | "emergency"
  | "emergencyCall"
  | "photo"
  | "memo"
  | "analyzing"
  | "location"
  | "locationIndoor"
  | "anonymous"
  | "duplicate"
  | "summary"
  | "complete";

type LocationType = "outdoor" | "indoor";

type Message =
  | { id: number; role: "ai" | "user"; type: "text"; text: string }
  | { id: number; role: "user"; type: "photo" }
  | { id: number; role: "ai"; type: "emergency" }
  | {
      id: number;
      role: "ai";
      type: "analysis";
      category: string;
      dangerLevel: DangerLevel;
      location: string;
    };

const PHASES = ["분석", "확인", "제안서", "전송"];

const DANGER_LEVELS: { key: DangerLevel; label: string }[] = [
  { key: "low", label: "낮음" },
  { key: "medium", label: "중간" },
  { key: "high", label: "높음" },
];
const DANGER_LABEL: Record<DangerLevel, string> = {
  low: "낮음",
  medium: "중간",
  high: "높음",
};
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

function phaseOf(step: Step): number {
  switch (step) {
    case "emergency":
    case "emergencyCall":
    case "photo":
    case "memo":
    case "analyzing":
      return 0; // 분석
    case "location":
    case "locationIndoor":
    case "anonymous":
    case "duplicate":
      return 1; // 확인
    case "summary":
      return 2; // 제안서
    case "complete":
      return 3; // 전송
  }
}

export default function ReportFlowPage() {
  const navigate = useNavigate();
  const idRef = useRef(1);
  const nextId = () => ++idRef.current;
  const scrollRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "ai",
      type: "text",
      text: "안전 제보를 도와드릴게요.\n먼저, 다친 사람이나 진행 중인 사고가 있나요?",
    },
  ]);
  const [step, setStep] = useState<Step>("emergency");

  // 수집 데이터
  const [memo, setMemo] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [dangerLevel, setDangerLevel] = useState<DangerLevel>("high");
  const [locationType, setLocationType] = useState<LocationType>("outdoor");
  const [building, setBuilding] = useState("김대건관");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [proposalText, setProposalText] = useState("");
  const [trackingId, setTrackingId] = useState("");

  // 입력/수정 상태
  const [input, setInput] = useState("");
  const [tmpFloor, setTmpFloor] = useState("");
  const [tmpRoom, setTmpRoom] = useState("");
  const [editingField, setEditingField] = useState<
    null | "category" | "danger" | "location" | "anonymous" | "proposal"
  >(null);
  const [showCancel, setShowCancel] = useState(false);

  const locationText =
    locationType === "indoor"
      ? `${building || "건물"}${floor ? ` ${floor}층` : ""}${room ? ` ${room}` : ""}`.trim()
      : `${building || "건물"} 정문 앞 보도`;

  // ─── helpers ───
  const addAi = (text: string) =>
    setMessages((p) => [...p, { id: nextId(), role: "ai", type: "text", text }]);
  const addUser = (text: string) =>
    setMessages((p) => [...p, { id: nextId(), role: "user", type: "text", text }]);

  const generateProposal = (
    cat: Category | null,
    danger: DangerLevel,
    locText: string,
    memoText: string,
  ) =>
    `안녕하십니까. 학내 안전 위험 요소를 제보드립니다.\n\n` +
    `[발견 위치] ${locText}\n` +
    `[위험 유형] ${cat?.label ?? ""}\n` +
    `[위험도] ${DANGER_LABEL[danger]}\n\n` +
    `[현황]\n${(memoText || "현장에서 위험 요소가 확인되었습니다.").trim()}\n\n` +
    `[개선 제안]\n해당 구역에 대한 현장 점검 및 보수 조치를 요청드립니다. ` +
    `보행자 안전사고 예방을 위해 조속한 확인 부탁드립니다.\n\n감사합니다.`;

  // 자동 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, step, editingField]);

  // ─── flow ───
  const proceedToPhoto = () => {
    addAi("위험 요소가 잘 보이는 사진을 올려주세요.");
    setStep("photo");
  };

  const handleEmergency = (yes: boolean) => {
    addUser(yes ? "네, 응급이에요" : "아니요");
    if (yes) {
      setMessages((p) => [...p, { id: nextId(), role: "ai", type: "emergency" }]);
      setStep("emergencyCall");
    } else {
      proceedToPhoto();
    }
  };

  const handlePhoto = () => {
    setMessages((p) => [...p, { id: nextId(), role: "user", type: "photo" }]);
    addAi("사진에 덧붙일 한 줄 메모가 있나요? 없으면 건너뛰어도 돼요.");
    setStep("memo");
  };

  const startAnalysis = () => {
    addAi("사진을 분석하고 있어요…");
    setStep("analyzing");
    setTimeout(() => {
      const cat = CATEGORIES[0];
      setCategory(cat);
      setDangerLevel("high");
      setBuilding("김대건관");
      setMessages((p) => [
        ...p,
        {
          id: nextId(),
          role: "ai",
          type: "analysis",
          category: cat.label,
          dangerLevel: "high",
          location: "김대건관",
        },
      ]);
      askLocation();
    }, 1600);
  };

  const handleMemo = (text: string | null) => {
    if (text) {
      setMemo(text);
      addUser(text);
    } else {
      addUser("건너뛸게요");
    }
    setInput("");
    startAnalysis();
  };

  const askLocation = () => {
    addAi("어디에서 발견했나요? 건물 외부인가요, 내부인가요?");
    setStep("location");
  };

  const handleLocation = (type: LocationType) => {
    setLocationType(type);
    addUser(type === "outdoor" ? "건물 외부" : "건물 내부");
    if (type === "outdoor") {
      askAnonymous();
    } else {
      addAi("몇 층, 어느 위치인가요?");
      setTmpFloor(floor);
      setTmpRoom(room);
      setStep("locationIndoor");
    }
  };

  const handleIndoorConfirm = () => {
    setFloor(tmpFloor);
    setRoom(tmpRoom);
    addUser(`${tmpFloor ? `${tmpFloor}층` : ""} ${tmpRoom}`.trim() || "내부");
    askAnonymous();
  };

  const askAnonymous = () => {
    addAi("익명으로 보낼까요, 실명으로 보낼까요?");
    setStep("anonymous");
  };

  const handleAnonymous = (anon: boolean) => {
    setIsAnonymous(anon);
    addUser(anon ? "익명" : "실명");
    addAi("최근 비슷한 제보가 있어요. 기존 제안서에 더해 보낼까요?");
    setStep("duplicate");
  };

  const handleDuplicate = (merge: boolean) => {
    addUser(merge ? "기존에 병합" : "새로 제출");
    const text = generateProposal(category, dangerLevel, locationText, memo);
    setProposalText(text);
    addAi("제안서를 작성했어요. 확인하고 보내주세요.");
    setStep("summary");
  };

  const handleSend = () => {
    setTrackingId(`SW-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setStep("complete");
  };

  // 정리 카드 — 항목 수정 시 제안서 재작성
  const updateCategory = (cat: Category) => {
    setCategory(cat);
    setProposalText(generateProposal(cat, dangerLevel, locationText, memo));
    setEditingField(null);
  };
  const updateDanger = (d: DangerLevel) => {
    setDangerLevel(d);
    setProposalText(generateProposal(category, d, locationText, memo));
    setEditingField(null);
  };
  const updateLocation = () => {
    const locText =
      locationType === "indoor"
        ? `${building || "건물"}${floor ? ` ${floor}층` : ""}${room ? ` ${room}` : ""}`.trim()
        : `${building || "건물"} 정문 앞 보도`;
    setProposalText(generateProposal(category, dangerLevel, locText, memo));
    setEditingField(null);
  };

  // 명령어 / 자유 입력
  const handleSubmitInput = () => {
    const text = input.trim();
    if (!text) return;
    if (step === "memo") {
      handleMemo(text);
      return;
    }
    addUser(text);
    setInput("");
    if (/위치/.test(text)) {
      askLocation();
    } else if (/메모/.test(text)) {
      addAi("메모를 다시 입력해 주세요. 없으면 건너뛰어도 돼요.");
      setStep("memo");
    } else if (/익명|실명/.test(text)) {
      askAnonymous();
    } else if (/카테고리|분류|위험도/.test(text)) {
      if (step === "summary") {
        addAi("아래 정리 카드의 [수정]에서 바꿀 수 있어요.");
      } else {
        addAi("카테고리·위험도는 마지막 정리 카드에서 수정할 수 있어요.");
      }
    } else {
      addAi("칩으로 답하시거나 '위치 다시'처럼 말씀해 주세요.");
    }
  };

  const handleClose = () => {
    if (step === "complete") navigate("/map");
    else setShowCancel(true);
  };

  const phase = phaseOf(step);

  return (
    <div className="flex flex-col h-dvh">
      <Header title="AI 신고" closeMode onBack={handleClose} />

      {/* 진행바 */}
      <div className="px-4 py-2.5 border-b border-[#F0F0F0] shrink-0">
        <div className="flex justify-between mb-1.5">
          {PHASES.map((label, i) => (
            <span
              key={label}
              className={`text-[10px] tracking-[-0.25px] ${
                i <= phase ? "font-semibold text-[#262626]" : "font-medium text-[#C4C4C4]"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="h-1 bg-[#F5F5F5] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#262626] rounded-full transition-all duration-300"
            style={{ width: `${((phase + 1) / PHASES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 대화 영역 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}

        {step === "summary" && (
          <SummaryCard
            category={category}
            dangerLevel={dangerLevel}
            locationText={locationText}
            proposalText={proposalText}
            isAnonymous={isAnonymous}
            editingField={editingField}
            setEditingField={setEditingField}
            locationType={locationType}
            building={building}
            floor={floor}
            room={room}
            setBuilding={setBuilding}
            setFloor={setFloor}
            setRoom={setRoom}
            setLocationType={setLocationType}
            onUpdateCategory={updateCategory}
            onUpdateDanger={updateDanger}
            onUpdateLocation={updateLocation}
            onUpdateAnonymous={(a) => {
              setIsAnonymous(a);
              setEditingField(null);
            }}
            onUpdateProposal={(t) => setProposalText(t)}
            onSend={handleSend}
          />
        )}

        {step === "complete" && (
          <CompleteCard trackingId={trackingId} onMap={() => navigate("/map")} onMine={() => navigate("/my-reports")} />
        )}
      </div>

      {/* 하단 독 */}
      {step !== "summary" && step !== "complete" && (
        <div className="shrink-0 border-t border-[#E9E9E9] bg-white px-4 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)]">
          {/* 빠른 답변 */}
          <QuickReplies
            step={step}
            onEmergency={handleEmergency}
            onEmergencyContinue={() => {
              addUser("안전해졌어요, 계속할게요");
              proceedToPhoto();
            }}
            onPhoto={() => cameraInputRef.current?.click()}
            onMemoSkip={() => handleMemo(null)}
            onLocation={handleLocation}
            onIndoorConfirm={handleIndoorConfirm}
            tmpFloor={tmpFloor}
            tmpRoom={tmpRoom}
            setTmpFloor={setTmpFloor}
            setTmpRoom={setTmpRoom}
            onAnonymous={handleAnonymous}
            onDuplicate={handleDuplicate}
          />

          {/* 텍스트 입력 */}
          {step !== "locationIndoor" && (
            <div className="mt-2 flex items-center gap-2">
              <input
                className="flex-1 h-11 px-4 bg-[#F5F5F5] rounded-full text-sm outline-none placeholder:text-[#C4C4C4] tracking-[-0.3px] disabled:opacity-50"
                placeholder={
                  step === "memo"
                    ? "메모를 입력하세요"
                    : step === "analyzing"
                      ? "분석 중이에요…"
                      : "메시지 입력 (예: 위치 다시)"
                }
                value={input}
                disabled={step === "analyzing" || step === "photo"}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitInput();
                }}
              />
              <button
                className="w-11 h-11 shrink-0 bg-[#262626] rounded-full flex items-center justify-center disabled:opacity-40"
                disabled={!input.trim()}
                onClick={handleSubmitInput}
              >
                <ArrowUp className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 사진 입력 (숨김) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhoto}
      />

      {showCancel && (
        <CancelSheet
          onContinue={() => setShowCancel(false)}
          onExit={() => navigate("/map")}
        />
      )}
    </div>
  );
}

// ─── 말풍선 ───
function MessageBubble({ msg }: { msg: Message }) {
  if (msg.type === "photo") {
    return (
      <div className="flex justify-end">
        <div className="w-[140px] h-[140px] bg-[#E9E9E9] rounded-[14px] rounded-tr-[4px]" />
      </div>
    );
  }

  if (msg.type === "emergency") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] bg-[#F5F5F5] rounded-[14px] rounded-tl-[4px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-[#D94A4A]" />
            <span className="text-sm font-bold text-[#262626] tracking-[-0.35px]">
              먼저 도움을 요청하세요
            </span>
          </div>
          <p className="text-xs font-medium text-[#7A7A7A] tracking-[-0.3px] leading-[1.5] mb-3">
            부상자나 진행 중인 사고가 있다면 아래로 즉시 연락하세요.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="tel:119"
              className="w-full h-11 bg-[#D94A4A] rounded-[4px] text-sm font-semibold text-white tracking-[-0.35px] flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" /> 119 (화재·구급)
            </a>
            <a
              href="tel:112"
              className="w-full h-11 bg-[#262626] rounded-[4px] text-sm font-semibold text-white tracking-[-0.35px] flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" /> 112 (범죄·사고)
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === "analysis") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] bg-[#F5F5F5] rounded-[14px] rounded-tl-[4px] p-4">
          <p className="text-xs font-semibold text-[#7B7B7B] tracking-[-0.3px] mb-2">
            사진을 이렇게 파악했어요
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-[#262626] bg-white border border-[#E9E9E9] rounded-full px-2.5 py-1 tracking-[-0.3px]">
              {msg.location}
            </span>
            <span className="text-xs font-medium text-[#262626] bg-white border border-[#E9E9E9] rounded-full px-2.5 py-1 tracking-[-0.3px]">
              {msg.category}
            </span>
            <span
              className={`text-xs font-semibold text-[#262626] bg-white border ${DANGER_BORDER[msg.dangerLevel]} rounded-full px-2 py-1 tracking-[-0.3px] flex items-center gap-1.5`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${DANGER_DOT[msg.dangerLevel]}`} />
              {DANGER_LABEL[msg.dangerLevel]}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // text
  const isAi = msg.role === "ai";
  return (
    <div className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-[1.5] tracking-[-0.3px] whitespace-pre-line ${
          isAi
            ? "bg-[#F5F5F5] text-[#262626] rounded-[14px] rounded-tl-[4px]"
            : "bg-[#262626] text-white rounded-[14px] rounded-tr-[4px]"
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

// ─── 빠른 답변 (하단 독) ───
function QuickReplies(props: {
  step: Step;
  onEmergency: (yes: boolean) => void;
  onEmergencyContinue: () => void;
  onPhoto: () => void;
  onMemoSkip: () => void;
  onLocation: (t: LocationType) => void;
  onIndoorConfirm: () => void;
  tmpFloor: string;
  tmpRoom: string;
  setTmpFloor: (v: string) => void;
  setTmpRoom: (v: string) => void;
  onAnonymous: (anon: boolean) => void;
  onDuplicate: (merge: boolean) => void;
}) {
  const chip =
    "shrink-0 px-3.5 h-9 rounded-full border border-[#262626] text-sm font-semibold text-[#262626] tracking-[-0.3px] flex items-center";

  switch (props.step) {
    case "emergency":
      return (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button className={chip} onClick={() => props.onEmergency(true)}>
            네, 응급이에요
          </button>
          <button className={chip} onClick={() => props.onEmergency(false)}>
            아니요
          </button>
        </div>
      );
    case "emergencyCall":
      return (
        <button
          className="w-full h-9 rounded-full border border-[#262626] text-sm font-semibold text-[#262626] tracking-[-0.3px]"
          onClick={props.onEmergencyContinue}
        >
          안전해졌어요 · 계속할게요
        </button>
      );
    case "photo":
      return (
        <button
          className="w-full h-10 bg-[#262626] rounded-full text-sm font-semibold text-white tracking-[-0.3px] flex items-center justify-center gap-2"
          onClick={props.onPhoto}
        >
          <Camera className="w-4 h-4" /> 사진 올리기
        </button>
      );
    case "memo":
      return (
        <div className="flex gap-2">
          <button className={chip} onClick={props.onMemoSkip}>
            건너뛰기
          </button>
        </div>
      );
    case "location":
      return (
        <div className="flex gap-2">
          <button className={chip} onClick={() => props.onLocation("outdoor")}>
            건물 외부
          </button>
          <button className={chip} onClick={() => props.onLocation("indoor")}>
            건물 내부
          </button>
        </div>
      );
    case "locationIndoor":
      return (
        <div className="flex gap-2">
          <input
            className="w-[80px] h-11 px-3 bg-[#F5F5F5] rounded-[4px] text-sm outline-none placeholder:text-[#C4C4C4] tracking-[-0.3px]"
            placeholder="층 (예:2)"
            value={props.tmpFloor}
            onChange={(e) => props.setTmpFloor(e.target.value)}
          />
          <input
            className="flex-1 h-11 px-3 bg-[#F5F5F5] rounded-[4px] text-sm outline-none placeholder:text-[#C4C4C4] tracking-[-0.3px]"
            placeholder="위치 (예: 201호 복도)"
            value={props.tmpRoom}
            onChange={(e) => props.setTmpRoom(e.target.value)}
          />
          <button
            className="shrink-0 px-4 h-11 bg-[#262626] rounded-[4px] text-sm font-semibold text-white tracking-[-0.3px]"
            onClick={props.onIndoorConfirm}
          >
            확인
          </button>
        </div>
      );
    case "anonymous":
      return (
        <div className="flex gap-2">
          <button className={chip} onClick={() => props.onAnonymous(true)}>
            익명
          </button>
          <button className={chip} onClick={() => props.onAnonymous(false)}>
            실명
          </button>
        </div>
      );
    case "duplicate":
      return (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button className={chip} onClick={() => props.onDuplicate(true)}>
            기존에 병합
          </button>
          <button className={chip} onClick={() => props.onDuplicate(false)}>
            새로 제출
          </button>
        </div>
      );
    default:
      return null;
  }
}

// ─── 정리 카드 ───
function SummaryCard(props: {
  category: Category | null;
  dangerLevel: DangerLevel;
  locationText: string;
  proposalText: string;
  isAnonymous: boolean;
  editingField: null | "category" | "danger" | "location" | "anonymous" | "proposal";
  setEditingField: (f: SummaryCardField) => void;
  locationType: LocationType;
  building: string;
  floor: string;
  room: string;
  setBuilding: (v: string) => void;
  setFloor: (v: string) => void;
  setRoom: (v: string) => void;
  setLocationType: (t: LocationType) => void;
  onUpdateCategory: (c: Category) => void;
  onUpdateDanger: (d: DangerLevel) => void;
  onUpdateLocation: () => void;
  onUpdateAnonymous: (a: boolean) => void;
  onUpdateProposal: (t: string) => void;
  onSend: () => void;
}) {
  const f = props.editingField;
  const editBtn = (field: Exclude<SummaryCardField, null>) => (
    <button
      className="text-xs font-semibold text-[#7B7B7B] tracking-[-0.3px] underline shrink-0"
      onClick={() => props.setEditingField(f === field ? null : field)}
    >
      {f === field ? "닫기" : "수정"}
    </button>
  );
  const rowChip = (active: boolean) =>
    `px-3 h-9 rounded-full border text-sm font-semibold tracking-[-0.3px] ${
      active ? "border-[#262626] text-[#262626]" : "border-[#E9E9E9] text-[#7B7B7B]"
    }`;

  return (
    <div className="flex justify-start">
      <div className="w-full bg-white border border-[#E9E9E9] rounded-[14px] rounded-tl-[4px] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.05)] p-4">
        {/* 위치 */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#7B7B7B] tracking-[-0.35px]">위치</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-[#262626] tracking-[-0.35px] truncate">
              {props.locationText}
            </span>
            {editBtn("location")}
          </div>
        </div>
        {f === "location" && (
          <div className="mt-2.5 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                className={rowChip(props.locationType === "outdoor")}
                onClick={() => props.setLocationType("outdoor")}
              >
                외부
              </button>
              <button
                className={rowChip(props.locationType === "indoor")}
                onClick={() => props.setLocationType("indoor")}
              >
                내부
              </button>
            </div>
            <input
              className="w-full h-10 px-3 bg-[#F5F5F5] rounded-[4px] text-sm outline-none tracking-[-0.3px]"
              placeholder="건물"
              value={props.building}
              onChange={(e) => props.setBuilding(e.target.value)}
            />
            {props.locationType === "indoor" && (
              <div className="flex gap-2">
                <input
                  className="w-[80px] h-10 px-3 bg-[#F5F5F5] rounded-[4px] text-sm outline-none tracking-[-0.3px]"
                  placeholder="층"
                  value={props.floor}
                  onChange={(e) => props.setFloor(e.target.value)}
                />
                <input
                  className="flex-1 h-10 px-3 bg-[#F5F5F5] rounded-[4px] text-sm outline-none tracking-[-0.3px]"
                  placeholder="위치"
                  value={props.room}
                  onChange={(e) => props.setRoom(e.target.value)}
                />
              </div>
            )}
            <button
              className="self-end px-4 h-9 bg-[#262626] rounded-full text-sm font-semibold text-white tracking-[-0.3px]"
              onClick={props.onUpdateLocation}
            >
              적용
            </button>
          </div>
        )}

        <div className="h-px bg-[#F0F0F0] my-3" />

        {/* 카테고리 */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#7B7B7B] tracking-[-0.35px]">카테고리</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-[#262626] tracking-[-0.35px] truncate">
              {props.category?.label}
            </span>
            {editBtn("category")}
          </div>
        </div>
        {f === "category" && (
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`h-9 px-3 rounded-full border text-xs text-left tracking-[-0.3px] flex items-center ${
                  props.category?.id === cat.id
                    ? "border-[#262626] font-semibold text-black"
                    : "border-[#E9E9E9] font-medium text-[#7B7B7B]"
                }`}
                onClick={() => props.onUpdateCategory(cat)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        <div className="h-px bg-[#F0F0F0] my-3" />

        {/* 위험도 */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#7B7B7B] tracking-[-0.35px]">위험도</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#262626] tracking-[-0.35px] flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${DANGER_DOT[props.dangerLevel]}`} />
              {DANGER_LABEL[props.dangerLevel]}
            </span>
            {editBtn("danger")}
          </div>
        </div>
        {f === "danger" && (
          <div className="mt-2.5 flex gap-2">
            {DANGER_LEVELS.map(({ key, label }) => (
              <button
                key={key}
                className={`flex-1 h-10 rounded-[4px] border flex items-center justify-center gap-1.5 text-xs font-semibold tracking-[-0.3px] ${
                  props.dangerLevel === key
                    ? "border-[#262626] text-[#262626]"
                    : "border-[#E9E9E9] text-[#7B7B7B]"
                }`}
                onClick={() => props.onUpdateDanger(key)}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${DANGER_DOT[key]}`} />
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="h-px bg-[#F0F0F0] my-3" />

        {/* 제보 방식 */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#7B7B7B] tracking-[-0.35px]">제보 방식</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#262626] tracking-[-0.35px]">
              {props.isAnonymous ? "익명" : "실명"}
            </span>
            {editBtn("anonymous")}
          </div>
        </div>
        {f === "anonymous" && (
          <div className="mt-2.5 flex gap-2">
            <button className={rowChip(props.isAnonymous)} onClick={() => props.onUpdateAnonymous(true)}>
              익명
            </button>
            <button className={rowChip(!props.isAnonymous)} onClick={() => props.onUpdateAnonymous(false)}>
              실명
            </button>
          </div>
        )}

        <div className="h-px bg-[#F0F0F0] my-3" />

        {/* 제안서 */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#7B7B7B] tracking-[-0.35px]">제안서</span>
          {editBtn("proposal")}
        </div>
        {f === "proposal" ? (
          <textarea
            className="mt-2 w-full h-[200px] p-3 border border-[#E9E9E9] rounded-[4px] text-xs leading-[1.6] resize-none outline-none tracking-[-0.3px]"
            value={props.proposalText}
            onChange={(e) => props.onUpdateProposal(e.target.value)}
          />
        ) : (
          <p className="mt-2 text-xs font-medium text-[#7A7A7A] tracking-[-0.3px] leading-[1.6] whitespace-pre-line line-clamp-4">
            {props.proposalText}
          </p>
        )}

        <button
          className="mt-4 w-full h-11 bg-[#262626] rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px]"
          onClick={props.onSend}
        >
          보내기
        </button>
      </div>
    </div>
  );
}

type SummaryCardField = null | "category" | "danger" | "location" | "anonymous" | "proposal";

// ─── 완료 카드 ───
function CompleteCard({
  trackingId,
  onMap,
  onMine,
}: {
  trackingId: string;
  onMap: () => void;
  onMine: () => void;
}) {
  return (
    <div className="flex justify-start">
      <div className="w-full bg-white border border-[#E9E9E9] rounded-[14px] rounded-tl-[4px] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.05)] p-5 flex flex-col items-center">
        <div className="w-[64px] h-[64px] bg-[#262626] rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-[#1d1d1f] tracking-[-0.45px]">제안서 발송 완료</h3>
        <p className="mt-1.5 text-xs font-medium text-[#7A7A7A] tracking-[-0.3px] text-center leading-[1.5]">
          안전관리센터로 제안서가 발송되고
          <br />
          핀이 지도에 표시됩니다.
        </p>
        <div className="w-full mt-4 bg-[#F5F5F5] rounded-[4px] p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#7B7B7B] tracking-[-0.3px]">추적 ID</span>
          <span className="text-sm font-bold text-[#262626] tracking-[-0.35px]">{trackingId}</span>
        </div>
        <div className="w-full mt-3 flex gap-2">
          <button
            className="flex-1 h-11 border border-[#262626] rounded-[4px] text-sm font-semibold text-[#262626] tracking-[-0.35px]"
            onClick={onMine}
          >
            내 신고
          </button>
          <button
            className="flex-1 h-11 bg-[#262626] rounded-[4px] text-sm font-semibold text-[#F5F5F5] tracking-[-0.35px]"
            onClick={onMap}
          >
            지도에서 확인
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 취소 시트 ───
function CancelSheet({ onContinue, onExit }: { onContinue: () => void; onExit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onContinue} />
      <div className="relative w-full max-w-[430px] mx-auto bg-white rounded-t-[10px] animate-slide-up">
        <div className="flex justify-center pt-[5px] pb-[5px]">
          <div className="w-14 h-[5px] bg-[#D9D9D9] rounded-full" />
        </div>
        <div className="px-4 pt-4 pb-6">
          <h3 className="text-lg font-bold text-[#262626] tracking-[-0.45px]">신고를 그만둘까요?</h3>
          <p className="mt-2 text-sm font-medium text-[#7B7B7B] tracking-[-0.35px] leading-[1.48]">
            지금까지 입력한 내용은 저장되지 않습니다.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              className="w-full h-11 bg-[#262626] rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px]"
              onClick={onContinue}
            >
              계속 작성하기
            </button>
            <button
              className="w-full h-11 border border-[#262626] rounded-[4px] text-base font-semibold text-[#262626] tracking-[-0.4px]"
              onClick={onExit}
            >
              그만두기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
