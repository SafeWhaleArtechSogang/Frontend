import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, List, LocateFixed, ChevronRight, X, Share, Heart } from "lucide-react";
import { useAuth } from "@/App";
import type { DangerLevel, ReportStatus } from "@/types";

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
  category: string;
  dangerLevel: DangerLevel;
  status: ReportStatus;
  school: string;
  address: string;
  date: string;
  isMine: boolean;
  source: "user" | "public";
  geoQuery?: string; // 카카오 장소 검색용 키워드 (지도 마커 좌표 조회)
  latitude?: number;
  longitude?: number;
}

const DUMMY_PINS: PinItem[] = [
  {
    id: "1",
    title: "서강대학교 정문 앞 횡단보도",
    description: "정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음.",
    category: "안전시설 파손 · 부재",
    dangerLevel: "high",
    status: "received",
    school: "서강대학교",
    address: "서울 마포구 백범로 35",
    date: "2026년 5월 15일 14:30",
    isMine: false,
    source: "user",
    geoQuery: "서강대학교 정문",
    latitude: 37.5509,
    longitude: 126.9400,
  },
  {
    id: "2",
    title: "서강대학교 김대건관",
    description: "김대건관 2층 복도 난간 일부가 흔들려 보행 시 위험함. 고정이 헐거워져 기대면 안전사고 우려가 있음.",
    category: "안전시설 파손 · 부재",
    dangerLevel: "medium",
    status: "confirmed",
    school: "서강대학교",
    address: "서울 마포구 백범로 35",
    date: "2026년 5월 14일 09:15",
    isMine: true,
    source: "user",
    geoQuery: "서강대학교 김대건관",
    latitude: 37.5506,
    longitude: 126.9404,
  },
  {
    id: "3",
    title: "서강대학교 정하상관",
    description: "정하상관 1층 출입문 유리에 금이 가 있어 파손 시 부상 위험이 있음. 통행이 잦은 구간이라 빠른 점검이 필요함.",
    category: "안전시설 파손 · 부재",
    dangerLevel: "low",
    status: "reviewing",
    school: "서강대학교",
    address: "서울 마포구 백범로 35",
    date: "2026년 5월 13일 16:42",
    isMine: false,
    source: "user",
    geoQuery: "서강대학교 정하상관",
    latitude: 37.5501,
    longitude: 126.9417,
  },
  {
    id: "4",
    title: "서강대학교 하비에르관",
    description: "하비에르관 정문 앞 보도블록이 들떠 있어 보행자가 걸려 넘어질 위험이 있음. 비 오는 날 미끄러짐 사고 우려.",
    category: "노면 파손",
    dangerLevel: "high",
    status: "complete",
    school: "서강대학교",
    address: "서울 마포구 백범로 35",
    date: "2026년 5월 12일 11:20",
    isMine: true,
    source: "user",
    geoQuery: "서강대학교 하비에르관",
    latitude: 37.5514,
    longitude: 126.9413,
  },
];

const DANGER_LABEL: Record<DangerLevel, string> = { low: "낮음", medium: "중간", high: "높음" };
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

const STATUS_LABELS: { key: ReportStatus; label: string }[] = [
  { key: "received", label: "접수중" },
  { key: "confirmed", label: "접수완료" },
  { key: "reviewing", label: "검토중" },
  { key: "complete", label: "처리완료" },
];

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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [sheetFullscreen, setSheetFullscreen] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(68);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedPin, setSelectedPin] = useState<PinItem | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [kakaoMap, setKakaoMap] = useState<any>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const allPins = DUMMY_PINS;
  const minePins = useMemo(() => allPins.filter((p) => p.isMine), [allPins]);

  const FILTER_TABS = useMemo(() => [
    { id: "all", label: "전체 보기" },
    { id: "mine", label: `My핀 · ${minePins.length}개` },
  ], [minePins.length]);

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

  // 카카오 장소 검색
  const handleSearch = (query: string) => {
    if (!window.kakao?.maps?.services || !query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(query, (data: SearchResult[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data.slice(0, 8));
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    });
  };

  // 검색 결과 클릭 → 지도 이동
  const handleSelectPlace = (place: SearchResult) => {
    if (kakaoMap) {
      const coords = new window.kakao.maps.LatLng(place.y, place.x);
      kakaoMap.setCenter(coords);
      kakaoMap.setLevel(3);
    }
    setSearchQuery(place.place_name);
    setShowSearchResults(false);
  };

  const handleReportStart = () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/report" } });
      return;
    }
    setShowLocationModal(true);
  };
  const handleLocationAllow = () => {
    setShowLocationModal(false);
    navigator.geolocation.getCurrentPosition(() => {}, () => {});
    cameraInputRef.current?.click();
  };
  const handleLocationDeny = () => {
    setShowLocationModal(false);
    cameraInputRef.current?.click();
  };

  useEffect(() => {
    if (!sheetRef.current) return;
    const ro = new ResizeObserver(([entry]) => setSheetHeight(entry.contentRect.height));
    ro.observe(sheetRef.current);
    return () => ro.disconnect();
  }, []);

  // 커스텀 마커 SVG 생성
  const createPinSvg = (level: DangerLevel) => {
    const colors: Record<DangerLevel, string> = {
      low: "#E5C946",
      medium: "#E8943A",
      high: "#D94A4A",
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
        createPinSvg(pin.dangerLevel),
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

  // 검색 결과 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-search-area]")) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative h-dvh flex flex-col">
      {/* Search Area */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-3" data-search-area>
        {/* Search Input */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-primary z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            className="w-full py-2.5 pl-11 pr-4 bg-white rounded-[4px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)] text-base font-semibold text-text-primary tracking-[-0.35px] placeholder:text-[#7B7B7B] placeholder:font-semibold outline-none"
            placeholder="캠퍼스 건물을 검색하세요"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            onFocus={() => {
              if (searchResults.length > 0) setShowSearchResults(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(searchQuery);
              }
            }}
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowSearchResults(false);
                searchInputRef.current?.focus();
              }}
            >
              <X className="w-4 h-4 text-[#7B7B7B]" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="mt-1 bg-white rounded-[8px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)] overflow-hidden max-h-[400px] overflow-y-auto">
            {searchResults.map((place, idx) => (
              <div
                key={place.id || idx}
                className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0] last:border-b-0 hover:bg-[#F9F9F9] active:bg-[#F0F0F0] transition-colors"
              >
                <button
                  className="flex-1 text-left min-w-0"
                  onClick={() => handleSelectPlace(place)}
                >
                  <p className="text-sm font-semibold text-[#262626] tracking-[-0.35px] truncate">
                    {place.place_name}
                  </p>
                  <p className="text-xs font-medium text-[#7B7B7B] tracking-[-0.3px] truncate mt-0.5">
                    {place.road_address_name || place.address_name}
                  </p>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1 bg-bg-tertiary">
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full text-text-tertiary">지도를 불러오는 중...</div>
        )}
      </div>

      {/* Danger Level Legend — 검색창 아래 우측 상단 */}
      {!showSearchResults && (
        <div className="absolute right-4 top-[64px] z-10 flex items-center gap-2.5 bg-white rounded-[10px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)] px-3 py-1.5">
          <span className="text-[10px] font-semibold text-[#262626] tracking-[-0.25px]">위험도</span>
          {(["high", "medium", "low"] as DangerLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-full ${DANGER_DOT[level]}`} />
              <span className="text-[10px] font-medium text-[#262626] tracking-[-0.25px]">{DANGER_LABEL[level]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Right FAB column: 위치 → 신고 */}
      <button
        className="absolute right-4 z-20 w-11 h-11 bg-white rounded-full shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all duration-300"
        style={{ bottom: `${sheetHeight + 15 + 44 + 15}px` }}
        onClick={() => {}}
      >
        <LocateFixed className="w-5 h-5 text-text-primary" />
      </button>
      <button
        className="absolute right-4 z-20 w-11 h-11 bg-primary rounded-full shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all duration-300"
        style={{ bottom: `${sheetHeight + 15}px` }}
        onClick={handleReportStart}
      >
        <Plus className="w-5 h-5 text-text-inverse" />
      </button>
      {!sheetExpanded && (
        <div className="absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-300" style={{ bottom: `${sheetHeight + 15}px` }}>
          <button className="flex items-center gap-[5px] px-3 py-1.5 bg-white rounded-full shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)]" onClick={() => setSheetExpanded(true)}>
            <List className="w-5 h-5 text-[#262626]" />
            <span className="text-sm font-medium text-[#262626] tracking-[-0.35px] whitespace-nowrap">안전핀 리스트</span>
          </button>
        </div>
      )}

      {/* ─── Bottom Sheet ─── */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 z-30 bg-white shadow-[0px_-4px_20px_0px_rgba(0,0,0,0.15)] transition-all duration-300 overflow-hidden flex flex-col ${sheetFullscreen ? "rounded-none" : "rounded-t-[10px]"}`}
        style={{
          height: sheetFullscreen
            ? "100dvh"
            : sheetExpanded
              ? "50dvh"
              : "15dvh",
        }}
      >
        {/* Handle */}
        <div
          className="w-full flex justify-center py-4 cursor-pointer touch-none shrink-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (sheetFullscreen) { setSheetFullscreen(false); return; }
            if (selectedPin && sheetExpanded) { setSheetFullscreen(true); return; }
            if (selectedPin) { setSelectedPin(null); return; }
            setSheetExpanded(!sheetExpanded);
          }}
        >
          <div className="w-14 h-[5px] bg-[#D9D9D9] rounded-full" />
        </div>

        {selectedPin ? (
          // ─── Pin Detail View ───
          sheetFullscreen ? (
            // ─── Fullscreen Detail (피그마 디자인) ───
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 flex flex-col gap-10">
                  {/* 상단: 이미지 + 정보 + 설명 */}
                  <div className="flex flex-col gap-[30px]">
                    {/* Images — 가로 스크롤 */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
                      <div className="w-[300px] h-[300px] bg-[#F5F5F5] rounded-[10px] shrink-0" />
                      <div className="h-[300px] aspect-[3/4] bg-[#F5F5F5] rounded-[10px] shrink-0" />
                      <div className="h-[300px] aspect-[3/4] bg-[#F5F5F5] rounded-[10px] shrink-0" />
                    </div>

                    {/* 정보 영역 */}
                    <div className="flex flex-col gap-2.5">
                      {/* Tags */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#262626] bg-[#F5F5F5] border border-[#E9E9E9] rounded-full px-2.5 py-1 tracking-[-0.3px]">
                            {selectedPin.category}
                          </span>
                          <span className={`text-xs font-semibold text-[#262626] border ${DANGER_BORDER[selectedPin.dangerLevel]} rounded-full px-2 py-1 tracking-[-0.3px] flex items-center gap-1.5 leading-[1.48]`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${DANGER_DOT[selectedPin.dangerLevel]}`} />
                            {DANGER_LABEL[selectedPin.dangerLevel]}
                          </span>
                          {selectedPin.isMine && (
                            <span className="w-[26px] h-[26px] rounded-full border border-[#E9E9E9] flex items-center justify-center">
                              <span className="text-[10px] font-semibold text-[#7B7B7B] tracking-[-0.25px]">My</span>
                            </span>
                          )}
                        </div>
                        {/* Title + Date */}
                        <div className="flex items-center gap-2">
                          <h3 className="flex-1 text-lg font-bold text-[#1d1d1f] tracking-[-0.45px] leading-[1.48]">
                            {selectedPin.title}
                          </h3>
                          <span className="text-[10px] font-medium text-[#7A7A7A] tracking-[-0.25px] whitespace-nowrap shrink-0">
                            {selectedPin.date}
                          </span>
                        </div>
                      </div>
                      {/* Description */}
                      <p className="text-sm font-medium text-[#7A7A7A] tracking-[-0.35px] leading-[1.48]">
                        {selectedPin.description}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Buttons — 고정 */}
              <div className="px-4 pb-[34px] pt-3 shrink-0 flex gap-2.5">
                <button className="flex-1 h-11 border border-[#262626] rounded-[4px] text-base font-semibold text-[#262626] tracking-[-0.4px] flex items-center justify-center gap-2">
                  <Share className="w-5 h-5" />
                  공유하기
                </button>
                <button className="flex-1 h-11 bg-[#262626] rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px] flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5" />
                  공감해요
                </button>
              </div>
            </div>
          ) : (
            // ─── Compact Detail (50dvh) ───
            <div className="flex-1 flex flex-col overflow-hidden cursor-pointer" onClick={() => setSheetFullscreen(true)}>
              <div className="flex-1 flex flex-col overflow-hidden px-4 pt-2 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-white bg-[#C4C4C4] rounded-full px-2.5 py-1 tracking-[-0.3px]">
                      {STATUS_LABELS.find((s) => s.key === selectedPin.status)?.label}
                    </span>
                    <span className="text-xs font-medium text-[#262626] bg-[#F5F5F5] border border-[#E9E9E9] rounded-full px-2.5 py-1 tracking-[-0.3px]">
                      {selectedPin.category}
                    </span>
                    <span className={`text-xs font-semibold text-[#262626] border ${DANGER_BORDER[selectedPin.dangerLevel]} rounded-full px-2 py-1 tracking-[-0.3px] flex items-center gap-1.5 leading-[1.48]`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${DANGER_DOT[selectedPin.dangerLevel]}`} />
                      {DANGER_LABEL[selectedPin.dangerLevel]}
                    </span>
                    {selectedPin.isMine && (
                      <span className="w-[26px] h-[26px] rounded-full border border-[#E9E9E9] flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-[#7B7B7B] tracking-[-0.25px]">My</span>
                      </span>
                    )}
                  </div>
                  <button
                    className="shrink-0 w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); setSelectedPin(null); setSheetFullscreen(false); }}
                  >
                    <X className="w-5 h-5 text-[#262626]" />
                  </button>
                </div>
                <div className="flex items-start justify-between mt-2">
                  <h3 className="text-lg font-bold text-[#262626] tracking-[-0.45px] leading-[1.48]">
                    {selectedPin.title}
                  </h3>
                  <span className="text-xs font-medium text-[#7B7B7B] tracking-[-0.3px] whitespace-nowrap ml-2 mt-1">
                    {selectedPin.date}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-[#7B7B7B] tracking-[-0.35px] leading-[1.48]">
                  {selectedPin.description}
                </p>
                <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide flex-1 min-h-[100px] -mx-4 px-4">
                  <div className="h-full aspect-square bg-[#F5F5F5] rounded-[10px] shrink-0" />
                  <div className="h-full aspect-[3/4] bg-[#F5F5F5] rounded-[10px] shrink-0" />
                  <div className="h-full aspect-[3/4] bg-[#F5F5F5] rounded-[10px] shrink-0" />
                  <div className="h-full aspect-square bg-[#F5F5F5] rounded-[10px] shrink-0" />
                  <div className="h-full aspect-square bg-[#F5F5F5] rounded-[10px] shrink-0" />
                </div>
              </div>
              <div className="px-4 pb-6 pt-2 shrink-0 flex gap-2.5" onClick={(e) => e.stopPropagation()}>
                <button className="flex-1 h-11 border border-[#262626] rounded-[4px] text-base font-semibold text-[#262626] tracking-[-0.4px] flex items-center justify-center gap-2">
                  <Share className="w-5 h-5" />
                  공유하기
                </button>
                <button className="flex-1 h-11 bg-[#262626] rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px] flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5" />
                  공감해요
                </button>
              </div>
            </div>
          )
        ) : (
          // ─── Pin List View ───
          <>
            <div className="flex gap-2 px-4 pb-2.5 pt-2.5 overflow-x-auto scrollbar-hide shrink-0">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`shrink-0 px-2.5 py-1 rounded-full border text-xs tracking-[-0.3px] whitespace-nowrap transition-colors ${
                    activeFilter === tab.id
                      ? "border-[#262626] font-semibold text-[#262626]"
                      : "border-[#E9E9E9] font-medium text-[#7B7B7B]"
                  }`}
                  onClick={() => setActiveFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
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
                        <span className={`text-xs font-semibold text-[#262626] border ${DANGER_BORDER[pin.dangerLevel]} rounded-full px-2 py-1 tracking-[-0.3px] flex items-center gap-1.5 shrink-0 leading-[1.48]`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${DANGER_DOT[pin.dangerLevel]}`} />
                          {DANGER_LABEL[pin.dangerLevel]}
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

      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={() => navigate("/report")}
      />

      {/* Location Permission Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleLocationDeny} />
          <div className="relative bg-white rounded-[10px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)] p-5 mx-6 w-full max-w-[270px] flex flex-col items-center gap-[30px]">
            <div className="flex flex-col items-center gap-2.5">
              <LocateFixed className="w-6 h-6 text-[#1d1d1f]" />
              <div className="flex flex-col items-center gap-2">
                <p className="text-base font-bold text-[#1d1d1f] tracking-[-0.4px]">위치 사용을 허용하겠어요?</p>
                <p className="text-xs font-medium text-[#7A7A7A] tracking-[-0.3px] text-center leading-[1.48] whitespace-nowrap">
                  정확한 신고 위치 등록을 위해 위치 정보가 필요합니다.<br />신고 등록 시에만 사용됩니다.
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <button className="flex-1 h-11 border border-[#262626] rounded-[4px] text-base font-semibold text-[#262626] tracking-[-0.4px]" onClick={handleLocationDeny}>허용 안 함</button>
              <button className="flex-1 h-11 bg-black rounded-[4px] text-base font-semibold text-[#F5F5F5] tracking-[-0.4px]" onClick={handleLocationAllow}>허용</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
