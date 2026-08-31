import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, List, X, Heart, Bell } from "lucide-react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/auth";
import { reportApi } from "@/api";
import DepartmentChip from "@/components/common/DepartmentChip";
import ShareIcon from "@/components/common/ShareIcon";
import MyBadge from "@/components/common/MyBadge";
import ReportDetailView from "@/components/report/ReportDetailView";
import FilterChip from "@/components/map/FilterChip";
import SafetyPinRow from "@/components/map/SafetyPinRow";
import SheetCloseButton from "@/components/map/SheetCloseButton";
import SheetProfile from "@/components/map/SheetProfile";
import NotificationDropdown from "@/components/notification/NotificationDropdown";
import { useNotifications } from "@/hooks/useNotifications";
import type { Report } from "@/types";
import type { RiskLevel, ReportStatus } from "@/types";

declare global {
  interface Window {
    kakao: any;
  }
}

// ─── Data ───
interface PinItem {
  id: number;
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
  imageUrl?: string;
}

function toPin(report: Report, mineIds: Set<number>): PinItem {
  return {
    id: report.id,
    title: report.locationDescription ?? report.building?.name ?? report.summary ?? "안전 신고",
    description: report.description ?? "상세 내용이 없습니다.",
    departmentName: report.department?.name ?? "담당 부서 배정 중",
    riskLevel: report.riskLevel ?? "MEDIUM",
    status: report.status,
    address: report.building?.address ?? "서강대학교",
    date: new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" })
      .format(new Date(report.submittedAt ?? report.createdAt)),
    isMine: mineIds.has(report.id),
    geoQuery: report.locationDescription ?? report.building?.name,
    latitude: report.lat ?? undefined,
    longitude: report.lng ?? undefined,
    imageUrl: report.photos[0]?.url,
  };
}

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

// 접힘 상태 높이(px) — 핸들 21 + 프로필 블록(pt 6 + 프로필 60 + pb 16) + 여백 29
const COLLAPSED_SHEET_HEIGHT = 132;

export default function MapPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [sheetFullscreen, setSheetFullscreen] = useState(false);
  const [showListButton, setShowListButton] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(68);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(() => {
    const key = import.meta.env.VITE_KAKAO_APP_KEY;
    return !key || key === "your-kakao-javascript-key"
      ? "지도 키가 없어 목록 모드로 표시 중입니다."
      : null;
  });
  const [pinsLoading, setPinsLoading] = useState(true);
  const [pinsError, setPinsError] = useState<string | null>(null);
  const [allPins, setAllPins] = useState<PinItem[]>([]);
  const [selectedPin, setSelectedPin] = useState<PinItem | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [kakaoMap, setKakaoMap] = useState<any>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, loading: notificationsLoading, error: notificationsError, hasUnread, markRead } =
    useNotifications(isLoggedIn);

  const FILTER_TABS = [
    { id: "all", label: "전체 신고" },
    { id: "mine", label: "내 신고" },
  ];

  useEffect(() => {
    let cancelled = false;
    const loadPins = async () => {
      if (activeFilter === "mine" && !isLoggedIn) {
        setAllPins([]);
        setPinsLoading(false);
        return;
      }
      setPinsLoading(true);
      setPinsError(null);
      try {
        const [reports, mineReports] = await Promise.all([
          reportApi.getMap(activeFilter as "all" | "mine"),
          isLoggedIn && activeFilter === "all" ? reportApi.getMap("mine") : Promise.resolve([]),
        ]);
        if (cancelled) return;
        const mineIds = new Set((activeFilter === "mine" ? reports : mineReports).map((report) => report.id));
        setAllPins(reports.map((report) => toPin(report, mineIds)));
      } catch (cause) {
        if (!cancelled) setPinsError(cause instanceof Error ? cause.message : "신고 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setPinsLoading(false);
      }
    };
    void loadPins();
    return () => { cancelled = true; };
  }, [activeFilter, isLoggedIn]);

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
      // Swipe up — 핀 상세를 보는 중일 때만 전체 화면으로 확장한다
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
    if (!user?.profileCompleted) {
      navigate("/profile", { state: { from: "/report" } });
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
    if (sheetExpanded || sheetFullscreen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowListButton(false);
    }
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
    if (!appKey || appKey === "your-kakao-javascript-key") return;
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
      setMapError("지도를 불러오지 못했습니다. 앱 키와 허용 도메인을 확인하세요.");
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 제보 핀 마커 표시 — 저장된 좌표 우선, 좌표가 없는 신고만 장소 검색으로 보완
  useEffect(() => {
    if (!kakaoMap) return;
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

    // 신고 저장 시 확정한 좌표가 있으면 그대로 찍는다.
    // locationDescription은 "도서관 입구 앞"처럼 서술형이라 장소 검색으로는 찾을 수 없다.
    const needSearch = allPins.filter((pin) => pin.latitude == null || pin.longitude == null);
    for (const pin of allPins) {
      if (pin.latitude != null && pin.longitude != null) {
        drawMarker(pin, pin.latitude, pin.longitude);
      }
    }

    // 좌표가 없는 과거 신고만 건물명으로 검색해 보완한다
    if (needSearch.length > 0 && window.kakao?.maps?.services) {
      const ps = new window.kakao.maps.services.Places();
      for (const pin of needSearch) {
        const query = pin.geoQuery || pin.title;
        ps.keywordSearch(query, (data: SearchResult[], status: string) => {
          if (cancelled) return;
          if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
            drawMarker(pin, parseFloat(data[0].y), parseFloat(data[0].x));
          }
        });
      }
    }

    return () => {
      cancelled = true;
      markers.forEach((m) => m.setMap(null));
    };
  }, [kakaoMap, allPins]);

  return (
    <div className="app-shell relative h-svh flex flex-col">
      {/* Map */}
      <div ref={mapRef} className="flex-1 bg-bg-tertiary">
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full px-8 text-center text-text-tertiary">
            {mapError ?? "지도를 불러오는 중..."}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label={notificationsOpen ? "알림 닫기" : "알림"}
        onClick={() => {
          if (!isLoggedIn) {
            navigate("/login", { state: { from: "/map" } });
            return;
          }
          setNotificationsOpen((prev) => !prev);
        }}
        className={`absolute right-4 top-4 z-40 rounded-full p-2.5 transition active:scale-95 ${
          notificationsOpen
            ? ""
            : "bg-white/30 shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)] backdrop-blur-[20px] active:bg-white/70"
        }`}
      >
        {notificationsOpen ? (
          <X className="w-6 h-6 text-[#262626]" />
        ) : (
          <span className="relative block">
            <Bell className="w-6 h-6 text-[#262626]" />
            {hasUnread && (
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-sogang-500 ring-2 ring-white/80" />
            )}
          </span>
        )}
      </button>

      {/* 신고 버튼 (바텀시트 위) — 전체화면 상세에서는 가린다 */}
      {!sheetFullscreen && (
        <button
          className="absolute right-4 z-40 flex items-center gap-1 bg-neutral-800 rounded-full pl-2.5 pr-3 py-2.5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.2)] transition active:brightness-90"
          style={{ bottom: `${sheetHeight + 15}px` }}
          onClick={handleReportStart}
        >
          <Plus className="w-5 h-5 text-white" />
          <span className="text-[15px] font-medium leading-5 text-[#f5f5f5] tracking-[-0.375px]">신고</span>
        </button>
      )}
      {showListButton && (
        <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ bottom: `${sheetHeight + 16}px` }}>
          <button
            className="flex items-center gap-1 rounded-full bg-gray-10 px-4 py-2.5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.2)] transition active:brightness-95"
            onClick={() => setSheetExpanded(true)}
          >
            <List className="size-5 text-neutral-800" />
            <span className="whitespace-nowrap text-[15px] font-medium leading-5 tracking-[-0.375px] text-neutral-800">
              안전핀 리스트
            </span>
          </button>
        </div>
      )}

      {/* ─── Bottom Sheet ─── */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 z-30 bg-[#fcfcfc] shadow-[0px_-4px_20px_0px_rgba(0,0,0,0.25)] transition-all duration-300 overflow-hidden flex flex-col ${sheetFullscreen ? "rounded-none" : "rounded-t-[20px]"}`}
        onTransitionEnd={(e) => {
          // 시트가 완전히 내려온 뒤에만 리스트 버튼 표시
          if (e.target === e.currentTarget && !sheetExpanded && !sheetFullscreen) {
            setShowListButton(true);
          }
        }}
        style={{
          height: sheetFullscreen
            ? "100svh"
            : sheetExpanded
              ? "50svh"
              : `calc(${COLLAPSED_SHEET_HEIGHT}px + env(safe-area-inset-bottom))`,
        }}
      >
        {/* Handle — 전체화면(핀 상세)에서는 접기 버튼을 쓰므로 숨긴다 */}
        {!sheetFullscreen && (
          <div
            className="w-full flex justify-center cursor-pointer touch-none shrink-0 pt-2.5 pb-2"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
              if (selectedPin && sheetExpanded) { setSheetFullscreen(true); return; }
              if (selectedPin) { setSelectedPin(null); return; }
              setSheetExpanded(!sheetExpanded);
            }}
          >
            <div className="w-[50px] h-[3px] bg-neutral-300 rounded-full" />
          </div>
        )}

        {selectedPin ? (
          // ─── Pin Detail View ───
          sheetFullscreen ? (
            // ─── Fullscreen Detail (155:1413) ───
            <>
              {/* 접기 버튼 — 스크롤과 무관하게 시트 좌측 상단에 고정 */}
              <SheetCloseButton
                className="absolute top-4 left-4 z-10"
                onClick={() => setSheetFullscreen(false)}
              />
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                <ReportDetailView report={selectedPin} showMyBadge={selectedPin.isMine} />
              </div>
            </>
          ) : (
            // ─── Compact Detail (155:1372) ───
            <div
              className="flex-1 flex flex-col overflow-hidden cursor-pointer px-4 pb-12 gap-4"
              onClick={() => setSheetFullscreen(true)}
            >
              {/* 헤더: 부서·My | 공유·공감·닫기 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DepartmentChip label={selectedPin.departmentName} />
                  {selectedPin.isMine && <MyBadge />}
                </div>
                <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                  <button className="size-10 rounded-full bg-sogang-10 flex items-center justify-center transition active:scale-95">
                    <ShareIcon className="size-5 text-sogang-500" />
                  </button>
                  <button className="size-10 rounded-full bg-sogang-10 flex items-center justify-center transition active:scale-95">
                    <Heart className="w-5 h-5 text-[#a92614]" />
                  </button>
                  <button
                    className="size-10 rounded-full bg-neutral-50 flex items-center justify-center transition active:scale-95"
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
              <div className="flex-1 min-h-[100px] bg-[#F5F5F5] rounded-[10px] overflow-hidden">
                {selectedPin.imageUrl && <img src={selectedPin.imageUrl} alt="신고 사진" className="w-full h-full object-cover" />}
              </div>
            </div>
          )
        ) : (
          // ─── Pin List View ───
          <>
            {/* Profile + Filter (289:3930) */}
            <div
              className={`shrink-0 flex flex-col gap-5 px-4 pb-4 pt-1.5 ${
                sheetExpanded ? "border-b border-gray-200" : ""
              }`}
            >
              <SheetProfile
                name={user?.name ?? "로그인해 주세요"}
                detail={
                  [user?.major, user?.studentNo].filter(Boolean).join(" · ") ||
                  (isLoggedIn ? "프로필 정보 미등록" : "내 신고를 확인할 수 있어요")
                }
                onClick={() => navigate(
                  isLoggedIn ? (user?.profileCompleted ? "/my-reports" : "/profile") : "/login",
                  isLoggedIn ? (user?.profileCompleted ? undefined : { state: { from: "/my-reports" } }) : { state: { from: "/my-reports" } },
                )}
              />
              {sheetExpanded && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {FILTER_TABS.map((tab) => (
                    <FilterChip
                      key={tab.id}
                      label={tab.label}
                      selected={activeFilter === tab.id}
                      onClick={() => {
                        if (tab.id === "mine" && !isLoggedIn) {
                          navigate("/login", { state: { from: "/map" } });
                          return;
                        }
                        setActiveFilter(tab.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            {sheetExpanded && (
              <div className="overflow-y-auto flex-1 min-h-0">
                {pinsLoading && <p className="px-4 py-6 text-sm text-[#7B7B7B] text-center">신고를 불러오는 중...</p>}
                {pinsError && <p className="px-4 py-6 text-sm text-[#a92614] text-center">{pinsError}</p>}
                {!pinsLoading && !pinsError && allPins.length === 0 && (
                  <p className="px-4 py-6 text-sm text-[#7B7B7B] text-center">표시할 신고가 없습니다.</p>
                )}
                {allPins.map((pin) => (
                  <SafetyPinRow
                    key={pin.id}
                    riskLevel={pin.riskLevel}
                    title={pin.title}
                    description={pin.description}
                    isMine={pin.isMine}
                    onClick={() => setSelectedPin(pin)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <NotificationDropdown
        open={notificationsOpen}
        notifications={notifications}
        loading={notificationsLoading}
        error={notificationsError}
        onRead={markRead}
      />

    </div>
  );
}
