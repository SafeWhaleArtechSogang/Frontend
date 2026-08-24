import { useLayoutEffect, useRef, useState } from "react";
import googleIcon from "@/assets/google.svg";
import { GOOGLE_BUTTON_HEIGHT } from "@/constants/google";
import { useGoogleIdentity } from "@/hooks/useGoogleIdentity";

/** 디자인 버튼 높이(px) — py-3(12px) × 2 + 아이콘 20px */
const BUTTON_HEIGHT = 44;
/** 구글 공식 버튼(40px)의 클릭 영역을 디자인 버튼 높이까지 늘리는 배율 */
const OVERLAY_SCALE_Y = BUTTON_HEIGHT / GOOGLE_BUTTON_HEIGHT;

interface GoogleLoginButtonProps {
  /** 구글이 발급한 ID token */
  onCredential: (idToken: string) => void;
  disabled?: boolean;
}

/**
 * Google 로그인 버튼 (Figma node 298:5282 / 눌림 298:5279)
 *
 * 구글 공식 버튼은 iframe 안에서 구글이 직접 그리므로 디자인을 바꿀 수 없다.
 * 그래서 디자인 버튼을 그리고, 그 위에 공식 버튼을 투명하게 겹쳐 클릭만 받게 한다.
 * ID token 발급 흐름(POST /auth/google)은 그대로 유지된다.
 */
export default function GoogleLoginButton({ onCredential, disabled = false }: GoogleLoginButtonProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const { containerRef, error } = useGoogleIdentity({ onCredential, width });

  // 공식 버튼은 폭을 px로 받으므로 디자인 버튼의 실제 폭을 재서 넘긴다
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={wrapperRef}
        className={`group relative inline-flex ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        {/* 디자인 레이어 */}
        <div className="flex h-11 items-center gap-6 rounded-[10px] bg-white px-6 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.05)] transition-colors group-focus-within:bg-neutral-200 group-active:bg-neutral-200">
          <img src={googleIcon} alt="" className="size-5 shrink-0" />
          <span className="text-sm font-medium leading-4 tracking-[-0.35px] whitespace-nowrap text-black">
            Google 계정으로 로그인
          </span>
        </div>

        {/* 구글 공식 버튼 — 투명하게 겹쳐 클릭과 ID token 발급을 담당 */}
        <div
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center opacity-0"
          style={{ transform: `scaleY(${OVERLAY_SCALE_Y})` }}
        />
      </div>

      {error && <p className="text-center text-sm text-sogang-500">{error}</p>}
    </div>
  );
}
