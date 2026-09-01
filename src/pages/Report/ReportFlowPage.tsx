import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Camera, Image as ImageIcon, ArrowUp, MapPin, Pencil } from "lucide-react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/auth";
import { aiApi, buildingApi, reportApi } from "@/api";
import type { ReportFlowAnswer, ReportQuestionStep } from "@/api";
import type { Building } from "@/types";
import { IMPROVEMENT_MARKER } from "@/utils/reportDescription";

// 페이지 배경 (gray/10)
const BG = "#fcfcfc";
// 강조 (sogang/500)
const SOGANG_RED = "#a92614";
// 서강대 캠퍼스 중심
const SOGANG_CENTER = { lat: 37.551, lng: 126.9408 };
const OTHER_LOCATION_VALUE = "__OTHER_LOCATION__";

type Stage =
  | "photo"
  | "compose"
  | "buildingSelect"
  | "locationInput"
  | "locationConfirm"
  | "afterLocation"
  | "question"
  | "proposal";

type Msg =
  | {
      id: number;
      role: "ai";
      text: string;
      emphasis?: string | string[];
      topAnchor?: boolean;
    }
  | { id: number; role: "user"; text: string }
  | { id: number; role: "photo" }
  | { id: number; role: "locationSaved"; label: string; lat: number; lng: number };

// AI 문장 내 특정 구절 강조 (여러 단어 지원)
function renderEmphasis(text: string, emp: string | string[]) {
  const words = Array.isArray(emp) ? emp : [emp];
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`);
  return text.split(re).map((part, i) =>
    words.includes(part) ? (
      <span key={i} className="font-semibold">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
type MsgInput = DistributiveOmit<Msg, "id">;

// ─── 카카오맵 SDK 로더 ───
function ensureKakao(cb: () => void) {
  const w = window as any;
  if (w.kakao?.maps) {
    w.kakao.maps.load(cb);
    return;
  }
  const existing = document.getElementById("kakao-sdk") as HTMLScriptElement | null;
  if (existing) {
    existing.addEventListener("load", () => w.kakao.maps.load(cb));
    return;
  }
  const appKey = import.meta.env.VITE_KAKAO_APP_KEY;
  if (!appKey || appKey === "your-kakao-javascript-key") return;
  const s = document.createElement("script");
  s.id = "kakao-sdk";
  s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
  s.async = true;
  s.onload = () => w.kakao.maps.load(cb);
  document.head.appendChild(s);
}

export default function ReportFlowPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isAuthLoading, user } = useAuth();
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [dockHeight, setDockHeight] = useState(120);
  const [headerHeight, setHeaderHeight] = useState(100);
  const idRef = useRef(1);
  const nextId = () => ++idRef.current;

  const [stage, setStage] = useState<Stage>("photo");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [memo, setMemo] = useState("");
  const [input, setInput] = useState("");
  const [reportId, setReportId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // 위치
  const [locationQuery, setLocationQuery] = useState(""); // 지도 조회용(고정)
  const [locationText, setLocationText] = useState(""); // 표시 라벨(편집 가능)
  const [editingLoc, setEditingLoc] = useState(false);
  const [coords, setCoords] = useState(SOGANG_CENTER);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isOtherLocation, setIsOtherLocation] = useState(false);

  // 맞춤 질문 — 한 번에 하나씩 받아오고, 답변은 다음 질문의 컨텍스트가 된다.
  const [step, setStep] = useState<ReportQuestionStep | null>(null);
  const [directActive, setDirectActive] = useState(false);
  const [directInput, setDirectInput] = useState("");
  const [pendingScroll, setPendingScroll] = useState<"top" | "bottom">("bottom");
  const [answers, setAnswers] = useState<ReportFlowAnswer[]>([]);

  // 신고서 문서 (신고자는 로그인 정보 기반 실명 고정)
  const [draftSummary, setDraftSummary] = useState("");
  const [hazardContent, setHazardContent] = useState("");
  const [improvement, setImprovement] = useState("");
  const [editingSection, setEditingSection] = useState<
    null | "hazard" | "improvement"
  >(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      navigate("/login", { replace: true, state: { from: "/report" } });
    }
    if (!isAuthLoading && isLoggedIn && !user?.profileCompleted) {
      navigate("/profile", { replace: true, state: { from: "/report" } });
    }
  }, [isAuthLoading, isLoggedIn, navigate, user?.profileCompleted]);

  useEffect(() => {
    if (stage !== "buildingSelect") return;
    let cancelled = false;
    void (async () => {
      try {
        const items = await buildingApi.list();
        if (cancelled) return;
        setBuildings(items);
        setApiError(null);
      } catch (error) {
        if (!cancelled) {
          setApiError(error instanceof Error ? error.message : "건물 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setBuildingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stage]);

  // objectURL 정리
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  // 헤더/하단 dock 높이 측정 (오버레이 → 채팅 스크롤 여백 확보)
  useEffect(() => {
    const els: [HTMLElement | null, (h: number) => void][] = [
      [dockRef.current, setDockHeight],
      [headerRef.current, setHeaderHeight],
    ];
    const ros = els.map(([el, set]) => {
      if (!el) return null;
      const ro = new ResizeObserver(([e]) => set(e.contentRect.height));
      ro.observe(el);
      return ro;
    });
    return () => ros.forEach((ro) => ro?.disconnect());
  }, [stage]);

  // 스크롤: 새 질문은 상단 정렬, 그 외는 하단
  useEffect(() => {
    const cont = scrollRef.current;
    if (!cont) return;
    if (pendingScroll === "top") {
      const nodes = cont.querySelectorAll('[data-anchor="top"]');
      const last = nodes[nodes.length - 1] as HTMLElement | undefined;
      if (last) {
        last.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    cont.scrollTo({ top: cont.scrollHeight, behavior: "smooth" });
  }, [messages, pendingScroll]);

  const addMsgs = (...msgs: MsgInput[]) =>
    setMessages((p) => [...p, ...msgs.map((m) => ({ ...m, id: nextId() }) as Msg)]);

  const handleClose = () => {
    if (reportId) void reportApi.deleteDraft(reportId).catch(() => undefined);
    navigate("/map");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
    setStage("compose");
  };

  const handleComposeSend = async () => {
    if (!memo.trim() || !photoFile || submitting) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const draftReport = reportId
        ? { id: reportId }
        : await reportApi.createDraft();
      setReportId(draftReport.id);
      await reportApi.uploadPhotos(draftReport.id, [photoFile]);
      addMsgs(
        { role: "photo" },
        { role: "user", text: memo.trim() },
        { role: "ai", text: "보내주신 사진과 내용을 바탕으로 신고서를 작성할게요." },
        {
          role: "ai",
          text: "신고 위치의 건물을 먼저 선택해 주세요.\n길이나 야외처럼 건물이 아닌 곳은 기타를 선택할 수 있어요.",
        },
      );
      setBuildingsLoading(true);
      setStage("buildingSelect");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "사진을 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputSend = () => {
    const t = input.trim();
    if (!t) return;
    if (stage === "locationInput") {
      addMsgs({ role: "user", text: t }, { role: "ai", text: "해당 위치가 맞나요?" });
      const fullLocation = selectedBuilding ? `${selectedBuilding.name} ${t}` : t;
      setLocationQuery(fullLocation);
      setLocationText(fullLocation);
      if (selectedBuilding?.lat != null && selectedBuilding.lng != null) {
        setCoords({ lat: selectedBuilding.lat, lng: selectedBuilding.lng });
      }
      setStage("locationConfirm");
    } else {
      addMsgs({ role: "user", text: t });
    }
    setInput("");
  };

  const handleBuildingSelect = () => {
    if (!selectedBuilding && !isOtherLocation) return;
    const label = selectedBuilding?.name ?? "기타 (건물이 아닌 위치)";
    addMsgs(
      { role: "user", text: label },
      {
        role: "ai",
        text: selectedBuilding
          ? `${selectedBuilding.name}의 세부 위치를 알려주세요.\n(예: 3관 입구 앞, 2층 계단 옆)`
          : "신고할 세부 위치를 알려주세요.\n길·야외라면 가까운 건물이나 지점을 기준으로 설명해 주세요.",
      },
    );
    setStage("locationInput");
  };

  const startQuestions = (firstStep: ReportQuestionStep) => {
    setStep(firstStep);
    setAnswers([]);
    setPendingScroll("top");
    addMsgs(
      ...(firstStep.introduction
        ? ([
            {
              role: "ai",
              text: firstStep.introduction,
              emphasis: "질문 세 가지만",
              topAnchor: true,
            },
          ] as MsgInput[])
        : []),
      { role: "ai", text: firstStep.question.text },
    );
    setDirectActive(false);
    setDirectInput("");
    setStage("question");
  };

  const handleLocationConfirm = async () => {
    if (!reportId || submitting) return;
    setSubmitting(true);
    setApiError(null);
    try {
      await reportApi.patchLocation(reportId, {
        buildingId: selectedBuilding?.id,
        locationDescription: locationText,
        lat: coords.lat,
        lng: coords.lng,
      });
      const firstStep = await aiApi.getNextReportQuestion(reportId, memo.trim(), []);
      addMsgs({
        role: "locationSaved",
        label: locationText,
        lat: coords.lat,
        lng: coords.lng,
      });
      setStage("afterLocation");
      setTimeout(() => startQuestions(firstStep), 900);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "위치를 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (text: string) => {
    const t = text.trim();
    const current = step;
    if (!t || !current || !reportId || submitting) return;
    setPendingScroll("bottom");
    addMsgs({ role: "user", text: t });
    const nextAnswers = [
      ...answers,
      {
        questionId: current.question.id,
        question: current.question.text,
        answer: t,
        axis: current.axis,
      },
    ];
    setAnswers(nextAnswers);
    setDirectActive(false);
    setDirectInput("");

    setSubmitting(true);
    setApiError(null);
    try {
      if (!current.last) {
        // 방금 받은 답변까지 넘겨 다음 질문을 만든다.
        const nextStep = await aiApi.getNextReportQuestion(
          reportId,
          memo.trim(),
          nextAnswers,
        );
        setPendingScroll("top");
        addMsgs({ role: "ai", text: nextStep.question.text, topAnchor: true });
        setStep(nextStep);
        return;
      }
      const generated = await aiApi.createReportDraft(
        reportId,
        locationText,
        memo.trim(),
        nextAnswers,
      );
      setPendingScroll("top");
      addMsgs({
        role: "ai",
        text: "내용을 정리해 신고서를 작성했어요.",
        topAnchor: true,
      });
      setDraftSummary(generated.summary);
      setHazardContent(generated.hazardContent);
      setImprovement(generated.improvementSuggestion);
      setStage("proposal");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "신고서를 생성하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (section: "hazard" | "improvement") => {
    setEditingSection(section);
    setDraft(section === "hazard" ? hazardContent : improvement);
  };

  const commitEdit = () => {
    if (!editingSection) return;
    if (editingSection === "hazard") setHazardContent(draft);
    else setImprovement(draft);
    setEditingSection(null);
  };

  const handleSubmitProposal = async () => {
    if (!reportId || submitting) return;
    setSubmitting(true);
    setApiError(null);
    try {
      await reportApi.patch(reportId, {
        summary: draftSummary || `${locationText} 안전 신고`,
        description: `${hazardContent}${IMPROVEMENT_MARKER}${improvement}`,
        reporterType: "REAL_NAME",
      });
      await reportApi.generateReportFile(reportId);
      await reportApi.submit(reportId);
      navigate("/map");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "신고를 전송하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoRemove = () => {
    if (reportId) void reportApi.deleteDraft(reportId).catch(() => undefined);
    // 첫 메시지 재편집
    setMessages([]);
    setLocationQuery("");
    setLocationText("");
    setSelectedBuilding(null);
    setIsOtherLocation(false);
    setReportId(null);
    setApiError(null);
    setStage("compose");
  };

  // ─── 신고서 문서 화면 (채팅 아님) ───
  if (stage === "proposal") {
    return (
      <div className="app-shell h-svh w-full flex flex-col" style={{ backgroundColor: BG }}>
        {/* 헤더 */}
        <div className="shrink-0 bg-gradient-to-t from-transparent to-white/80">
          <div className="h-[44px]" />
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between">
              <button
                onClick={handleClose}
                className="bg-white/30 backdrop-blur-[20px] rounded-full p-2.5 shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)] transition active:bg-white/70 active:scale-95"
              >
                <X className="w-6 h-6 text-[#262626]" />
              </button>
              <div className="bg-white/30 backdrop-blur-[20px] rounded-full h-[44px] px-4 flex items-center shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)]">
                <span className="text-sm font-medium text-[#262626] tracking-[-0.28px] whitespace-nowrap">
                  신고서 전송
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 문서 본문 */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-6 py-[30px] flex flex-col gap-5">
          {apiError && (
            <p className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">
              {apiError}
            </p>
          )}
          {/* 신고자 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#9d9d9d] tracking-[-0.28px]">
              신고자
            </span>
            <span className="text-sm font-medium text-[#262626] tracking-[-0.28px] leading-[1.4]">
              {user?.name ?? "로그인 사용자"}
            </span>
          </div>

          {/* 위험장소 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#9d9d9d] tracking-[-0.28px]">
              위험장소
            </span>
            <span className="text-sm font-medium text-[#262626] tracking-[-0.28px] leading-[1.4]">
              {locationText}
            </span>
          </div>

          {/* 안전·보건 유해/위험/시설/장소 내용 (수정 가능) */}
          <ProposalEditableField
            label="안전·보건 유해/위험/시설/장소 내용"
            value={hazardContent}
            editing={editingSection === "hazard"}
            draft={draft}
            onEdit={() => startEdit("hazard")}
          />

          {/* 개선 제안 사항 (수정 가능) */}
          <ProposalEditableField
            label="개선 제안 사항"
            value={improvement}
            editing={editingSection === "improvement"}
            draft={draft}
            onEdit={() => startEdit("improvement")}
          />

          {/* 사진 */}
          <div className="h-[180px] flex items-center">
            <div className="h-[180px] w-[269px] max-w-full rounded-[12px] overflow-hidden bg-[#e9e9e9]">
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt="첨부 사진"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>

        {/* 하단: 수정 중이면 편집 바, 아니면 전송 버튼 */}
        {editingSection ? (
          <div className="p-2.5 shrink-0">
            <div className="w-full bg-white/30 backdrop-blur-[20px] rounded-[20px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)] flex items-end">
              <AutoTextarea
                autoFocus
                className="flex-1 min-w-0 p-5 bg-transparent outline-none resize-none text-sm text-[#262626] tracking-[-0.28px] leading-[1.4] max-h-[140px]"
                value={draft}
                onChange={setDraft}
                onEnter={commitEdit}
              />
              <div className="p-2.5 shrink-0">
                <button
                  onClick={commitEdit}
                  className="rounded-full p-2 flex items-center justify-center transition active:scale-95 active:brightness-90"
                  style={{ backgroundColor: SOGANG_RED }}
                >
                  <ArrowUp className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2.5 shrink-0">
            <div className="w-full bg-white/30 backdrop-blur-[20px] rounded-[20px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)] p-5">
              <button
                onClick={handleSubmitProposal}
                disabled={submitting}
                className="w-full h-11 rounded-[10px] text-base font-semibold text-white tracking-[-0.4px] transition active:brightness-90"
                style={{ backgroundColor: SOGANG_RED }}
              >
                {submitting ? "전송 중..." : "시설관리팀에 전송하기"}
              </button>
            </div>
          </div>
        )}

        {/* HomeIndicator 영역 */}
        <div className="h-[34px] shrink-0" />
      </div>
    );
  }

  const progress =
    stage === "photo" || stage === "compose"
      ? "사진 · 설명 1/4"
      : stage === "buildingSelect" ||
          stage === "locationInput" ||
          stage === "locationConfirm" ||
          stage === "afterLocation"
        ? "신고 위치 2/4"
        : "맞춤 질문 3/4";

  return (
    <div
      className="app-shell h-svh w-full flex flex-col relative"
      style={{ backgroundColor: BG }}
    >
      {/* 헤더 (채팅 위 오버레이) */}
      <div ref={headerRef} className="absolute top-0 left-0 right-0 z-20">
        <div className="h-[44px]" />
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <button
              onClick={handleClose}
              className="bg-white/30 backdrop-blur-[20px] rounded-full p-2.5 shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)] transition active:bg-white/70 active:scale-95"
            >
              <X className="w-6 h-6 text-[#262626]" />
            </button>
            <div className="bg-white/30 backdrop-blur-[20px] rounded-full h-[44px] px-4 flex items-center shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)]">
              <span className="text-sm font-medium text-[#262626] tracking-[-0.28px] whitespace-nowrap">
                {progress}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 대화 영역 */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 flex flex-col gap-5"
        style={{ paddingTop: headerHeight + 10, paddingBottom: dockHeight + 20 }}
      >
        {/* AI 인사 */}
        <p className="max-w-[300px] text-sm text-[#262626] tracking-[-0.28px] leading-[1.4]">
          안녕하세요! 위험한 곳/수리가 필요한 곳을 발견했나요?
          <br />
          <span className="font-bold">사진 한 장과 어떤 상황인지</span> 함께 알려주세요.
        </p>

        {apiError && (
          <p className="max-w-[300px] rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">
            {apiError}
          </p>
        )}

        {messages.map((m) => {
          if (m.role === "ai") {
            return (
              <p
                key={m.id}
                data-anchor={m.topAnchor ? "top" : undefined}
                className="max-w-[300px] text-sm text-[#262626] tracking-[-0.28px] leading-[1.4] whitespace-pre-line"
              >
                {m.emphasis ? renderEmphasis(m.text, m.emphasis) : m.text}
              </p>
            );
          }
          if (m.role === "user") {
            return (
              <div key={m.id} className="flex justify-end">
                <div
                  className="max-w-[300px] rounded-[20px] px-4 py-3"
                  style={{ backgroundColor: SOGANG_RED }}
                >
                  <p className="text-sm text-[#fcfcfc] tracking-[-0.28px] leading-[1.4]">
                    {m.text}
                  </p>
                </div>
              </div>
            );
          }
          if (m.role === "locationSaved") {
            return (
              <div key={m.id} className="flex flex-col gap-2.5 items-start">
                <p className="max-w-[300px] text-sm text-[#262626] tracking-[-0.28px] leading-[1.4]">
                  위치를 저장했어요.
                  <br />
                  <span className="font-semibold">{m.label}</span>
                </p>
                <StaticMap lat={m.lat} lng={m.lng} />
              </div>
            );
          }
          // photo
          return (
            <div key={m.id} className="flex justify-end">
              <div className="relative size-[180px] rounded-[12px] overflow-hidden bg-[#e9e9e9]">
                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt="첨부 사진"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <button
                  onClick={handlePhotoRemove}
                  className="absolute top-1.5 right-1.5 bg-[#262626]/60 rounded-full p-1.5 flex items-center justify-center transition active:scale-90"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 하단 독 (채팅 위 오버레이) ─── */}
      <div ref={dockRef} className="absolute bottom-0 left-0 right-0">
      {stage === "photo" && (
        <div className="p-2.5 shrink-0">
          <div className="w-full bg-white/30 backdrop-blur-[20px] rounded-[20px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)] py-5">
            <div className="flex items-center gap-2.5 px-5">
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2.5 border border-[#d9d9d9] rounded-[10px] px-5 py-4 transition active:bg-[#F5F5F5] active:border-[#262626] active:scale-[0.98]"
              >
                <Camera className="w-6 h-6 text-[#262626]" />
                <span className="text-sm font-medium text-[#262626] tracking-[-0.28px]">
                  촬영하기
                </span>
              </button>
              <button
                onClick={() => albumRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2.5 border border-[#d9d9d9] rounded-[10px] px-5 py-4 transition active:bg-[#F5F5F5] active:border-[#262626] active:scale-[0.98]"
              >
                <ImageIcon className="w-6 h-6 text-[#262626]" />
                <span className="text-sm font-medium text-[#262626] tracking-[-0.28px]">
                  앨범에서 선택
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === "compose" && (
        <div className="p-2.5 shrink-0">
          <div className="w-full bg-white/30 backdrop-blur-[20px] rounded-[20px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)]">
            <div className="flex justify-center py-2.5">
              <div className="overflow-hidden rounded-[12px] bg-[#e9e9e9] h-[213px] aspect-[3/4]">
                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt="첨부 사진"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
            <div className="flex items-end">
              <AutoTextarea
                autoFocus
                className="flex-1 min-w-0 p-5 bg-transparent outline-none resize-none text-sm text-[#262626] tracking-[-0.28px] leading-[1.4] placeholder:text-[#C4C4C4] max-h-[140px]"
                placeholder="어떤 상황인지 알려주세요"
                value={memo}
                onChange={setMemo}
                onEnter={handleComposeSend}
              />
              <div className="p-2.5 shrink-0">
                <button
                  onClick={handleComposeSend}
                  disabled={submitting}
                  className="rounded-full p-2 flex items-center justify-center transition active:scale-95 active:brightness-90"
                  style={{ backgroundColor: SOGANG_RED }}
                >
                  <ArrowUp className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === "buildingSelect" && (
        <div className="p-2.5 shrink-0">
          <div className="w-full bg-white/30 backdrop-blur-[20px] rounded-[20px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)] p-5 flex flex-col gap-3">
            <p className="text-sm font-medium text-[#262626] tracking-[-0.28px]">
              신고할 건물을 선택해 주세요.
            </p>
            <select
              className="w-full h-11 rounded-[10px] border border-[#E3E3E3] bg-white px-3 text-sm text-[#262626] outline-none"
              value={isOtherLocation ? OTHER_LOCATION_VALUE : selectedBuilding?.id ?? ""}
              disabled={buildingsLoading}
              onChange={(e) => {
                if (e.target.value === OTHER_LOCATION_VALUE) {
                  setSelectedBuilding(null);
                  setIsOtherLocation(true);
                  return;
                }
                const building = buildings.find((item) => item.id === Number(e.target.value)) ?? null;
                setSelectedBuilding(building);
                setIsOtherLocation(false);
              }}
            >
              <option value="">
                {buildingsLoading ? "건물 목록을 불러오는 중..." : "건물을 선택해 주세요"}
              </option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
              <option value={OTHER_LOCATION_VALUE}>기타 (건물이 아닌 위치)</option>
            </select>
            <button
              onClick={handleBuildingSelect}
              disabled={(!selectedBuilding && !isOtherLocation) || buildingsLoading}
              className="w-full h-11 rounded-[10px] text-sm font-semibold text-white tracking-[-0.28px] transition disabled:bg-[#C4C4C4]"
              style={{ backgroundColor: SOGANG_RED }}
            >
              다음
            </button>
          </div>
        </div>
      )}

      {(stage === "locationInput" || stage === "afterLocation") && (
        <div className="p-2.5 shrink-0">
          <div className="w-full bg-white/30 backdrop-blur-[20px] rounded-[20px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)] flex items-end">
            <AutoTextarea
              className="flex-1 min-w-0 p-5 bg-transparent outline-none resize-none text-sm text-[#262626] tracking-[-0.28px] leading-[1.4] placeholder:text-[#7b7b7b] max-h-[140px]"
              placeholder={
                stage === "locationInput"
                  ? selectedBuilding
                    ? "세부 위치를 입력해주세요. (예: 3관 입구 앞)"
                    : "세부 위치를 입력해주세요. (예: 정문 앞 횡단보도)"
                  : "내용을 입력해주세요."
              }
              value={input}
              onChange={setInput}
              onEnter={handleInputSend}
            />
            <div className="p-2.5 shrink-0">
              <button
                onClick={handleInputSend}
                className="bg-[#262626] rounded-full p-2 flex items-center justify-center transition active:scale-95 active:brightness-90"
              >
                <ArrowUp className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === "locationConfirm" && (
        <div className="p-2.5 shrink-0">
          <div className="w-full bg-white/30 backdrop-blur-[20px] rounded-[20px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)] pt-5 pb-4 px-5 flex flex-col gap-2.5 items-center">
            <p className="text-xs text-[#555555] tracking-[-0.24px] leading-[1.4] text-center">
              아래 지도에서 위치를 직접 이동할 수 있어요.
            </p>
            <MapPreview
              query={locationQuery}
              fallbackLat={selectedBuilding?.lat ?? SOGANG_CENTER.lat}
              fallbackLng={selectedBuilding?.lng ?? SOGANG_CENTER.lng}
              onCoordsChange={setCoords}
            />
            <div className="flex items-center gap-2 justify-center w-full">
              {editingLoc ? (
                <input
                  autoFocus
                  className="text-sm font-medium text-[#262626] tracking-[-0.28px] text-center outline-none bg-transparent border-b-2 pb-0.5"
                  style={{ borderColor: SOGANG_RED, minWidth: 140 }}
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  onBlur={() => setEditingLoc(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingLoc(false);
                  }}
                />
              ) : (
                <span className="text-sm font-medium text-[#262626] tracking-[-0.28px] text-center">
                  {locationText}
                </span>
              )}
              <button
                onClick={() => setEditingLoc(true)}
                className="p-1 transition active:scale-90"
              >
                <Pencil className="w-4 h-4 text-[#262626]" />
              </button>
            </div>
            <button
              onClick={handleLocationConfirm}
              disabled={submitting}
              className="w-full h-11 rounded-[10px] text-sm font-semibold text-white tracking-[-0.28px] transition active:brightness-90"
              style={{ backgroundColor: SOGANG_RED }}
            >
              {submitting ? "저장 중..." : "이 위치로 저장"}
            </button>
          </div>
        </div>
      )}

      {stage === "question" && step && (
        <div className="p-2.5 shrink-0">
          <div className="w-full bg-white/30 backdrop-blur-[20px] rounded-[20px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)] pt-5 pb-2 flex flex-col">
            {/* 질문 */}
            <div className="px-5 pb-2">
              <p className="text-base font-medium text-[#262626] tracking-[-0.32px] leading-[1.4]">
                {step.question.text}
              </p>
              {/* AI 호출이 몇 초 걸려 비어 보이지 않게 진행 상태를 남긴다 */}
              {submitting && (
                <p className="pt-2 text-sm text-[#9d9d9d] tracking-[-0.28px]">
                  {step.last
                    ? "신고서를 작성하고 있어요..."
                    : "다음 질문을 준비하고 있어요..."}
                </p>
              )}
            </div>
            {/* 선택지 */}
            {step.question.options.map((opt, i) => (
              <button
                key={opt}
                onClick={() => void handleAnswer(opt)}
                disabled={submitting}
                className="w-full flex items-center gap-4 px-5 py-3 border-b border-[#e9e9e9] transition active:bg-black/5"
              >
                <span className="size-[34px] shrink-0 flex items-center justify-center bg-[#eeeeee] rounded-full text-base font-medium text-black">
                  {i + 1}
                </span>
                <span className="flex-1 text-left text-sm text-[#262626] tracking-[-0.28px] leading-[1.4]">
                  {opt}
                </span>
              </button>
            ))}
            {/* 직접 입력 */}
            {step.question.allowCustom && (
            <div className="w-full flex items-center gap-4 px-5 py-3">
              <span className="size-[34px] shrink-0 flex items-center justify-center bg-[#eeeeee] rounded-full">
                <Pencil className="w-4 h-4 text-[#262626]" />
              </span>
              {directActive ? (
                <>
                  <input
                    autoFocus
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#262626] tracking-[-0.28px] placeholder:text-[#c4c4c4]"
                    placeholder="답변을 입력하세요..."
                    value={directInput}
                    onChange={(e) => setDirectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleAnswer(directInput);
                    }}
                  />
                  <button
                    onClick={() => void handleAnswer(directInput)}
                    disabled={submitting}
                    className="rounded-full p-2 shrink-0 flex items-center justify-center transition active:scale-95 active:brightness-90"
                    style={{ backgroundColor: SOGANG_RED }}
                  >
                    <ArrowUp className="w-6 h-6 text-white" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setDirectActive(true)}
                  className="flex-1 text-left text-sm text-[#c4c4c4] tracking-[-0.28px] leading-[1.4]"
                >
                  직접 입력
                </button>
              )}
            </div>
            )}
          </div>
        </div>
      )}

      {/* HomeIndicator 영역 (컴포넌트 미표시, 영역만 유지) */}
      <div className="h-[34px] shrink-0" />
      </div>

      {/* 숨김 파일 입력 */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={albumRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ─── 자동 확장 입력창 (내용 많아지면 여러 줄) ───
function AutoTextarea({
  value,
  onChange,
  onEnter,
  placeholder,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      autoFocus={autoFocus}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing && !e.shiftKey) {
          e.preventDefault();
          onEnter?.();
        }
      }}
      className={className}
    />
  );
}

// ─── 신고서 본문 (수정 가능 필드) ───
function ProposalEditableField({
  label,
  value,
  editing,
  draft,
  onEdit,
}: {
  label: string;
  value: string;
  editing: boolean;
  draft: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#9d9d9d] tracking-[-0.28px]">
          {label}
        </span>
        {editing ? (
          <span
            className="text-sm font-medium tracking-[-0.28px]"
            style={{ color: SOGANG_RED }}
          >
            수정중
          </span>
        ) : (
          <button
            onClick={onEdit}
            className="text-sm font-medium text-[#7b7b7b] tracking-[-0.28px] underline transition active:opacity-60"
          >
            수정
          </button>
        )}
      </div>
      {editing ? (
        <div
          className="rounded-[10px] border p-2"
          style={{ borderColor: SOGANG_RED }}
        >
          <p className="text-sm text-[#262626] tracking-[-0.28px] leading-[1.4] whitespace-pre-wrap">
            {draft}
          </p>
        </div>
      ) : (
        <p className="text-sm font-medium text-[#262626] tracking-[-0.28px] leading-[1.4] whitespace-pre-wrap">
          {value}
        </p>
      )}
    </div>
  );
}

// ─── 지도 프리뷰 (고정 중앙 핀 + 드래그로 좌표 변경) ───
function MapPreview({
  query,
  fallbackLat,
  fallbackLng,
  onCoordsChange,
}: {
  query: string;
  fallbackLat: number;
  fallbackLng: number;
  onCoordsChange: (c: { lat: number; lng: number }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hasMapKey = Boolean(
    import.meta.env.VITE_KAKAO_APP_KEY &&
      import.meta.env.VITE_KAKAO_APP_KEY !== "your-kakao-javascript-key",
  );

  useEffect(() => {
    let cancelled = false;
    ensureKakao(() => {
      if (cancelled || !ref.current) return;
      const w = window as any;
      const map = new w.kakao.maps.Map(ref.current, {
        center: new w.kakao.maps.LatLng(fallbackLat, fallbackLng),
        level: 3,
      });
      setTimeout(() => map.relayout(), 0);
      onCoordsChange({ lat: fallbackLat, lng: fallbackLng });

      // 답변 위치로 지도 중심 이동
      if (query && w.kakao.maps.services) {
        const ps = new w.kakao.maps.services.Places();
        ps.keywordSearch(query, (data: any[], status: string) => {
          if (cancelled) return;
          if (status === w.kakao.maps.services.Status.OK && data[0]) {
            const c = new w.kakao.maps.LatLng(data[0].y, data[0].x);
            map.setCenter(c);
            onCoordsChange({ lat: +data[0].y, lng: +data[0].x });
          }
        });
      }

      // 드래그 종료 시 중심 좌표 = 신고 좌표
      w.kakao.maps.event.addListener(map, "dragend", () => {
        const c = map.getCenter();
        onCoordsChange({ lat: c.getLat(), lng: c.getLng() });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [fallbackLat, fallbackLng, query, onCoordsChange]);

  return (
    <div className="isolate relative w-full h-[200px] rounded-[10px] overflow-hidden border border-[#e9e9e9]">
      <div ref={ref} className="w-full h-full bg-[#e9e9e9]" />
      {!hasMapKey && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#e9e9e9] px-6 text-center text-xs text-[#555555]">
          카카오 지도 키 미설정 상태입니다. 기본 캠퍼스 좌표로 신고를 계속할 수 있어요.
        </div>
      )}
      {/* 고정 중앙 핀 (지도를 움직여 좌표 변경) */}
      <div className="absolute z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none">
        <MapPin className="w-8 h-9" style={{ color: SOGANG_RED, fill: SOGANG_RED }} />
      </div>
    </div>
  );
}

// ─── 정적 지도 (저장된 위치 · 채팅 로그용) ───
function StaticMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasMapKey = Boolean(
    import.meta.env.VITE_KAKAO_APP_KEY &&
      import.meta.env.VITE_KAKAO_APP_KEY !== "your-kakao-javascript-key",
  );

  useEffect(() => {
    let cancelled = false;
    ensureKakao(() => {
      if (cancelled || !ref.current) return;
      const w = window as any;
      const center = new w.kakao.maps.LatLng(lat, lng);
      const map = new w.kakao.maps.Map(ref.current, {
        center,
        level: 3,
        draggable: false,
      });
      map.setZoomable(false);
      setTimeout(() => {
        map.relayout();
        map.setCenter(center);
      }, 0);
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return (
    <div className="isolate relative w-[300px] max-w-full h-[191px] rounded-[10px] overflow-hidden border border-[#e9e9e9]">
      <div ref={ref} className="w-full h-full bg-[#e9e9e9]" />
      {!hasMapKey && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#e9e9e9] px-6 text-center text-xs text-[#555555]">
          지도 키 미설정 · 저장 좌표 {lat.toFixed(4)}, {lng.toFixed(4)}
        </div>
      )}
      <div className="absolute z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none">
        <MapPin className="w-8 h-9" style={{ color: SOGANG_RED, fill: SOGANG_RED }} />
      </div>
    </div>
  );
}
