import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth";
import logo from "@/assets/logo.png";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GOOGLE_SCRIPT_ID = "google-identity-services";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 로그인 후 돌아갈 경로 (없으면 /map)
  const from = (location.state as { from?: string })?.from || "/map";

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;
    const googleButton = googleButtonRef.current;
    let cancelled = false;

    const handleCredential = async (response: GoogleCredentialResponse) => {
      if (cancelled || !response.credential) return;
      setSubmitting(true);
      setError(null);
      try {
        await login(response.credential);
        if (!cancelled) navigate(from, { replace: true });
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "로그인에 실패했습니다.");
        }
      } finally {
        if (!cancelled) setSubmitting(false);
      }
    };

    const renderGoogleButton = () => {
      if (cancelled || !window.google) return;
      googleButton.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
        use_fedcm_for_prompt: true,
      });
      window.google.accounts.id.renderButton(googleButton, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: Math.min(googleButton.clientWidth || 360, 400),
        locale: "ko",
      });
    };

    const handleScriptError = () => {
      if (!cancelled) setError("Google 로그인 모듈을 불러오지 못했습니다.");
    };

    if (window.google) {
      renderGoogleButton();
    } else {
      let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = GOOGLE_SCRIPT_ID;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderGoogleButton);
      script.addEventListener("error", handleScriptError);
      return () => {
        cancelled = true;
        script?.removeEventListener("load", renderGoogleButton);
        script?.removeEventListener("error", handleScriptError);
        googleButton.replaceChildren();
      };
    }

    return () => {
      cancelled = true;
      googleButton.replaceChildren();
    };
  }, [from, login, navigate]);

  return (
    <div className="flex flex-col min-h-dvh px-page">
      {/* Logo Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <img src={logo} alt="안전고래" className="w-[160px] h-[160px] rounded-xl mb-4" />
        <h1 className="text-2xl font-bold text-text-primary">안전고래</h1>
        <p className="mt-2 text-base text-text-secondary">
          로그인하고 안전 신고를 시작하세요
        </p>
      </div>

      {/* Login Buttons */}
      <div className="flex flex-col gap-3 pb-12">
        {GOOGLE_CLIENT_ID ? (
          <div
            ref={googleButtonRef}
            className={`flex min-h-[44px] w-full justify-center ${submitting ? "pointer-events-none opacity-60" : ""}`}
          />
        ) : (
          <p className="text-sm text-[#a92614] text-center">
            VITE_GOOGLE_CLIENT_ID가 설정되지 않았습니다.
          </p>
        )}
        {submitting && <p className="text-sm text-text-secondary text-center">로그인 확인 중...</p>}
        {error && <p className="text-sm text-[#a92614] text-center">{error}</p>}
      </div>
    </div>
  );
}
