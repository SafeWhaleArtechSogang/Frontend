import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth";
import logo from "@/assets/logo.png";
import GoogleLoginButton from "@/components/login/GoogleLoginButton";
import { GOOGLE_CLIENT_ID } from "@/constants/google";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 구글 ID token으로 백엔드 로그인 → 성공 시 항상 지도로 이동
  const handleCredential = useCallback(
    async (idToken: string) => {
      setSubmitting(true);
      setError(null);
      try {
        await login(idToken);
        navigate("/map", { replace: true });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "로그인에 실패했습니다.");
        setSubmitting(false);
      }
    },
    [login, navigate]
  );

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
      <div className="flex flex-col items-center gap-3 pb-12">
        {GOOGLE_CLIENT_ID ? (
          <GoogleLoginButton onCredential={handleCredential} disabled={submitting} />
        ) : (
          <p className="text-sm text-sogang-500 text-center">
            VITE_GOOGLE_CLIENT_ID가 설정되지 않았습니다.
          </p>
        )}
        {submitting && <p className="text-sm text-text-secondary text-center">로그인 확인 중...</p>}
        {error && <p className="text-sm text-sogang-500 text-center">{error}</p>}
      </div>
    </div>
  );
}
