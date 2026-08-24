import { useEffect, useRef, useState } from "react";
import {
  GOOGLE_BUTTON_MAX_WIDTH,
  GOOGLE_BUTTON_MIN_WIDTH,
  GOOGLE_CLIENT_ID,
  GOOGLE_SCRIPT_ID,
  GOOGLE_SCRIPT_SRC,
} from "@/constants/google";

/** Google Identity Services 스크립트를 한 번만 로드한다 */
function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google 스크립트 로드 실패")));
      return;
    }
    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google 스크립트 로드 실패"));
    document.head.appendChild(script);
  });
}

interface UseGoogleIdentityOptions {
  /** 로그인 성공 시 구글이 발급한 ID token */
  onCredential: (idToken: string) => void;
  /** 구글 공식 버튼을 그릴 폭(px). 0이면 아직 측정 전이므로 렌더를 보류한다 */
  width: number;
}

/**
 * 구글 공식 버튼을 containerRef에 렌더한다.
 * 커스텀 디자인 버튼 위에 투명하게 겹쳐 쓰기 때문에 ID token 발급 흐름은 그대로 유지된다.
 */
export function useGoogleIdentity({ onCredential, width }: UseGoogleIdentityOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 콜백이 매 렌더 새로 만들어져도 구글 버튼을 다시 그리지 않도록 최신 값만 보관한다
  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const clientId = GOOGLE_CLIENT_ID;
    if (!clientId || width <= 0) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onCredentialRef.current(response.credential),
          use_fedcm_for_prompt: true,
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: Math.min(GOOGLE_BUTTON_MAX_WIDTH, Math.max(GOOGLE_BUTTON_MIN_WIDTH, width)),
          locale: "ko",
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError("Google 로그인을 불러오지 못했습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [width]);

  return { containerRef, ready, error };
}
