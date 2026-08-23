import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import logo from "@/assets/logo.png";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GOOGLE_SCRIPT_ID = "google-identity-services";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (_provider: string) => {
    // TODO: Implement OAuth login
    login();
    // 로그인 후 항상 지도로 이동
    navigate("/map", { replace: true });
  };

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
