import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, List, LocateFixed, ChevronRight, X, Share, Heart } from "lucide-react";
import { MapSearchInput } from "@/components/common";
import type { DangerLevel, ReportStatus } from "@/types";

declare global {
  interface Window {
    kakao: any;
  }
}

// ─── Dummy Data ───
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
  },
  {
    id: "2",
    title: "연세대학교 앞 건널목",
    description: "정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음. 정문 앞 횡단보도.",
    category: "스쿨존 불법주정차",
    dangerLevel: "medium",
    status: "confirmed",
    school: "연세대학교",
    address: "서울 서대문구 연세로 50",
    date: "2026년 5월 14일 09:15",
    isMine: true,
  },
  {
    id: "3",
    title: "홍익대학교 CU쪽 건널목",
    description: "정문 앞 횡단보도 옆 가드레일 일부가 파손되어 있음.",
    category: "노면 파손",
    dangerLevel: "low",
    status: "reviewing",
    school: "홍익대학교",
    address: "서울 마포구 와우산로 94",
    date: "2026년 5월 13일 16:42",
    isMine: false,
  },
  {
    id: "4",
    title: "서강대학교 후문 맨홀 파손",
    description: "후문 앞 맨홀 뚜껑이 파손되어 보행자 안전에 위험이 있음. 빗물이 고여 미끄러짐 사고 우려.",
    category: "맨홀 · 배수시설",
    dangerLevel: "high",
    status: "complete",
    school: "서강대학교",
    address: "서울 마포구 백범로 35",
    date: "2026년 5월 12일 11:20",
    isMine: true,
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

const MY_SCHOOL = "서강대학교";

const schoolPins = DUMMY_PINS.filter((p) => p.school === MY_SCHOOL);
const minePins = DUMMY_PINS.filter((p) => p.isMine);

const FILTER_TABS = [
  { id: "all", label: "전체 보기" },
  { id: "school", label: `내 학교 · ${schoolPins.length}개` },
  { id: "mine", label: `나의 핀 · ${minePins.length}개` },
  { id: "received", label: "접수중" },
  { id: "confirmed", label: "접수완료" },
  { id: "reviewing", label: "검토중" },
  { id: "complete", label: "처리완료" },
];

function filterPins(pins: PinItem[], filter: string): PinItem[] {
  switch (filter) {
    case "school":
      return pins.filter((p) => p.school === MY_SCHOOL);
    case "mine":
      return pins.filter((p) => p.isMine);
    case "received":
    case "confirmed":
    case "reviewing":
    case "complete":
      return pins.filter((p) => p.status === filter);
    case "all":
    default:
      return pins;
  }
}

export default function MapPage() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [sheetHeight, setSheetHeight] = useState(68);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedPin, setSelectedPin] = useState<PinItem | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [kakaoMap, setKakaoMap] = useState<any>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY === null) return;
    const deltaY = e.changedTouches[0].clientY - dragStartY;
    const threshold = 50;
    if (deltaY > threshold) {
      // Swipe down
      if (selectedPin) {
        setSelectedPin(null);
      } else {
        setSheetExpanded(false);
      }
    } else if (deltaY < -threshold) {
      // Swipe up
      setSheetExpanded(true);
    }
    setDragStartY(null);
  };

  const handleSearch = (query: string) => {
    if (!kakaoMap || !query.trim()) return;
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(query, (data: any[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
        const place = data[0];
        const coords = new window.kakao.maps.LatLng(place.y, place.x);
        kakaoMap.setCenter(coords);
        kakaoMap.setLevel(3);
      }
    });
  };

  const handleReportStart = () => setShowLocationModal(true);
  const handleLocationAllow = () => {
    setShowLocationModal(false);
    // geolocation을 백그라운드로 요청하고, 카메라는 사용자 제스처 내에서 바로 열기
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

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=b3221aa1cf97848ef13cd1f3fb052eab&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        if (mapRef.current) {
          const map = new window.kakao.maps.Map(mapRef.current, {
            center: new window.kakao.maps.LatLng(37.5563, 126.9368),
            level: 5,
          });
          setKakaoMap(map);
          setMapLoaded(true);
        }
      });
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  return (
    <div className="relative h-dvh flex flex-col">
      {/* Search Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-3">
        <MapSearchInput
          placeholder="장소를 검색하세요"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch(searchQuery);
          }}
        />
      </div>

      {/* Danger Level Legend */}
      <div className="absolute top-[67px] left-1/2 -translate-x-1/2 z-0">
        <div className="flex items-center gap-2 bg-white rounded-[10px] shadow-[0px_2px_20px_0px_rgba(0,0,0,0.15)] p-2.5">
          <span className="text-xs font-semibold text-[#262626] tracking-[-0.25px]">위험도</span>
          <div className="flex items-center gap-2">
            {(["low", "medium", "high"] as DangerLevel[]).map((level) => (
              <div key={level} className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 rounded-full ${DANGER_DOT[level]}`} />
                <span className="text-xs font-medium text-[#262626] tracking-[-0.25px]">{DANGER_LABEL[level]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1 bg-bg-tertiary">
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full text-text-tertiary">지도를 불러오는 중...</div>
        )}
      </div>

      {/* FABs — location on top, add below */}
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
        className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-[10px] shadow-[0px_-4px_20px_0px_rgba(0,0,0,0.15)] transition-all duration-300 overflow-hidden flex flex-col"
        style={{ height: sheetExpanded ? "50dvh" : "15dvh" }}
      >
        {/* Handle — swipe area */}
        <div
          className="w-full flex justify-center py-4 cursor-pointer touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
          if (selectedPin) { setSelectedPin(null); return; }
          setSheetExpanded(!sheetExpanded);
        }}>
          <div className="w-14 h-[5px] bg-[#D9D9D9] rounded-full" />
        </div>

        {selectedPin ? (
          // ─── Pin Detail View ───
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden px-4 pt-2 pb-4">
              {/* Tags + Close */}
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
                  onClick={() => setSelectedPin(null)}
                >
                  <X className="w-5 h-5 text-[#262626]" />
                </button>
              </div>

              {/* Title + Date */}
              <div className="flex items-start justify-between mt-2">
                <h3 className="text-lg font-bold text-[#262626] tracking-[-0.45px] leading-[1.48]">
                  {selectedPin.title}
                </h3>
                <span className="text-xs font-medium text-[#7B7B7B] tracking-[-0.3px] whitespace-nowrap ml-2 mt-1">
                  {selectedPin.date}
                </span>
              </div>

              {/* Description */}
              <p className="mt-2 text-sm font-medium text-[#7B7B7B] tracking-[-0.35px] leading-[1.48]">
                {selectedPin.description}
              </p>

              {/* Images — horizontal scroll, height fills remaining space */}
              <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide flex-1 min-h-[100px] -mx-4 px-4">
                <div className="h-full aspect-square bg-[#F5F5F5] rounded-[10px] shrink-0" />
                <div className="h-full aspect-[3/4] bg-[#F5F5F5] rounded-[10px] shrink-0" />
                <div className="h-full aspect-[3/4] bg-[#F5F5F5] rounded-[10px] shrink-0" />
                <div className="h-full aspect-square bg-[#F5F5F5] rounded-[10px] shrink-0" />
                <div className="h-full aspect-square bg-[#F5F5F5] rounded-[10px] shrink-0" />
              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="px-4 pb-6 pt-2 shrink-0 flex gap-2.5">
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
          // ─── Pin List View ───
          <>
            {/* Filter Chips */}
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

            {/* List */}
            {sheetExpanded && (
              <div className="overflow-y-auto flex-1">
                {filterPins(DUMMY_PINS, activeFilter).map((pin) => (
                  <button
                    key={pin.id}
                    className="w-full h-[74px] px-4 flex items-center gap-2.5 border-b border-[#E9E9E9] text-left"
                    onClick={() => setSelectedPin(pin)}
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
