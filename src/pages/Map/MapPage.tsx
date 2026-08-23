import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, List, ChevronRight, ChevronDown, X, Share, Heart, UserRound } from "lucide-react";
import { useAuth } from "@/App";
import type { RiskLevel, ReportStatus } from "@/types";

declare global {
  interface Window {
    kakao: any;
  }
}

// ─── Data ───
interface PinItem {
  id: string;
  title: string;
  description: string;
  departmentName: string;
  riskLevel: RiskLevel;
  status: ReportStatus;
  address: string;
  date: string;
  isMine: boolean;
  geoQuery?: string; // 카카오 장소 검색용 키워드 (지도 마커 좌표 조회)
  latitude?: number;
  longitude?: number;
}

const DUMMY_PINS: PinItem[] = [
  {
    id: "1",
    title: "서강대학교 정문 앞 횡단보도",
    description: "정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음.",
    departmentName: "시설관리팀",
    riskLevel: "HIGH",
    status: "RECEIVED",
    address: "서울 마포구 백범로 35",
    date: "2026년 5월 15일 14:30",
    isMine: false,
    geoQuery: "서강대학교 정문",
    latitude: 37.5509,
    longitude: 126.9400,
  },
  {
    id: "2",
    title: "서강대학교 김대건관",
    description: "김대건관 2층 복도 난간 일부가 흔들려 보행 시 위험함. 고정이 헐거워져 기대면 안전사고 우려가 있음.",
    departmentName: "시설관리팀",
    riskLevel: "MEDIUM",
    status: "REVIEWING",
    address: "서울 마포구 백범로 35",
    date: "2026년 5월 14일 09:15",
    isMine: true,
    geoQuery: "서강대학교 김대건관",
    latitude: 37.5506,
    longitude: 126.9404,
  },
  {
    id: "3",
    title: "서강대학교 정하상관",
    description: "정하상관 1층 출입문 유리에 금이 가 있어 파손 시 부상 위험이 있음. 통행이 잦은 구간이라 빠른 점검이 필요함.",
    departmentName: "전산정보처",
    riskLevel: "LOW",
    status: "REVIEWING",
    address: "서울 마포구 백범로 35",
    date: "2026년 5월 13일 16:42",
    isMine: false,
    geoQuery: "서강대학교 정하상관",
    latitude: 37.5501,
    longitude: 126.9417,
  },
  {
    id: "4",
    title: "서강대학교 하비에르관",
    description: "하비에르관 정문 앞 보도블록이 들떠 있어 보행자가 걸려 넘어질 위험이 있음. 비 오는 날 미끄러짐 사고 우려.",
    departmentName: "환경안전팀",
    riskLevel: "HIGH",
    status: "RESOLVED",
    address: "서울 마포구 백범로 35",
    date: "2026년 5월 12일 11:20",
    isMine: true,
    geoQuery: "서강대학교 하비에르관",
    latitude: 37.5514,
    longitude: 126.9413,
  },
];

const DANGER_LABEL: Record<RiskLevel, string> = { LOW: "낮음", MEDIUM: "중간", HIGH: "높음" };
const DANGER_DOT: Record<RiskLevel, string> = {
  LOW: "bg-[#E5C946]",
  MEDIUM: "bg-[#E8943A]",
  HIGH: "bg-[#D94A4A]",
};
const DANGER_BORDER: Record<RiskLevel, string> = {
  LOW: "border-[#E5C946]",
  MEDIUM: "border-[#E8943A]",
  HIGH: "border-[#D94A4A]",
};

interface SearchResult {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  category_group_code: string;
  category_group_name: string;
  x: string;
  y: string;
}

// 서강대학교 캠퍼스 중심 좌표
const SOGANG_CENTER = { lat: 37.5510, lng: 126.9408 };

export default function MapPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [sheetFullscreen, setSheetFullscreen] = useState(false);
  const [showListButton, setShowListButton] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(68);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPin, setSelectedPin] = useState<PinItem | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [kakaoMap, setKakaoMap] = useState<any>(null);

  const allPins = DUMMY_PINS;

  const FILTER_TABS = [
    { id: "all", label: "전체 신고" },
    { id: "mine", label: "내 신고" },
  ];

  function filterPins(pins: PinItem[], filter: string): PinItem[] {
    switch (filter) {
      case "mine":
        return pins.filter((p) => p.isMine);
      case "all":
      default:
        return pins;
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY === null) return;
    const deltaY = e.changedTouches[0].clientY - dragStartY;
    const threshold = 50;
    if (deltaY > threshold) {
      // Swipe down
      if (sheetFullscreen) {
        setSheetFullscreen(false);
      } else if (selectedPin) {
        setSelectedPin(null);
        setSheetFullscreen(false);
      } else {
        setSheetExpanded(false);
      }
    } else if (deltaY < -threshold) {
      // Swipe up
      if (selectedPin && sheetExpanded && !sheetFullscreen) {
        setSheetFullscreen(true);
      } else {
        setSheetExpanded(true);
      }
    }
    setDragStartY(null);
  };

  const handleReportStart = () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/report" } });
      return;
    }
    navigate("/report");
  };

  useEffect(() => {
    if (!sheetRef.current) return;
    const ro = new ResizeObserver(([entry]) => setSheetHeight(entry.contentRect.height));
    ro.observe(sheetRef.current);
    return () => ro.disconnect();
  }, []);

  // 시트가 펼쳐지면 리스트 버튼은 즉시 숨김 (내려올 때만 트랜지션 끝에서 표시)
  useEffect(() => {
    if (sheetExpanded || sheetFullscreen) setShowListButton(false);
  }, [sheetExpanded, sheetFullscreen]);

  // 커스텀 마커 SVG 생성
  const createPinSvg = (level: RiskLevel) => {
    const colors: Record<RiskLevel, string> = {
      LOW: "#E5C946",
      MEDIUM: "#E8943A",
      HIGH: "#D94A4A",
    };
    const color = colors[level];
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46" fill="none">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 28 18 28s18-15.4 18-28C36 8.06 27.94 0 18 0z" fill="${color}"/>
        <circle cx="18" cy="18" r="8" fill="white"/>
        <circle cx="18" cy="18" r="4" fill="${color}"/>
      </svg>
    `)}`;
  };

  // 카카오맵 SDK 로드
  useEffect(() => {
    const appKey = import.meta.env.VITE_KAKAO_APP_KEY;
    if (!appKey) {
      console.error("VITE_KAKAO_APP_KEY 환경변수가 설정되지 않았습니다.");
      return;
    }
    // 이미 로드된 경우
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => {
        if (mapRef.current) {
          const map = new window.kakao.maps.Map(mapRef.current, {
            center: new window.kakao.maps.LatLng(SOGANG_CENTER.lat, SOGANG_CENTER.lng),
            level: 4,
          });
          setKakaoMap(map);
          setMapLoaded(true);
        }
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        if (mapRef.current) {
          const map = new window.kakao.maps.Map(mapRef.current, {
            center: new window.kakao.maps.LatLng(SOGANG_CENTER.lat, SOGANG_CENTER.lng),
            level: 4,
          });
          setKakaoMap(map);
          setMapLoaded(true);
        }
      });
    };
    script.onerror = () => {
      console.error("카카오맵 SDK 로드 실패. 앱키와 도메인 설정을 확인하세요.");
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 제보 핀 마커 표시 — 카카오 장소 검색으로 좌표 조회 (실패 시 하드코딩 좌표 fallback)
  useEffect(() => {
    if (!kakaoMap || !window.kakao?.maps?.services) return;
    const ps = new window.kakao.maps.services.Places();
    const markers: any[] = [];
    let cancelled = false;

    const drawMarker = (pin: PinItem, lat: number, lng: number) => {
      if (cancelled) return;
      const markerImage = new window.kakao.maps.MarkerImage(
        createPinSvg(pin.riskLevel),
        new window.kakao.maps.Size(36, 46),
        { offset: new window.kakao.maps.Point(18, 46) }
      );
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(lat, lng),
        map: kakaoMap,
        image: markerImage,
        title: pin.title,
      });
      window.kakao.maps.event.addListener(marker, "click", () => {
        setSelectedPin(pin);
        setSheetFullscreen(false);
        setSheetExpanded(true);
      });
      markers.push(marker);
    };

    // 모든 제보 핀을 카카오 장소 검색으로 좌표 조회해 표시
    for (const pin of allPins) {
      const query = pin.geoQuery || pin.title;
      ps.keywordSearch(query, (data: SearchResult[], status: string) => {
        if (cancelled) return;
        if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
          drawMarker(pin, parseFloat(data[0].y), parseFloat(data[0].x));
        } else if (pin.latitude != null && pin.longitude != null) {
          // 검색 실패 시 하드코딩 좌표로 표시
          drawMarker(pin, pin.latitude, pin.longitude);
        }
      });
    }

    return () => {
      cancelled = true;
      markers.forEach((m) => m.setMap(null));
    };
  }, [kakaoMap, allPins]);

  return (
    <div className="relative h-dvh flex flex-col">
      {/* Map */}
      <div ref={mapRef} className="flex-1 bg-bg-tertiary">
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full text-text-tertiary">지도를 불러오는 중...</div>
        )}
      </div>

      {/* 신고 버튼 (바텀시트 위) */}
      <button
        className="absolute right-4 z-20 flex items-center gap-1 bg-[#262626] rounded-full pl-2.5 pr-3 py-2 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.2)] transition active:brightness-90"
        style={{ bottom: `${sheetHeight + 15}px` }}
        onClick={handleReportStart}
      >
        <Plus className="w-5 h-5 text-white" />
        <span className="text-[15px] font-medium text-white tracking-[-0.375px]">신고</span>
      </button>
      {showListButton && (
        <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ bottom: `${sheetHeight + 15}px` }}>
          <button className="flex items-center gap-[5px] px-3 py-1.5 bg-white rounded-full shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)]" onClick={() => setSheetExpanded(true)}>
            <List className="w-5 h-5 text-[#262626]" />
            <span className="text-sm font-medium text-[#262626] tracking-[-0.35px] whitespace-nowrap">안전핀 리스트</span>
          </button>
        </div>
      )}

      {/* ─── Bottom Sheet ─── */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 z-30 bg-[#fcfcfc] shadow-[0px_-4px_20px_0px_rgba(0,0,0,0.25)] transition-all duration-300 overflow-hidden flex flex-col ${sheetFullscreen ? "rounded-none" : "rounded-t-[10px]"}`}
        onTransitionEnd={(e) => {
          // 시트가 완전히 내려온 뒤에만 리스트 버튼 표시
          if (e.target === e.currentTarget && !sheetExpanded && !sheetFullscreen) {
            setShowListButton(true);
          }
        }}
        style={{
          height: sheetFullscreen
            ? "100dvh"
            : sheetExpanded
              ? "50dvh"
              : "15dvh",
        }}
      >
        {/* Handle (전체화면에서는 숨김 → 접기 버튼 사용) */}
        {!sheetFullscreen && (
          <div
            className="w-full flex justify-center py-4 cursor-pointer touch-none shrink-0"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
              if (selectedPin && sheetExpanded) { setSheetFullscreen(true); return; }
              if (selectedPin) { setSelectedPin(null); return; }
              setSheetExpanded(!sheetExpanded);
            }}
          >
            <div className="w-14 h-[5px] bg-[#D9D9D9] rounded-full" />
          </div>
        )}

        {selectedPin ? (
          // ─── Pin Detail View ───
          sheetFullscreen ? (
            // ─── Fullscreen Detail (155:1413) ───
            <div className="flex-1 overflow-y-auto scrollbar-hide relative">
              {/* 접기 버튼 */}
              <button
                className="absolute top-4 left-4 z-10 w-8 h-8 bg-[#f5f5f5] rounded-full flex items-center justify-center transition active:scale-95"
                onClick={() => setSheetFullscreen(false)}
              >
                <ChevronDown className="w-5 h-5 text-[#262626]" />
              </button>

              {/* 사진 */}
              <div className="px-1.5 pt-1.5">
                <div className="w-full aspect-square bg-[#F5F5F5] rounded-[10px]" />
              </div>

              {/* 정보 */}
              <div className="px-4 pt-5 pb-12 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-8 px-2.5 flex items-center bg-[#e9e9e9] rounded-full text-sm font-medium text-[#7b7b7b] tracking-[-0.35px]">
                      {selectedPin.departmentName}
                    </span>
                    {selectedPin.isMine && (
                      <span className="w-8 h-8 rounded-full bg-white border border-[#e9e9e9] flex items-center justify-center text-xs font-semibold text-[#7b7b7b]">
                        My
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button className="w-8 h-8 rounded-full bg-[#f5e5e3] flex items-center justify-center transition active:scale-95">
                      <Share className="w-5 h-5 text-[#a92614]" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-[#f5e5e3] flex items-center justify-center transition active:scale-95">
                      <Heart className="w-5 h-5 text-[#a92614]" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="flex-1 text-[17px] font-bold text-[#1d1d1f] tracking-[-0.425px] leading-[1.4]">
                    {selectedPin.title}
                  </h3>
                  <span className="text-[11px] font-medium text-[#7a7a7a] tracking-[-0.275px] whitespace-nowrap shrink-0">
                    {selectedPin.date}
                  </span>
                </div>

                <div className="flex flex-col gap-5 mt-1">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-[#9d9d9d] tracking-[-0.28px]">위험장소</span>
                    <span className="text-sm font-medium text-[#262626] tracking-[-0.28px] leading-[1.4]">{selectedPin.title}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-[#9d9d9d] tracking-[-0.28px]">안전·보건 유해/위험/시설/장소 내용</span>
                    <span className="text-sm font-medium text-[#262626] tracking-[-0.28px] leading-[1.4]">{selectedPin.description}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-[#9d9d9d] tracking-[-0.28px]">개선 제안 사항</span>
                    <span className="text-sm font-medium text-[#262626] tracking-[-0.28px] leading-[1.4]">현장 점검 후 위험 요소 보수 및 임시 안전표시 설치를 요청합니다.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // ─── Compact Detail (155:1372) ───
            <div
              className="flex-1 flex flex-col overflow-hidden cursor-pointer px-4 pb-12 gap-4"
              onClick={() => setSheetFullscreen(true)}
            >
              {/* 헤더: 부서·My | 공유·공감·닫기 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-8 px-2.5 flex items-center bg-[#e9e9e9] rounded-full text-sm font-medium text-[#7b7b7b] tracking-[-0.35px]">
                    {selectedPin.departmentName}
                  </span>
                  {selectedPin.isMine && (
                    <span className="w-8 h-8 rounded-full bg-white border border-[#e9e9e9] flex items-center justify-center text-xs font-semibold text-[#7b7b7b]">
                      My
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                  <button className="w-8 h-8 rounded-full bg-[#f5e5e3] flex items-center justify-center transition active:scale-95">
                    <Share className="w-5 h-5 text-[#a92614]" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-[#f5e5e3] flex items-center justify-center transition active:scale-95">
                    <Heart className="w-5 h-5 text-[#a92614]" />
                  </button>
                  <button
                    className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center transition active:scale-95"
                    onClick={() => { setSelectedPin(null); setSheetFullscreen(false); }}
                  >
                    <X className="w-5 h-5 text-[#262626]" />
                  </button>
                </div>
              </div>

              {/* 제목 + 날짜 */}
              <div className="flex items-center gap-2">
                <h3 className="flex-1 text-[17px] font-bold text-[#1d1d1f] tracking-[-0.425px] leading-[1.4]">
                  {selectedPin.title}
                </h3>
                <span className="text-xs font-medium text-[#7b7b7b] tracking-[-0.3px] whitespace-nowrap shrink-0">
                  {selectedPin.date}
                </span>
              </div>

              {/* 설명 */}
              <p className="text-sm font-medium text-[#262626] tracking-[-0.28px] leading-[1.4] line-clamp-3">
                {selectedPin.description}
              </p>

              {/* 사진 */}
              <div className="flex-1 min-h-[100px] bg-[#F5F5F5] rounded-[10px]" />
            </div>
          )
        ) : (
          // ─── Pin List View ───
          <>
            {/* Profile (red card) */}
            <div className="px-4 pt-1 shrink-0">
              <button
                className="w-full bg-[#a92614] rounded-[10px] p-2 flex items-center gap-2.5 text-left transition active:brightness-95"
                onClick={() => navigate("/my-reports")}
              >
                <div className="w-12 h-12 rounded-[6px] bg-white/20 shrink-0 flex items-center justify-center">
                  <UserRound className="w-6 h-6 text-white/90" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-base font-semibold text-[#f5f5f5] tracking-[-0.4px] leading-[1.48]">
                    김준수
                  </span>
                  <span className="text-xs font-medium text-[#e9e9e9] tracking-[-0.3px] leading-[1.48]">
                    20211234
                  </span>
                </div>
                <span className="shrink-0 flex items-center gap-0.5 border border-white/40 rounded-full pl-2.5 pr-1.5 py-1 text-xs font-semibold text-white tracking-[-0.3px] whitespace-nowrap">
                  내 프로필
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
            {sheetExpanded && (
              <div className="flex gap-2 px-4 pb-2.5 pt-2.5 overflow-x-auto scrollbar-hide shrink-0">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`shrink-0 px-2.5 py-1 rounded-full border text-xs tracking-[-0.3px] whitespace-nowrap bg-white transition-colors ${
                      activeFilter === tab.id
                        ? "border-[#902011] font-semibold text-[#761b0e]"
                        : "border-[#dcdcdc] font-medium text-[#a2a3a3]"
                    }`}
                    onClick={() => setActiveFilter(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            {sheetExpanded && (
              <div className="overflow-y-auto flex-1">
                {filterPins(allPins, activeFilter).map((pin) => (
                  <button
                    key={pin.id}
                    className="w-full h-[74px] px-4 flex items-center gap-2.5 border-b border-[#E9E9E9] text-left"
                    onClick={() => { setSelectedPin(pin); setSheetFullscreen(false); }}
                  >
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold text-[#262626] border ${DANGER_BORDER[pin.riskLevel]} rounded-full px-2 py-1 tracking-[-0.3px] flex items-center gap-1.5 shrink-0 leading-[1.48]`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${DANGER_DOT[pin.riskLevel]}`} />
                          {DANGER_LABEL[pin.riskLevel]}
                        </span>
                        <h4 className="text-base font-semibold text-[#1d1d1f] tracking-[-0.4px] truncate leading-[1.48]">
                          {pin.title}
                        </h4>
                      </div>
                      <p className="text-xs font-medium text-[#7B7B7B] tracking-[-0.3px] leading-[1.48] truncate">
                        {pin.description}
                      </p>
                    </div>
                    {pin.isMine && (
                      <div className="w-[30px] h-[30px] rounded-full border border-[#E9E9E9] flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-[#7B7B7B] tracking-[-0.3px] leading-[1.48]">My</span>
                      </div>
                    )}
                    <ChevronRight className="w-6 h-6 text-[#C4C4C4] shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
